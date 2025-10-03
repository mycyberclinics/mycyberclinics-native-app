const winston = require('winston')
const fs = require('fs-extra')
const { join, dirname } = require('path')

const filename = join(__dirname, './../../logs/server.log')
fs.ensureDirSync(dirname(filename))

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename })
  ]
})

module.exports = logger
logger.info('logger started')
