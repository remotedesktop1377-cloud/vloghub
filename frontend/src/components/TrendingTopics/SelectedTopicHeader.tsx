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
    <Paper sx={{
      p: 1.5,
      mb: 2,
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Avatar
          sx={{
            bgcolor: HelperFunctions.getTrendingColor(0),
            width: 40,
            height: 40,
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          {selectedTopic.topic.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{
            fontSize: '0.95rem',
            fontWeight: 600,
            mb: 0.5,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {selectedTopic.topic}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={selectedTopic.category}
              size="small"
              sx={{
                bgcolor: '#f5f5f5',
                color: 'text.primary',
                fontSize: '0.6rem',
                height: 18,
                fontWeight: 500,
                border: '1px solid #e0e0e0'
              }}
            />

            <Chip
              label={`🔥 ${selectedTopic.value ? HelperFunctions.formatTweetVolume(selectedTopic.value) : '0'}`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                fontSize: '0.6rem',
                height: 18,
                fontWeight: 500
              }}
            />

            {selectedTopic.source_reference && (
              <Chip
                label={`📱 ${selectedTopic.source_reference.split(',')[0].trim()}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#9e9e9e',
                  color: '#9e9e9e',
                  fontSize: '0.6rem',
                  height: 18,
                  fontWeight: 500
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Compact Description Row */}
      {selectedTopic.description && (
        <Box sx={{
          mt: 1,
          p: 1,
          bgcolor: '#f8f9fa',
          borderRadius: 1,
          border: '1px solid #e9ecef'
        }}>
          <Typography variant="body2" sx={{
            fontSize: '0.7rem',
            lineHeight: 1.3,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}>
            Description: {selectedTopic.description}
          </Typography>

          {/* {selectedTopic.engagement_count && (
            <Typography variant="caption" sx={{
              fontSize: '0.65rem',
              color: 'text.secondary',
              mt: 0.5,
              display: 'block'
            }}>
              📊 {selectedTopic.engagement_count.toLocaleString()} engagements
            </Typography>
          )} */}
        </Box>
      )}
    </Paper>
  );
};

export default SelectedTopicHeader; 