import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Map as MapIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Topic as TopicIcon,
} from '@mui/icons-material';

interface ClipMetadata {
  id: string;
  clip_id: string;
  title: string;
  sentiment_label?: string;
  topic_labels?: string[];
  speaker_name?: string;
  geo_location?: {
    name: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    city?: string;
  };
  event_date?: string;
  tags: Array<{
    id: string;
    name: string;
    tag_type: string;
    confidence: number;
  }>;
  created_at: string;
}

interface MetadataStats {
  total_clips: number;
  sentiment_distribution: Record<string, number>;
  top_speakers: Array<{ name: string; count: number }>;
  geographic_distribution: Array<{ country: string; count: number }>;
  tags: {
    total_tags: number;
    by_type: Record<string, number>;
  };
}

const MetadataVisualizer: React.FC = () => {
  const [clips, setClips] = useState<ClipMetadata[]>([]);
  const [stats, setStats] = useState<MetadataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load metadata statistics
      const statsResponse = await fetch('/api/metadata/statistics');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load clips for visualization
      const clipsResponse = await fetch('/api/metadata/clips/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Add time range filter if needed
          page_size: 100
        })
      });
      
      if (clipsResponse.ok) {
        const clipsData = await clipsResponse.json();
        setClips(clipsData.clips || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSentimentChart = () => {
    if (!stats?.sentiment_distribution) return null;

    const sentiments = Object.entries(stats.sentiment_distribution);
    const total = sentiments.reduce((sum, [_, count]) => sum + count, 0);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <AnalyticsIcon sx={{ mr: 1 }} />
            Sentiment Distribution
          </Typography>
          {sentiments.map(([sentiment, count]) => (
            <Box key={sentiment} mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {sentiment}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {count} ({Math.round((count / total) * 100)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(count / total) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getSentimentColor(sentiment),
                  },
                }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderGeographicDistribution = () => {
    if (!stats?.geographic_distribution) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <LocationIcon sx={{ mr: 1 }} />
            Geographic Distribution
          </Typography>
          <List dense>
            {stats.geographic_distribution.slice(0, 10).map((item, index) => (
              <ListItem key={item.country} disableGutters>
                <ListItemText
                  primary={item.country}
                  secondary={`${item.count} clips`}
                />
                <Chip 
                  label={item.count} 
                  size="small" 
                  color="primary" 
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  const renderTopSpeakers = () => {
    if (!stats?.top_speakers) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <PersonIcon sx={{ mr: 1 }} />
            Top Speakers
          </Typography>
          <List dense>
            {stats.top_speakers.slice(0, 10).map((speaker, index) => (
              <ListItem key={speaker.name} disableGutters>
                <ListItemText
                  primary={speaker.name}
                  secondary={`${speaker.count} appearances`}
                />
                <Chip 
                  label={`#${index + 1}`} 
                  size="small" 
                  variant="outlined" 
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  const renderTagDistribution = () => {
    if (!stats?.tags.by_type) return null;

    const tagTypes = Object.entries(stats.tags.by_type);
    const totalTags = tagTypes.reduce((sum, [_, count]) => sum + count, 0);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <TopicIcon sx={{ mr: 1 }} />
            Tag Distribution by Type
          </Typography>
          {tagTypes.map(([type, count]) => (
            <Box key={type} mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {type}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {count} ({Math.round((count / totalTags) * 100)}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(count / totalTags) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getTagTypeColor(type),
                  },
                }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderTimelineView = () => {
    // Group clips by date
    const clipsByDate = clips.reduce((acc, clip) => {
      const date = clip.event_date || clip.created_at;
      const dateKey = new Date(date).toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(clip);
      return acc;
    }, {} as Record<string, ClipMetadata[]>);

    const sortedDates = Object.keys(clipsByDate).sort();

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <TimelineIcon sx={{ mr: 1 }} />
            Timeline View
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {sortedDates.map((date) => (
              <Box key={date} mb={3}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
                <Box ml={2}>
                  {clipsByDate[date].map((clip) => (
                    <Paper key={clip.id} sx={{ p: 2, mb: 1, backgroundColor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {clip.title}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        {clip.sentiment_label && (
                          <Chip 
                            label={clip.sentiment_label} 
                            size="small" 
                            style={{ backgroundColor: getSentimentColor(clip.sentiment_label) }}
                          />
                        )}
                        {clip.speaker_name && (
                          <Chip 
                            label={clip.speaker_name} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                        {clip.geo_location && (
                          <Chip 
                            label={clip.geo_location.name} 
                            size="small" 
                            color="secondary" 
                          />
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderMapView = () => {
    const clipsWithLocation = clips.filter(clip => 
      clip.geo_location?.latitude && clip.geo_location?.longitude
    );

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <MapIcon sx={{ mr: 1 }} />
            Geographic Map
          </Typography>
          <Box 
            sx={{ 
              height: 400, 
              backgroundColor: 'grey.100', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <MapIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Interactive Map Component
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {clipsWithLocation.length} clips with location data
            </Typography>
            
            {/* Location list as fallback */}
            <Box mt={2} width="100%">
              <Typography variant="subtitle2" gutterBottom>Locations:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Array.from(new Set(clipsWithLocation.map(clip => 
                  clip.geo_location?.name
                ))).map((location) => (
                  <Chip 
                    key={location} 
                    label={location} 
                    size="small" 
                    variant="outlined" 
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
      case 'hopeful':
      case 'inspiring':
        return '#4CAF50';
      case 'negative':
      case 'angry':
      case 'sad':
        return '#F44336';
      case 'neutral':
        return '#9E9E9E';
      case 'determined':
      case 'defiant':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getTagTypeColor = (type: string): string => {
    const colors = {
      person: '#2196F3',
      location: '#4CAF50',
      organization: '#FF9800',
      event: '#9C27B0',
      topic: '#607D8B',
      sentiment: '#F44336',
      speaker: '#00BCD4',
      language: '#8BC34A',
      genre: '#FF5722',
      custom: '#795548'
    };
    return colors[type as keyof typeof colors] || '#9E9E9E';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Metadata Visualizer
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
            >
              <MenuItem value="overview">Overview</MenuItem>
              <MenuItem value="timeline">Timeline</MenuItem>
              <MenuItem value="map">Map</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Statistics Overview */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Clips
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.total_clips}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tags
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.tags.total_tags}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Countries
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.geographic_distribution.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Speakers
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.top_speakers.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      {selectedView === 'overview' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderSentimentChart()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderGeographicDistribution()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTopSpeakers()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTagDistribution()}
          </Grid>
        </Grid>
      )}

      {selectedView === 'timeline' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderTimelineView()}
          </Grid>
        </Grid>
      )}

      {selectedView === 'map' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {renderMapView()}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MetadataVisualizer; 