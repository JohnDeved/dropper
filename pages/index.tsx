import React from 'react'
import Head from 'next/head'
import { Dashboard } from '@uppy/react'
import XHRUpload from '@uppy/xhr-upload'
import Tus from '@uppy/tus'
import Uppy from '@uppy/core'

import 'rsuite/lib/styles/themes/dark/index.less'
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import './style.sass'

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

export default function () {
  return (
    <div data-container>
      <Head>
        <title>Dropper</title>
      </Head>

      <div style={{marginBottom: 30, textAlign: 'center', fontFamily: 'Poppins'}}>
        <h1>Dropper</h1>
        <p style={{fontWeight: 'lighter'}}>easy file uploads</p>
      </div>

      <Dashboard uppy={uppy} theme="dark"></Dashboard>
    </div>
  )
}
