import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Typography, useTheme } from '@mui/material';
import { locationData, LocationOption, getCitiesByCountry } from '../../data/locationData';
import styles from './LocationSelector.module.css';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedLocationType: 'region' | 'country' | 'global';
  onLocationTypeChange: (type: 'region' | 'country' | 'global') => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationChange,
  selectedLocationType,
  onLocationTypeChange,
  selectedCountry,
  onCountryChange,
}) => {
  const theme = useTheme();

  const handleLocationTypeChange = (event: SelectChangeEvent<string>) => {
    const newType = event.target.value as 'region' | 'country' | 'global';
    onLocationTypeChange(newType);
    // Reset location when type changes
    onLocationChange('');
    onCountryChange('');
  };

  const handleLocationChange = (event: SelectChangeEvent<string>) => {
    onLocationChange(event.target.value);
  };

  const getLocationOptions = (): LocationOption[] => {
    if (selectedLocationType === 'country') {
      // When type is country, the location dropdown will be cities
      if (!selectedCountry) return [];
      return getCitiesByCountry(selectedCountry);
    }
    // When type is region, the location dropdown will be regions
    if (selectedLocationType === 'region') {
      return locationData.regions;
    }
    // Global: no location dropdown
    return [];
  };

  const getLocationTypeLabel = (): string => {
    switch (selectedLocationType) {
      case 'region': return 'Region';
      case 'country': return 'City';
      case 'global': return 'Global';
      default: return 'Location';
    }
  };

  const getSelectedLocationLabel = (): string => {
    if (!selectedLocation) {
      return 'Select';
    }
    const location = getLocationOptions().find(loc => loc.value === selectedLocation);
    return location ? location.label : 'Select';
  };

  return (
    <Box className={styles.locationSelectorContainer}>
      {/* Location Type Selector */}
      <FormControl 
        className={`${styles.locationTypeSelector}`} 
        size="small" 
        sx={{ 
          height: '40px',
          width: '160px',
          minWidth: '160px'
        }}
      >
        <InputLabel id="location-type-label">Type</InputLabel>
        <Select
          labelId="location-type-label"
          value={selectedLocationType}
          label="Type"
          onChange={handleLocationTypeChange}
          sx={{ 
            height: '40px',
            width: '100%'
          }}
        >
          <MenuItem value="global">Global</MenuItem>
          <MenuItem value="region">Region</MenuItem>
          <MenuItem value="country">Country</MenuItem>
        </Select>
      </FormControl>

      {/* Country Selector (only when Type is Country) */}
      {selectedLocationType === 'country' && (
        <FormControl 
          className={`${styles.locationSelector}`} 
          size="small" 
          sx={{ 
            height: '40px',
            width: '160px',
            minWidth: '160px'
          }}
        >
          <InputLabel id="country-label">Country</InputLabel>
          <Select
            labelId="country-label"
            value={selectedCountry}
            label={'Country'}
            onChange={(e: SelectChangeEvent<string>) => {
              const countryVal = e.target.value;
              onCountryChange(countryVal);
              // Reset city when country changes
              onLocationChange('');
            }}
            sx={{ 
              height: '40px',
              width: '100%'
            }}
          >
            <MenuItem value="">
              <em>Select</em>
            </MenuItem>
            {locationData.countries.map((country) => (
              <MenuItem key={country.value} value={country.value}>
                <Box className={styles.locationMenuItem}>
                  {country.flag && <span>{country.flag}</span>}
                  <Typography variant="body2" className={styles.locationLabel}>
                    {country.label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Region or City Selector depending on type (hidden for Global) */}
      {selectedLocationType !== 'global' && (
        <FormControl 
          className={`${styles.locationSelector}`} 
          size="small" 
          sx={{ 
            height: '40px',
            width: '160px',
            minWidth: '160px'
          }}
        >
          <InputLabel id="location-label">{getLocationTypeLabel()}</InputLabel>
          <Select
            labelId="location-label"
            value={selectedLocation}
            label={getLocationTypeLabel()}
            onChange={handleLocationChange}
            disabled={selectedLocationType === 'country' && !selectedCountry}
            sx={{ 
              height: '40px',
              width: '100%'
            }}
          >
            <MenuItem value="">
              <em>Select</em>
            </MenuItem>
            {getLocationOptions().map((location) => (
              <MenuItem key={location.value} value={location.value}>
                <Box className={styles.locationMenuItem}>
                  {location.flag && <span>{location.flag}</span>}
                  <Typography variant="body2" className={styles.locationLabel}>
                    {location.label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export default LocationSelector;
