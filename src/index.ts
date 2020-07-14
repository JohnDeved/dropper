import * as fs from 'fs'
import * as express from 'express'
import * as crypto from 'crypto'
import * as mime from 'mime-types'
import base64url from "base64url"
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process'

const rclone = process.env.NODE_ENV === 'production' ? './rclone' : 'rclone'
const rootDomain = 'https://dropper.up1.dev'
spawn(rclone, ['--config=./rclone.conf', 'serve', 'http', 'dropper:'])

const app = express()
app.use('/v/:filename', (req, res) => {
  const { filename } = req.params
  res.send(`
    <meta property="og:type" content="video">
    <meta property="og:video" content="${rootDomain}/${filename}">
    <meta property="og:video:secure_url" content="${rootDomain}/${filename}">
    <video controls autoplay name="media">
      <source src="${rootDomain}/E49wsNc.mp4" type="video/mp4">
    </video>
  `)
})
app.use('/:filename', createProxyMiddleware({ target: 'http://127.0.0.1:8080', changeOrigin: true }))

app.post('/', (req, res) => {
  const type = req.header('Content-Type')
  const ext = mime.extension(type)

  const hash = base64url(crypto.randomBytes(5))
  const filename = `${hash}.${ext}`
  const path = `tmp/${filename}`

  req.pipe(fs.createWriteStream(path))
  req.on('end', async () => {

    spawn(rclone, ['--config=./rclone.conf', 'move', path, 'dropper:']).on('close', () => {
      res.send(filename)
    })
  })
})

app.listen(3000)