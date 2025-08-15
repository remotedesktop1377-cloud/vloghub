import React from 'react';
import { Box, Avatar, Typography, Chip, Paper } from '@mui/material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';

interface SelectedTopicHeaderProps {
  selectedTopic: TrendingTopic | null;
}

const SelectedTopicHeader: React.FC<SelectedTopicHeaderProps> = ({ selectedTopic }) => {
  if (!selectedTopic) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: HelperFunctions.getTrendingColor(0),
            width: 50,
            height: 50,
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {selectedTopic.topic.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 0.5 }}>
            {selectedTopic.topic}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={selectedTopic.category}
              size="small"
              sx={{
                bgcolor: '#AEAEAE',
                color: 'white',
                fontSize: '0.6rem',
                height: 20
              }}
            />
            
            {selectedTopic.postCount ? (
              <Chip
                label={`Posts: ${selectedTopic.postCount}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  fontSize: '0.6rem',
                  height: 20
                }}
              />
            ) : (
              <Chip
                label={`Posts: ${selectedTopic.postCountValue ? HelperFunctions.formatTweetVolume(selectedTopic.postCountValue) : '0'}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  fontSize: '0.6rem',
                  height: 20
                }}
              />
            )}
            
            <Chip
              label={`Ranking: #${selectedTopic.ranking || 'N/A'}`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                fontSize: '0.6rem',
                height: 20
              }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default SelectedTopicHeader; 