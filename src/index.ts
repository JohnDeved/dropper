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
app.use('/oembed', (req, res) => {
  const url = req.query.url
  if (!url) return res.sendStatus(500)

  res.json({
    type: "rich",
    version: "1.0",
    title: "dropper file",
    provider_name: "dropper",
    provider_url: "https://dropper.file",
    cache_age: 3600,
    thumbnail_url: "https://dummyimage.com/600x400/000/fff",
    thumbnail_width: 600,
    thumbnail_height: 400,
    html: `<iframe src="${url}"></iframe>`,
  })
})

app.use('/e/:filename', (req, res) => {
  const { filename } = req.params
  console.log(filename)

  res.send(`
    <html>
    <head>
          <link href="//vjs.zencdn.net/4.5/video-js.css" rel="stylesheet">
      <style>
      * {
        padding:0;
        margin:0;
        width:100%;
        height:100%;
        background:#000;
      }
      </style>
    </head>

    <body>
      <video id="video" width="100%" height="100%">
        <source src="/d/${filename}" type='video/mp4' />
      </video>

      <script src="//vjs.zencdn.net/4.5/video.js"></script>
      <script type="text/javascript" src="http://cdn.embed.ly/player-0.1.0.min.js"></script>
      <script>
        var video = document.getElementById('video');

        videojs("video", {}, function(){
          var adapter = new playerjs.VideoJSAdapter(this);
          adapter.ready();
        });
      </script>
    </body>
    </html>
  `)
})

app.use('/d/:filename', createProxyMiddleware({
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  pathRewrite: { '^/d': '/' },
}))

app.post('/u', (req, res) => {
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