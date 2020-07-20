import React from 'react'
import Head from 'next/head'
import { Dashboard } from '@uppy/react'
import Tus from '@uppy/tus'
import Uppy from '@uppy/core'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = Uppy({
  meta: { type: 'avatar' },
  autoProceed: true
})

uppy.use(Tus, {
  endpoint: '/upload/tus',
  resume: true,
  autoRetry: true,
  retryDelays: [0, 1000, 3000, 5000],
  chunkSize: 5e+7
})

uppy.on('upload-success', (file, body: { uploadURL: string }) => {
  const uploadURL = location.href.slice(0,-1) + body.uploadURL.replace('upload/tus', 'stream')
  uppy.setFileState(file.id, { uploadURL })
})

export default function () {
  return (
    <div className="index">
      <Head>
        <title>Dropper</title>
      </Head>

      <div className="logo">
        <div>
          <h1>Dropper</h1>
          <p>easy file uploads</p>
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
        <span style={{margin: '0 5px'}}>|</span>
        <a href="/privacy.txt">Privacy Policy</a>
      </footer>
    </div>
  )
}
