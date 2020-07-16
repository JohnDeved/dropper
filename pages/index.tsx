import React, { useState } from 'react'
import Head from 'next/head'
import { Uploader, UploaderProps, IconButton, Icon, Notification } from 'rsuite'
import { FileType } from 'rsuite/lib/Uploader'

import 'rsuite/lib/styles/themes/dark/index.less'
import './style.sass'

const Upload: React.FC = props => {
  const [list, setList] = useState<FileType[]>([])

  function getFileIndex (file: FileType) {
    return list.findIndex(f => f.fileKey === file.fileKey)
  }

  function getFile (file: FileType) {
    return list[getFileIndex(file)]
  }

  function getUrl (file: FileType) {
    const { url } = getFile(file)
    return `${location.href.slice(0, -1)}${url}`
  }

  function handleUrl (file: FileType) {
    const url = getUrl(file)

    open(url, '_blank')
  }

  function handleCopy (file: FileType) {
    const url = getUrl(file)

    navigator.clipboard.writeText(url)
    Notification.info({
      title: 'Copied to Clipboard',
      description: <a href={url}>{url}</a>
    })
  }

  const attr: UploaderProps = {
    action: "/upload",
    draggable: true,
    fileList: list,
    onChange: setList,
    listType: 'picture-text',

    onSuccess (response: { filehash?: string, filename?: string }, file) {
      const index = getFileIndex(file)
      if (response?.filehash) {
        list[index].url = `/stream/${response.filehash}`
        setList(list)
      }
    },

    renderFileInfo (file) {
      const disabled = file.status !== 'finished'
      return (
        <div>
          <span style={{marginRight: '10px'}}>{file.name}</span>
          <span style={{float: "right"}}>
            <IconButton style={{marginLeft: '10px'}} disabled={disabled} appearance="primary" onClick={() => handleUrl(file)} icon={<Icon icon="link" />}>Open URL</IconButton>
            <IconButton style={{marginLeft: '10px'}} disabled={disabled} appearance="primary" onClick={() => handleCopy(file)} icon={<Icon icon="copy" />}>Copy URL</IconButton>
          </span>
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

export default function () {
  return (
    <div data-container>
      <Head>
        <title>Dropper</title>
      </Head>

      <div style={{marginBottom: 20, textAlign: 'center', fontFamily: 'Poppins'}}>
        <h1>Dropper</h1>
        <p style={{fontWeight: 'lighter'}}>easy file uploads</p>
      </div>

      <Upload>
        <div style={{ lineHeight: '200px' }}>Click or Drag files to this area to upload</div>
      </Upload>
    </div>
  )
}
