const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')

const UserSchema = new Schema(
  {
    email: { type: String, lowercase: true, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profile: {
      nickname: { type: String, default: '' },
      website: { type: String, default: '' },
      description: { type: String, default: '' },
      avatar: { type: String, default: '' }
    },
    role: {
      type: String,
      enum: ['Member', 'Owner', 'Admin'],
      default: 'Member'
    },
    registeTime: { type: Date },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
)

UserSchema.pre('save', function (next) {
  const user = this
  if (!user.isModified('password')) return next()
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err)
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err)
      user.password = hash
      next()
    })
  })
})

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

module.exports = mongoose.model('UserModel', UserSchema)
