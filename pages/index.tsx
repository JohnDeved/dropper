import React, { useState, useEffect } from 'react'
import { Dashboard } from '@uppy/react'
import Tus from '@uppy/tus'
import Uppy from '@uppy/core'
import { Notification, Toggle, Icon, IconButton, Modal, Button, Badge, Popover, Whisper } from 'rsuite'
import { openDB } from 'idb'
import { KeysDB, TSettings, TSetting } from '../types/common'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import Head from 'next/head'

function getDB () {
  return openDB<KeysDB>('dropper', 2, {
    upgrade (db, oldv) {
      if (oldv < 1) {
        db.createObjectStore('cryptkeys')
        db.createObjectStore('settings')
      }
      if (oldv < 2) {
        db.createObjectStore('fragments')
      }
    }
  })
}

async function getCryptKey (fileId: string) {
  const db = await getDB()
  return db.get('cryptkeys', fileId)
}

async function getCryptSetting () {
  const db = await getDB()
  const { encryption } = await db.get('settings', 0)
  return encryption
}

function getFileId (url: string) {
  return url.replace('/upload/tus/', '')
}

async function getCryptoUrl (url: string, extKey: string) {
  const db = await getDB()
  const { embed } = await db.get('settings', 0)

  if (embed) {
    return location.href.slice(0, -1) + url.replace('upload/tus', 'crypto') + `?key=${encodeURIComponent(extKey)}`
  } else {
    return location.href.slice(0, -1) + url.replace('upload/tus', 'crypto') + `#${encodeURIComponent(extKey)}`
  }
}

function getStreamUrl (url: string) {
  return location.href.slice(0, -1) + url.replace('upload/tus', 'embed')
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
  chunkSize: 5e5
})

uppy.on('upload-success', async (file, body: { uploadURL: string }) => {
  const fileId = getFileId(body.uploadURL)
  const crypt = await getCryptKey(fileId)

  let uploadURL = ''
  if (crypt) {
    uploadURL = await getCryptoUrl(body.uploadURL, crypt.extKey)
  } else {
    uploadURL = getStreamUrl(body.uploadURL)
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
      if (crypt) {
        text = await getCryptoUrl(file.uploadURL, crypt.extKey)
      } else {
        text = getStreamUrl(file.uploadURL)
      }
    }

    if (arr.length > 1) text += ` (${file.name})`
    return text
  }))

  navigator.clipboard.writeText(clipboard.join('\n'))
  Notification.success({
    title: 'Copied to Clipboard',
    description: 'Copied your File URL to Clipboard'
  })
})

