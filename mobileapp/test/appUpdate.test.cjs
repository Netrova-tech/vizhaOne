const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");
function setup({ platform = "android", availability = 2, error = false } = {}) {
  const calls = [], module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../legacy/lib/appUpdate.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require(name) {
    if (name === "@capacitor/core") return { Capacitor: { getPlatform: () => platform } };
    if (name === "@capawesome/capacitor-app-update") return {
      AppUpdateAvailability: { UPDATE_AVAILABLE: 2 },
      AppUpdate: {
        getAppUpdateInfo: async () => { calls.push("check"); if (error) throw new Error("unavailable"); return { updateAvailability: availability }; },
        openAppStore: async () => { calls.push("open"); if (error) throw new Error("unavailable"); },
      },
    };
    throw new Error(name);
  } });
  return { ...module.exports, calls };
}
test("prompts only when Google Play reports an available update", async () => {
  assert.equal(await setup().checkPlayStoreUpdate(), true);
  for (const availability of [0, 1, 3]) assert.equal(await setup({ availability }).checkPlayStoreUpdate(), false);
});
test("offline checks do not prevent the app opening", async () => {
  assert.equal(await setup({ error: true }).checkPlayStoreUpdate(), false);
});
test("web and iOS do not call the Android update checker", async () => {
  for (const platform of ["web", "ios"]) {
    const s = setup({ platform }); assert.equal(await s.checkPlayStoreUpdate(), false); assert.equal(s.calls.length, 0);
  }
});
test("Update now opens this application's store listing and surfaces failures for retry", async () => {
  const s = setup(); await s.openPlayStoreUpdate(); assert.deepEqual(s.calls, ["open"]);
  await assert.rejects(setup({ error: true }).openPlayStoreUpdate(), /unavailable/);
});
