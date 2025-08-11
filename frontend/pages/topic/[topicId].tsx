import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
  Divider,
  Alert,
  Container,
  IconButton,
  CardMedia,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  TrendingUp as TrendingIcon,
  Twitter as TwitterIcon,
  ContentCut as CutIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface TopicData {
  id: string;
  name: string;
  tweet_volume: number;
  url: string;
  promoted_content?: string;
  query: string;
  region: string;
}

const TopicDetailPage: React.FC = () => {
  const router = useRouter();
  const { topicId, region } = router.query;
  
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersGenerated, setChaptersGenerated] = useState(false);

  const durationOptions = [
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
  ];

  useEffect(() => {
    if (topicId && region) {
      // Fetch topic details from the API
      fetchTopicDetails(topicId as string, region as string);
    }
  }, [topicId, region]);

  const fetchTopicDetails = async (topicId: string, region: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trending-topics?region=${region}`);
      
      if (response.ok) {
        const data = await response.json();
        const foundTopic = data.trends.find((t: TopicData) => t.id === topicId);
        
        if (foundTopic) {
          setTopic({ ...foundTopic, region });
        } else {
          setError('Topic not found');
        }
      } else {
        setError('Failed to fetch topic details');
      }
    } catch (err) {
      console.error('Error fetching topic details:', err);
      setError('Failed to load topic details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChapters = async () => {
    if (!hypothesis.trim()) {
      setError('Please enter a hypothesis');
      return;
    }

    try {
      setGeneratingChapters(true);
      setError(null);
      setChapters([]);
      setChaptersGenerated(false);

      const response = await fetch('/api/generate-chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic: topic?.name, 
          hypothesis, 
          duration: parseInt(duration) 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generated chapters:', data);
        
        if (data.chapters && Array.isArray(data.chapters)) {
          setChapters(data.chapters);
          setChaptersGenerated(true);
          setError(null);
        } else {
          setError('Invalid response format from API');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || `Failed to generate chapters (${response.status})`);
      }
    } catch (err) {
      console.error('Error generating chapters:', err);
      setError('Failed to generate chapters. Please try again.');
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleBackToTopics = () => {
    router.push(`/?region=${topic?.region || 'pakistan'}`);
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Typography>Loading topic details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !topic) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Topic not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToTopics}
        >
          Back to Trending Topics
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToTopics}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Topic Details
        </Typography>
      </Box>

      {/* Selected Topic Display */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: '#1DA1F2', 
              mr: 2, 
              width: 56, 
              height: 56,
              fontSize: '1.5rem'
            }}
          >
            <TrendingIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ wordBreak: 'break-word' }}>
              {topic.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Chip 
                icon={<TwitterIcon />}
                label={`${formatTweetVolume(topic.tweet_volume)} tweets`}
                size="medium"
                variant="outlined"
                sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
              />
              {topic.promoted_content && (
                <Chip 
                  label="Promoted" 
                  size="medium" 
                  color="secondary"
                  variant="outlined"
                />
              )}
              <Chip 
                label={topic.region.toUpperCase()} 
                size="medium" 
                variant="outlined"
              />
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Query: {topic.query}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Hypothesis Input */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Hypothesis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Enter your hypothesis, research question, or unique angle on this topic..."
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          Example: "How does this topic impact local communities and what solutions can be implemented?"
        </Typography>
      </Paper>

      {/* Video Duration Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Video Duration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the desired length for your generated video content.
        </Typography>
        <FormControl fullWidth sx={{ maxWidth: 300 }}>
          <InputLabel>Duration</InputLabel>
          <Select
            value={duration}
            label="Duration"
            onChange={(e) => setDuration(e.target.value)}
          >
            {durationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<CutIcon />}
          onClick={handleGenerateChapters}
          disabled={!hypothesis.trim() || generatingChapters}
          sx={{ 
            bgcolor: '#1DA1F2',
            '&:hover': { bgcolor: '#0d8bd9' },
            px: 4,
            py: 1.5
          }}
        >
          {generatingChapters ? 'Generating Chapters...' : 'Generate Chapters'}
        </Button>
      </Box>

      {/* Generated Chapters Display */}
      {chaptersGenerated && chapters.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#1DA1F2' }}>
            Generated Video Chapters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Here are the chapters for your {durationOptions.find(d => d.value === duration)?.label} video:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chapters.map((chapter, index) => (
              <Card 
                key={index} 
                variant="outlined" 
                sx={{ 
                  borderColor: '#e0e0e0',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: '#1DA1F2',
                    '& .chapter-actions': {
                      opacity: 1,
                    }
                  }
                }}
              >
                <CardContent sx={{ p: 0, height: 120 }}>
                  <Box sx={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                    {/* Image Thumbnail on Left */}
                    <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                      <CardMedia
                        component="img"
                        image={`https://picsum.photos/120/120?random=${index + 1}`}
                        alt={chapter.title}
                        sx={{ 
                          height: 120, 
                          width: 120,
                          objectFit: 'cover',
                          borderRadius: '8px 0 0 8px'
                        }}
                      />
                      {/* Replace Icon on Image */}
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                          width: 28,
                          height: 28,
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {/* Content on Right */}
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', height: '100%', px: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                          {chapter.title || `Chapter ${index + 1}`}
                        </Typography>
                        {chapter.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {chapter.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {chapter.duration && (
                            <Chip 
                              label={chapter.duration} 
                              size="small" 
                              variant="outlined"
                              sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
                            />
                          )}
                          {chapter.keyPoints && Array.isArray(chapter.keyPoints) && chapter.keyPoints.length > 0 && (
                            <Chip 
                              label={`${chapter.keyPoints.length} key points`}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#666', color: '#666' }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Delete Icon on Right */}
                      <IconButton
                        className="chapter-actions"
                        size="small"
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          color: '#ff4444',
                          '&:hover': { 
                            bgcolor: 'rgba(255,68,68,0.1)',
                            color: '#cc0000'
                          },
                          width: 36,
                          height: 36,
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Card */}
      <Card sx={{ mt: 4, bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Topic:</strong> {topic.name}
            </Typography>
            <Typography variant="body2">
              <strong>Region:</strong> {topic.region.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              <strong>Tweet Volume:</strong> {formatTweetVolume(topic.tweet_volume)}
            </Typography>
            <Typography variant="body2">
              <strong>Duration:</strong> {durationOptions.find(d => d.value === duration)?.label}
            </Typography>
            {hypothesis && (
              <Typography variant="body2">
                <strong>Hypothesis:</strong> {hypothesis}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TopicDetailPage;
