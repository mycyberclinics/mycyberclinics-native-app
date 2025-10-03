const passport = require('koa-passport')
const User = require('../models/userModel')
const config = require('./main')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const LocalStrategy = require('passport-local')

const localOptions = { usernameField: 'email' }
const localEmailLogin = new LocalStrategy(localOptions, function (
  email,
  password,
  done
) {
  User.findOne({ email }, function (err, user) {
    if (err) return done(err)
    if (!user) return done(null, false, { error: 'Invalid credentials.' })
    user.comparePassword(password, function (err, isMatch) {
      if (err) return done(err)
      if (!isMatch) return done(null, false, { error: 'Invalid credentials.' })
      return done(null, user)
    })
  })
})

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.secret
}
const jwtLogin = new JwtStrategy(jwtOptions, function (payload, done) {
  User.findById(payload._id, function (err, user) {
    if (err) return done(err, false)
    if (user) done(null, user)
    else done(null, false)
  })
})

passport.serializeUser(function (user, done) {
  done(null, user)
})
passport.deserializeUser(function (user, done) {
  return done(null, user)
})
passport.use(jwtLogin)
passport.use('email-local', localEmailLogin)
module.exports = passport
