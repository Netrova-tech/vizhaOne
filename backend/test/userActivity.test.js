const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function service() {
  const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/userActivityService.js"), "utf8"), {
    module, require: () => ({ query: async (sql, values) => {
      calls.push({ sql, values });
      return { rows: sql.includes("WITH days") ? [{ date: "2026-10-21", loginUsers: 2, newUsers: 1 }] : [{ count: 7 }] };
    } }),
  });
  return { ...module.exports, calls };
}
test("activity ignores unauthenticated and admin users and deduplicates by India day", async () => {
  const s = service();
  await s.recordUserActivity(null);
  await s.recordUserActivity({ id: "admin", role: "admin" });
  assert.equal(s.calls.length, 0);
  await s.recordUserActivity({ id: "customer", role: "customer" });
  assert.equal(s.calls[0].values[0], "customer");
  assert.match(s.calls[0].sql, /Asia\/Kolkata/);
  assert.match(s.calls[0].sql, /ON CONFLICT DO NOTHING/);
});
test("report returns daily and total account counts with zero-filled India dates", async () => {
  const s = service();
  const report = await s.getUserActivity();
  assert.equal(report.totalUsers, 7);
  assert.equal(report.today.loginUsers, 2);
  assert.equal(report.today.newUsers, 1);
  assert.equal(report.timezone, "Asia/Kolkata");
  assert.match(s.calls[0].sql, /generate_series\(0, 29\)/);
  assert.match(s.calls[0].sql, /COALESCE\(l.count, 0\)/);
  assert.match(s.calls[1].sql, /role <> 'admin'/);
});
