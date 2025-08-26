import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { mockTrendingTopics, TrendingTopic } from '../../data/mockTrendingTopics';


import { regions, Region } from '../../data/mockRegions';
import { durationOptions, DurationOption } from '../../data/mockDurationOptions';
import { languageOptions, LanguageOption } from '../../data/mockLanguageOptions';
import { getDirectionSx } from '../../utils/languageUtils';
import { USE_HARDCODED, HARDCODED_TOPIC, HARDCODED_HYPOTHESIS, DEFAULT_AI_PROMPT } from '../../data/constants';
import { apiService } from '../../utils/apiService';
import { HelperFunctions } from '../../utils/helperFunctions';
import { useTrendingTopicsCache } from '../../hooks/useTrendingTopicsCache';

import styles from './TrendingTopics.module.css';
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
  useTheme,
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
  Cached as CachedIcon,
} from '@mui/icons-material';
import { AutoFixHigh as MagicIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { WordCloudChart } from '../WordCloudChart/WordCloudChart';
import LoadingOverlay from '../LoadingOverlay';
import TrendingTopicsList from './TrendingTopicsList';
import TopicDetailsSection from './TopicDetailsSection';
import HypothesisSection from './HypothesisSection';
import VideoDurationSection from './VideoDurationSection';

import ScriptApprovalDialog from './ScriptApprovalDialog';
import HeaderSection from './HeaderSection';

import ConfirmationDialog from './ConfirmationDialog';

const TrendingTopics: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('pakistan');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Topic Details State
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [selectedTopicDetails, setSelectedTopicDetails] = useState<string>('');
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('5');
  const [language, setLanguage] = useState('english');
  const [generatingChapters, setGeneratingChapters] = useState(false);

  // Suggestions/Enhance states
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [selectedTopicSuggestions, setSelectedTopicSuggestions] = useState<string[]>([]);
  const [loadingTopicSuggestions, setLoadingTopicSuggestions] = useState(false);
  const [enhancingDetails, setEnhancingDetails] = useState(false);
  const [hypothesisSuggestions, setHypothesisSuggestions] = useState<string[]>([]);
  const [selectedHypothesisSuggestions, setSelectedHypothesisSuggestions] = useState<string[]>([]);
  const [loadingHypothesisSuggestions, setLoadingHypothesisSuggestions] = useState(false);
  const [enhancingHypothesis, setEnhancingHypothesis] = useState(false);

  // Script generation states
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [editedScript, setEditedScript] = useState<string>('');

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEnhancedOptions, setPendingEnhancedOptions] = useState<string[]>([]);
  const [pendingField, setPendingField] = useState<null | 'topicDetails' | 'hypothesis'>(null);
  const [originalSuggestionText, setOriginalSuggestionText] = useState<string | null>(null);

  const [trendView, setTrendView] = useState<'cloud' | 'grid'>('grid');

  // Cache management functions
  const { getCachedData, setCachedData } = useTrendingTopicsCache();

  // Function to clear cache for current region
  const clearCurrentRegionCache = () => {
    try {
      const cacheKey = `trending_topics_${selectedRegion}`;
      localStorage.removeItem(cacheKey);
      toast.success('Cache cleared for current region');
    } catch (error) {
      console.warn('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const fetchTrendingTopics = async (region: string, forceRefresh: boolean = false) => {
    if (USE_HARDCODED) {
      setTrendingTopics(mockTrendingTopics);
      setLoading(false);
      setLastUpdated(new Date().toISOString());
      return; // skip API in hardcoded mode
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData<TrendingTopic[]>(region);
      if (cachedData) {
        setTrendingTopics(cachedData);
        setLoading(false);
        // Try to get timestamp from cache
        try {
          const cacheKey = `trending_topics_${region}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            setLastUpdated(timestamp);
          }
        } catch (error) {
          console.warn('Error reading timestamp from cache:', error);
        }
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch from Gemini API only
      const geminiResult = await apiService.getGeminiTrendingTopics(region);

      // Handle Gemini results
      if (geminiResult.success && geminiResult.data) {
        const geminiData = geminiResult.data.data || [];
        // console.log('🟢 Gemini API Response Data:', geminiData);
        // console.log('🟢 Gemini Topics with Values:', geminiData.map((t: any) => ({
        //   topic: t.topic,
        //   value: t.value
        // })));
        // Sort by value (higher = first)
        const sortedGeminiData = geminiData.sort((a: any, b: any) => b.value - a.value);
        setTrendingTopics(sortedGeminiData);

        // Cache the fresh data
        setCachedData(region, sortedGeminiData);
        setLastUpdated(new Date().toISOString());

        if (forceRefresh) {
          toast.success('Trending topics refreshed successfully!');
        }
      } else {
        console.warn('Gemini API not ok, using mock data. Error:', geminiResult.error);
        setTrendingTopics(mockTrendingTopics);
        setLastUpdated(new Date().toISOString());
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching trending topics, using mock data:', err);
      setTrendingTopics(mockTrendingTopics);
      setError(null);
      setLastUpdated(new Date().toISOString());
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
      setSelectedTopic({ id: 'hardcoded', category: 'Hardcoded', topic: HARDCODED_TOPIC, value: 20, timestamp: new Date().toISOString() });
      setSelectedTopicDetails(HARDCODED_TOPIC);
      setHypothesis(HARDCODED_HYPOTHESIS);
      setTrendingTopics(mockTrendingTopics);
      setLoading(false);
    }
  }, []);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    // Reset selections when region changes
    setSelectedTopicSuggestions([]);
    setSelectedHypothesisSuggestions([]);
  };

  const handleRefresh = () => {
    fetchTrendingTopics(selectedRegion, true); // Force refresh
    // Reset selections when refreshing
    setSelectedTopicSuggestions([]);
    setSelectedHypothesisSuggestions([]);
  };

  const getTopicSuggestions = async (topicName: string, applyToDetails: boolean = false, currentSuggestions?: string[]) => {
    if (!topicName.trim()) return;

    try {
      // While topic suggestions load, clear hypothesis suggestions and avoid showing loaders there
      setHypothesisSuggestions([]);
      setSelectedHypothesisSuggestions([]); // Also clear selected hypothesis suggestions
      setLoadingTopicSuggestions(true);
      setError(null);

      // Use passed currentSuggestions or fallback to current state
      const suggestionsToAvoid = currentSuggestions || topicSuggestions;
      // console.log('🚀 Calling API with current suggestions:', suggestionsToAvoid);
      const result = await apiService.getTopicSuggestions({
        topic: topicName,
        region: selectedRegion,
        currentSuggestions: suggestionsToAvoid // Pass current suggestions to avoid duplicates
      });
      // console.log('📡 API response:', result);

      if (result.success && result.data) {
        const suggestions = Array.isArray(result.data)
          ? result.data
          : (Array.isArray(result.data?.suggestions) ? result.data.suggestions : []);
        setTopicSuggestions(suggestions || []);

        // Automatically fetch hypothesis suggestions when topic suggestions are updated
        if (suggestions && suggestions.length > 0 && selectedTopic) {
          autoFetchHypothesisSuggestions();
        }

      } else {
        console.error('Failed to fetch topic suggestions:', result.error);
        // Fallback to default suggestions
        const fallback = HelperFunctions.generateFallbackTopicSuggestions(topicName, selectedRegion);
        setTopicSuggestions(fallback);

        // Automatically fetch hypothesis suggestions when fallback suggestions are set
        if (fallback && fallback.length > 0 && selectedTopic) {
          autoFetchHypothesisSuggestions();
        }

      }
    } catch (err) {
      console.error('Error fetching topic suggestions:', err);
      // Fallback to default suggestions
      const fallback = HelperFunctions.generateFallbackTopicSuggestions(topicName, selectedRegion);
      setTopicSuggestions(fallback);

      // Automatically fetch hypothesis suggestions when fallback suggestions are set
      if (fallback && fallback.length > 0 && selectedTopic) {
        autoFetchHypothesisSuggestions();
      }

    } finally {
      setLoadingTopicSuggestions(false);
    }
  };

  const fetchHypothesisSuggestions = async () => {
    if (USE_HARDCODED) return;
    if (!selectedTopic) return;
    if (loadingTopicSuggestions) return;
    try {

      setLoadingHypothesisSuggestions(true);

      // Create enhanced details that include selected topic suggestions
      let enhancedDetails = selectedTopicDetails;
      if (selectedTopicSuggestions.length > 0) {
        enhancedDetails = `${selectedTopicDetails}\n\nSelected Topic Suggestions:\n${selectedTopicSuggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}`;

        // Show toast notification that hypothesis is being generated based on topic suggestions
        toast.info(`🔄 Generating hypothesis suggestions based on ${selectedTopicSuggestions.length} selected topic suggestion${selectedTopicSuggestions.length !== 1 ? 's' : ''}...`);
      }

      const result = await apiService.getHypothesisSuggestions({
        topic: selectedTopic.topic,
        details: enhancedDetails,
        region: selectedRegion,
        num: 5,
        currentSuggestions: hypothesisSuggestions // Pass current suggestions to avoid duplicates
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

  // useEffect for fetching hypothesis suggestions when topic suggestions are updated
  useEffect(() => {
    // Fetch hypothesis suggestions when topic suggestions change and we have a selected topic
    if (!USE_HARDCODED && selectedTopic && !loadingTopicSuggestions && topicSuggestions.length > 0) {
      autoFetchHypothesisSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSuggestions, selectedTopic, selectedRegion]);

  // useEffect for fetching hypothesis suggestions when topic details are manually changed
  useEffect(() => {
    // Fetch hypothesis suggestions when topic details are manually typed or changed
    if (!USE_HARDCODED && selectedTopic && selectedTopicDetails.trim().length > 0 && !loadingTopicSuggestions) {
      // Debounce the hypothesis suggestions fetch to avoid too many API calls
      const timeoutId = setTimeout(() => {
        autoFetchHypothesisSuggestions();
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopicDetails, selectedTopic, selectedRegion]);



  const handleEnhanceTopicDetails = async (originalText?: string) => {
    // Determine what text to enhance - either the provided suggestion or the current text field
    const textToEnhance = originalText || selectedTopicDetails.trim();

    if (!selectedTopic || !textToEnhance) return;

    try {
      setEnhancingDetails(true);

      // Store the original suggestion text if provided
      if (originalText) {
        setOriginalSuggestionText(originalText);
      } else {
        setOriginalSuggestionText(null);
      }

      if (USE_HARDCODED) {
        const enhanced = `${textToEnhance} (refined for clarity and impact)`;
        setPendingField('topicDetails');
        setPendingEnhancedOptions([enhanced]);
        setConfirmOpen(true);
      } else {
        const result = await apiService.enhanceTopicDetails({
          topic: selectedTopic.topic,
          details: textToEnhance,
          region: selectedRegion,
          targetWords: 160,
        });

        if (result.success && result.data?.enhancedOptions && result.data.enhancedOptions.length > 0) {
          setPendingField('topicDetails');
          setPendingEnhancedOptions(result.data.enhancedOptions);
          setConfirmOpen(true);
        } else {
          console.error('Failed to enhance details', result.error);
        }
      }
    } catch (e) {
      console.error('Error enhancing details', e);
    } finally {
      setEnhancingDetails(false);
    }
  };

  const handleEnhanceHypothesis = async (originalText?: string) => {
    // Determine what text to enhance - either the provided suggestion or the current text field
    const textToEnhance = originalText || hypothesis.trim();

    if (!selectedTopic || !textToEnhance) return;

    try {
      setEnhancingHypothesis(true);

      // Store the original suggestion text if provided
      if (originalText) {
        setOriginalSuggestionText(originalText);
      } else {
        setOriginalSuggestionText(null);
      }

      const result = await apiService.enhanceHypothesis({
        topic: selectedTopic.topic,
        hypothesis: textToEnhance,
        details: selectedTopicDetails,
        region: selectedRegion
      });

      if (result.success && result.data?.enhancedOptions && result.data.enhancedOptions.length > 0) {
        setPendingField('hypothesis');
        setPendingEnhancedOptions(result.data.enhancedOptions);
        setConfirmOpen(true);
      }
    } catch (e) {
      console.error('Failed to enhance hypothesis', e);
    } finally {
      setEnhancingHypothesis(false);
    }
  };

  const handleConfirmAccept = (selectedOption: string) => {
    if (pendingField === 'topicDetails') {
      // If this enhancement came from a suggestion, replace it in the suggestions list
      if (originalSuggestionText && topicSuggestions.includes(originalSuggestionText)) {
        const updatedSuggestions = topicSuggestions.map(suggestion =>
          suggestion === originalSuggestionText ? selectedOption : suggestion
        );
        setTopicSuggestions(updatedSuggestions);

        // Update selected suggestions as well if the original was selected
        if (selectedTopicSuggestions.includes(originalSuggestionText)) {
          const updatedSelectedSuggestions = selectedTopicSuggestions.map(suggestion =>
            suggestion === originalSuggestionText ? selectedOption : suggestion
          );
          handleTopicSuggestionsChange(updatedSelectedSuggestions);
        }
      }

      // Automatically fetch hypothesis suggestions when topic details are updated
      autoFetchHypothesisSuggestions();
    } else if (pendingField === 'hypothesis') {
      // Don't populate the hypothesis field - only update the suggestions list
      // The user should manually type in the hypothesis field if they want to

      // If this enhancement came from a suggestion, replace it in the suggestions list
      if (originalSuggestionText && hypothesisSuggestions.includes(originalSuggestionText)) {
        const updatedSuggestions = hypothesisSuggestions.map(suggestion =>
          suggestion === originalSuggestionText ? selectedOption : suggestion
        );
        setHypothesisSuggestions(updatedSuggestions);

        // Update selected suggestions as well if the original was selected
        if (selectedHypothesisSuggestions.includes(originalSuggestionText)) {
          const updatedSelectedSuggestions = selectedHypothesisSuggestions.map(suggestion =>
            suggestion === originalSuggestionText ? selectedOption : suggestion
          );
          handleHypothesisSuggestionsChange(updatedSelectedSuggestions);
        }
      }
    }

    setConfirmOpen(false);
    setPendingEnhancedOptions([]);
    setPendingField(null);
    setOriginalSuggestionText(null);
  };

  const handleConfirmReject = () => {
    setConfirmOpen(false);
    setPendingEnhancedOptions([]);
    setPendingField(null);
    setOriginalSuggestionText(null);
  };

  // Wrapper functions to always fetch hypothesis suggestions when checkbox selections change
  const handleTopicSuggestionsChange = (suggestions: string[]) => {
    setSelectedTopicSuggestions(suggestions);
    // Always fetch hypothesis suggestions when topic suggestions selection changes
    if (suggestions.length > 0 && selectedTopic) {
      // If topic details are empty, use the first selected suggestion as topic details
      // Fetch hypothesis suggestions when topic suggestions selection changes
      autoFetchHypothesisSuggestions();
    }
  };

  // Function to automatically fetch hypothesis suggestions when topic suggestions are updated
  const autoFetchHypothesisSuggestions = () => {
    if (!USE_HARDCODED && selectedTopic && topicSuggestions.length > 0) {
      setTimeout(() => {
        fetchHypothesisSuggestions();
      }, 200); // Small delay to ensure state is updated
    }
  };

  const handleHypothesisSuggestionsChange = (suggestions: string[]) => {
    setSelectedHypothesisSuggestions(suggestions);
  };

  const handleTopicSelect = async (topic: TrendingTopic) => {
    setSelectedTopic(topic);
    setHypothesis('');
    setTopicSuggestions([]); // Reset suggestions
    setSelectedTopicSuggestions([]); // Reset selected topic suggestions
    setHypothesisSuggestions([]); // Reset hypothesis suggestions
    setSelectedHypothesisSuggestions([]); // Reset selected hypothesis suggestions
    setSelectedTopicDetails(''); // Clear topic details to refresh
    // Fetch new topic suggestions without auto-filling topic details
    await getTopicSuggestions(topic.topic);
  };

  const handleGenerateScript = async () => {
    if (selectedHypothesisSuggestions.length === 0 || !selectedTopic) {
      return;
    }

    try {
      setGeneratingChapters(true); // Keep using same loading state for now
      setError(null);

      const result = await apiService.generateScript({
        topic: selectedTopic.topic,
        hypothesis,
        details: selectedTopicDetails,
        region: selectedRegion,
        duration: duration,
        language: language,
        selectedTopicSuggestions: selectedTopicSuggestions,
        selectedHypothesisSuggestions: selectedHypothesisSuggestions,
        topicDetails: selectedTopicDetails
      });
      console.log('🟢 Script generation result:', result);
      if (result.success && result.data?.script) {
        // Show script approval dialog with structured data
        setGeneratedScript(result.data.script);
        setEditedScript(result.data.script);

        // Store additional script metadata for later use
        const scriptMetadata = {
          title: result.data.title || 'Untitled Script',
          hook: result.data.hook || '',
          mainContent: result.data.mainContent || '',
          conclusion: result.data.conclusion || '',
          callToAction: result.data.callToAction || '',
          estimatedWords: result.data.estimatedWords || 0,
          emotionalTone: result.data.emotionalTone || 'Engaging',
          pacing: result.data.pacing || 'Dynamic'
        };

        // Store metadata in localStorage for the script production page
        localStorage.setItem('scriptMetadata', JSON.stringify(scriptMetadata));

        setShowScriptDialog(true);
        setError(null);
      } else {
        setError(result.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error('Error generating script:', err);
      setError('Failed to generate script. Please try again.');
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleScriptApproval = () => {
    // Navigate to script production page with the approved script data
    console.log('Script approved, navigating to script production page...');

    // Store script data for the next page
    // Use edited script if it exists, otherwise use generated script
    const finalScript = editedScript || generatedScript;

    // Merge any script metadata if present
    let metadata: any = null;
    try {
      const storedMeta = localStorage.getItem('scriptMetadata');
      metadata = storedMeta ? JSON.parse(storedMeta) : null;
    } catch {}

    const scriptData = {
      script: finalScript,
      topic: selectedTopic?.topic || '',
      hypothesis,
      details: selectedTopicDetails,
      region: selectedRegion,
      duration,
      language,
      selectedTopicSuggestions,
      selectedHypothesisSuggestions,
      ...(metadata || {})
    };

    // Store in localStorage as backup
    localStorage.setItem('approvedScript', JSON.stringify(scriptData));

    // Close dialog and clear states immediately for faster UX
    setShowScriptDialog(false);
    setGeneratedScript('');

    // Navigate immediately - this should be the fastest path
    router.push('/script-production');

    // Show success message after navigation starts (non-blocking)
    setTimeout(() => {
      toast.success('Script approved! Navigating to production pipeline...');
    }, 100);
  };

  const handleScriptRejection = () => {
    // Clear the script and allow user to try again
    setGeneratedScript('');
    setEditedScript('');
    setShowScriptDialog(false);
  };

  const handleScriptChange = (newScript: string) => {
    setEditedScript(newScript);
  };



  const wordClickHandler = useCallback(async (w: any) => {
    console.log('🔍 Word clicked:', w.text);
    console.log('🔍 Available topics:', trendingTopics.map(t => t.topic));

    // find the topic which matches the clicked word
    const foundTopic = trendingTopics.find(t => t.topic === w.text);

    if (foundTopic) {
      console.log('✅ Selecting topic:', foundTopic.topic);
      console.log('✅ Found topic object:', foundTopic);
      await handleTopicSelect(foundTopic);
    } else {
      console.log('❌ No matching topic found for:', w.text);
    }
  }, [trendingTopics, handleTopicSelect]);

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box className={styles.trendingTopicsContainer}>
      {/* Loading Overlay for AI Operations */}
      <LoadingOverlay
        generatingChapters={generatingChapters}
        enhancingDetails={enhancingDetails}
        enhancingHypothesis={enhancingHypothesis}
        imagesLoading={false}
        pickerLoading={false}
      />

      {/* Header with Region Selection and Refresh */}
      <HeaderSection
        selectedRegion={selectedRegion}
        regions={regions}
        onRegionChange={handleRegionChange}
        onRefresh={handleRefresh}
        onClearCache={clearCurrentRegionCache}
        trendView={trendView}
        onTrendViewChange={setTrendView}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {error && (
        <Alert severity="error" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      {trendView === 'grid' ? (
        /* List View - Simple list for trending topics */
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box className={styles.listSection}>
            {/* Trending Topics List */}
            <Box sx={{ width: '100%' }}>
              {/* Fixed height container with scroll */}
              <Box
                sx={{
                  height: '400px', // Fixed height container
                  overflowY: 'auto', // Enable vertical scrolling
                  overflowX: 'hidden', // Hide horizontal scroll
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  p: 1,
                  // Custom scrollbar styling
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#6b7280',
                    borderRadius: '4px',
                    '&:hover': {
                      background: '#9ca3af',
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {trendingTopics.map((topic, index) => {
                    const isSelected = selectedTopic?.id === topic.id;
                    const isDataFresh = lastUpdated ? (() => {
                      try {
                        const date = new Date(lastUpdated);
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        return diffHours < 1; // Consider data fresh if less than 1 hour old
                      } catch (error) {
                        return false;
                      }
                    })() : false;

                    return (
                      <Box
                        key={`topic-${index}`}
                        onClick={() => handleTopicSelect(topic)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: (theme) => isSelected ? theme.palette.action.selected : theme.palette.action.hover,
                            borderLeft: (theme) => `3px solid ${theme.palette.primary.main}`,
                            paddingLeft: '15px'
                          },
                          border: (theme) => isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                          borderLeft: (theme) => isSelected ? `4px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          p: 1.5,
                          paddingLeft: isSelected ? '14px' : '12px',
                          mb: 0.5,
                          backgroundColor: (theme) => isSelected ? theme.palette.action.selected : theme.palette.background.paper,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          minHeight: '60px',
                          boxShadow: (theme) => isSelected ? theme.shadows[3] : 'none'
                        }}
                      >
                        {/* Cache indicator */}
                        {lastUpdated && !isDataFresh && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              borderRadius: '4px',
                              px: 1,
                              py: 0.5,
                            }}
                            title="Data from cache - click refresh for fresh data"
                          >
                            <CachedIcon sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                              Cached
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* Topic */}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: 'primary.main',
                              fontSize: '0.95rem',
                              minWidth: '200px',
                              flexShrink: 0
                            }}
                          >
                            {topic.topic}
                          </Typography>

                          {/* Separator */}
                          <Box
                            sx={{
                              width: '1px',
                              height: '30px',
                              backgroundColor: 'divider',
                              flexShrink: 0
                            }}
                          />

                          {/* Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.85rem',
                              lineHeight: 1.3,
                              flex: 1
                            }}
                          >
                            {topic.description}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      ) : (
        /* Cloud View - Centered word cloud with permanent details panel on right */
        <Paper sx={{ p: 2, mb: 2 }}>
          {trendingTopics.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No trends to display.</Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 3, height: '400px' }}>
              {/* Centered Word Cloud Container */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>
                {/* Cache indicator for word cloud view */}
                {lastUpdated && (() => {
                  try {
                    const date = new Date(lastUpdated);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const isDataFresh = diffHours < 1;

                    if (!isDataFresh) {
                      return (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '4px',
                            px: 1,
                            py: 0.5,
                            zIndex: 1,
                          }}
                          title="Data from cache - click refresh for fresh data"
                        >
                          <CachedIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            Cached
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  } catch (error) {
                    return null;
                  }
                })()}

                <WordCloudChart
                  width={600}
                  height={400}
                  data={trendingTopics.map(topic => {
                    return {
                      text: topic.topic,
                      value: topic.value || 1,
                      category: topic.category,
                      description: topic.description,
                      source_reference: topic.source_reference,
                      id: topic.id
                    };
                  })}
                  handleWordClick={wordClickHandler}
                />
              </Box>

              {/* Permanent Details Panel on Right */}
              <Box sx={{
                width: '320px',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
              }}>
                {/* Panel Header */}
                <Box sx={{
                  p: 2,
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Topic Details
                  </Typography>
                </Box>

                {/* Panel Content */}
                <Box sx={{
                  flex: 1,
                  p: 2,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '3px',
                  },
                }}>
                  {selectedTopic ? (
                    <Box>
                      {/* Selected Topic */}
                      <Typography variant="h6" sx={{
                        fontWeight: 700,
                        color: '#1976d2',
                        mb: 2,
                        fontSize: '1.2rem',
                        lineHeight: 1.3
                      }}>
                        {selectedTopic.topic}
                      </Typography>

                      {/* Description */}
                      <Typography variant="body2" sx={{
                        color: '#333',
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}>
                        {selectedTopic.description}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      textAlign: 'center',
                      color: '#999'
                    }}>
                      <Box sx={{
                        fontSize: '2rem',
                        mb: 2,
                        opacity: 0.3
                      }}>
                        🔍
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Click on any topic
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        to see detailed information
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {trendingTopics.length === 0 && !loading && (
        <Box className={styles.noTrendsContainer}>
          <Typography variant="body1" color="text.secondary" className={styles.noTrendsText}>
            No trending topics found for {regions.find(r => r.value === selectedRegion)?.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" className={styles.noTrendsSubtext}>
            Try selecting a different region or refreshing the data.
          </Typography>
        </Box>
      )}

      {/* Topic Details Section */}
      {selectedTopic && (
        <Box className={styles.topicDetailsSection}>
          <Box className={styles.topicDetailsContent}>

            <TopicDetailsSection
              selectedTopic={selectedTopic}
              selectedTopicDetails={selectedTopicDetails}
              topicSuggestions={topicSuggestions}
              selectedTopicSuggestions={selectedTopicSuggestions}
              loadingTopicSuggestions={loadingTopicSuggestions}
              enhancingDetails={enhancingDetails}
              selectedRegion={selectedRegion}
              language={language}

              onTopicDetailsChange={setSelectedTopicDetails}
              onEnhanceTopicDetails={handleEnhanceTopicDetails}
              onTopicSuggestionsChange={handleTopicSuggestionsChange}
              onRestoreTopicSuggestions={(suggestions) => {
                setTopicSuggestions(suggestions)
              }}
            />

            <HypothesisSection
              selectedTopic={selectedTopic}
              selectedTopicDetails={selectedTopicDetails}
              hypothesis={hypothesis}
              hypothesisSuggestions={hypothesisSuggestions}
              selectedHypothesisSuggestions={selectedHypothesisSuggestions}
              loadingHypothesisSuggestions={loadingHypothesisSuggestions}
              enhancingHypothesis={enhancingHypothesis}
              selectedRegion={selectedRegion}
              selectedTopicSuggestions={selectedTopicSuggestions}
              language={language}
              onFetchHypothesisSuggestions={fetchHypothesisSuggestions}
              onHypothesisChange={setHypothesis}
              onEnhanceHypothesis={handleEnhanceHypothesis}
              onHypothesisSuggestionsChange={handleHypothesisSuggestionsChange}
              onRestoreHypothesisSuggestions={(suggestions) => setHypothesisSuggestions(suggestions)}
            />

            <VideoDurationSection
              duration={duration}
              onDurationChange={setDuration}
              durationOptions={durationOptions}
              language={language}
              onLanguageChange={setLanguage}
              languageOptions={languageOptions}
              generatingChapters={generatingChapters}
              onGenerateChapters={handleGenerateScript}
              selectedHypothesisSuggestions={selectedHypothesisSuggestions}
              hasChapters={false}
              onRegenerateAllAssets={() => { }}
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
          enhancedOptions={pendingEnhancedOptions}
        />
      )}



      {/* Script Approval Dialog */}
      <ScriptApprovalDialog
        open={showScriptDialog}
        onClose={() => setShowScriptDialog(false)}
        onApprove={handleScriptApproval}
        onReject={handleScriptRejection}
        script={editedScript || generatedScript}
        topic={selectedTopic?.topic || ''}
        language={language}
        onScriptChange={handleScriptChange}
        intendedDuration={duration}
      />

    </Box>
  );
};




export default TrendingTopics;
