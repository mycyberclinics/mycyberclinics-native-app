const { join } = require('path')
const dbhost = 'localhost'
const redishost = '127.0.0.1'

const config = {
  env: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  secret: 'super-secret-passphrase',
  database: `mongodb://${dbhost}:27017/cyber-clinic`,
  port: process.env.PORT || 4000,
  redis: {
    session: { host: redishost, port: 6379, db: 0 },
    client: { host: redishost, port: 6379, db: 1 }
  },
  avatarUploadDir: join(__dirname, './../../upload/avatar/')
}

module.exports = config
