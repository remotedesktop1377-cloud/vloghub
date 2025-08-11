import React from 'react';
import type { AppProps } from 'next/app';
import { Box } from '@mui/material';
import Layout from '../src/components/Layout/Layout';
import FeedbackButton from '../src/components/Feedback/FeedbackButton';

// Import feedback styles
import '../src/components/Feedback/Feedback.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      
      {/* Floating feedback button */}
      <FeedbackButton 
        variant="floating" 
        position="bottom-right" 
        label="Feedback" 
      />
    </Box>
  );
}
