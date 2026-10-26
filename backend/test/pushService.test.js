const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
function setup(devices = [], responses = [], owners = []) {
  const calls = [], messages = [], module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/pushService.js"), "utf8"), {
    module, process: { env: {} }, console,
    require(name) {
      if (name === "firebase-admin/app") return { getApps: () => [{}] };
      if (name === "firebase-admin/messaging") return { getMessaging: () => ({ sendEachForMulticast: async message => {
        messages.push(message);
        return { successCount: responses.filter(r => r.success).length, failureCount: responses.filter(r => !r.success).length, responses };
      } }) };
      if (name === "../db/pool") return { query: async (sql, values) => {
        calls.push({ sql, values }); return { rows: sql.startsWith("SELECT token") ? devices : sql.startsWith("SELECT DISTINCT v.user_id") ? owners : [] };
      } };
      throw new Error(name);
    },
  });
  return { ...module.exports, calls, messages };
}
test("register validates device input and associates tokens with the signed-in user", async () => {
  const s = setup();
  await assert.rejects(s.registerDevice("user-1", "", "android"), { status: 400 });
  await assert.rejects(s.registerDevice("user-1", "a".repeat(30), "ios"), { status: 400 });
  assert.equal(s.calls.length, 0);
  await s.registerDevice("user-1", "a".repeat(30), "android");
  assert.equal(s.calls[0].values[1], "user-1");
  assert.match(s.calls[0].sql, /ON CONFLICT/);
});
test("device removal is scoped to its owner", async () => {
  const s = setup(); await s.removeDevice("user-1", "a".repeat(30));
  assert.match(s.calls[0].sql, /token=\$1 AND user_id=\$2/);
  assert.equal(s.calls[0].values[1], "user-1");
});
test("messages target only the account devices and expired tokens are removed", async () => {
  const s = setup([{ token: "valid" }, { token: "expired" }], [{ success: true }, { success: false, error: { code: "messaging/registration-token-not-registered" } }]);
  const result = await s.sendUserPush("user-1", "Update", "Approved");
  assert.equal(result.sent, 1);
  assert.equal(result.failed, 1);
  assert.equal(s.calls[0].values[0], "user-1");
  assert.equal(s.messages[0].android.notification.channelId, "vizhaone_updates");
  assert.equal(s.messages[0].data.route, "/bookings");
  assert.equal(s.calls[1].values[1][0], "expired");
});
test("accounts without devices do not call Firebase", async () => {
  const s = setup(); assert.equal((await s.sendUserPush("user-1", "Update", "Approved")).sent, 0);
  assert.equal(s.messages.length, 0);
  await s.notifyBookingStatus({ user_id: null, status: "approved" });
  assert.equal(s.calls.length, 1);
});

test("new booking alerts target the listing owner and open provider bookings", async () => {
  const s = setup([{token:"vendor-device"}], [{success:true}], [{user_id:"provider-1"}]);
  await s.notifyNewBooking({service_id:"service-1"});
  assert.equal(s.calls[0].values[0], "service-1");
  assert.match(s.calls[0].sql, /s.id=\$1 OR h.id=\$2/);
  assert.equal(s.calls[1].values[0], "provider-1");
  assert.equal(s.messages[0].data.route, "/provider-dashboard?tab=bookings");
});
test("unowned listings do not send provider alerts", async () => {
  const s = setup(); await s.notifyNewBooking({service_id:"unowned"});
  assert.equal(s.messages.length, 0);
});
