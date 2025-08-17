import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { Refresh as RefreshIcon, GridOn as GridIcon, Cloud as CloudIcon } from '@mui/icons-material';
import { Region } from '../../data/mockRegions';

interface HeaderSectionProps {
  selectedRegion: string;
  regions: Region[];
  onRegionChange: (region: string) => void;
  onRefresh: () => void;
  trendView: 'grid' | 'cloud';
  onTrendViewChange: (view: 'grid' | 'cloud') => void;
  loading: boolean;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  selectedRegion,
  regions,
  onRegionChange,
  onRefresh,
  trendView,
  onTrendViewChange,
  loading,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          Trending Topics
        </Typography>
        
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
          >
            Refresh
          </Button>

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