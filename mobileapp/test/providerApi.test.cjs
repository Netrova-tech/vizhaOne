const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");

function setup(response) {
  const calls = [], module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../legacy/lib/providerApi.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    fetch: async (...args) => { calls.push(args); return response; },
    require(name) {
      if (name === "@/lib/utils") return { apiUrl: p => `https://api.example${p}` };
      if (name === "@/lib/mobileAuth") return { token: () => "session-token" };
      throw new Error(name);
    },
  });
  return { request: module.exports.providerRequest, calls };
}
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });

test("workspace GET requests authenticate without declaring a JSON body", async () => {
  const data = { vendor: null, services: [] }, s = setup(response(data));
  assert.equal(await s.request("/dashboard"), data);
  assert.equal(s.calls[0][0], "https://api.example/api/provider/dashboard");
  const options = s.calls[0][1];
  assert.equal(options.method, "GET");
  assert.equal(options.headers.Authorization, "Bearer session-token");
  assert.equal(options.headers["Content-Type"], undefined);
  assert.equal(options.body, undefined);
});
test("HTML and empty responses identify the failed endpoint and status", async () => {
  for (const status of [200, 502]) {
    const s = setup({ ok: status === 200, status, json: async () => { throw new SyntaxError("invalid JSON"); } });
    await assert.rejects(s.request("/bookings"), new RegExp(`Provider /bookings .*HTTP ${status}.*unreadable response`));
  }
});
test("server authentication errors remain visible", async () => {
  await assert.rejects(setup(response({ error: "Session expired" }, 401)).request("/dashboard"), /Session expired/);
});
test("malformed workspace data is rejected before rendering", async () => {
  for (const data of [null, {}, { services: null }]) {
    await assert.rejects(setup(response(data)).request("/dashboard"), /incomplete workspace data/);
  }
  await assert.rejects(setup(response({})).request("/bookings"), /incomplete workspace data/);
  assert.deepEqual(await setup(response([])).request("/bookings"), []);
});
test("service edits send a serialized JSON body", async () => {
  const s = setup(response({ id: "service-1" }));
  await s.request("/services/service-1", { title: "Photography" });
  assert.equal(s.calls[0][1].method, "PATCH");
  assert.equal(s.calls[0][1].headers["Content-Type"], "application/json");
  assert.equal(s.calls[0][1].body, '{"title":"Photography"}');
});
