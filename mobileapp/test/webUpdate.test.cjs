const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");
const release = { nativeBuild: "22", bundleId: "android-22-" + "a".repeat(24), url: "https://updates.example/bundle.zip", checksum: "a".repeat(43) + "=", signature: "signed" };
function setup({ platform = "android", data = release, ok = true, blocked = [], current = null, failDownload = false } = {}) {
  const calls = [], module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../legacy/lib/webUpdate.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, URL, AbortSignal, process: { env: {} },
    fetch: async url => { calls.push(["fetch", url]); return { ok, json: async () => data }; },
    require(name) {
      if (name === "@capacitor/core") return { Capacitor: { getPlatform: () => platform } };
      if (name === "@capacitor/app") return { App: { getInfo: async () => ({ build: "22" }) } };
      if (name === "@/lib/utils") return { apiUrl: p => "https://api.example" + p };
      if (name === "@capawesome/capacitor-live-update") return { LiveUpdate: {
        ready: async () => calls.push(["ready"]),
        getCurrentBundle: async () => ({ bundleId: current }), getNextBundle: async () => ({ bundleId: null }),
        getBlockedBundles: async () => ({ bundleIds: blocked }), getDownloadedBundles: async () => ({ bundleIds: [] }),
        downloadBundle: async options => { calls.push(["download", options]); if (failDownload) throw new Error("Invalid signature"); },
        setNextBundle: async options => calls.push(["next", options]),
      } };
      throw new Error(name);
    },
  });
  return { ...module.exports, calls };
}
test("downloads a signed compatible update and schedules it without reloading", async () => {
  const s = setup(); await s.markWebUpdateReady(); await s.checkWebUpdate(); await s.checkWebUpdate();
  assert.deepEqual(s.calls.map(c => c[0]), ["ready", "fetch", "download", "next"]);
  assert.equal(s.calls[1][1], "https://api.example/api/web-updates/22/latest.json");
  assert.equal(s.calls[2][1].signature, "signed");
  assert.equal(s.calls[2][1].checksum, release.checksum);
});
test("web browsers do not invoke native updater or network", async () => {
  const s = setup({ platform: "web" }); await s.markWebUpdateReady(); await s.checkWebUpdate(); assert.equal(s.calls.length, 0);
});
test("incompatible, unsigned, malformed and insecure releases are ignored", async () => {
  for (const data of [null, {}, { ...release, nativeBuild: "21" }, { ...release, signature: "" }, { ...release, url: "http://example.com/a.zip" }, { ...release, checksum: "bad" }]) {
    const s = setup({ data }); await s.checkWebUpdate(); assert.deepEqual(s.calls.map(c => c[0]), ["fetch"]);
  }
});
test("failed downloads never become the next bundle", async () => {
  const s = setup({ failDownload: true }); await s.checkWebUpdate(); assert.deepEqual(s.calls.map(c => c[0]), ["fetch", "download"]);
});
test("rolled back and already active bundles are not reapplied", async () => {
  for (const options of [{ blocked: [release.bundleId] }, { current: release.bundleId }, { ok: false }]) {
    const s = setup(options); await s.checkWebUpdate(); assert.deepEqual(s.calls.map(c => c[0]), ["fetch"]);
  }
});
