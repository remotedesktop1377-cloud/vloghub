import type { AppProps } from 'next/app'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from '../src/components/Layout/Layout'
import Head from 'next/head'
import { fontVariablesClass, fontStacks } from '../src/styles/fonts'
import React, { useEffect, useMemo, useState, createContext } from 'react'

export const ColorModeContext = createContext<{ mode: 'light' | 'dark'; toggle: () => void }>({ mode: 'dark', toggle: () => { } })

export default function App({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')

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
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      ...(mode === 'dark' ? { background: { default: '#000C21', paper: '#000C21' } } : {})
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
  }), [mode])

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
            font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Arial Unicode MS', sans-serif;
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
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </div>
  )
}
