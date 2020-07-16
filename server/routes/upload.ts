import * as fs from 'fs'
import * as crypto from 'crypto'
import * as mime from 'mime-types'
import base64url from "base64url"
import Busboy from 'busboy'
import express from 'express'
import { move } from '../modules/rclone'
import { postModel } from '../modules/mongo'

const router = express.Router()

router.post('/', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  busboy.on('file', async (key, file, filename, encoding, mimetype) => {
    const hash = base64url(crypto.randomBytes(5))
    const ext = mime.extension(mimetype)
    const filehash = `${hash}.${ext}`
    const path = `tmp/${filehash}`

    await postModel.create({ _id: filehash, filename })

    file.pipe(fs.createWriteStream(path))

    busboy.on('finish', async () => {
      await move(path)
      res.json({ filehash, filename })
    })
  })

  req.pipe(busboy)
})

export default router