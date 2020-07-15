import * as fs from 'fs'
import * as crypto from 'crypto'
import * as mime from 'mime-types'
import base64url from "base64url"
import * as Busboy from 'busboy'
import * as express from 'express'
import { move } from '../modules/rclone'

const router = express.Router()

router.post('/', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  busboy.on('file', (key, file, filename, encoding, mimetype) => {
    const hash = base64url(crypto.randomBytes(5))
    const ext = mime.extension(mimetype)
    const filehash = `${hash}.${ext}`
    const path = `tmp/${filehash}`

    file.pipe(fs.createWriteStream(path))

    busboy.on('finish', async () => {
      await move(path)
      res.send(filehash)
    })
  })

  req.pipe(busboy)
})

export default router