import fs from 'fs'
import crypto from 'crypto'
import base64url from "base64url"
import Busboy from 'busboy'
import express from 'express'
import { move } from '../modules/rclone'
import { fileModel } from '../modules/mongo'
import parseFile from 'parse-filepath'
import { promisify } from 'util'
import { Transform } from 'stream'
import BlockStream from 'block-stream2'
import { Buffer } from 'buffer'
import { Crypto } from '@peculiar/webcrypto'

const fsExists = promisify(fs.exists)
const router = express.Router()
const webcrypto = new Crypto()

router.post('/xhr', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  const length = Number(req.get('Content-Length'))
  if (length > 1e8) return res.sendStatus(400)

  busboy.on('file', async (key, file, filename) => {
    let filehash = base64url(crypto.randomBytes(5))
    const { ext } = parseFile(filename)
    if (ext) filehash += ext


    const path = `tmp/${filehash}`
    file.pipe(fs.createWriteStream(path))

    busboy.on('finish', async () => {
      await fileModel.create({ _id: filehash, filename, uploaded: true, length })
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
  res.setHeader('Location', `/upload/tus/${filehash}`)
  res.sendStatus(201)
})

router.patch('/tus/:filename', async (req, res) => {
  const { filename } = req.params
  const length = Number(req.get('Content-Length'))
  const offset = Number(req.get('Upload-Offset'))

  const total = offset + length
  const path = `tmp/${filename}`

  if (!await fsExists(path)) res.sendStatus(404)

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Upload-Offset', total)

  const stream = fs.createWriteStream(path, { start: offset, flags: 'r+' })
  req.pipe(stream)
  req.on('end', async () => {
    const file = await fileModel.findOne({ _id: filename })

    if (file.length === total) {
      // file.uploaded = true
      // await move(path)
      // await file.save()

      const decrypt = new Transform({
        async transform(chunk: Buffer, encode, next) {
          const crpytString = req.get('Cryptkey')
          const cryptBuffer = Buffer.from(crpytString, 'base64')
          const key = cryptBuffer.slice(0, 16)
          const iv = cryptBuffer.slice(-4)

          const cryptkey = await webcrypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt'])
          const decrypt = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptkey, chunk)

          this.push(Buffer.from(decrypt))

          next()
        }
      })

      fs.createReadStream(path)
        .pipe<Transform>(new BlockStream({ size: 1e7 + 16, zeroPadding: false }))
        .pipe(decrypt)
        .pipe(fs.createWriteStream(path + '_o.mp4'))
    }

    res.sendStatus(204)
  })
})

router.delete('/tus/:filename', async (req, res) => {
  const { filename } = req.params
  const path = `tmp/${filename}`
  if (!await fsExists(path)) res.sendStatus(404)

  await fs.promises.unlink(path)
  await fileModel.deleteOne({ _id: filename })

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Cache-Control', 'no-store')
  res.sendStatus(204)
})

router.head('/tus/:filename', async (req, res, next) => {
  const { filename } = req.params
  const path = `tmp/${filename}`
  if (!await fsExists(path)) return next()

  const { length } = await fileModel.findOne({ _id: filename })
  const { size } = await fs.promises.stat(path)

  res.setHeader('Upload-Length', length)
  res.setHeader('Upload-Offset', size)
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
  res.setHeader('Tus-Resumable', '1.0.0')
  res.sendStatus(204)
})


export default router