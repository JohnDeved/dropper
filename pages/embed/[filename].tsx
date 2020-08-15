import { useRouter } from 'next/router'
import { useRef, useEffect } from 'react'
import Head from 'next/head'
import { isVideo } from '../../server/modules/fsExtra'

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
    if (!Array.isArray(filename)) {
      if (isVideo(filename)) {
        return <video className="embed" ref={video} controls src={streamRoute}></video>
      }
    }

    if (filename) {
      return <embed className="embed" src={streamRoute}></embed>
    }
  }

  function getMeta () {
    function getVideMeta () {
      if (!Array.isArray(filename) && isVideo(filename)) {
        return <>
          <meta name="twitter:card" content="player"/>
          <meta name="twitter:title" content={filename}/>
          <meta name="twitter:url" content={`https://dropper.link/embed/${filename}`}/>
          <meta name="twitter:player" content={`https://dropper.link/embed/${filename}`}/>
          <meta name="twitter:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
          <meta name="twitter:image:src" content={`https://dropper.link/stream/thumb/${filename}`}/>
          <meta name="twitter:player:width" content="708"/>
          <meta name="twitter:player:height" content="382"/>

          <meta property="og:video" content={`https://dropper.link/stream/${filename}`}/>
          <meta property="og:video:secure_url" content={`https://dropper.link/stream/${filename}`}/>
          <meta property="og:video:type" content="video/mp4"/>
          <meta property="og:video:width" content="640"/>
          <meta property="og:video:height" content="345"/>
          <meta property="og:video:duration" content="2.82"/>
          <meta property="og:video:iframe" content={`https://dropper.link/embed/${filename}`}/>
        </>
      }
    }

    if (!Array.isArray(filename)) {
      return <>
        <meta property="og:type" content="video"/>
        <meta property="og:url" content={`https://dropper.link/stream/thumb/${filename}`}/>
        <meta property="og:title" content={filename}/>

        <meta property="og:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
        <meta property="og:image:width" content="640"/>
        <meta property="og:image:height" content="345"/>
        <meta property="og:image:secure_url" content={`https://dropper.link/stream/thumb/${filename}`}/>
        <meta property="og:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
        <meta property="og:image:width" content="640"/>
        <meta property="og:image:height" content="345"/>
        <meta property="og:image" content={`https://dropper.link/stream/thumb/${filename}`}/>

        {getVideMeta()}
      </>
    }
  }

  return <div>
    <Head>
      {getMeta()}

      <link rel="canonical" href={`https://dropper.link/stream/${filename}`}/>
      <link rel="alternate" type="application/json+oembed" href={`https://dropper.link/oembed?url=https://dropper.link/stream/${filename}`} title="Emma Watson Dancing Bling Ring 1"/>

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
