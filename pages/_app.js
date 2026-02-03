import '../styles/globals.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#8B4513" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="brown" />
        <link rel="manifest" href="/manifest.json" />
        <title>YoAnoto - Anotador de Truco Argentino</title>
        <meta name="description" content="El mejor anotador de truco argentino. Anotá tus partidas con chapitas de cerveza, configurá puntos, flor y falta envido." />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
