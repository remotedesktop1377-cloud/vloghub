import LandingPage from '@/components/LandingPageComponents/LandingPage'
import LandingToolbar from '@/components/LandingPageComponents/landingToolbar/LandingToolbar'

export const metadata = {
  title: 'Vloghub - Transform Ideas into Stunning Videos',
  description: 'Vloghub: The AI-powered solution for effortless video creation. Create engaging content with trending topics and AI-generated scripts.',
  keywords: 'video creation, AI video, content creation, trending topics, script generation, video editing',
  openGraph: {
    title: 'Vloghub - Transform Ideas into Stunning Videos',
    description: 'AI-powered solution for effortless video creation',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'dark',
}

export default function Home() {
  return (
    <LandingToolbar>
      <LandingPage />
    </LandingToolbar>
  )
}

