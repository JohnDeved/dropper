import { useRef, useEffect } from 'react'
import Head from 'next/head'
import { isVideo } from '../../server/modules/mime'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { fileModel } from '../../server/modules/mongo'
import bytes from 'bytes'
import { Button } from 'rsuite'
import { getDimensions } from '../../server/modules/ffmpeg'

interface IProps {
  filename: string
  name: string
  size: string
  width: string
  height: string
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { filename } = context.query

  if (!Array.isArray(filename) && filename) {
    const file = await fileModel.findOne({ _id: filename })
    const { width, height } = await getDimensions(filename)

    return {
      props: {
        filename,
        width,
        height,
        name: file.filename,
        size: bytes(file.length)
      }
    }
  }
}

export default function Embed ({ filename, name, size, width, height }: IProps) {
  const video = useRef()

  const streamRoute = `/stream/${filename}`

  useEffect(() => {
    if (video.current) {
      const player = require('player.js')
      player.HTML5Adapter(video.current).ready()
    }
  })

  function getEmbed () {
    if (isVideo(filename)) {
      return <video className="embed" ref={video} controls src={streamRoute}></video>
    }

    if (filename) {
      return (
        <div className="content">
          <meta httpEquiv="Refresh" content={`0; url='${streamRoute}'`} />
          <div className="download">
            <img height="150px" src={`/stream/thumb/${filename}`}/>
            <Button style={{ borderRadius: 0 }} onClick={() => open(streamRoute, '_blank')} appearance="primary">Download ({size})</Button>
          </div>
        </div>
      )
    }
  }

  function getMeta () {
    function getVideMeta () {
      if (isVideo(filename)) {
        return <>
          <meta property="og:type" content="video"/>
          <meta name="twitter:card" content="player"/>
          <meta name="twitter:url" content={`https://dropper.link/embed/${filename}`}/>
          <meta name="twitter:player" content={`https://dropper.link/embed/${filename}`}/>
          <meta name="twitter:player:width" content={width}/>
          <meta name="twitter:player:height" content={height}/>

          <meta property="og:video" content={`https://dropper.link/stream/${filename}`}/>
          <meta property="og:video:url" content={`https://dropper.link/stream/${filename}`}/>
          <meta property="og:video:secure_url" content={`https://dropper.link/stream/${filename}`}/>
          <meta property="og:video:type" content="video/mp4"/>

          <meta property="og:video:width" content={width}/>
          <meta property="og:video:height" content={height}/>
          <meta property="og:video:iframe" content={`https://dropper.link/embed/${filename}`}/>
        </>
      }
    }

    return <>
      <title>{name} ({size})</title>

      <meta property="og:url" content={`https://dropper.link/embed/${filename}`}/>
      <meta property="og:title" content={name}/>
      <meta property="og:description" content={size}/>
      <meta name="twitter:title" content={name}/>
      <meta name="twitter:description" content={size}/>

      <meta property="og:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
      <meta property="og:image:width" content={width}/>
      <meta property="og:image:height" content={height}/>
      <meta property="og:image:secure_url" content={`https://dropper.link/stream/thumb/${filename}`}/>
      <meta property="og:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
      <meta property="og:image:width" content={width}/>
      <meta property="og:image:height" content={height}/>
      <meta property="og:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
      <meta name="twitter:image" content={`https://dropper.link/stream/thumb/${filename}`}/>
      <meta name="twitter:image:src" content={`https://dropper.link/stream/thumb/${filename}`}/>

      {getVideMeta()}
    </>
  }

  return <>
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
          width: 100%;
          height: 100%;
          background-color: transparent !important;
        }

        .content {
          display: flex;
          justify-content: center;
        }

        .download {
          display: flex;
          flex-direction: column;
          border-radius: 20px 20px 5px 5px;
          overflow: hidden;
          box-shadow:
            0 0.7px 2.2px rgba(0, 0, 0, 0.02),
            0 1.7px 5.3px rgba(0, 0, 0, 0.028),
            0 3.1px 10px rgba(0, 0, 0, 0.035),
            0 5.6px 17.9px rgba(0, 0, 0, 0.042),
            0 10.4px 33.4px rgba(0, 0, 0, 0.05),
            0 25px 80px rgba(0, 0, 0, 0.07)
          ;
        }
      `}</style>
    </Head>
    {getEmbed()}
  </>
}
