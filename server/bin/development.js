#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const debug = require('debug')('dev')
require('colors')
const log = console.log.bind(console, '>>> [DEV]:'.red)
const babelCliDir = require('babel-cli/lib/babel/dir')
const babelCliFile = require('babel-cli/lib/babel/file')
const chokidar = require('chokidar')
const srcPath = path.join(__dirname, '../src')
const appPath = path.join(__dirname, '../app')
const watcher = chokidar.watch(srcPath)

watcher.on('ready', function () {
  log('Compiling...'.green)
  babelCliDir({ outDir: 'app/', retainLines: true, sourceMaps: true }, [
    'src/'
  ])
  require('../app')
  log('♪ App Started'.green)

  watcher
    .on('add', function (absPath) {
      compileFile('src/', 'app/', path.relative(srcPath, absPath), cacheClean)
    })
    .on('change', function (absPath) {
      compileFile('src/', 'app/', path.relative(srcPath, absPath), cacheClean)
    })
    .on('unlink', function (absPath) {
      const rmfileRelative = path.relative(srcPath, absPath)
      const rmfile = path.join(appPath, rmfileRelative)
      try {
        fs.unlinkSync(rmfile)
        fs.unlinkSync(rmfile + '.map')
      } catch (e) {
        debug('fail to unlink', rmfile)
        return
      }
      console.log('Deleted', rmfileRelative)
      cacheClean()
    })
})

function compileFile (srcDir, outDir, filename, cb) {
  const outFile = path.join(outDir, filename)
  const srcFile = path.join(srcDir, filename)
  try {
    babelCliFile(
      {
        outFile,
        retainLines: true,
        highlightCode: true,
        comments: true,
        babelrc: true,
        sourceMaps: true
      },
      [srcFile],
      {
        highlightCode: true,
        comments: true,
        babelrc: true,
        ignore: [],
        sourceMaps: true
      }
    )
  } catch (e) {
    console.error('Error while compiling file %s', filename, e)
    return
  }
  console.log(srcFile + ' -> ' + outFile)
  cb && cb()
}

function cacheClean () {
  Object.keys(require.cache).forEach(function (id) {
    if (/[/\\](app)[/\\]/.test(id)) {
      delete require.cache[id]
    }
  })
  log('♬ App Cache Cleaned...'.green)
}

process.on('exit', function (e) {
  log(' ♫ App Quit'.green)
})
