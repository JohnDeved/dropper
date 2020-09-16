import bytes from 'bytes'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function History () {
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
              <div className="list-item-preview" style={{ backgroundImage: `url(/stream/thumb/${fileIDExt})` }}>
              </div>
              <div className="list-item-info">
                <span className="list-item-name">{x.metadata.name}</span>
                <span className="list-item-size">{bytes(x.size)}</span>

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
