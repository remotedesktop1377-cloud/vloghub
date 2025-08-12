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
  Paper,
  TextField,
  Container,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  Twitter as TwitterIcon,
  ContentCut as CutIcon,
  Create as CreateIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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

interface Chapter {
  id: string;
  heading: string;
  narration: string;
  visuals: string;
  brollIdeas: string[];
  duration: string;
}

const TrendingTopics: React.FC = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('pakistan');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Topic Details State
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [selectedTopicDetails, setSelectedTopicDetails] = useState<string>('');
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('1');
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersGenerated, setChaptersGenerated] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editHeading, setEditHeading] = useState('');
  const [editNarration, setEditNarration] = useState('');

  const router = useRouter();

  const regions = [
    { value: 'pakistan', label: 'Pakistan', flag: '🇵🇰' },
  ];

  const durationOptions = [
    { value: '1', label: '1 minutes' },
    { value: '3', label: '3 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
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

  const getHypothesisSuggestions = (topicName: string): string[] => {
    const name = topicName.toLowerCase();

    if (name.includes('cricket') || name.includes('sports') || name.includes('football')) {
      return [
        "How does this sport impact local economy and tourism?",
        "What are the social and cultural implications for the community?",
        "How can we improve youth engagement and development through sports?",
        "What role does this sport play in national identity and pride?"
      ];
    }

    if (name.includes('weather') || name.includes('climate')) {
      return [
        "How does climate change affect local agriculture and food security?",
        "What adaptation strategies can communities implement?",
        "How does extreme weather impact urban infrastructure and planning?",
        "What are the economic consequences of changing weather patterns?"
      ];
    }

    if (name.includes('food') || name.includes('restaurant')) {
      return [
        "How does this food trend reflect changing cultural preferences?",
        "What impact does this have on local farmers and suppliers?",
        "How can we make this food more accessible to different communities?",
        "What are the health and nutrition implications?"
      ];
    }

    if (name.includes('startup') || name.includes('tech') || name.includes('ai')) {
      return [
        "How can this technology solve local problems and challenges?",
        "What are the job market implications and skill requirements?",
        "How does this innovation impact traditional industries?",
        "What are the ethical considerations and potential risks?"
      ];
    }

    if (name.includes('music') || name.includes('fashion')) {
      return [
        "How does this trend reflect generational changes and values?",
        "What impact does this have on local artists and creators?",
        "How can we preserve cultural heritage while embracing new trends?",
        "What are the economic opportunities for local businesses?"
      ];
    }

    if (name.includes('education') || name.includes('school')) {
      return [
        "How can we improve access to quality education for all students?",
        "What role does technology play in modern learning?",
        "How do educational policies impact student outcomes?",
        "What are the challenges and opportunities in remote learning?"
      ];
    }

    if (name.includes('politics') || name.includes('news')) {
      return [
        "How does this political development affect local communities?",
        "What are the long-term implications for democracy and governance?",
        "How can citizens become more engaged in the political process?",
        "What are the economic and social consequences of this policy?"
      ];
    }

    if (name.includes('traffic') || name.includes('transport')) {
      return [
        "How can we improve public transportation infrastructure?",
        "What are the environmental impacts of current transport systems?",
        "How does traffic congestion affect local businesses and quality of life?",
        "What innovative solutions can reduce transportation costs?"
      ];
    }

    // Default suggestions for general topics
    return [
      "How does this topic impact local communities and daily life?",
      "What are the underlying causes and contributing factors?",
      "How can we address the challenges and leverage opportunities?",
      "What lessons can other regions learn from this situation?",
      "How does this reflect broader social, economic, or cultural trends?"
    ];
  };

  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [loadingTopicSuggestions, setLoadingTopicSuggestions] = useState(false);
  const [enhancingDetails, setEnhancingDetails] = useState(false);

  const getTopicSuggestions = async (topicName: string) => {
    if (!topicName.trim()) return;

    try {
      setLoadingTopicSuggestions(true);
      setError(null);

      const response = await fetch('/api/get-topic-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtag: topicName,
          region: selectedRegion
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestions = Array.isArray(data)
          ? data
          : (Array.isArray(data?.suggestions) ? data.suggestions : []);
        setTopicSuggestions(suggestions || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch topic suggestions:', errorData.detail || response.status);
        // Fallback to default suggestions
        setTopicSuggestions([
          `The hidden story behind ${topicName} that nobody talks about`,
          `How ${topicName} is changing the landscape in ${selectedRegion}`,
          `The controversy surrounding ${topicName} - what you need to know`,
          `5 surprising facts about ${topicName} that will shock you`,
          `Why ${topicName} matters more than you think`
        ]);
      }
    } catch (err) {
      console.error('Error fetching topic suggestions:', err);
      // Fallback to default suggestions
      setTopicSuggestions([
        `The hidden story behind ${topicName} that nobody talks about`,
        `How ${topicName} is changing the landscape in ${selectedRegion}`,
        `5 surprising facts about ${topicName} that will shock you`,
        `Why ${topicName} matters more than you think`,
        `The future of ${topicName} - predictions and possibilities`
      ]);
    } finally {
      setLoadingTopicSuggestions(false);
    }
  };

  const handleEnhanceTopicDetails = async () => {
    if (!selectedTopic || !selectedTopicDetails.trim()) return;
    try {
      setEnhancingDetails(true);
      const response = await fetch('/api/enhance-topic-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic.name,
          details: selectedTopicDetails,
          region: selectedRegion,
          targetWords: 160,
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.enhancedText) {
          setSelectedTopicDetails(data.enhancedText);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('Failed to enhance details', errData);
      }
    } catch (e) {
      console.error('Error enhancing details', e);
    } finally {
      setEnhancingDetails(false);
    }
  };

  const handleTopicSelect = async (topic: TrendingTopic) => {
    setSelectedTopic(topic);
    setHypothesis('');
    setChapters([]);
    setChaptersGenerated(false);
    setEditingChapter(null);
    setTopicSuggestions([]); // Reset suggestions
    // Fetch new topic suggestions
    await getTopicSuggestions(topic.name);
  };

  const handleGenerateChapters = async () => {
    if (!hypothesis.trim() || !selectedTopic) {
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
          topic: selectedTopic.name,
          hypothesis,
          duration: parseInt(duration)
        }),
      });

      if (response.ok) {
        const data = await response.json();
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

  const handleAddChapterAfter = (index: number) => {
    const newChapter = {
      id: (chapters.length + 1).toString(),
      heading: `New Chapter ${chapters.length + 1}`,
      narration: 'New chapter narration content will be generated here.',
      visuals: 'Visual direction for the new chapter.',
      brollIdeas: ['B-roll idea 1', 'B-roll idea 2', 'B-roll idea 3'],
      duration: '1 min'
    };

    const updatedChapters = [...chapters];
    updatedChapters.splice(index + 1, 0, newChapter);
    setChapters(updatedChapters);
  };

  const handleDeleteChapter = (index: number) => {
    const updatedChapters = chapters.filter((_, i) => i !== index);
    setChapters(updatedChapters);
  };

  const handleEditChapter = (index: number) => {
    setEditingChapter(index);
    setEditHeading(chapters[index].heading || '');
    setEditNarration(chapters[index].narration || '');
  };

  const handleSaveEdit = (index: number) => {
    const updatedChapters = [...chapters];
    updatedChapters[index] = {
      ...updatedChapters[index],
      heading: editHeading,
      narration: editNarration
    };
    setChapters(updatedChapters);
    setEditingChapter(null);
    setEditHeading('');
    setEditNarration('');
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setEditHeading('');
    setEditNarration('');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.index === destination.index) return;

    const updatedChapters = Array.from(chapters);
    const [reorderedChapter] = updatedChapters.splice(source.index, 1);
    updatedChapters.splice(destination.index, 0, reorderedChapter);

    setChapters(updatedChapters);
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
                onClick={() => handleTopicSelect(topic)}
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
                    onClick={() => handleTopicSelect(topic)}
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

      {/* Topic Details Section */}
      {selectedTopic && (
        <Box sx={{ mt: 6 }}>
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
                  {selectedTopic.name}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    icon={<TwitterIcon />}
                    label={`${formatTweetVolume(selectedTopic.tweet_volume)} tweets`}
                    size="medium"
                    variant="outlined"
                    sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
                  />
                  {selectedTopic.promoted_content && (
                    <Chip
                      label="Promoted"
                      size="medium"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    label={selectedRegion.toUpperCase()}
                    size="medium"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>

            {/* Topic Details */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Topic
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Describe your topic, This will help generate relevant video content.
              </Typography>

              {/* Topic Suggestions */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    💡 Suggested topics for "{selectedTopic.name}":
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => getTopicSuggestions(selectedTopic.name)}
                    disabled={loadingTopicSuggestions}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    🔄
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {loadingTopicSuggestions ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Generating topic suggestions...
                      </Typography>
                    </Box>
                  ) : topicSuggestions.length > 0 ? (
                    topicSuggestions.map((suggestion: string, index: number) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedTopicDetails(suggestion)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(29, 161, 242, 0.1)',
                            borderColor: '#1DA1F2',
                          }
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No topic suggestions available. Click on a trending topic to generate suggestions.
                    </Typography>
                  )}
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Enter your topic details..."
                value={selectedTopicDetails}
                onChange={(e) => setSelectedTopicDetails(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleEnhanceTopicDetails}
                  disabled={enhancingDetails || !selectedTopicDetails.trim()}
                  sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
                >
                  {enhancingDetails ? 'Enhancing...' : '✨ Enhance'}
                </Button>
              </Box>
            </Paper>

            {/* Hypothesis Input */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Hypothesis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
              </Typography>

              {/* Hypothesis Suggestions */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    💡 Suggested hypotheses for "{selectedTopic.name}":
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => getHypothesisSuggestions(selectedTopic.name)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    🔄
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {getHypothesisSuggestions(selectedTopic.name).map((suggestion: string, index: number) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      variant="outlined"
                      onClick={() => setHypothesis(suggestion)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(29, 161, 242, 0.1)',
                          borderColor: '#1DA1F2',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

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
            </Paper>

            {/* Video Duration */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Video Duration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the desired length for your generated video content.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
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
            </Paper>

            {/* Video Chapters Section */}
            <Paper sx={{ p: 2, border: '2px dashed #e0e0e0', minHeight: '400px' }}>
              {chaptersGenerated && chapters.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="chapters">
                    {(provided) => (
                      <Box
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                      >
                        {chapters.map((chapter, index) => (
                          <Draggable key={chapter.id || index.toString()} draggableId={chapter.id || index.toString()} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                variant="outlined"
                                sx={{
                                  borderColor: '#e0e0e0',
                                  borderRadius: 2,
                                  transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                  boxShadow: snapshot.isDragging ? 8 : 1,
                                  '&:hover': {
                                    boxShadow: 2,
                                    borderColor: '#1DA1F2',
                                    '& .chapter-actions': {
                                      opacity: 1,
                                    }
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 2, height: 'auto' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', height: '100%' }}>
                                    {/* Drag Handle */}
                                    <Box
                                      {...provided.dragHandleProps}
                                      sx={{
                                        mr: 2,
                                        cursor: 'grab',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9c27b0',
                                        '&:active': { cursor: 'grabbing' },
                                        minHeight: '100%',
                                        alignSelf: 'stretch'
                                      }}
                                    >
                                      <DragIcon fontSize="small" />
                                    </Box>

                                    {/* Content */}
                                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-start', height: '100%' }}>
                                      <Box sx={{ flexGrow: 1 }}>
                                        {/* Narration Content */}
                                        {editingChapter === index ? (
                                          <TextField
                                            value={editNarration}
                                            onChange={(e) => setEditNarration(e.target.value)}
                                            variant="outlined"
                                            multiline
                                            rows={4}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                          />
                                        ) : (
                                          <Box sx={{
                                            p: 2,
                                            bgcolor: '#f8f9fa',
                                            borderRadius: 1,
                                            border: '1px solid #e9ecef',
                                            maxHeight: '200px',
                                            overflow: 'auto',
                                            mb: 2
                                          }}>
                                            <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#495057' }}>
                                              {chapter.narration || 'Narration content will be generated here.'}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>

                                      {/* Chapter Actions */}
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                                        {editingChapter === index ? (
                                          <>
                                            {/* Save Button */}
                                            <IconButton
                                              size="small"
                                              onClick={() => handleSaveEdit(index)}
                                              sx={{
                                                color: '#4caf50',
                                                '&:hover': {
                                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                                  color: '#388e3c'
                                                },
                                                width: 36,
                                                height: 36,
                                              }}
                                              title="Save changes"
                                            >
                                              <CheckIcon fontSize="small" />
                                            </IconButton>

                                            {/* Cancel Button */}
                                            <IconButton
                                              size="small"
                                              onClick={handleCancelEdit}
                                              sx={{
                                                color: '#ff9800',
                                                '&:hover': {
                                                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                                                  color: '#f57c00'
                                                },
                                                width: 36,
                                                height: 36,
                                              }}
                                              title="Cancel editing"
                                            >
                                              <CloseIcon fontSize="small" />
                                            </IconButton>
                                          </>
                                        ) : (
                                          <>
                                            {/* Edit Chapter Button */}
                                            <IconButton
                                              className="chapter-actions"
                                              size="small"
                                              onClick={() => handleEditChapter(index)}
                                              sx={{
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                color: '#ff9800',
                                                '&:hover': {
                                                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                                                  color: '#f57c00'
                                                },
                                                width: 36,
                                                height: 36,
                                              }}
                                              title="Edit chapter"
                                            >
                                              <CreateIcon fontSize="small" />
                                            </IconButton>

                                            {/* Delete Icon */}
                                            <IconButton
                                              className="chapter-actions"
                                              size="small"
                                              onClick={() => handleDeleteChapter(index)}
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
                                              title="Delete chapter"
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>

                                            {/* Add Chapter After This One Button */}
                                            <IconButton
                                              className="chapter-actions"
                                              size="small"
                                              onClick={() => handleAddChapterAfter(index)}
                                              sx={{
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                color: '#1DA1F2',
                                                '&:hover': {
                                                  bgcolor: 'rgba(29, 161, 242, 0.1)',
                                                  color: '#0d8bd9'
                                                },
                                                width: 36,
                                                height: 36,
                                              }}
                                              title="Add chapter after this one"
                                            >
                                              <AddIcon fontSize="small" />
                                            </IconButton>
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  py: 8
                }}>
                  <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                    📚 Generated Chapters
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999', mb: 3, maxWidth: '300px' }}>
                    Your video chapters will appear here once you generate them using the form on the left.
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#ccc',
                    fontSize: '0.875rem'
                  }}>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Enter your hypothesis and click "Generate Chapters" to get started
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TrendingTopics;
