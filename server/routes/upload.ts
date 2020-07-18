import * as fs from 'fs'
import * as crypto from 'crypto'
import base64url from "base64url"
import Busboy from 'busboy'
import express from 'express'
import { move } from '../modules/rclone'
import { fileModel } from '../modules/mongo'
import parseFile from 'parse-filepath'

const router = express.Router()

router.post('/xhr', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  busboy.on('file', async (key, file, filename) => {
    let filehash = base64url(crypto.randomBytes(5))
    const { ext } = parseFile(filename)
    if (ext) filehash += ext

    await fileModel.create({ _id: filehash, filename })

    const path = `tmp/${filehash}`
    file.pipe(fs.createWriteStream(path))

    busboy.on('finish', async () => {
      await move(path)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ filehash, filename })
    })
  })

  req.pipe(busboy)
})

interface IUploadMetadata {
  filetype?: string
  filename?: string
}

function getMetaData (req: express.Request): IUploadMetadata {
  const rawMetadata = req.get('Upload-Metadata')
  return rawMetadata.split(',')
    .map(raw => {
      const [key, base64] = raw.split(' ')
      const value = Buffer.from(base64, 'base64').toString()
      return { key, value }
    })
    .reduce((obj, val) => {
      obj[val.key] = val.value
      return obj
    }, {})
}

router.post('/tus', async (req, res) => {
  const { filename } = getMetaData(req)
  const length = Number(req.get('Upload-Length'))

  let filehash = base64url(crypto.randomBytes(5))
  const { ext } = parseFile(filename)
  if (ext) filehash += ext

  await fileModel.create({ _id: filehash, filename, length })

  fs.promises.writeFile(`tmp/${filehash}`, Buffer.from([]))

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Location', `/stream/${filehash}`)
  res.sendStatus(201)
})

export default router