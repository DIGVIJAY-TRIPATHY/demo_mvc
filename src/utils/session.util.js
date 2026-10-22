const { sequelize } = require("../db/sequelize");

// Deletes every stored session that belongs to a user (log out everywhere).
// `exceptSid` keeps one session alive (e.g. the current device).
// connect-session-sequelize stores the session JSON in the `data` column.
async function destroyUserSessions(userId, exceptSid = null) {
  const replacements = { userId: String(userId) };
  let sql = `DELETE FROM "sessions" WHERE (data::jsonb ->> 'userId') = :userId`;

  if (exceptSid) {
    sql += ` AND sid <> :sid`;
    replacements.sid = exceptSid;
  }

  await sequelize.query(sql, { replacements });
}

module.exports = { destroyUserSessions };