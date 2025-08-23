import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, ToggleButtonGroup, ToggleButton, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, GridOn as GridIcon, Cloud as CloudIcon, AccessTime as TimeIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Region } from '../../data/mockRegions';

interface HeaderSectionProps {
  selectedRegion: string;
  regions: Region[];
  onRegionChange: (region: string) => void;
  onRefresh: () => void;
  onClearCache?: () => void;
  trendView: 'grid' | 'cloud';
  onTrendViewChange: (view: 'grid' | 'cloud') => void;
  loading: boolean;
  lastUpdated?: string;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  selectedRegion,
  regions,
  onRegionChange,
  onRefresh,
  onClearCache,
  trendView,
  onTrendViewChange,
  loading,
  lastUpdated,
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
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Trending Topics
          </Typography>
          
          {/* Last Updated Info */}
          {lastUpdated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </Typography>
              <Chip
                label={isDataFresh(lastUpdated) ? 'Fresh' : 'Cached'}
                size="small"
                color={isDataFresh(lastUpdated) ? 'success' : 'default'}
                variant="outlined"
                sx={{ height: '20px', fontSize: '0.7rem' }}
              />
              {!isDataFresh(lastUpdated) && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  • {getCacheExpiryInfo(lastUpdated)}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Region Selection */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={selectedRegion}
              label="Region"
              onChange={(e) => onRegionChange(e.target.value)}
            >
              {regions.map((region) => (
                <MenuItem key={region.value} value={region.value}>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Refresh Button */}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            size="small"
            title="Click to fetch fresh trending topics from Gemini API"
          >
            Refresh
          </Button>

          {/* Clear Cache Button */}
          {onClearCache && (
            <Tooltip title="Clear cache">
              <IconButton
                onClick={onClearCache}
                size="small"
                disabled={loading}
                sx={{ ml: 1 }}
              >
                <ClearIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {/* View Toggle */}
          <ToggleButtonGroup
            value={trendView}
            exclusive
            onChange={(_, newView) => newView && onTrendViewChange(newView)}
            size="small"
          >
            <ToggleButton value="grid">
              <GridIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              Grid
            </ToggleButton>
            <ToggleButton value="cloud">
              <CloudIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              Cloud
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default HeaderSection; 