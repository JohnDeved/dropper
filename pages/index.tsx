import React, { useState } from 'react'
import { Dashboard } from '@uppy/react'
import Tus from '@uppy/tus'
import Uppy from '@uppy/core'
import { Notification, Toggle, Icon, IconButton, Modal, Button, Badge, Popover, Whisper } from 'rsuite'
import { openDB } from 'idb'
import { KeysDB } from '../types/common'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

function getDB () {
  return openDB<KeysDB>('dropper', 1, {
    upgrade (db) { db.createObjectStore('cryptkeys') }
  })
}

async function getCryptKey (fileId: string) {
  const db = await getDB()
  return db.get('cryptkeys', fileId)
}

function getFileId (url: string) {
  return url.replace('/upload/tus/', '')
}

function getCryptoUrl (url: string, extKey: string) {
  return location.href.slice(0, -1) + url.replace('upload/tus', 'crypto') + `?key=${extKey}`
}

const uppy = Uppy({
  meta: { type: 'avatar' },
  autoProceed: true
})

uppy.use(Tus, {
  endpoint: '/upload/tus',
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000],
  chunkSize: 1e7
})

uppy.on('upload-success', async (file, body: { uploadURL: string }) => {
  const fileId = getFileId(body.uploadURL)
  const crypt = await getCryptKey(fileId)

  let uploadURL = ''
  if (crypt) {
    uploadURL = getCryptoUrl(body.uploadURL, crypt.extKey)
  } else {
    uploadURL = location.href.slice(0, -1) + body.uploadURL.replace('upload/tus', 'stream')
  }

  uppy.setFileState(file.id, { uploadURL })
})

uppy.on('complete', async result => {
  const clipboard = await Promise.all(result.successful.map(async (file, i, arr) => {
    let text = ''

    if (/stream|crypto/g.test(file.uploadURL)) {
      text = file.uploadURL
    } else {
      const fileId = getFileId(file.uploadURL)
      const crypt = await getCryptKey(fileId)
      text = await getCryptoUrl(file.uploadURL, crypt.extKey)
    }

    if (arr.length > 1) text += ` (${file.name})`
    return text
  }))

  navigator.clipboard.writeText(clipboard.join('\n'))
  Notification.success({
    title: 'Copied to Clipboard',
    description: clipboard
  })
})

export default function Index () {
  const [modalOpen, setModalOpen] = useState(false)

  const EncryptInfo = (
    <Popover title="Encryption">
      <p>
        Enabling this Setting will Encrypt your future Uploads<br/>
        using an End to End File encryption Method.<br/>
        Your files can only be decrypted using a secret key<br/>
        that you will receive after the upload.
      </p>
      <p></p>
    </Popover>
  )

  return (
    <div className="index">
      <div className="header">
        <div className="logo">
          <img src="/logo.svg" alt="Dropper Logo"/>
          <p>easy file uploads</p>
        </div>
        <div className="settings">
          <Badge content="NEW">
            <IconButton onClick={() => setModalOpen(true)} icon={<Icon icon="cog"/>} circle size="lg" />
          </Badge>
        </div>
      </div>

      <div className="upload">
        <Dashboard
          uppy={uppy}
          theme="dark"
          showProgressDetails={true}
          proudlyDisplayPoweredByUppy={false}
          width="100%" height="calc(100vh - 110px)"
          hideUploadButton={false}
        />
      </div>

      <footer>
        <a href="/tos.txt">Terms of Service</a>
        <span style={{ margin: '0 5px' }}>|</span>
        <a href="/privacy.txt">Privacy Policy</a>
      </footer>

      <Modal show={modalOpen} onHide={() => setModalOpen(false)}>
        <Modal.Header>
          <Modal.Title>Dropper Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="setting">
            <label>Encryption</label>
            <Toggle checkedChildren={<Icon icon="lock" />} unCheckedChildren={<Icon icon="unlock-alt" />} />
            <Whisper placement="top" trigger="hover" speaker={EncryptInfo}>
              <Icon className="info" icon="question2"></Icon>
            </Whisper>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setModalOpen(false)} appearance="subtle">Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
