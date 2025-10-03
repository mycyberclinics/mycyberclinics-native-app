const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const config = require('../config/main')
const passport = require('../config/passport')

exports.signup = async (ctx) => {
  const { email, username, password } = ctx.request.body
  if (!email || !username || !password) {
    ctx.status = 400
    ctx.body = { success: false, message: 'Missing fields.' }
    return
  }
  let user = await User.findOne({ email })
  if (user) {
    ctx.status = 400
    ctx.body = { success: false, message: 'Email already registered.' }
    return
  }
  user = new User({
    email,
    username,
    password,
    registeTime: new Date(),
    profile: {}
  })
  await user.save()
  ctx.body = { success: true, message: 'User registered.' }
}

exports.login = (ctx, next) => {
  return passport.authenticate('email-local', (err, user) => {
    if (err) {
      ctx.status = 500
      ctx.body = { success: false, message: 'Authentication error.' }
      return
    }
    if (user) {
      const token = jwt.sign(
        { _id: user._id, email: user.email },
        config.secret,
        { expiresIn: '7d' }
      )
      ctx.body = {
        success: true,
        token,
        profile: user.profile,
        username: user.username,
        email: user.email
      }
    } else {
      ctx.status = 401
      ctx.body = { success: false, message: 'Invalid credentials.' }
    }
  })(ctx, next)
}

exports.getProfile = async (ctx) => {
  const userId = ctx.request.query._id
  const user = await User.findById(userId)
  if (!user) {
    ctx.status = 404
    ctx.body = { success: false, message: 'User not found.' }
    return
  }
  ctx.body = {
    success: true,
    profile: user.profile,
    username: user.username,
    email: user.email
  }
}

exports.setProfile = async (ctx) => {
  const { _id, profile } = ctx.request.body
  const user = await User.findById(_id)
  if (!user) {
    ctx.status = 404
    ctx.body = { success: false, message: 'User not found.' }
    return
  }
  user.profile = { ...user.profile, ...profile }
  await user.save()
  ctx.body = { success: true, profile: user.profile }
}
