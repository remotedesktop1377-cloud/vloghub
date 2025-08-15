import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { mockTrendingTopics, TrendingTopic } from '../../data/mockTrendingTopics';
import { mockChapters, Chapter } from '../../data/mockChapters';
import { fallbackImages } from '../../data/mockImages';
import { regions, Region } from '../../data/mockRegions';
import { durationOptions, DurationOption } from '../../data/mockDurationOptions';
import { USE_HARDCODED, HARDCODED_TOPIC, HARDCODED_HYPOTHESIS, DEFAULT_AI_PROMPT } from '../../data/constants';
import { apiService } from '../../utils/apiService';
import { HelperFunctions } from '../../utils/helperFunctions';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
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
import { AutoFixHigh as MagicIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { WordCloudChart } from '../WordCloudChart/WordCloudChart';
import LoadingOverlay from '../LoadingOverlay';

const TrendingTopics: React.FC = () => {
  // Utility function for smooth scrolling to sections
  const scrollToSection = (sectionName: string, delay: number = 300) => {

    // Try multiple selectors to find the section
    const selectors = [
      `[data-section="${sectionName}"]`,
      `.MuiPaper-root[data-section="${sectionName}"]`,
    ];

    let targetElement = null;

    // First try the data-section selectors
    for (const selector of selectors) {
      try {
        targetElement = document.querySelector(selector);
        if (targetElement) {
          console.log(`Found ${sectionName} section with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} failed:`, e);
      }
    }

    // If not found, try finding by text content
    if (!targetElement) {
      const elements = document.querySelectorAll('h6, .MuiTypography-subtitle1');
      Array.from(elements).forEach(element => {
        const text = element.textContent || '';
        if (sectionName === 'topic-details' && text.includes('Your Topic')) {
          targetElement = element.closest('.MuiPaper-root');
        } else if (sectionName === 'hypothesis' && text.includes('Your Hypothesis')) {
          targetElement = element.closest('.MuiPaper-root');
        }
      });
    }

    if (targetElement) {
      // Ensure the element is visible and scrollable
      if (targetElement.scrollIntoView) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      } else {
        // Fallback for older browsers
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({
          top: scrollTop + rect.top - 100,
          behavior: 'smooth'
        });
      }
    } else {
      // Fallback: scroll to the general area where these sections should be
      const mainContent = document.querySelector('main') ||
        document.querySelector('.MuiBox-root') ||
        document.querySelector('body');
      if (mainContent && mainContent.scrollIntoView) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Last resort: scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('pakistan');

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

  // Suggestions/Enhance states
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [loadingTopicSuggestions, setLoadingTopicSuggestions] = useState(false);
  const [enhancingDetails, setEnhancingDetails] = useState(false);
  const [hypothesisSuggestions, setHypothesisSuggestions] = useState<string[]>([]);
  const [loadingHypothesisSuggestions, setLoadingHypothesisSuggestions] = useState(false);
  const [enhancingHypothesis, setEnhancingHypothesis] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEnhancedText, setPendingEnhancedText] = useState('');
  const [pendingField, setPendingField] = useState<null | 'topicDetails' | 'hypothesis'>(null);

  // Right panel state (tabs and generated images)
  const [rightTabIndex, setRightTabIndex] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [chapterImagesMap, setChapterImagesMap] = useState<Record<number, string[]>>({});
  const [aiImagesEnabled, setAiImagesEnabled] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [pickerChapterIndex, setPickerChapterIndex] = useState<number | null>(null);
  const [pickerNarrations, setPickerNarrations] = useState<string[]>([]);
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>(DEFAULT_AI_PROMPT);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDraggingUpload, setIsDraggingUpload] = useState<boolean>(false);
  const [trendView, setTrendView] = useState<'cloud' | 'list'>('cloud');

  const handleUploadFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imgs: string[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      imgs.push(url);
    });
    if (imgs.length === 0) return;
    setUploadedImages((prev) => [...imgs, ...prev]);
    // Mirror AI Generation flow: send to Stock Media single view with the first image
    const first = imgs[0];
    setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [first, ...(prev[selectedChapterIndex] || [])] }));
    setGeneratedImages([first]);
    setAiImagesEnabled(true);
    setRightTabIndex(0);
  };

  const selectChapter = (idx: number) => {
    setSelectedChapterIndex(idx);
    if (aiImagesEnabled) {
      const imgs = chapterImagesMap[idx] || [];
      const fallback = [fallbackImages[idx % fallbackImages.length]];
      setGeneratedImages(imgs.length > 0 ? [imgs[0]] : fallback);
    } else {
      setGeneratedImages(fallbackImages);
    }
  };



  // Mock trending topics imported from separate data file



  const fetchTrendingTopics = async (region: string) => {
    if (USE_HARDCODED) {
      setTrendingTopics(mockTrendingTopics);
      setLoading(false);
      return; // skip API in hardcoded mode
    }
    try {
      setLoading(true);
      setError(null);

      const result = await apiService.getTrendingTopics(region);

      if (result.success && result.data) {
        setTrendingTopics(result.data.data || []);
      } else {
        console.warn('Trending API not ok, using mock data. Error:', result.error);
        setTrendingTopics(mockTrendingTopics);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching trending topics, using mock data:', err);
      setTrendingTopics(mockTrendingTopics);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTopics(selectedRegion);
  }, [selectedRegion]);

  // Initialize hardcoded topic/hypothesis if flag enabled
  useEffect(() => {
    if (USE_HARDCODED) {
      setSelectedTopic({ id: 'hardcoded', ranking: 0, category: 'Hardcoded', topic: HARDCODED_TOPIC, postCount: '', postCountValue: null, timestamp: new Date().toISOString() });
      setSelectedTopicDetails(HARDCODED_TOPIC);
      setHypothesis(HARDCODED_HYPOTHESIS);
      setTrendingTopics(mockTrendingTopics);
      // Provide mock chapters so we don't call the backend
      setChapters(mockChapters);
      setChaptersGenerated(true);
      // Default view: chapter 1 selected, multiple images (dummy grid)
      setSelectedChapterIndex(0);
      setGeneratedImages(fallbackImages);
      setLoading(false);
    }
  }, []);

  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(event.target.value);
  };

  const handleRefresh = () => {
    fetchTrendingTopics(selectedRegion);
  };





  const getTopicSuggestions = async (topicName: string, applyToDetails: boolean = false) => {
    if (!topicName.trim()) return;

    try {
      // While topic suggestions load, clear hypothesis suggestions and avoid showing loaders there
      setHypothesisSuggestions([]);
      setLoadingTopicSuggestions(true);
      setError(null);
      // Auto-scroll to topic details section after fallback suggestions
      scrollToSection('topic-details');

      const result = await apiService.getTopicSuggestions({
        topic: topicName,
        region: selectedRegion
      });

      if (result.success && result.data) {
        const suggestions = Array.isArray(result.data)
          ? result.data
          : (Array.isArray(result.data?.suggestions) ? result.data.suggestions : []);
        setTopicSuggestions(suggestions || []);
        if (applyToDetails && suggestions && suggestions.length > 0) {
          setSelectedTopicDetails(suggestions[0]);
        }

      } else {
        console.error('Failed to fetch topic suggestions:', result.error);
        // Fallback to default suggestions
        const fallback = HelperFunctions.generateFallbackTopicSuggestions(topicName, selectedRegion);
        setTopicSuggestions(fallback);
        if (applyToDetails) setSelectedTopicDetails(fallback[0]);
       
      }
    } catch (err) {
      console.error('Error fetching topic suggestions:', err);
      // Fallback to default suggestions
      const fallback = HelperFunctions.generateFallbackTopicSuggestions(topicName, selectedRegion);
      setTopicSuggestions(fallback);
      if (applyToDetails) setSelectedTopicDetails(fallback[0]);

    } finally {
      setLoadingTopicSuggestions(false);
    }
  };

  const fetchHypothesisSuggestions = async () => {
    if (USE_HARDCODED) return;
    if (!selectedTopic) return;
    if (!selectedTopicDetails || !selectedTopicDetails.trim()) return;
    if (loadingTopicSuggestions) return;
    try {
      // Auto-scroll to hypothesis section after suggestions are loaded
      scrollToSection('hypothesis');
      setLoadingHypothesisSuggestions(true);
      const result = await apiService.getHypothesisSuggestions({
        topic: selectedTopic.topic,
        details: selectedTopicDetails,
        region: selectedRegion,
        num: 5
      });

      if (result.success && result.data) {
        setHypothesisSuggestions(Array.isArray(result.data?.suggestions) ? result.data.suggestions :
          HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic.topic, selectedRegion)
        );
      } else {
        setHypothesisSuggestions(
          HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic.topic, selectedRegion)
        );
      }
    } catch (e) {
      console.error('Failed to fetch hypothesis suggestions', e);
      setHypothesisSuggestions(
        HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic.topic, selectedRegion)
      );
    } finally {
      setLoadingHypothesisSuggestions(false);
    }
  };

  useEffect(() => {
    // Only fetch when topic is selected and details are present, and not while topic suggestions are loading
    if (!USE_HARDCODED && selectedTopic && selectedTopicDetails.trim().length > 0 && !loadingTopicSuggestions) {
      fetchHypothesisSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopicDetails, selectedTopic, selectedRegion]);

  const handleEnhanceTopicDetails = async () => {
    if (USE_HARDCODED) return;
    if (!selectedTopic || !selectedTopicDetails.trim()) return;
    try {
      setEnhancingDetails(true);
      const result = await apiService.enhanceTopicDetails({
        topic: selectedTopic.topic,
        details: selectedTopicDetails,
        region: selectedRegion,
        targetWords: 160,
      });

      if (result.success && result.data?.enhancedText) {
        setPendingField('topicDetails');
        setPendingEnhancedText(result.data.enhancedText);
        setConfirmOpen(true);
      } else {
        console.error('Failed to enhance details', result.error);
      }
    } catch (e) {
      console.error('Error enhancing details', e);
    } finally {
      setEnhancingDetails(false);
    }
  };

  const handleEnhanceHypothesis = async () => {
    if (!selectedTopic || !hypothesis.trim()) return;
    try {
      setEnhancingHypothesis(true);
      const result = await apiService.enhanceHypothesis({
        topic: selectedTopic.topic,
        hypothesis,
        details: selectedTopicDetails,
        region: selectedRegion
      });

      if (result.success && result.data?.enhancedText) {
        setPendingField('hypothesis');
        setPendingEnhancedText(result.data.enhancedText);
        setConfirmOpen(true);
      }
    } catch (e) {
      console.error('Failed to enhance hypothesis', e);
    } finally {
      setEnhancingHypothesis(false);
    }
  };

  const handleConfirmAccept = () => {
    if (pendingField === 'topicDetails') {
      setSelectedTopicDetails(pendingEnhancedText);
    } else if (pendingField === 'hypothesis') {
      setHypothesis(pendingEnhancedText);
    }
    setConfirmOpen(false);
    setPendingEnhancedText('');
    setPendingField(null);
  };

  const handleConfirmReject = () => {
    setConfirmOpen(false);
    setPendingEnhancedText('');
    setPendingField(null);
  };

  const handleTopicSelect = async (topic: TrendingTopic) => {
    setSelectedTopic(topic);
    setHypothesis('');
    setChapters([]);
    setChaptersGenerated(false);
    setEditingChapter(null);
    setTopicSuggestions([]); // Reset suggestions
    setSelectedTopicDetails(''); // Clear topic details to refresh
    // Fetch new topic suggestions without auto-filling topic details
    await getTopicSuggestions(topic.topic);
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

      const result = await apiService.generateChapters({
        topic: selectedTopic.topic,
        hypothesis,
        details: selectedTopicDetails,
        region: selectedRegion,
        duration: duration
      });

      if (result.success && result.data?.chapters && Array.isArray(result.data.chapters)) {
        setChapters(result.data.chapters);
        setChaptersGenerated(true);
        setError(null);
      } else {
        setError(result.error || 'Invalid response format from API');
      }
    } catch (err) {
      console.error('Error generating chapters:', err);
      setError('Failed to generate chapters. Please try again.');
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleAddChapterAfter = (index: number) => {
    HelperFunctions.addChapterAfter(index, chapters, setChapters);
  };

  const handleDeleteChapter = (index: number) => {
    HelperFunctions.deleteChapter(index, chapters, setChapters);
  };

  const handleEditChapter = (index: number) => {
    setEditingChapter(index);
    setEditHeading(chapters[index].heading || '');
    setEditNarration(chapters[index].narration || '');
  };

  const handleSaveEdit = (index: number) => {
    HelperFunctions.saveEdit(index, chapters, setChapters, editHeading, editNarration, setEditingChapter);
    setEditHeading('');
    setEditNarration('');
  };

  const handleCancelEdit = () => {
    HelperFunctions.cancelEdit(setEditingChapter, setEditHeading, setEditNarration);
  };

  const handleDragEnd = (result: DropResult) => {
    HelperFunctions.handleDragEnd(result, chapters, setChapters);
  };

  const wordClickHandler = useCallback((w: any) => {
    HelperFunctions.handleWordClick(w, trendingTopics, handleTopicSelect);
  }, [trendingTopics]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Loading Overlay for AI Operations */}
      <LoadingOverlay
        generatingChapters={generatingChapters}
        enhancingDetails={enhancingDetails}
        enhancingHypothesis={enhancingHypothesis}
        imagesLoading={imagesLoading}
        pickerLoading={pickerLoading}
      />

      {/* Header with Region Selection and Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingIcon sx={{ fontSize: 16, color: '#1DA1F2', mr: 1 }} />
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
            Trending Topics
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
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

          <ToggleButtonGroup size="small" value={trendView} exclusive onChange={(_, v) => v && setTrendView(v)}>
            <ToggleButton value="cloud">Word Cloud</ToggleButton>
            <ToggleButton value="list">List</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {trendView === 'list' ? (
        <Grid container spacing={1.5}>
          {trendingTopics.map((topic, index) => {

            return (
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
                  onClick={() => handleTopicSelect(topic)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: HelperFunctions.getTrendingColor(index),
                          mr: 1,
                          // fontWeight: 'bold',
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
                              // fontWeight: 'bold',
                              fontSize: '0.5rem',
                              height: 16
                            }}
                          />
                          {topic.postCount ? (
                            <Chip
                              // icon={<TwitterIcon sx={{ fontSize: '0.6rem' }} />}
                              label={topic.postCount}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#1DA1F2', color: '#1DA1F2', fontSize: '0.5rem', height: 16 }}
                            />
                          ) : (
                            <Chip
                              // icon={<TwitterIcon sx={{ fontSize: '0.6rem' }} />}
                              label={topic.postCountValue ? HelperFunctions.formatTweetVolume(topic.postCountValue) : '0'}
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
                      onClick={() => {
                        // Scroll to topic details section immediately
                        scrollToSection('topic-details');
                        // Then handle topic selection
                        handleTopicSelect(topic);
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
            );
          })}
        </Grid>
      ) : (
        <Paper sx={{ p: 2, mb: 2 }}>
          {trendingTopics.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No trends to display.</Typography>
          ) : (
            <Box sx={{ display: 'flex', width: '100%', minHeight: 330 }}>
              {/* Left Column - 50% width */}
              <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                {/* Left Label */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '1rem', }}>
                    Gemini Topics
                  </Typography>
                </Box>
                {/* Left Word Cloud */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  margin: 1,
                  padding: 1
                }}>
                  <WordCloudChart
                    width={330}
                    height={230}
                    data={trendingTopics
                      .filter(topic => topic.postCountValue && topic.postCountValue > 0)
                      // .slice(0, 30)
                      .map(topic => ({
                        text: topic.topic,
                        value: topic.postCountValue || 1
                      }))}
                    handleWordClick={wordClickHandler}
                  />
                </Box>
              </Box>



              {/* Right Column - 50% width */}
              <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                {/* Right Label */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '1rem', }}>
                    Twitter Topics
                  </Typography>
                </Box>
                {/* Right Word Cloud */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  margin: 1,
                  padding: 1
                }}>
                  <WordCloudChart
                    width={330}
                    height={230}
                    data={trendingTopics
                      .filter(topic => topic.postCountValue && topic.postCountValue > 0)
                      // .slice(0, 30)
                      .map(topic => ({
                        text: topic.topic,
                        value: topic.postCountValue || 1
                      }))}
                    handleWordClick={wordClickHandler}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {trendingTopics.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
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
                <Typography variant="h5" gutterBottom sx={{ wordBreak: 'break-word', fontSize: '1.2rem' }}>
                  {selectedTopic.topic}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    icon={<TwitterIcon />}
                    label={`${selectedTopic.postCountValue ? HelperFunctions.formatTweetVolume(selectedTopic.postCountValue) : '0'} posts`}
                    size="medium"
                    variant="outlined"
                    sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
                  />

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
            <Paper sx={{ p: 2, mb: 3 }} data-section="topic-details">
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.8rem' }}>
                Your Topic
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Describe your topic, This will help generate relevant video content.
              </Typography>

              {/* Topic Suggestions */}
              <Box sx={{ mb: 3, opacity: USE_HARDCODED ? 0.6 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    💡 Suggested topics for "{selectedTopic.topic}":
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => getTopicSuggestions(selectedTopic.topic)}
                    disabled={USE_HARDCODED || loadingTopicSuggestions}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    🔄
                  </Button>

                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {USE_HARDCODED ? (
                    // Show hardcoded suggestions in hardcoded mode
                    HelperFunctions.generateFallbackTopicSuggestions(selectedTopic.topic, selectedRegion).map((suggestion: string, index: number) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedTopicDetails(suggestion);
                          // Don't automatically scroll to hypothesis - let user stay in topic section
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(29, 161, 242, 0.1)',
                            borderColor: '#1DA1F2',
                          }
                        }}
                      />
                    ))
                  ) : loadingTopicSuggestions ? (
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
                        onClick={() => {
                          setSelectedTopicDetails(suggestion);
                          // Don't automatically scroll to hypothesis - let user stay in topic section
                        }}
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
                  disabled={USE_HARDCODED || enhancingDetails || !selectedTopicDetails.trim()}
                  sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
                >
                  {enhancingDetails ? 'Enhancing...' : '✨ Enhance'}
                </Button>
              </Box>
            </Paper>

            {/* Hypothesis Input */}
            <Paper sx={{ p: 2, mb: 3, opacity: selectedTopic ? 1 : 0.6 }} data-section="hypothesis">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.8rem' }}>
                  Your Hypothesis
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
              </Typography>

              {/* Hypothesis Suggestions */}
              <Box sx={{ mb: 3, opacity: USE_HARDCODED ? 0.6 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    💡 Suggested hypotheses for "{selectedTopicDetails ? selectedTopicDetails : selectedTopic?.topic}":
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchHypothesisSuggestions}
                    disabled={USE_HARDCODED || !selectedTopic || loadingHypothesisSuggestions}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    🔄
                  </Button>

                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {USE_HARDCODED ? (
                    // Show hardcoded hypothesis suggestions in hardcoded mode
                    HelperFunctions.generateFallbackHypothesisSuggestions(selectedTopic?.topic || '', selectedRegion).map((suggestion: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={suggestion}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setHypothesis(suggestion);
                          // Don't automatically scroll anywhere - let user stay where they are
                        }}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(29, 161, 242, 0.1)', borderColor: '#1DA1F2' } }}
                      />
                    ))
                  ) : (!selectedTopic || !selectedTopicDetails.trim() || loadingTopicSuggestions) ? (
                    null
                  ) : loadingHypothesisSuggestions ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Generating hypothesis suggestions...
                      </Typography>
                    </Box>
                  ) : (
                    (hypothesisSuggestions || []).map((suggestion: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={suggestion}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setHypothesis(suggestion);
                          // Don't automatically scroll anywhere - let user stay where they are
                        }}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(29, 161, 242, 0.1)', borderColor: '#1DA1F2' } }}
                      />
                    ))
                  )}
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Enter your hypothesis, research question, or unique angle on this topic..."
                value={hypothesis}
                disabled={!selectedTopic}
                onChange={(e) => setHypothesis(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEnhanceHypothesis}
                  disabled={USE_HARDCODED || !selectedTopic || !hypothesis.trim() || enhancingHypothesis}
                  sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
                >
                  {enhancingHypothesis ? 'Enhancing...' : '✨ Enhance'}
                </Button>
              </Box>
            </Paper>

            {/* Video Duration */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.8rem' }}>
                Video Duration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the desired length for your generated video content.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
                    <Box sx={{ width: '100%' }}>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="chapters">
                          {(provided) => (
                            <Box
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, alignItems: 'flex-start' }}
                            >
                              {chapters.map((chapter, index) => (
                                <Box key={chapter.id || index.toString()} sx={{ width: 'fit-content' }}>
                                  <Draggable key={(chapter.id || index.toString()) + '-draggable'} draggableId={chapter.id || index.toString()} index={index}>
                                    {(provided, snapshot) => (
                                      <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        variant="elevation"
                                        sx={{
                                          borderRadius: 2,
                                          transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                          boxShadow: snapshot.isDragging ? 8 : 0,
                                          '&:hover': { boxShadow: 0 }
                                        }}
                                      >
                                        <CardContent sx={{ p: 0, height: 'auto', '&:last-child': { paddingBottom: 0 } }}>
                                          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', bgcolor: selectedChapterIndex === index ? 'rgba(29,161,242,0.06)' : 'transparent' }} onClick={() => selectChapter(index)}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                                  '&:active': { cursor: 'grabbing' }
                                                }}
                                              >
                                                <DragIcon fontSize="small" />
                                              </Box>

                                              {/* Narration Content - centered with integrated left strip number */}
                                              <Box sx={{ width: '100%', maxWidth: 760, mx: 0 }}>
                                                <Box sx={{
                                                  display: 'flex',
                                                  alignItems: 'stretch',
                                                  borderWidth: 1,
                                                  borderStyle: 'solid',
                                                  borderColor: selectedChapterIndex === index ? '#1DA1F2' : '#e9ecef',
                                                  borderRadius: 1,
                                                  overflow: 'hidden',
                                                  bgcolor: '#fff',
                                                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                                                  '&:hover': {
                                                    borderColor: '#1DA1F2',
                                                    boxShadow: '0 0 0 3px rgba(29, 161, 242, 0.08)',
                                                    backgroundColor: 'rgba(29, 161, 242, 0.02)'
                                                  }
                                                }}>
                                                  <Box sx={{
                                                    width: 48,
                                                    bgcolor: 'rgba(29,161,242,0.08)',
                                                    color: '#1DA1F2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0
                                                  }}>
                                                    {index + 1}
                                                  </Box>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    {editingChapter === index ? (
                                                      <TextField
                                                        value={editNarration}
                                                        onChange={(e) => setEditNarration(e.target.value)}
                                                        variant="standard"
                                                        InputProps={{ disableUnderline: true }}
                                                        multiline
                                                        minRows={4}
                                                        fullWidth
                                                        sx={{ px: 1.5, py: 1.5 }}
                                                      />
                                                    ) : (
                                                      <Box sx={{
                                                        p: 1.5,
                                                        maxHeight: '200px',
                                                        overflow: 'auto',
                                                        bgcolor: '#fff'
                                                      }}>
                                                        <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#495057' }}>
                                                          {chapter.narration || 'Narration content will be generated here.'}
                                                        </Typography>
                                                      </Box>
                                                    )}
                                                  </Box>
                                                </Box>
                                              </Box>

                                              {/* Chapter Actions */}
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2, alignSelf: 'center' }}>
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
                                                    {/* Magic variations for this chapter */}
                                                    <IconButton
                                                      className="chapter-actions"
                                                      size="small"
                                                      onClick={async () => {
                                                        try {
                                                          setPickerOpen(true);
                                                          setPickerChapterIndex(index);
                                                          setPickerLoading(true);
                                                          const chapter = chapters[index];
                                                          const res = await fetch('/api/get-narration-variations', {
                                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                              narration: chapter.narration,
                                                              noOfNarrations: 5
                                                            })
                                                          });
                                                          const data = await res.json();
                                                          const vars: string[] = Array.isArray(data?.variations) ? data.variations : [];
                                                          setPickerNarrations(vars);
                                                        } catch (e) {
                                                          console.error('picker fetch failed', e);
                                                          setPickerNarrations([chapters[index].narration]);
                                                        } finally {
                                                          setPickerLoading(false);
                                                        }
                                                      }}
                                                      sx={{
                                                        opacity: selectedChapterIndex === index ? 1 : 0,
                                                        transition: 'opacity 0.2s ease',
                                                        color: '#1DA1F2',
                                                        '&:hover': { bgcolor: 'rgba(29,161,242,0.1)', color: '#0d8bd9' },
                                                        width: 36, height: 36,
                                                      }}
                                                      title="Magic variations"
                                                    >
                                                      <MagicIcon fontSize="small" />
                                                    </IconButton>
                                                    {/* Edit Chapter Button */}
                                                    <IconButton
                                                      className="chapter-actions"
                                                      size="small"
                                                      onClick={() => handleEditChapter(index)}
                                                      sx={{
                                                        opacity: selectedChapterIndex === index ? 1 : 0,
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
                                                        opacity: selectedChapterIndex === index ? 1 : 0,
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
                                                        opacity: selectedChapterIndex === index ? 1 : 0,
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
                                  {/* divider removed as requested */}
                                </Box>
                              ))}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
                    <Paper sx={{ p: 0, overflow: 'hidden' }}>
                      <Tabs value={rightTabIndex} onChange={(_, v) => setRightTabIndex(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                        <Tab label="Stock Media" />
                        <Tab label="AI Generation" />
                        <Tab label="Upload Media" />
                      </Tabs>
                      {rightTabIndex === 0 && (
                        <>
                          <Box sx={{ p: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption">AI (Single Image)</Typography>
                              <Switch size="small" checked={aiImagesEnabled} onChange={(e) => {
                                const enabled = e.target.checked;
                                setAiImagesEnabled(enabled);
                                // Update current panel instantly
                                if (!enabled) {
                                  setGeneratedImages([fallbackImages[selectedChapterIndex % fallbackImages.length]]);
                                } else {
                                  const imgs = chapterImagesMap[selectedChapterIndex] || [];
                                  setGeneratedImages(imgs.length ? [imgs[0]] : [fallbackImages[selectedChapterIndex % fallbackImages.length]]);
                                }
                              }} />
                            </Box>
                            {!aiImagesEnabled ? null : (
                              <Button
                                startIcon={<MagicIcon />}
                                variant="contained"
                                size="small"
                                disabled={imagesLoading || chapters.length === 0}
                                onClick={async () => {
                                  try {
                                    setImagesLoading(true);
                                    const currentIdx = selectedChapterIndex;
                                    const visuals = `${currentIdx + 1}. ${chapters[currentIdx]?.visuals || ''}`;
                                    const res = await fetch('/api/generate-images', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ visuals })
                                    });
                                    const data = await res.json();
                                    const newImgsAll: string[] = Array.isArray(data?.images) && data.images.length > 0 ? data.images : fallbackImages;
                                    const newImgs = [newImgsAll[0]];
                                    setChapterImagesMap(prev => {
                                      const existing = prev[currentIdx] || [];
                                      const merged = [...newImgs, ...existing];
                                      return { ...prev, [currentIdx]: merged };
                                    });
                                    setGeneratedImages(prev => {
                                      const merged = [...newImgs, ...prev];
                                      return merged;
                                    });
                                  } catch (e) {
                                    console.error('Failed to fetch images', e);
                                    const newImgs = [fallbackImages[selectedChapterIndex % fallbackImages.length]];
                                    setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [...newImgs, ...(prev[selectedChapterIndex] || [])] }));
                                    setGeneratedImages(prev => [...newImgs, ...prev]);
                                  } finally {
                                    setImagesLoading(false);
                                  }
                                }}
                              >
                                {imagesLoading ? 'Fetching...' : 'Magic'}
                              </Button>)}
                          </Box>
                          <Box sx={{ p: 1.5 }}>
                            {aiImagesEnabled ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                {(generatedImages.length ? generatedImages.slice(0, 1) : ((chapterImagesMap[selectedChapterIndex] || []).slice(0, 1).length ? (chapterImagesMap[selectedChapterIndex] || []).slice(0, 1) : [fallbackImages[selectedChapterIndex % fallbackImages.length]])).map((src, idx) => (
                                  <Box key={idx} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', width: '100%', maxWidth: 320, aspectRatio: '1 / 1' }}>
                                    <Box component="img" src={src} alt={`generated-${idx}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    <IconButton
                                      sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' }, opacity: 0, transition: 'opacity 0.2s ease', '.MuiBox-root:hover &': { opacity: 1 } }}
                                      onClick={() => HelperFunctions.downloadImage(src, idx)}
                                      title="Download"
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M20 21H4a2 2 0 01-2-2v0a2 2 0 012-2h16a2 2 0 012 2v0a2 2 0 01-2 2z" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </IconButton>
                                  </Box>
                                ))}
                                {!imagesLoading && generatedImages.length === 0 && (!chapterImagesMap[selectedChapterIndex] || chapterImagesMap[selectedChapterIndex].length === 0) && (
                                  <Typography variant="body2" color="text.secondary">
                                    Generate images from the script to see results here.
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 160px)', justifyContent: 'center', gap: 1.5 }}>
                                {[...uploadedImages, ...fallbackImages].map((src, idx) => (
                                  <Box key={idx} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', width: 160, aspectRatio: '1 / 1' }}>
                                    <Box component="img" src={src} alt={`dummy-${idx}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </>
                      )}
                      {rightTabIndex === 1 && (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

                          <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Box sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 2,
                              mx: 'auto',
                              mb: 2,
                              background: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <svg width="42" height="42" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M8 5h8a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3V8a3 3 0 013-3zm3 3v8l6-4-6-4z" /></svg>
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>What do you want to create?</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Type in what you'd like to generate and add it to your scene.
                            </Typography>
                          </Box>

                          <TextField
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            multiline
                            minRows={3}
                            placeholder="Describe what you want to generate..."
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                          />

                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant="text" fullWidth sx={{ flex: 1 }} onClick={() => setAiPrompt('')}>Cancel</Button>
                            <Button
                              fullWidth
                              sx={{ flex: 1 }}
                              variant="contained"
                              onClick={async () => {
                                try {
                                  setImagesLoading(true);
                                  const visuals = aiPrompt;
                                  const res = await fetch('/api/generate-images', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visuals })
                                  });
                                  const data = await res.json();
                                  const imgs: string[] = Array.isArray(data?.images) && data.images.length > 0 ? data.images : [fallbackImages[selectedChapterIndex % fallbackImages.length]];
                                  const first = imgs[0];
                                  setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [first, ...(prev[selectedChapterIndex] || [])] }));
                                  setGeneratedImages([first]);
                                  setAiImagesEnabled(true);
                                  setRightTabIndex(0);
                                } catch (e) {
                                  console.error('AI generate failed', e);
                                  const first = fallbackImages[selectedChapterIndex % fallbackImages.length];
                                  setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [first, ...(prev[selectedChapterIndex] || [])] }));
                                  setGeneratedImages([first]);
                                  setRightTabIndex(0);
                                } finally { setImagesLoading(false); }
                              }}
                              disabled={imagesLoading || !aiPrompt.trim()}
                            >
                              {imagesLoading ? 'Generating...' : 'Generate'}
                            </Button>
                          </Box>
                        </Box>
                      )}
                      {rightTabIndex === 2 && (
                        <Box sx={{ p: 2 }}>
                          <Box
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingUpload(true); }}
                            onDragLeave={() => setIsDraggingUpload(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDraggingUpload(false); handleUploadFiles(e.dataTransfer.files); }}
                            onClick={() => HelperFunctions.triggerFileUpload()}
                            sx={{
                              border: '2px dashed #cbd5e1',
                              borderColor: isDraggingUpload ? '#5b76ff' : '#cbd5e1',
                              borderRadius: 2,
                              height: 360,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: isDraggingUpload ? 'rgba(91,118,255,0.04)' : 'transparent'
                            }}
                          >
                            <Box>
                              <Box sx={{
                                width: 88,
                                height: 88,
                                borderRadius: '50%',
                                mx: 'auto',
                                mb: 2,
                                background: 'linear-gradient(135deg, #5b76ff, #9b8cff)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M12 16V8m0 0l-3 3m3-3l3 3M7 20h10a4 4 0 004-4 4 4 0 00-4-4h-.26A8 8 0 104 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.8rem' }}>Upload Asset</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Click to browse or drag & drop your file here
                              </Typography>
                            </Box>
                          </Box>
                          <input id="upload-input" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleUploadFiles(e.target.files)} />
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
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
                  <Typography variant="subtitle1" sx={{ color: '#666', mb: 2, fontSize: '0.8rem' }}>
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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleConfirmReject}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirm Enhance</DialogTitle>
        <DialogContent>
          <Typography id="confirm-dialog-description">
            The enhanced text is ready. Would you like to accept the changes?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Original: "{pendingField === 'topicDetails' ? selectedTopicDetails : hypothesis}"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enhanced: "{pendingEnhancedText}"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmReject} color="primary">
            Reject
          </Button>
          <Button onClick={handleConfirmAccept} color="primary" variant="contained">
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      {/* Narration Variations Picker */}
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select a narration</DialogTitle>
        <DialogContent>
          {pickerLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(pickerNarrations.length ? pickerNarrations : [chapters[pickerChapterIndex ?? 0]?.narration]).map((text, idx) => (
                <Box key={idx} sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, cursor: 'pointer', '&:hover': { borderColor: '#1DA1F2', backgroundColor: 'rgba(29,161,242,0.02)' } }}
                  onClick={() => {
                    if (pickerChapterIndex === null) return;
                    const updated = [...chapters];
                    updated[pickerChapterIndex] = { ...updated[pickerChapterIndex], narration: text } as any;
                    setChapters(updated);
                    if (editingChapter === pickerChapterIndex) {
                      setEditNarration(text);
                    }
                    setPickerOpen(false);
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrendingTopics;
