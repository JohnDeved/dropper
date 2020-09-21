import bytes from 'bytes'
import React, { useEffect, useState } from 'react'
import { Dropdown, Icon, IconButton, Notification } from 'rsuite'

export default function History () {
  const copy = (type: 'embed' | 'stream', id: string) => {
    navigator.clipboard.writeText(`https://dropper.link/${type}/${id}`)
      .then(() => {
        Notification.success({
          title: 'Copied to Clipboard',
          description: `Copied the File ${type === 'embed' ? type : ''} URL to Clipboard`
        })
      })
      .catch(e => {
        Notification.error({
          title: 'Error',
          description: 'The URL wasn\'t copied to the Clipboard because an error'
        })
      })
  }

  const [files, setFiles] = useState([])

  useEffect(() => {
    const files = []
    const lsTokens = Object
      .entries(window.localStorage)
      .filter(x => x[0].includes('tus::'))
    lsTokens.forEach(e => {
      e.shift()
      files.push(JSON.parse(...e))
    })

    if (files.length > -1) setFiles(files)
  }, [History])

  return (
    <div className="index">
      <div className="header">
        <div className="logo">
          <img src="/logo.svg" alt="Dropper Logo"/>
          <p>easy file uploads</p>
        </div>
      </div>
      <div className="list-wrapper">
        <div className="page-title">
          Upload History
        </div>
        <div className="list">
          {files.map(x => {
            const [,,, fileIDExt] = x.uploadUrl.split('/')
            const fileID = fileIDExt.replace(/\..*/, '')

            return (<div className="list-item" key={x.uploadUrl}>
              {/* TODO: #18 Fix thumb performance */}
              <div className="list-item-preview" style={{ backgroundImage: `url(/stream/thumb/${fileIDExt})` }}>
              </div>
              <div className="list-item-text">
                <div className="list-item-info">
                  <span className="list-item-name">{x.metadata.name}</span>
                  <span className="list-item-size">{bytes(x.size)}</span>
                </div>
                <div className="list-item-menu">

                  <Dropdown className="list-item-dropdown"
                    renderTitle={() => {
                      return <IconButton className="list-dropdown-button" appearance="subtle" icon={<Icon icon="ellipsis-v" />} />
                      //  <Icon icon="ellipsis-v" />
                    }}
                  >
                    <Dropdown.Item onSelect={() => copy('stream', fileIDExt)}>
                      <Icon icon="copy" /> Copy URL
                    </Dropdown.Item>
                    <Dropdown.Item onSelect={() => copy('embed', fileIDExt)}>
                      <Icon icon="copy" /> Copy embed URL
                    </Dropdown.Item>
                    <Dropdown.Item onSelect={() => Notification.info({ title: 'Info', description: 'This feature is not yet fully implemented' })}>
                      <Icon icon="trash" /> Delete File
                    </Dropdown.Item>
                  </Dropdown>
                </div>
              </div>

            </div>)
          })}
        </div>
      </div>
      <footer>
        <a href="/tos.txt">Terms of Service</a>
        <span style={{ margin: '0 5px' }}>|</span>
        <a href="/privacy.txt">Privacy Policy</a>
      </footer>
    </div>
  )
}
