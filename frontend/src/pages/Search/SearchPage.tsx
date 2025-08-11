import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

interface SearchFilters {
  publishedAfter: string;
  publishedBefore: string;
  duration: string;
  videoLicense: string;
  regionCode: string;
  relevanceLanguage: string;
  order: string;
  channelId: string;
}

interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  statistics: {
    sentiment: string;
    entities: string[];
    topics: string[];
  };
}

const SearchPage: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    publishedAfter: '',
    publishedBefore: '',
    duration: 'any',
    videoLicense: 'any',
    regionCode: '',
    relevanceLanguage: 'en',
    order: 'relevance',
    channelId: '',
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // API call to backend search endpoint
      const requestBody = {
        prompt: query,
        max_results: 25,
        use_alternative_queries: false,
        filters: {
          publishedAfter: filters.publishedAfter,
          publishedBefore: filters.publishedBefore,
          duration: filters.duration,
          videoLicense: filters.videoLicense,
          regionCode: filters.regionCode,
          relevanceLanguage: filters.relevanceLanguage,
          channelId: filters.channelId,
        },
        sort_by: filters.order,
        sort_reverse: false,
      };

      const response = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.items || []);
      } else {
        console.error('Search failed');
        // For demo, show mock results
        setResults(getMockResults());
      }
    } catch (error) {
      console.error('Search error:', error);
      // For demo, show mock results
      setResults(getMockResults());
    } finally {
      setLoading(false);
    }
  };

  const getMockResults = (): VideoResult[] => [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Nelson Mandela: The Long Walk to Freedom',
      description: 'A comprehensive documentary about Nelson Mandela\'s journey from activist to president.',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      channelTitle: 'History Channel',
      publishedAt: '2023-12-01',
      duration: '45:30',
      viewCount: 1250000,
      statistics: {
        sentiment: 'inspiring',
        entities: ['Nelson Mandela', 'South Africa', 'Apartheid'],
        topics: ['History', 'Politics', 'Human Rights'],
      },
    },
    {
      id: 'abc123def456',
      title: 'Mandela\'s Prison Years: Robben Island Stories',
      description: 'Interviews with former prisoners and guards about life on Robben Island.',
      thumbnailUrl: 'https://img.youtube.com/vi/abc123def456/maxresdefault.jpg',
      channelTitle: 'BBC Documentaries',
      publishedAt: '2023-11-15',
      duration: '28:45',
      viewCount: 850000,
      statistics: {
        sentiment: 'somber',
        entities: ['Robben Island', 'Prison', 'Walter Sisulu'],
        topics: ['History', 'Biography', 'Social Justice'],
      },
    },
  ];

  const handleAnalyzeVideo = (videoId: string) => {
    router.push(`/editor/${videoId}`);
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Search YouTube Videos
      </Typography>

      {/* Search Interface */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            label="Search Query"
            placeholder="Enter keywords, names, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </Box>

        {/* Advanced Filters */}
        <Accordion expanded={showFilters}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Advanced Search Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Published After"
                  type="date"
                  value={filters.publishedAfter}
                  onChange={(e) => setFilters({...filters, publishedAfter: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Published Before"
                  type="date"
                  value={filters.publishedBefore}
                  onChange={(e) => setFilters({...filters, publishedBefore: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Duration</InputLabel>
                  <Select
                    value={filters.duration}
                    onChange={(e) => setFilters({...filters, duration: e.target.value})}
                  >
                    <MenuItem value="any">Any Duration</MenuItem>
                    <MenuItem value="short">Short (&lt; 4 minutes)</MenuItem>
                    <MenuItem value="medium">Medium (4-20 minutes)</MenuItem>
                    <MenuItem value="long">Long (&gt; 20 minutes)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>License</InputLabel>
                  <Select
                    value={filters.videoLicense}
                    onChange={(e) => setFilters({...filters, videoLicense: e.target.value})}
                  >
                    <MenuItem value="any">Any License</MenuItem>
                    <MenuItem value="creativeCommon">Creative Commons</MenuItem>
                    <MenuItem value="youtube">Standard YouTube License</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.order}
                    onChange={(e) => setFilters({...filters, order: e.target.value})}
                  >
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="date">Upload Date</MenuItem>
                    <MenuItem value="viewCount">View Count</MenuItem>
                    <MenuItem value="rating">Rating</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Loading */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Searching YouTube and analyzing content...
          </Typography>
        </Box>
      )}

      {/* Results */}
      <Grid container spacing={3}>
        {results.map((video) => (
          <Grid item xs={12} md={6} lg={4} key={video.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={video.thumbnailUrl}
                alt={video.title}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleAnalyzeVideo(video.id)}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {video.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {video.channelTitle} • {formatViewCount(video.viewCount)} views
                </Typography>
                <Typography variant="body2" paragraph>
                  {video.description.substring(0, 100)}...
                </Typography>

                {/* AI Analysis Tags */}
                <Box mb={2}>
                  <Chip
                    label={`Sentiment: ${video.statistics.sentiment}`}
                    size="small"
                    color="primary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  {video.statistics.entities.map((entity, index) => (
                    <Chip
                      key={index}
                      label={entity}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    {video.publishedAt} • {video.duration}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleAnalyzeVideo(video.id)}
                      title="Analyze & Edit Clips"
                    >
                      <AnalyticsIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Download Video"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {results.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No videos found. Try searching for something!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchPage; 