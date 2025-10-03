const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const helmet = require('koa-helmet')
const cors = require('koa2-cors')
const passport = require('./config/passport')
const router = require('./routes/index')
const mongoose = require('mongoose')
const config = require('./config/main')

mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const app = new Koa()

app.use(helmet())
app.use(cors())
app.use(bodyParser())
app.use(logger())
app.use(passport.initialize())
app.use(router.routes()).use(router.allowedMethods())

module.exports = app
