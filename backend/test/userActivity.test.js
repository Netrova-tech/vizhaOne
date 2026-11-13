const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function service(database) {
  const calls = [], warnings = [];
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/userActivityService.js"), "utf8"), {
    module, console: { warn: (...args) => warnings.push(args) }, require: () => ({ query: async (sql, values) => {
      calls.push({ sql, values });
      if (database) return database(sql, values);
      return { rows: sql.includes("WITH days") ? [{ date: "2026-10-21", loginUsers: 2, newUsers: 1 }] : [{ count: 7 }] };
    } }),
  });
  return { ...module.exports, calls, warnings };
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
  assert.match(s.calls[0].sql, /CREATE TABLE IF NOT EXISTS user_daily_activity/);
  assert.match(s.calls[1].sql, /generate_series\(0, 29\)/);
  assert.match(s.calls[1].sql, /COALESCE\(l.count, 0\)/);
  assert.match(s.calls[2].sql, /role <> 'admin'/);
});

test("missing activity table is created and the login activity is retried", async () => {
  let exists = false, records = 0;
  const s = service(async sql => {
    if (sql.startsWith("CREATE TABLE")) exists = true;
    else if (!exists) throw Object.assign(new Error("relation user_daily_activity does not exist"), { code: "42P01" });
    else records++;
    return { rows: [] };
  });
  await s.recordUserActivity({ id: "google-user", role: "customer" });
  assert.equal(records, 1);
  assert.equal(s.warnings.length, 0);
});

test("activity failures cannot block sign-in, and a failed migration can retry", async () => {
  let unavailable = true;
  const s = service(async () => {
    if (unavailable) throw Object.assign(new Error("database permission denied"), { code: "42501" });
    return { rows: [] };
  });
  await assert.doesNotReject(s.recordUserActivity({ id: "google-user", role: "customer" }));
  assert.equal(s.warnings.length, 1);
  await assert.rejects(s.ensureUserActivitySchema());
  unavailable = false;
  await assert.doesNotReject(s.ensureUserActivitySchema());
});
