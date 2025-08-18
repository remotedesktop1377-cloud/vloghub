import React from 'react';
import { Grid, Card, CardContent, Box, Typography, Chip, Avatar, Button } from '@mui/material';
import { TrendingUp as TrendingIcon } from '@mui/icons-material';
import { TrendingTopic } from '../../data/mockTrendingTopics';
import { HelperFunctions } from '../../utils/helperFunctions';

interface TrendingTopicsListProps {
  trendingTopics: TrendingTopic[];
  selectedRegion: string;
  regions: Array<{ value: string; label: string }>;
  onTopicSelect: (topic: TrendingTopic) => void;
  onExploreTopic: (topic: TrendingTopic) => void;
}

const TrendingTopicsList: React.FC<TrendingTopicsListProps> = ({
  trendingTopics,
  selectedRegion,
  regions,
  onTopicSelect,
  onExploreTopic,
}) => {
  if (trendingTopics.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No trending topics found for {regions.find(r => r.value === selectedRegion)?.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try selecting a different region or refreshing the data.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={1.5}>
      {trendingTopics.map((topic, index) => (
        <Grid item xs={6} md={4} lg={2} key={topic.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                transition: 'transform 0.2s ease-in-out',
                boxShadow: 4,
              }
            }}
            onClick={() => onTopicSelect(topic)}
          >
            <CardContent sx={{ flexGrow: 1, p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: HelperFunctions.getTrendingColor(index),
                    mr: 1,
                    fontSize: '0.7rem',
                    width: 25,
                    height: 25
                  }}
                >
                  #{index + 1}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" gutterBottom sx={{ wordBreak: 'break-word', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {topic.topic}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={topic.category}
                      size="small"
                      sx={{
                        bgcolor: '#AEAEAE',
                        color: 'white',
                        fontSize: '0.5rem',
                        height: 16
                      }}
                    />
                    {topic.value ? (
                      <Chip
                        label={topic.value}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#1DA1F2', color: '#1DA1F2', fontSize: '0.5rem', height: 16 }}
                      />
                    ) : (
                      <Chip
                        label={topic.value ? HelperFunctions.formatTweetVolume(topic.value) : '0'}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#1DA1F2', color: '#1DA1F2', fontSize: '0.5rem', height: 16 }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>

            <Box sx={{ display: 'flex', justifyContent: 'center', p: 1, borderTop: '1px solid #e0e0e0' }}>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click
                  onExploreTopic(topic);
                }}
                sx={{
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  fontSize: '0.5rem',
                  '&:hover': {
                    borderColor: '#0d8bd9',
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                  }
                }}
              >
                Explore the Topic
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TrendingTopicsList; 