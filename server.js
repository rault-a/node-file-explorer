'use strict';

const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const basicAuth = require('basic-auth-connect')

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

const publicDir = path.join(__dirname, 'public')
const username = process.env.USERNAME
const password = process.env.PASSWORD

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
if (username && password) {
  app.use(basicAuth(username, password));
}

app.use(express.static(publicDir, {
  maxAge: 86400000
}));

app.locals.moment = require('moment')

function humanFileSize(bytes) {
  const units = ['o', 'ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo']
  let u = 0
  while (bytes >= 1000 ** (u + 1)) {
    ++u;
  }
  return `${(bytes / 1000 ** u).toFixed(1)} ${units[u]}`
}

async function list(directory) {
  const files = await readdir(directory)
  return Promise.all(files.map((file) => {
    return new Promise(async (resolve, reject) => {
      const stats = await stat(path.join(directory, file)).catch(reject)
      if (!stats) {
        return
      }

      resolve({
        filename: file,
        isDir: stats.isDirectory(),
        size: humanFileSize(stats.size),
        creation: stats.ctime.toISOString().replace('T', ' ').replace(/\.\d{3}Z/, '')
      })
    })
  }))
}

app.get('/*', async (req, res) => {
  const files = await list(path.join(publicDir, req.params[0]))
  res.render('index', {
    title: process.env.TITLE,
    currentDir: req.params[0],
    subDir: req.params[0] !== '',
    files: files
  })
});

app.listen(process.env.PORT || 8002);
