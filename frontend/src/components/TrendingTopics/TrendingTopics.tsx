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
import TrendingTopicsList from './TrendingTopicsList';
import TopicDetailsSection from './TopicDetailsSection';
import HypothesisSection from './HypothesisSection';
import VideoDurationSection from './VideoDurationSection';
import ChaptersSection from './ChaptersSection';
import HeaderSection from './HeaderSection';
import SelectedTopicHeader from './SelectedTopicHeader';
import ConfirmationDialog from './ConfirmationDialog';
import NarrationPickerDialog from './NarrationPickerDialog';


const TrendingTopics: React.FC = () => {
  // Utility function for smooth scrolling to sections
  const scrollToSection = (sectionName: string) => {

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
          // console.log(`Found ${sectionName} section with selector: ${selector}`);
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

  // Handler functions for the ChaptersSection component
  const handleGenerateImages = async () => {
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
  };

  const handleImageSelect = (imageUrl: string) => {
    setGeneratedImages([imageUrl]);
  };

  const handleImageDeselect = (imageUrl: string) => {
    setGeneratedImages(generatedImages.filter(img => img !== imageUrl));
  };

  const handleDownloadImage = (src: string, idx: number) => {
    HelperFunctions.downloadImage(src, idx);
  };

  const handleTriggerFileUpload = () => {
    HelperFunctions.triggerFileUpload();
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

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
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

  const handleStartEdit = (index: number, heading: string, narration: string) => {
    setEditingChapter(index);
    setEditHeading(heading);
    setEditNarration(narration);
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

  const wordClickHandler = useCallback(async (w: any) => {
    // find the topic which have same topic name
    const topic = trendingTopics.find(t => t.topic === w.text);

    if (topic) {
      await handleTopicSelect(topic);
    } else {
      console.log('No matching topic found for:', w.text);
    }
  }, [trendingTopics, handleTopicSelect]);

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
      <HeaderSection
        selectedRegion={selectedRegion}
        regions={regions}
        onRegionChange={handleRegionChange}
        onRefresh={handleRefresh}
        trendView={trendView}
        onTrendViewChange={setTrendView}
        loading={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {trendView === 'list' ? (
        <TrendingTopicsList
          trendingTopics={trendingTopics}
          selectedRegion={selectedRegion}
          regions={regions}
          onTopicSelect={handleTopicSelect}
          onExploreTopic={(topic) => {
            // Scroll to topic details section immediately
            scrollToSection('topic-details');
            // Then handle topic selection
            handleTopicSelect(topic);
          }}
        />
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
        <Box sx={{ mt: 2 }}>
          <SelectedTopicHeader selectedTopic={selectedTopic} />

          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>

            <TopicDetailsSection
              selectedTopic={selectedTopic}
              selectedTopicDetails={selectedTopicDetails}
              topicSuggestions={topicSuggestions}
              loadingTopicSuggestions={loadingTopicSuggestions}
              enhancingDetails={enhancingDetails}
              selectedRegion={selectedRegion}
              onGetTopicSuggestions={getTopicSuggestions}
              onTopicDetailsChange={setSelectedTopicDetails}
              onEnhanceTopicDetails={handleEnhanceTopicDetails}
            />

            <HypothesisSection
              selectedTopic={selectedTopic}
              selectedTopicDetails={selectedTopicDetails}
              hypothesis={hypothesis}
              hypothesisSuggestions={hypothesisSuggestions}
              loadingHypothesisSuggestions={loadingHypothesisSuggestions}
              enhancingHypothesis={enhancingHypothesis}
              selectedRegion={selectedRegion}
              onFetchHypothesisSuggestions={fetchHypothesisSuggestions}
              onHypothesisChange={setHypothesis}
              onEnhanceHypothesis={handleEnhanceHypothesis}
            />

            <VideoDurationSection
              duration={duration}
              onDurationChange={setDuration}
              durationOptions={durationOptions}
              generatingChapters={generatingChapters}
              onGenerateChapters={handleGenerateChapters}
              hypothesis={hypothesis}
            />

            {/* Video Chapters Section */}
            <ChaptersSection
              chapters={chapters}
              chaptersGenerated={chaptersGenerated}
              generatingChapters={generatingChapters}
              editingChapter={editingChapter}
              editHeading={editHeading}
              editNarration={editNarration}
              selectedChapterIndex={selectedChapterIndex}
              rightTabIndex={rightTabIndex}
              aiImagesEnabled={aiImagesEnabled}
              imagesLoading={imagesLoading}
              generatedImages={generatedImages}
              aiPrompt={aiPrompt}
              pickerOpen={pickerOpen}
              pickerChapterIndex={pickerChapterIndex}
              pickerNarrations={pickerNarrations}
              pickerLoading={pickerLoading}
              uploadedImages={uploadedImages}
              isDraggingUpload={isDraggingUpload}
              chapterImagesMap={chapterImagesMap}
              onGenerateChapters={handleGenerateChapters}
              onAddChapterAfter={handleAddChapterAfter}
              onDeleteChapter={handleDeleteChapter}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditHeadingChange={setEditHeading}
              onEditNarrationChange={setEditNarration}
              onStartEdit={handleStartEdit}
              onDragEnd={handleDragEnd}
              onSelectChapter={selectChapter}
              onRightTabChange={setRightTabIndex}
              onAIPromptChange={setAiPrompt}
              onUseAIChange={setAiImagesEnabled}
              onGenerateImages={handleGenerateImages}
              onImageSelect={handleImageSelect}
              onImageDeselect={handleImageDeselect}
              onDownloadImage={handleDownloadImage}
              onTriggerFileUpload={handleTriggerFileUpload}
              onUploadFiles={handleUploadFiles}
              onPickerOpen={setPickerOpen}
              onPickerChapterIndex={setPickerChapterIndex}
              onPickerLoading={setPickerLoading}
              onPickerNarrations={setPickerNarrations}
              onChapterImagesMapChange={setChapterImagesMap}
              onGeneratedImagesChange={setGeneratedImages}
              onRightTabIndexChange={setRightTabIndex}
            />

          </Box>
        </Box>
      )}

      {/* Confirmation Dialog */}
      {pendingField && (
        <ConfirmationDialog
          open={confirmOpen}
          onClose={handleConfirmReject}
          onAccept={handleConfirmAccept}
          onReject={handleConfirmReject}
          pendingField={pendingField}
          originalText={pendingField === 'topicDetails' ? selectedTopicDetails : hypothesis}
          enhancedText={pendingEnhancedText}
        />
      )}

      {/* Narration Variations Picker */}
      <NarrationPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pickerLoading={pickerLoading}
        pickerNarrations={pickerNarrations}
        chapters={chapters}
        pickerChapterIndex={pickerChapterIndex}
        editingChapter={editingChapter}
        onNarrationSelect={(chapterIndex, narration) => {
          if (chapterIndex === null) return;
          const updated = [...chapters];
          updated[chapterIndex] = { ...updated[chapterIndex], narration: narration } as any;
          setChapters(updated);
          if (editingChapter === chapterIndex) {
            setEditNarration(narration);
          }
          setPickerOpen(false);
        }}
        onEditNarrationChange={setEditNarration}
      />

    </Box>
  );
};




export default TrendingTopics;
