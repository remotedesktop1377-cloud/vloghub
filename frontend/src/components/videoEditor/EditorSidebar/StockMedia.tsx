'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';

interface StockMediaProps {
  type: 'video' | 'image';
}

const StockMedia: React.FC<StockMediaProps> = ({ type }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Placeholder stock media items
  const stockItems = [
    { id: '1', title: 'Business Meeting', thumbnail: '', category: 'business' },
    { id: '2', title: 'Nature Landscape', thumbnail: '', category: 'nature' },
    { id: '3', title: 'Technology', thumbnail: '', category: 'tech' },
    { id: '4', title: 'People', thumbnail: '', category: 'people' },
  ];

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Stock {type === 'video' ? 'Video' : 'Images'}
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder={`Search ${type === 'video' ? 'videos' : 'images'}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container spacing={1}>
            {stockItems.map((item) => (
              <Grid item xs={6} key={item.id}>
                <Paper
                  sx={{
                    aspectRatio: '16/9',
                    position: 'relative',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                >
                  {type === 'video' ? (
                    <MovieIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  ) : (
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      p: 0.5,
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                    }}
                  >
                    {item.title}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Stock media library coming soon. This will integrate with stock media APIs.
        </Typography>
      </Box>
    </Box>
  );
};

export default StockMedia;

