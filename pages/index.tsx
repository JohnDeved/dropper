import React from 'react';
import Head from 'next/head';
import { Uploader } from 'rsuite';
import 'rsuite/lib/styles/themes/dark/index.less';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Dropper</title>
      </Head>

      <Uploader action="/upload" draggable>
        <div style={{ lineHeight: '200px' }}>Click or Drag files to this area to upload</div>
      </Uploader>
    </div>
  )
}
