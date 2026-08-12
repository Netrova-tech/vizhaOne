const { getPool } = require("../db/pool");

async function connectDatabase() {
  await getPool().query("SELECT 1");
}

module.exports = { connectDatabase };
