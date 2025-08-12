import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

interface TrendingTopic {
  id: string;
  name: string;
  tweet_volume: number;
  url: string;
  promoted_content?: string;
  query: string;
}

interface TrendingTopicsResponse {
  trends: TrendingTopic[];
  region: string;
  timestamp: string;
}

const TrendingTopics: React.FC = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('pakistan');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  const regions = [
    { value: 'pakistan', label: 'Pakistan', flag: '🇵🇰' },
  ];

  const fetchTrendingTopics = async (region: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trending-topics?region=${region}`);

      if (response.ok) {
        const data: TrendingTopicsResponse = await response.json();
        setTrendingTopics(data.trends || []);
        setLastUpdated(new Date(data.timestamp));
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching trending topics:', err);
      setError('Failed to fetch trending topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTopics(selectedRegion);
  }, [selectedRegion]);

  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(event.target.value);
  };

  const handleRefresh = () => {
    fetchTrendingTopics(selectedRegion);
  };

  const formatTweetVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getTrendingColor = (index: number): string => {
    if (index === 0) return '#FFD700'; // Gold for #1
    if (index === 1) return '#C0C0C0'; // Silver for #2
    if (index === 2) return '#CD7F32'; // Bronze for #3
    return '#4A90E2'; // Blue for others
  };

  const getCategoryFromTopic = (topicName: string): string => {
    const name = topicName.toLowerCase();
    if (name.includes('cricket') || name.includes('sports') || name.includes('football')) return 'Sports';
    if (name.includes('weather') || name.includes('climate')) return 'Weather';
    if (name.includes('food') || name.includes('restaurant')) return 'Food & Dining';
    if (name.includes('startup') || name.includes('tech') || name.includes('ai')) return 'Technology';
    if (name.includes('music') || name.includes('fashion')) return 'Entertainment';
    if (name.includes('education') || name.includes('school')) return 'Education';
    if (name.includes('politics') || name.includes('news')) return 'Politics & News';
    if (name.includes('traffic') || name.includes('transport')) return 'Transportation';
    return 'General';
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Sports': return '#4caf50';
      case 'Weather': return '#2196f3';
      case 'Food & Dining': return '#ff9800';
      case 'Technology': return '#9c27b0';
      case 'Entertainment': return '#e91e63';
      case 'Education': return '#607d8b';
      case 'Politics & News': return '#f44336';
      case 'Transportation': return '#795548';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Region Selection and Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingIcon sx={{ fontSize: 32, color: '#1DA1F2', mr: 2 }} />
          <Typography variant="h5" gutterBottom>
            Trending Topics
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={selectedRegion}
              label="Region"
              onChange={handleRegionChange}
            >
              {regions.map((region) => (
                <MenuItem key={region.value} value={region.value}>
                  <span style={{ marginRight: '8px' }}>{region.flag}</span>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}



      <Grid container spacing={3}>
        {trendingTopics.map((topic, index) => {
          const category = getCategoryFromTopic(topic.name);
          const categoryColor = getCategoryColor(category);

          return (
            <Grid item xs={12} md={6} lg={4} key={topic.id}>
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
                onClick={() => router.push(`/topic/${topic.id}?region=${selectedRegion}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getTrendingColor(index),
                        mr: 2,
                        fontWeight: 'bold',
                        fontSize: '1.2rem'
                      }}
                    >
                      #{index + 1}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word' }}>
                        {topic.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip
                          label={category}
                          size="small"
                          sx={{
                            bgcolor: categoryColor,
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                        <Chip
                          icon={<TwitterIcon />}
                          label={formatTweetVolume(topic.tweet_volume)}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {topic.promoted_content && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label="Promoted"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>

                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => router.push(`/topic/${topic.id}?region=${selectedRegion}`)}
                    sx={{
                      borderColor: '#1DA1F2',
                      color: '#1DA1F2',
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
          );
        })}
      </Grid>

      {trendingTopics.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No trending topics found for {regions.find(r => r.value === selectedRegion)?.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try selecting a different region or refreshing the data.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TrendingTopics;
