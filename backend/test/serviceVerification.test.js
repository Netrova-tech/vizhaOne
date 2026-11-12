const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");

function setup({ session = null, cookieAdmin = null, databaseRole = "admin" } = {}) {
  const writes = [], module = { exports: {} };
  const save = async (...args) => { writes.push(args); return { id: "service-1", ...args.at(-1) }; };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/controllers/catalogController.js"), "utf8"), {
    module, require(name) {
      if (name === "../services/catalogService") return { createCatalogItem: save, updateCatalogItem: save };
      if (name === "../services/authService") return { mobileSession: () => session, getAdminUserFromRequest: async () => cookieAdmin };
      if (name === "../db/pool") return { query: async () => ({ rows: [{ role: databaseRole }] }) };
      throw new Error(name);
    },
  });
  return { writes, async invoke(method, body) {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await module.exports.createCrudControllers("services")[method]({ body, params: { id: "service-1" } }, res, {});
    return res;
  } };
}

test("anonymous users and vendors cannot assign or remove verified badges", async () => {
  for (const session of [null, { sub: "vendor-1", role: "service_provider" }]) {
    for (const method of ["create", "update"]) {
      for (const verified of [true, false]) {
        const app = setup({ session });
        assert.equal((await app.invoke(method, { verified })).code, 403);
        assert.equal(app.writes.length, 0);
      }
    }
  }
});

test("cookie and mobile admins can award and revoke badges on any service", async () => {
  for (const auth of [{ cookieAdmin: { role: "admin" } }, { session: { sub: "admin-1", role: "admin" } }]) {
    for (const verified of [true, false]) {
      const app = setup(auth);
      assert.equal((await app.invoke("update", { verified })).code, 200);
      assert.equal(app.writes[0][2], "service-1");
      assert.equal(app.writes[0][3].verified, verified);
    }
  }
});

test("revoked admin roles and invalid badge values cannot update verification", async () => {
  const revoked = setup({ session: { sub: "former-admin", role: "admin" }, databaseRole: "customer" });
  assert.equal((await revoked.invoke("update", { verified: true })).code, 403);
  const app = setup({ cookieAdmin: { role: "admin" } });
  assert.equal((await app.invoke("update", { verified: "false" })).code, 400);
  assert.equal(app.writes.length, 0);
});
