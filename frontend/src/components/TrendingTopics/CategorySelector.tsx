import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import styles from './CategorySelector.module.css';
import { locationData } from '../../data/locationData';

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategory, onCategoryChange }) => {
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    onCategoryChange(event.target.value);
  };

  return (
    <Box className={styles.categorySelectorContainer}>
      <FormControl 
        className={`${styles.categorySelector}`} 
        size="small" 
        sx={{ 
          height: '40px',
          width: '180px',
          minWidth: '180px'
        }}
      >
        <InputLabel id="category-label">Category</InputLabel>
        <Select
          labelId="category-label"
          value={selectedCategory}
          label={'Category'}
          onChange={handleCategoryChange}
          sx={{ 
            height: '40px',
            width: '100%'
          }}
        >
          <MenuItem value="">
            <em>Select</em>
          </MenuItem>
          {locationData.category.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CategorySelector;


