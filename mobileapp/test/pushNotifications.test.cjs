const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
const ts = require("typescript");
function setup({ permission = "granted", online = true } = {}) {
  const storage = new Map([["vizha_mobile_token", "signed-in-token"]]);
  const events = {}, requests = [], calls = [], module = { exports: {} };
  const window = { setTimeout, clearTimeout, dispatchEvent() {}, location: { hash: "" } };
  const push = {
    addListener: async (event, handler) => { events[event] = handler; },
    checkPermissions: async () => ({ receive: permission }),
    requestPermissions: async () => ({ receive: permission }),
    createChannel: async () => {},
    register: async () => { events.registration({ value: "firebase-device-token-123456789" }); },
    unregister: async () => calls.push("unregister"),
    removeAllDeliveredNotifications: async () => calls.push("clear"),
  };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../legacy/lib/pushNotifications.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, window, Event: class {},
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    fetch: async (url, init) => { requests.push({ url, ...init }); return { ok: online }; },
    require(name) {
      if (name === "@capacitor/core") return { Capacitor: { getPlatform: () => "android" } };
      if (name === "@capacitor/push-notifications") return { PushNotifications: push };
      if (name === "sonner") return { toast() {} };
      if (name === "@/lib/utils") return { apiUrl: path => path };
      throw new Error(name);
    },
  });
  return { ...module.exports, storage, events, requests, calls, window };
}
test("enable registers the device using the current signed-in session", async () => {
  const s = setup(); await s.enablePush();
  assert.equal(s.pushEnabled(), true);
  assert.equal(s.requests[0].headers.Authorization, "Bearer signed-in-token");
  assert.equal(JSON.parse(s.requests[0].body).platform, "android");
});
test("denied permission and missing authentication never register a device", async () => {
  const denied = setup({ permission: "denied" });
  await assert.rejects(denied.enablePush(), /Android Settings/);
  assert.equal(denied.requests.length, 0);
  const guest = setup(); guest.storage.delete("vizha_mobile_token");
  await assert.rejects(guest.enablePush(), /Sign in/);
  assert.equal(guest.requests.length, 0);
});
test("logout invalidates the native token even if the backend is offline", async () => {
  const s = setup({ online: false });
  s.storage.set("vizha_push_token", "firebase-device-token-123456789");
  s.storage.set("vizha_push_enabled", "true");
  await assert.rejects(s.unregisterPushDevice(), /retry/);
  assert.deepEqual(s.calls, ["unregister", "clear"]);
  assert.equal(s.pushEnabled(), false);
  assert.equal(s.storage.has("vizha_push_token"), false);
});
test("notification taps accept only supported in-app destinations", async () => {
  const s = setup(); await s.enablePush();
  const tap = route => s.events.pushNotificationActionPerformed({ notification: { data: { route } } });
  tap("https://example.com"); assert.equal(s.window.location.hash, "");
  tap("/admin"); assert.equal(s.window.location.hash, "");
  tap("/bookings"); assert.equal(s.window.location.hash, "#/bookings");
});
