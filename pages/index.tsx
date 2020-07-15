import React, { useState } from 'react'
import Head from 'next/head'
import { Uploader, UploaderProps, IconButton, Icon, Notification } from 'rsuite'
import { FileType } from 'rsuite/lib/Uploader'

import 'rsuite/lib/styles/themes/dark/index.less'
import './index.sass'

const Upload: React.FC = props => {
  const [list, setList] = useState<FileType[]>([])

  function getFileIndex (file: FileType) {
    return list.findIndex(f => f.fileKey === file.fileKey)
  }

  function getFile (file: FileType) {
    return list[getFileIndex(file)]
  }

  function handleUrl (file: FileType) {
    const { url } = getFile(file)
    const fullUrl = `${location.href.slice(0, -1)}${url}`

    navigator.clipboard.writeText(fullUrl)
    Notification.info({
      title: 'Copied to Clipboard',
      description: <a href={fullUrl}>{fullUrl}</a>
    })
  }

  const attr: UploaderProps = {
    action: "/upload",
    draggable: true,
    fileList: list,
    onChange: setList,

    onSuccess (response: { filehash?: string, filename?: string }, file) {
      const index = getFileIndex(file)
      if (response?.filehash) {
        list[index].url = `/stream/${response.filehash}`
        setList(list)
      }
    },

    renderFileInfo (file) {
      return (
        <div>
          <span>{file.name}</span>
          <IconButton disabled={file.status !== 'finished'} onClick={() => handleUrl(file)} appearance="subtle" icon={<Icon icon="link" />} circle size="xs" />
        </div>
      )
    }
  }

  return (
    <Uploader
      {...attr}
      {...props}
    />
  )
}

export default function Home() {
  return (
    <div data-container>
      <Head>
        <title>Dropper</title>
      </Head>

      <Upload>
        <div style={{ lineHeight: '200px' }}>Click or Drag files to this area to upload</div>
      </Upload>
    </div>
  )
}
