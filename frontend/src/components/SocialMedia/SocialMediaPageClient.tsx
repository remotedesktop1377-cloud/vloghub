'use client';

import React, { useState } from 'react';
import { Box, Container, Tabs, Tab, Typography } from '@mui/material';
import { BACKGROUND, TEXT, PURPLE } from '../../styles/colors';
import SocialMediaAccounts from './SocialMediaAccounts';
import SocialMediaStats from './SocialMediaStats';
import styles from './SocialMediaPageClient.module.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-media-tabpanel-${index}`}
      aria-labelledby={`social-media-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SocialMediaPageClient() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: BACKGROUND.default,
        pt: { xs: 2, md: 4 },
        pb: 8,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              color: TEXT.primary,
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Social Media Posting & Stats
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: TEXT.secondary,
              fontSize: '1.1rem',
            }}
          >
            Connect your social media accounts and track your posting performance
          </Typography>
        </Box>

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: TEXT.secondary,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                minHeight: 64,
                '&.Mui-selected': {
                  color: TEXT.primary,
                },
              },
              '& .MuiTabs-indicator': {
                background: PURPLE.gradient.primary,
                height: 3,
              },
            }}
          >
            <Tab label="Accounts" />
            <Tab label="Statistics" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <SocialMediaAccounts />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <SocialMediaStats />
        </TabPanel>
      </Container>
    </Box>
  );
}

