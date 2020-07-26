import { useRouter } from 'next/router'
import { useRef, useEffect } from 'react'
import Head from 'next/head'

export default function Embed () {
  const router = useRouter()
  const video = useRef()

  const { filename } = router.query
  const streamRoute = `/stream/${filename}`

  useEffect(() => {
    if (video.current) {
      const player = require('player.js')
      player.HTML5Adapter(video.current).ready()
    }
  })

  function getEmbed () {
    if (!Array.isArray(filename) && filename?.endsWith('.mp4')) {
      return <video className="embed" ref={video} controls src={streamRoute}></video>
    }

    if (filename) {
      return <embed className="embed" src={streamRoute}></embed>
    }
  }

  return <div>
    <Head>
      <style>{`
        #__next {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        html,body {
          width: 100%
          height: 100%
        }
      `}</style>
    </Head>
    {getEmbed()}
  </div>
}
