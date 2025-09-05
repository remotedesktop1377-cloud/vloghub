import React from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, AccessTime as TimeIcon, Clear as ClearIcon } from '@mui/icons-material';
import LocationSelector from './LocationSelector';
import DateRangeSelector from './DateRangeSelector';
import styles from './css/TrendingTopics.module.css';

interface HeaderSectionProps {
  selectedLocation: string;
  selectedLocationType: 'global' | 'region' | 'country';
  onLocationChange: (location: string) => void;
  onLocationTypeChange: (type: 'global' | 'region' | 'country') => void;
  onRefresh: () => void;
  onClearCache?: () => void;
  loading: boolean;
  lastUpdated?: string;
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
  onClearCache,
  loading,
  lastUpdated,
  selectedDateRange,
  onDateRangeChange,
  selectedCountry,
  onCountryChange,
}) => {
  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const isDataFresh = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return diffHours < 1; // Consider data fresh if less than 1 hour old
    } catch (error) {
      return false;
    }
  };

  const getCacheExpiryInfo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const maxAge = 1 * 60 * 60 * 1000; // 1 hours in milliseconds
      const remainingMs = maxAge - diffMs;

      if (remainingMs <= 0) return 'Expired';

      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      if (remainingHours > 0) {
        return `Expires in ${remainingHours}h ${remainingMins}m`;
      } else {
        return `Expires in ${remainingMins}m`;
      }
    } catch (error) {
      return 'Unknown';
    }
  };

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
            {/* Refresh Button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
              size="small"
              sx={{
                height: '40px',
                minWidth: '160px',
                mr: 1,
                color: 'text.primary',
                fontSize: '1.05rem',
                fontWeight: '500',
                textTransform: 'none'
              }}
              title="Click to fetch fresh trending topics from Gemini API"
            >
              Refresh
            </Button>

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
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default HeaderSection; 