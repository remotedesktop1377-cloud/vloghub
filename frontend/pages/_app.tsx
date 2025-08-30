import type { AppProps } from 'next/app'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from '../src/components/Layout/Layout'
import Head from 'next/head'
import { fontVariablesClass, fontStacks } from '../src/styles/fonts'
import { PRIMARY, SECONDARY, BACKGROUND } from '../src/styles/colors'
import '../src/styles/cssVariables.css'
import '../src/styles/fonts.css'
import React, { useEffect, useMemo, useState, createContext } from 'react'
import { useRouter } from 'next/router'

export const ColorModeContext = createContext<{ mode: 'light' | 'dark'; toggle: () => void }>({ mode: 'dark', toggle: () => { } })

export default function App({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  const router = useRouter()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('color-mode') as 'light' | 'dark' | null
      if (saved === 'light' || saved === 'dark') setMode(saved)
    } catch { }
  }, [])

  const colorMode = useMemo(() => ({
    mode,
    toggle: () => {
      setMode(prev => {
        const next = prev === 'light' ? 'dark' : 'light'
        try { localStorage.setItem('color-mode', next) } catch { }
        return next
      })
    }
  }), [mode])

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { 
        main: PRIMARY.main,
        light: PRIMARY.light,
        dark: PRIMARY.dark,
        contrastText: PRIMARY.contrastText
      },
      secondary: { 
        main: SECONDARY.main,
        light: SECONDARY.light,
        dark: SECONDARY.dark,
        contrastText: SECONDARY.contrastText
      },
      ...(mode === 'dark' ? { 
        background: { 
          default: BACKGROUND.default, 
          paper: BACKGROUND.paper
        } 
      } : {})
    },
    typography: {
      fontSize: 15,
      fontFamily: fontStacks.plusJakarta,
      h1: { fontFamily: fontStacks.plusJakarta },
      h2: { fontFamily: fontStacks.plusJakarta },
      h3: { fontFamily: fontStacks.plusJakarta },
      h4: { fontFamily: fontStacks.plusJakarta },
      h5: { fontFamily: fontStacks.plusJakarta },
      h6: { fontFamily: fontStacks.plusJakarta },
      subtitle1: { fontFamily: fontStacks.plusJakarta },
      subtitle2: { fontFamily: fontStacks.plusJakarta },
      button: { fontFamily: fontStacks.plusJakarta },
      caption: { fontFamily: fontStacks.plusJakarta },
      overline: { fontFamily: fontStacks.plusJakarta },
    },
  }), [mode])

  return (
    <div className={fontVariablesClass}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@300;400;500;600;700&family=Noto+Nastaliq+Urdu:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style jsx global>{`
          /* Base font across app (non-MUI elements) */
          html, body { font-family: var(--font-plus-jakarta-sans); }
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
            font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic';
            direction: rtl;
            text-align: right;
            unicode-bidi: bidi-override;
          }
          
          .ltr-text {
            font-family: var(--font-plus-jakarta-sans);
            direction: ltr;
            text-align: left;
          }
          
          /* Ensure proper text rendering for mixed content */
          .mixed-text {
            unicode-bidi: embed;
          }
        `}</style>
      </Head>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout showToolbar={router.pathname === '/'}>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </div>
  )
}
