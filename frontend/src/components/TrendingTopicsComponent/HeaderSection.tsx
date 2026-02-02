"use client";
import React from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, AccessTime as TimeIcon, Clear as ClearIcon } from '@mui/icons-material';
import LocationSelector from './LocationSelector';
import DateRangeSelector from './DateRangeSelector';
import { ProfileDropdown } from '../auth/ProfileDropdown';
import { useSession } from 'next-auth/react';
import styles from './css/TrendingTopics.module.css';
import { useRouter } from 'next/navigation';
import { ROUTES_KEYS } from '@/data/constants';

interface HeaderSectionProps {
  selectedLocation: string;
  selectedLocationType: 'global' | 'region' | 'country';
  onLocationChange: (location: string) => void;
  onLocationTypeChange: (type: 'global' | 'region' | 'country') => void;
  onRefresh: () => void;
  loading: boolean;
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  selectedLocation,
  selectedLocationType,
  onLocationChange,
  onLocationTypeChange,
  onRefresh,
  loading,
  selectedDateRange,
  onDateRangeChange,
  selectedCountry,
  onCountryChange,
}) => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const [dashboardLoading, setDashboardLoading] = React.useState(false);

  return (
    <Box className={styles.headerContainer}>
      <Box className={styles.headerContent}>
        <Box className={styles.headerLeft}>
          <Typography variant="h4" sx={{ fontWeight: '500' }}>
            Trending Topics
          </Typography>
        </Box>

        <Box className={styles.headerRight}>
          {/* Dropdown Group */}
          <Box className={styles.dropdownGroup}>
            {/* Refresh and Dashboard Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setDashboardLoading(true);
                  router.push(ROUTES_KEYS.DASHBOARD);
                }}
                size="small"
                sx={{
                  height: '40px',
                  minWidth: '120px',
                  fontSize: '1.0rem',
                  textTransform: 'none'
                }}
              >
                {dashboardLoading ? 'Opening...' : 'Dashboard'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
                size="small"
                sx={{
                  height: '40px',
                  minWidth: '140px',
                  color: 'text.primary',
                  fontSize: '1.05rem',
                  fontWeight: '500',
                  textTransform: 'none'
                }}
                title="Click to fetch fresh trending topics from Gemini API"
              >
                Refresh
              </Button>
            </Box>

            {/* Enhanced Location Selector */}
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationChange={onLocationChange}
              selectedLocationType={selectedLocationType}
              onLocationTypeChange={onLocationTypeChange}
              selectedCountry={selectedCountry}
              onCountryChange={onCountryChange}
            />

            {/* Date Range Selector */}
            <DateRangeSelector
              selectedDateRange={selectedDateRange}
              onDateRangeChange={onDateRangeChange}
            />

            {/* Profile Dropdown */}
            {user && (
              <Box sx={{ ml: 2 }}>
                <ProfileDropdown />
              </Box>
            )}
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default HeaderSection; 