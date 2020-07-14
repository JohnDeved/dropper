import * as fs from 'fs'
import * as express from 'express'
import * as crypto from 'crypto'
import * as mime from 'mime-types'
import base64url from "base64url"

const app = express()

app.post('/', (req, res) => {
  const type = req.header('Content-Type')
  const ext = mime.extension(type)

  const hash = base64url(crypto.randomBytes(5))
  const filename = `${hash}.${ext}`

  req.pipe(fs.createWriteStream(`tmp/${filename}`))
  req.on('end', async () => {
    await fs.promises.copyFile(`tmp/${filename}`, `files/${filename}`)
    await fs.promises.unlink(`tmp/${filename}`)
    res.send(filename)
  })
})

app.get('/:filename', (req, res) => {
  const { filename } = req.params

  const type = mime.contentType(filename)
  if (type) res.setHeader("Content-Type", type)

  const filepath = `files/${filename}`
  fs.exists(filepath, exists => {
    if (!exists) return res.sendStatus(404)
    fs.createReadStream(`files/${filename}`).pipe(res)
  })
})

app.listen(3000)