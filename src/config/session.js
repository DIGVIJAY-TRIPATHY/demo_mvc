
const session = require('express-session')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const { sequelize } = require('../db/sequelize')
const {env} = require('./env')

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000
})

const sessionMiddleware = session({
  name: 'project_camp.sid',
  secret: env.sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
})

module.exports = {
  sessionMiddleware,
  sessionStore
}