export default function Index () {
  const [modalOpen, setModalOpen] = useState(false)
  const [disableCryptSetting, setDisableCryptSetting] = useState(false)
  const [settingsState, setSettingsState] = useState<{[key in keyof TSettings]: TSettings[key]}>({} as any)
  const { encryption, embed } = settingsState || {}

  useEffect(() => {
    getDB()
      .then(db => db.get('settings', 0))
      .then(settings => setSettingsState(settings))

    uppy.on('upload', () => setDisableCryptSetting(true))
    uppy.on('upload-success', () => setDisableCryptSetting(false))

    getCryptSetting().then(sendEncryptionState)
  }, [Toggle])

  const encryptInfo = (
    <Popover title="Encryption">
      <p>
        Enabling this Setting will Encrypt your future Uploads<br/>
        using an End to End File encryption Method.<br/>
        Your files can only be decrypted using a secret key<br/>
        that you will receive after the upload.
      </p>
    </Popover>
  )

  const embedInfo = (
    <Popover title="Allow Encrypted Embed">
      <p>
        Enabling this Setting will Allow external sites<br/>
        to Embed your content. (Reddit, Twitter, Discord, etc)<br/>
        <br/>
        This could mean a potential security risk for your files.<br/>
        But this would be useful if you are<br/>
        trying to share your Encrypted Image on social media.
      </p>
    </Popover>
  )

  async function setSetting (store: 'settings', value: TSettings, key: 0)
  async function setSetting (store: TSetting, value: any, key: any) {
    if (store === 'settings') {
      setSettingsState({ ...settingsState, ...value })
    }

    const db = await getDB()
    db.put(store, value, key)
  }

  function sendEncryptionState (state: boolean) {
    navigator.serviceWorker.ready.then(registration => {
      registration.active.postMessage(state)
    })
  }

  function setEncryption (state: boolean) {
    setSetting('settings', { ...settingsState, encryption: state }, 0)
    sendEncryptionState(state)
  }

  function setEmbed (state: boolean) {
    setSetting('settings', { ...settingsState, embed: state }, 0)
  }

  function getEncryptionToggle () {
    if (typeof window !== 'undefined' && navigator?.vendor?.includes('Apple')) {
      const info = (
        <Popover title="Unsupported">
          <p>
            Woops, seems like your browser isnt Supported with this feature yet.<br/>
            Rest asured we are working on it, so check back later!
          </p>
        </Popover>
      )

      return (
        <Whisper placement="top" trigger="hover" speaker={info}>
          <Toggle disabled={true} />
        </Whisper>
      )
    } else {
      return <Toggle
        disabled={disableCryptSetting}
        checked={encryption}
        onChange={setEncryption}
        checkedChildren={<Icon icon="lock" />}
        unCheckedChildren={<Icon icon="unlock-alt" />}
      />
    }
  }

  function getEmbedToggle () {
    if (!encryption) {
      const info = (
        <Popover title="Sorry">
          <p>
            This setting is only available when Encryption is enabled.
          </p>
        </Popover>
      )

      return (
        <Whisper placement="top" trigger="hover" speaker={info}>
          <Toggle disabled={true} />
        </Whisper>
      )
    } else {
      return <Toggle
        checked={embed}
        onChange={setEmbed}
        checkedChildren={<Icon icon="link" />}
        unCheckedChildren={<Icon icon="unlink" />}
      />
    }
  }

  return (
    <>
      <Head>
        <title>Dropper</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="preload" as="style"/>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="stylesheet"/>

        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
        <link rel='shortcut icon' href='/favicon.ico' />
        <link rel="manifest" href="/site.webmanifest"></link>

        <meta name="theme-color" content="#101820" />
        <link rel='mask-icon' href='/logo.svg' color='#101820' />

        <meta name='application-name' content='Dropper Upload' />
        <meta name='apple-mobile-web-app-title' content='Dropper Upload' />
        <meta name='twitter:title' content='Dropper Upload' />
        <meta property='og:title' content='Dropper Upload' />
        <meta property='og:site_name' content='Dropper Upload' />

        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='mobile-web-app-capable' content='yes' />

        <meta name='description' content='Dropper offers free encrypted file uploads, without any file size limit.' />
        <meta name='twitter:description' content='Dropper offers free encrypted file uploads, without any file size limit.' />
        <meta property='og:description' content='Dropper offers free encrypted file uploads, without any file size limit.' />

        <meta name='twitter:card' content='summary' />
        <meta name='twitter:url' content='https://dropper.link' />
        <meta name='twitter:image' content='https://dropper.link/android-chrome-192x192.png' />
        <meta name='twitter:creator' content='@undefined_prop' />

        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://dropper.link' />
        <meta property='og:image' content='https://dropper.link/apple-touch-icon.png' />
        <meta name='format-detection' content='telephone=no' />

        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover' />
      </Head>

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
              {getEncryptionToggle()}
              <Whisper placement="top" trigger="hover" speaker={encryptInfo}>
                <Icon className="info" icon="question2"></Icon>
              </Whisper>
            </div>
            <div className="setting">
              <label>Allow Embed</label>
              {getEmbedToggle()}
              <Whisper placement="top" trigger="hover" speaker={embedInfo}>
                <Icon className="info" icon="question2"></Icon>
              </Whisper>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setModalOpen(false)} appearance="subtle">Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  )
}
