import fs from 'fs'
import express from 'express'
import fetch from 'node-fetch'
import { fileModel } from '../modules/mongo'
import { isString } from 'util'
import { Transform } from 'stream'
import BlockStream from 'block-stream2'
import { Crypto } from '@peculiar/webcrypto'

const webcrypto = new Crypto()
const router = express.Router()
const streamUrl = 'http://127.0.0.1:3000/stream/'

router.get('/:filename', async (req, res) => {
  const { filename } = req.params
  const { key: cryptString } = req.query

  if (!isString(cryptString)) return res.sendStatus(400)

  const response = await fetch(streamUrl + filename)
  if (!response.ok) return res.sendStatus(response.status)

  const { keyhash } = await fileModel.findOne({ _id: filename })
  if (!keyhash) return res.status(400).send('file is not encrypted')

  const cryptBuffer = Buffer.from(cryptString, 'base64')
  const compHash = Buffer.from(keyhash, 'base64')
  const hash = Buffer.from(await webcrypto.subtle.digest('SHA-256', cryptBuffer))
  if (!hash.equals(compHash)) return res.status(400).send('wrong key')

  const decrypt = new Transform({
    async transform(chunk: Buffer, encode, next) {
      const cryptBuffer = Buffer.from(cryptString, 'base64')
      const key = cryptBuffer.slice(0, 16)
      const iv = cryptBuffer.slice(-4)

      const cryptkey = await webcrypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt'])
      const decrypt = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptkey, chunk)

      this.push(Buffer.from(decrypt))
      next()
    }
  })

  response.body
    .pipe<Transform>(new BlockStream({ size: 1e7 + 16, zeroPadding: false }))
    .pipe(decrypt)
    .pipe(res)
})

export default router