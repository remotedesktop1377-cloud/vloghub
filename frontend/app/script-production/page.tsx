import ScriptProductionClient from './ScriptProductionClient'

export const metadata = {
  title: 'Script Production',
  description: 'Script production and video generation tools for content creators',
  keywords: 'script production, video generation, content creation, AI tools',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

// This function runs at build time (SSG) or request time (ISR)
async function getStaticData() {
  try {
    // Simulate fetching static data - in real app, this could be from an API
    // The 'force-cache' option makes this behave like getStaticProps (SSG)
    const staticData = {
      script: 'Script goes here',
      topic: 'Social affairs',
      hypothesis: 'DHA ',
      region: 'Pakistan',
      duration: '1',
      language: 'English',
      title: 'Social affairs',
      hook: 'Hook goes here',
      mainContent: 'Main content goes here',
      conclusion: 'Conclusion goes here',
      callToAction: 'Call to action goes here',
      estimatedWords: 150,
    }

    return staticData
  } catch (error) {
    console.error('Error loading static data:', error)
    return {
      script: 'Script goes here',
      topic: 'Social affairs',
      hypothesis: 'DHA ',
      region: 'Pakistan',
      duration: '1',
      language: 'English',
      title: 'Social affairs',
      hook: 'Hook goes here',
      mainContent: 'Main content goes here',
      conclusion: 'Conclusion goes here',
      callToAction: 'Call to action goes here',
      estimatedWords: 150,
    }
  }
}

export default async function ScriptProductionPage() {
  // Fetch static data at build time (SSG behavior)
  const staticData = await getStaticData()

  return (
    <ScriptProductionClient
      staticData={staticData}
    />
  )
}

