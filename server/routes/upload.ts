import * as fs from 'fs'
import * as crypto from 'crypto'
import base64url from "base64url"
import Busboy from 'busboy'
import express from 'express'
import { move } from '../modules/rclone'
import { postModel } from '../modules/mongo'
import parseFile from 'parse-filepath'

const router = express.Router()

router.post('/', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  busboy.on('file', async (key, file, filename) => {
    let filehash = base64url(crypto.randomBytes(5))
    const { ext } = parseFile(filename)
    if (ext) filehash += ext

    await postModel.create({ _id: filehash, filename })

    const path = `tmp/${filehash}`
    file.pipe(fs.createWriteStream(path))

    busboy.on('finish', async () => {
      await move(path)
      res.json({ filehash, filename })
    })
  })

  req.pipe(busboy)
})

export default router