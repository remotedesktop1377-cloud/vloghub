import Link from 'next/link'
import { Box, Typography, Button, Container } from '@mui/material'

export const metadata = {
  title: 'Page Not Found - Vloghub',
  description: 'The page you are looking for could not be found.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
}

export default function NotFound() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
          404
        </Typography>
        
        <Typography variant="h4" sx={{ mb: 2, color: 'text.primary' }}>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: '500px' }}>
          Sorry, the page you are looking for could not be found. It might have been moved, deleted, or you entered the wrong URL.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/"
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            Go Home
          </Button>
          
          <Button
            component={Link}
            href="/trending-topics"
            variant="outlined"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            Trending Topics
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
