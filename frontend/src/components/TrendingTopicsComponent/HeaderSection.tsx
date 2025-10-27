import React from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, AccessTime as TimeIcon, Clear as ClearIcon } from '@mui/icons-material';
import LocationSelector from './LocationSelector';
import DateRangeSelector from './DateRangeSelector';
import { ProfileDropdown } from '../auth/ProfileDropdown';
import { useAuth } from '../../context/AuthContext';
import styles from './css/TrendingTopics.module.css';

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
  const { user } = useAuth();

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