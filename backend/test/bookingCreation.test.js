const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
function setup(profile = { name: "Saved customer", mobile: "9876543210" }) {
  const inserted = [], notified = [], module = { exports: {} };
  const query = async (sql, values) => {
    if (sql.startsWith("SELECT name,mobile")) return { rows: profile ? [profile] : [] };
    if (sql.startsWith("INSERT INTO bookings")) { inserted.push(values); return { rows: [] }; }
    return { rows: inserted.map(v => ({ id:v[0], user_id:v[1], service_id:v[3], customer_name:v[10], mobile:v[11], status:"pending" })) };
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/bookingService.js"), "utf8"), {
    module, console, require(name) {
      if (name === "../db/pool") return { query, transaction: async fn => fn({ query }) };
      if (name === "./pushService") return { notifyNewBooking: async b => notified.push(b), notifyBookingStatus: async () => {} };
      if (name === "./referralService") return { registerReferral: async () => {}, syncBookingReward: async () => {} };
      throw new Error(name);
    }
  });
  return { ...module.exports, inserted, notified };
}
const item = { serviceId:"service-1", date:"2099-01-01", name:"Typed name", mobile:"0000000000" };
test("single booking uses authenticated profile contact and notifies after creation", async () => {
  const s = setup(); await s.createBooking(null, item, "customer-1");
  assert.equal(s.inserted[0][10], "Saved customer");
  assert.equal(s.inserted[0][11], "9876543210");
  assert.equal(s.inserted[0][1], "customer-1");
  assert.equal(s.notified[0].service_id, "service-1");
});
test("cart bookings use saved contact for every item and notify each provider", async () => {
  const s = setup(); await s.createBulkBookings(null, { bookings:[item, {...item,serviceId:"service-2"}] }, "customer-1");
  assert.equal(s.inserted.length, 2);
  assert.ok(s.inserted.every(v => v[10] === "Saved customer" && v[11] === "9876543210"));
  assert.equal(s.notified.length, 2);
});
test("missing profile contact prevents creation and notifications", async () => {
  const s = setup(null);
  await assert.rejects(s.createBooking(null,item,"customer-1"), /Complete your profile/);
  assert.equal(s.inserted.length, 0); assert.equal(s.notified.length, 0);
});
