const { query } = require("../db/pool");

let schemaReady;
function ensureUserActivitySchema() {
  if (!schemaReady) {
    schemaReady = query(`CREATE TABLE IF NOT EXISTS user_daily_activity (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date),
      PRIMARY KEY (activity_date, user_id)
    )`).catch(error => { schemaReady = null; throw error; });
  }
  return schemaReady;
}

async function recordUserActivity(user) {
  if (!user || user.role === "admin") return;
  const record = () => query(`INSERT INTO user_daily_activity(user_id, activity_date)
    VALUES ($1, (now() AT TIME ZONE 'Asia/Kolkata')::date)
    ON CONFLICT DO NOTHING`, [user.id]);
  try {
    try { await record(); }
    catch (error) {
      if (error.code !== "42P01") throw error;
      await ensureUserActivitySchema();
      await record();
    }
  } catch (error) {
    // Analytics must not prevent authenticated users from signing in.
    console.warn("Unable to record user activity", { code: error.code || "UNKNOWN" });
  }
}

async function getUserActivity() {
  await ensureUserActivitySchema();
  const result = await query(`WITH days AS (
    SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date - n)::date AS date
    FROM generate_series(0, 29) n
  ), logins AS (
    SELECT a.activity_date AS date, count(*)::int AS count
    FROM user_daily_activity a JOIN users u ON u.id = a.user_id
    WHERE u.role <> 'admin' AND a.activity_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date - 29
    GROUP BY a.activity_date
  ), signups AS (
    SELECT (created_at AT TIME ZONE 'Asia/Kolkata')::date AS date, count(*)::int AS count
    FROM users WHERE role <> 'admin'
      AND created_at >= (((now() AT TIME ZONE 'Asia/Kolkata')::date - 29)::timestamp AT TIME ZONE 'Asia/Kolkata')
    GROUP BY 1
  ) SELECT to_char(d.date, 'YYYY-MM-DD') AS date,
    COALESCE(l.count, 0)::int AS "loginUsers", COALESCE(s.count, 0)::int AS "newUsers"
    FROM days d LEFT JOIN logins l ON l.date = d.date LEFT JOIN signups s ON s.date = d.date
    ORDER BY d.date DESC`);
  const total = await query("SELECT count(*)::int AS count FROM users WHERE role <> 'admin'");
  return { timezone: "Asia/Kolkata", totalUsers: total.rows[0].count, today: result.rows[0], daily: result.rows };
}

module.exports = { recordUserActivity, getUserActivity, ensureUserActivitySchema };
