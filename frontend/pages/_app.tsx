import type { AppProps } from 'next/app'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from '../src/components/Layout/Layout'
import Head from 'next/head'
import { fontVariablesClass, fontStacks } from '../src/styles/fonts'

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
  typography: {
    fontSize: 15,
    fontFamily: fontStacks.inter,
    h1: { fontFamily: fontStacks.poppins },
    h2: { fontFamily: fontStacks.poppins },
    h3: { fontFamily: fontStacks.poppins },
    h4: { fontFamily: fontStacks.montserrat },
    h5: { fontFamily: fontStacks.montserrat },
    h6: { fontFamily: fontStacks.montserrat },
    subtitle1: { fontFamily: fontStacks.manrope },
    subtitle2: { fontFamily: fontStacks.manrope },
    button: { fontFamily: fontStacks.inter },
    caption: { fontFamily: fontStacks.manrope },
    overline: { fontFamily: fontStacks.manrope },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={fontVariablesClass}>
      <Head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@300;400;500;600;700&family=Noto+Nastaliq+Urdu:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <style jsx global>{`
          /* Base font across app (non-MUI elements) */
          html, body { font-family: var(--font-inter), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial; }
          body { font-size: 15px; }

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
            font-family: var(--font-inter), 'Arial', sans-serif;
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
    </div>
  )
}
