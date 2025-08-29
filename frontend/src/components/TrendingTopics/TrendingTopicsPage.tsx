import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { mockTrendingTopics, TrendingTopic } from '../../data/mockTrendingTopics';

import { locationData, LocationOption } from '../../data/locationData';
import { durationOptions, DurationOption } from '../../data/mockDurationOptions';
import { languageOptions, LanguageOption } from '../../data/mockLanguageOptions';
import { getDirectionSx } from '../../utils/languageUtils';
import { USE_HARDCODED, HARDCODED_TOPIC, HARDCODED_HYPOTHESIS, DEFAULT_AI_PROMPT } from '../../data/constants';
import { apiService } from '../../utils/apiService';
import { HelperFunctions } from '../../utils/helperFunctions';
import { useTrendingTopicsCache } from '../../hooks/useTrendingTopicsCache';
import { dateRangeOptions } from './DateRangeSelector';

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

  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<'global' | 'region' | 'country'>('global');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  // Category removed per request
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Topic Details State
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [selectedTopicDetails, setSelectedTopicDetails] = useState<string>('');
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('5');
  const [language, setLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
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

  const [trendView, setTrendView] = useState<'cloud' | 'grid'>('cloud');

  // Cache management functions
  const { getCachedData, setCachedData } = useTrendingTopicsCache();

  // Function to clear cache for current location and date range
  const clearCurrentLocationCache = () => {
    if (!isAllFieldsSelected()) {
      toast.info('Please select all options before clearing cache');
      return;
    }

    try {
      const cacheKey = `trending_topics_${selectedLocationType}_${selectedLocation}_${selectedDateRange}`;
      localStorage.removeItem(cacheKey);
      toast.success('Cache cleared for current location and time range');
    } catch (error) {
      console.warn('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  // Check if all required fields are selected
  const isAllFieldsSelected = () => {
    // Only date range required now
    if (!selectedDateRange) return false;
    if (selectedLocationType === 'global') {
      return true;
    }
    if (selectedLocationType === 'region') {
      return !!selectedLocation;
    }
    if (selectedLocationType === 'country') {
      return !!(selectedCountry && selectedLocation);
    }
    return false;
  };

  const fetchTrendingTopics = async (locationType: string, location: string, dateRange: string, forceRefresh: boolean = false) => {
    if (!isAllFieldsSelected()) {
      return; // Don't fetch if not all fields are selected
    }

    if (USE_HARDCODED) {
      setTrendingTopics(mockTrendingTopics);
      setLoading(false);
      setLastUpdated(new Date().toISOString());
      return; // skip API in hardcoded mode
    }

    // Check cache first (unless forcing refresh)
    if (forceRefresh) {
      const cacheKey = `${locationType}_${location}_${dateRange}`;
      const cachedData = getCachedData<TrendingTopic[]>(cacheKey);
      if (cachedData) {
        setTrendingTopics(cachedData);
        setLoading(false);
        // Try to get timestamp from cache
        try {
          const cacheKey = `trending_topics_${locationType}_${location}_${dateRange}`;
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

      // Fetch from Gemini API with location type and date range
      const geminiResult = await apiService.getGeminiTrendingTopics(locationType as 'global' | 'region' | 'country' | 'city', location, dateRange);

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
        const cacheKey = `${locationType}_${location}_${dateRange}`;
        setCachedData(cacheKey, sortedGeminiData);
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
    // Only fetch if all fields are selected
    if (isAllFieldsSelected()) {
      console.log('🟢 Fetching trending topics for:', selectedLocation, selectedLocationType, selectedDateRange);
      fetchTrendingTopics(selectedLocationType, selectedLocation, selectedDateRange);
    }
  }, [selectedLocation, selectedLocationType, selectedDateRange]);

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

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    // Reset selections when location changes
    setSelectedTopicSuggestions([]);
    setSelectedHypothesisSuggestions([]);
  };

  const handleLocationTypeChange = (locationType: 'global' | 'region' | 'country') => {
    setSelectedLocationType(locationType);
    // Reset location selection when type changes
    setSelectedLocation('');
    setSelectedCountry('');
    // Reset selections when location type changes
    setSelectedTopicSuggestions([]);
    setSelectedHypothesisSuggestions([]);
  };

  // Category removed

  const handleDateRangeChange = (dateRange: string) => {
    setSelectedDateRange(dateRange);
    // Reset selections when date range changes
    setSelectedTopicSuggestions([]);
    setSelectedHypothesisSuggestions([]);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
  };

  const handleRefresh = () => {
    if (isAllFieldsSelected()) {
      console.log('🟢 Refreshing trending topics for1:', selectedLocation, selectedLocationType, selectedDateRange);
      fetchTrendingTopics(selectedLocationType, selectedLocation, selectedDateRange, true); // Force refresh
      // Reset selections when refreshing
      setSelectedTopicSuggestions([]);
      setSelectedHypothesisSuggestions([]);
    } else {
      toast.info('Please select all options before refreshing');
    }
  };

  const handleTopicSelect = async (topic: TrendingTopic) => {
    setSelectedTopic(topic);
    setHypothesis('');
    setTopicSuggestions([]); // Reset suggestions
    setSelectedTopicSuggestions([]); // Reset selected topic suggestions
    setHypothesisSuggestions([]); // Reset hypothesis suggestions
    setSelectedHypothesisSuggestions([]); // Reset selected hypothesis suggestions
    setSelectedTopicDetails(''); // Clear topic details to refresh
  };

  const handleGenerateScript = async () => {
    if (!selectedTopic) {
      return;
    }

    try {
      debugger;
      setGeneratingChapters(true); // Keep using same loading state for now
      setError(null);

      const result = await apiService.generateScript({
        topic: selectedTopic.topic,
        hypothesis,
        details: selectedTopicDetails,
        region: selectedLocation, // Keep for backward compatibility
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
    } catch { }

    const scriptData = {
      script: finalScript,
      topic: selectedTopic?.topic || '',
      hypothesis,
      details: selectedTopicDetails,
      region: selectedLocation, // Keep for backward compatibility
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

  const handleSubtitleLanguageChange = (newSubtitleLanguage: string) => {
    setSubtitleLanguage(newSubtitleLanguage);
  };

  const wordClickHandler = useCallback(async (w: any) => {
    // console.log('🔍 Word clicked:', w.text);
    // console.log('🔍 Available topics:', trendingTopics.map(t => t.topic));

    // find the topic which matches the clicked word
    const foundTopic = trendingTopics.find(t => t.topic === w.text);

    if (foundTopic) {
      // console.log('✅ Selecting topic:', foundTopic.topic);
      // console.log('✅ Found topic object:', foundTopic);
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

      {/* Header with Enhanced Location Selection, Date Range, and Refresh */}
      <HeaderSection
        selectedLocation={selectedLocation}
        selectedLocationType={selectedLocationType}
        onLocationChange={handleLocationChange}
        onLocationTypeChange={handleLocationTypeChange}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={handleDateRangeChange}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountryChange}
        onRefresh={handleRefresh}
        onClearCache={clearCurrentLocationCache}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {error && (
        <Alert severity="error" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      {/* Show message when not all fields are selected */}
      {!isAllFieldsSelected() && (
        <Box sx={{
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          px: 2,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Please select all options to view trending topics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a location type, location, and time range to get started
          </Typography>
        </Box>
      )}

      {
        /* Cloud View - Centered word cloud with permanent details panel on right */
        isAllFieldsSelected() && (
          <Paper sx={{ p: 2, mb: 2 }}>
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

            </Box>
          </Paper>
        )
      }

      {/* Topic Details Section */}
      {selectedTopic && (
        <Box className={styles.topicDetailsSection}>
          <Box className={styles.topicDetailsContent}>

            <TopicDetailsSection
              selectedTopic={selectedTopic}
              selectedTopicDetails={selectedTopicDetails}
              language={language}
              onTopicDetailsChange={setSelectedTopicDetails}
            />

            <HypothesisSection
              selectedTopic={selectedTopic}
              selectedTopicDetails={selectedTopicDetails}
              hypothesis={hypothesis}
              language={language}
              onHypothesisChange={setHypothesis}
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
              canGenerate={!!selectedTopic}
              subtitleLanguage={subtitleLanguage}
              onSubtitleLanguageChange={handleSubtitleLanguageChange}
            />

          </Box>
        </Box>
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
