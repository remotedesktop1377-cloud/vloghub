import type { AppProps } from 'next/app'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from '../src/components/Layout/Layout'
import Head from 'next/head'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Nastaliq+Urdu:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <style jsx global>{`
          /* RTL Support Styles */
          [dir="rtl"] {
            text-align: right;
          }
          
          [dir="ltr"] {
            text-align: left;
          }
          
          /* Urdu and Arabic font support */
          .rtl-text {
            font-family: 'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Arial Unicode MS', sans-serif;
            direction: rtl;
            text-align: right;
            unicode-bidi: bidi-override;
          }
          
          .ltr-text {
            font-family: 'Roboto', 'Arial', sans-serif;
            direction: ltr;
            text-align: left;
          }
          
          /* Ensure proper text rendering for mixed content */
          .mixed-text {
            unicode-bidi: embed;
          }
        `}</style>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </>
  )
}
