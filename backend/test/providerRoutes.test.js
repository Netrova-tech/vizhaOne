const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function setup({ session = { sub: "vendor-user", role: "service_provider" }, current, missing = false, database } = {}) {
  const handlers = {}, calls = [], rewards = [];
  const query = async (sql, values) => {
    calls.push({ sql, values });
    if (database) return database(sql, values);
    if (sql.includes("FOR UPDATE OF b")) return { rows: current ? [current] : [] };
    if (sql.startsWith("UPDATE bookings")) return { rows: [{ ...current, status: values[1] }] };
    if (sql.startsWith("UPDATE services")) return { rowCount: missing ? 0 : 1, rows: [{ id: "service-1", verified: false }] };
    return { rows: [], rowCount: 0 };
  };
  const router = {};
  for (const method of ["get", "post", "patch"]) router[method] = (url, handler) => { handlers[`${method} ${url}`] = handler; };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/routes/providerRoutes.js"), "utf8"), {
    module,
    require(name) {
      if (name === "../services/pushService") return { notifyBookingStatus: async () => {} };
      if (name === "express") return { Router: () => router };
      if (name === "node:crypto") return require(name);
      if (name === "../db/pool") return { query, transaction: fn => fn({ query }) };
      if (name === "../services/authService") return { mobileSession: () => session };
      if (name === "../services/referralService") return { syncBookingReward: async (...args) => rewards.push(args) };
      throw new Error(name);
    },
  });
  module.exports.createProviderRouter();
  return {
    calls, rewards,
    async invoke(route, body = {}) {
      const res = { code: 200, set() { return this; }, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
      await handlers[route]({ params: { id: "item-1" }, body }, res);
      return res;
    },
  };
}

test("vendor endpoints reject missing and customer sessions before database access", async () => {
  for (const [session, code] of [[null, 401], [{ sub: "customer", role: "customer" }, 403]]) {
    for (const route of ["get /dashboard", "get /bookings", "patch /services/:id", "patch /bookings/:id"]) {
      const app = setup({ session });
      assert.equal((await app.invoke(route)).code, code);
      assert.equal(app.calls.length, 0);
    }
  }
});

test("published service belongs to the signed-in vendor and appears in their dashboard", async () => {
  let saved;
  const app = setup({ database: async (sql, values) => {
    if (sql.includes("SELECT id,role FROM users")) return { rows: [{ id: "vendor-user", role: "service_provider" }] };
    if (sql.includes("INSERT INTO vendors") || sql.includes("SELECT * FROM vendors")) {
      assert.equal(values[0], "vendor-user");
      return { rows: [{ id: "vendor-1", user_id: "vendor-user" }] };
    }
    if (sql.includes("INSERT INTO services")) {
      assert.equal(values[1], "vendor-1");
      saved = { id: values[0], vendor_id: values[1], title: values[3], availability_status: true, verified: false };
      return { rows: [saved] };
    }
    if (sql.includes("SELECT * FROM services")) {
      assert.equal(values[0], "vendor-1");
      return { rows: [saved] };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  } });
  const published = await app.invoke("post /publish", { vendorName: "Studio", phone: "9876543210", serviceName: "Photography", location: "Chennai", imageUrls: ["https://example.com/photo.jpg"], verified: true, vendor_id: "another-vendor" });
  assert.equal(published.code, 201);
  assert.equal(published.body.service.verified, false);
  const dashboard = await app.invoke("get /dashboard");
  assert.equal(dashboard.body.services.length, 1);
  assert.equal(dashboard.body.services[0].id, published.body.service.id);
  assert.equal(dashboard.body.services[0].listingStatus, "published");
});

test("booking listing is restricted to the signed-in vendor", async () => {
  const app = setup();
  assert.equal((await app.invoke("get /bookings")).code, 200);
  assert.match(app.calls[0].sql, /v.user_id=\$1/);
  assert.equal(app.calls[0].values[0], "vendor-user");
});

test("another vendor's booking cannot be accepted", async () => {
  const app = setup();
  assert.equal((await app.invoke("patch /bookings/:id", { status: "approved" })).code, 404);
  assert.match(app.calls[0].sql, /v.user_id=\$2/);
  assert.equal(app.calls[0].values[1], "vendor-user");
  assert.equal(app.calls.length, 1);
});

test("pending bookings can be accepted and rewards synchronized", async () => {
  const app = setup({ current: { id: "booking-1", status: "pending" } });
  const result = await app.invoke("patch /bookings/:id", { status: "approved" });
  assert.equal(result.code, 200);
  assert.equal(result.body.status, "approved");
  assert.deepEqual(app.rewards, [["booking-1", "approved"]]);
});

test("completed bookings cannot be reopened and pending bookings cannot skip to completion", async () => {
  for (const status of ["pending", "completed"]) {
    const app = setup({ current: { id: "booking-1", status } });
    assert.equal((await app.invoke("patch /bookings/:id", { status: "completed" })).code, 409);
    assert.equal(app.calls.length, 1);
  }
});

test("declining requires a reason; valid cancellation stores it", async () => {
  const app = setup({ current: { id: "booking-1", status: "pending" } });
  assert.equal((await app.invoke("patch /bookings/:id", { status: "cancelled" })).code, 400);
  assert.equal(app.calls.length, 0);
  assert.equal((await app.invoke("patch /bookings/:id", { status: "cancelled", rejectionReason: "Unavailable" })).code, 200);
  assert.equal(app.calls[1].values[2], "Unavailable");
});

const service = { title: "Photography", location: "Chennai", vendor_mobile: "9876543210", vendor_name: "Studio", price: 5000, availability_status: true };
test("service editing validates price and availability before writing", async () => {
  for (const edit of [{ price: -1 }, { price: "invalid" }, { availability_status: "true" }]) {
    const app = setup();
    assert.equal((await app.invoke("patch /services/:id", { ...service, ...edit })).code, 400);
    assert.equal(app.calls.length, 0);
  }
});

test("service edits cannot change ownership or verification", async () => {
  const app = setup();
  assert.equal((await app.invoke("patch /services/:id", { ...service, verified: true, vendor_id: "someone-else" })).code, 200);
  assert.match(app.calls[0].sql, /v.user_id=\$10/);
  assert.equal(app.calls[0].values[9], "vendor-user");
  assert.doesNotMatch(app.calls[0].sql, /SET verified|verified=|vendor_id=\$/);
  const missing = setup({ missing: true });
  assert.equal((await missing.invoke("patch /services/:id", service)).code, 404);
});
