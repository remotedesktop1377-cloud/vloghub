'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HelperFunctions, SecureStorageHelpers } from '../../utils/helperFunctions';
import { TrendingTopic } from '../../types/TrendingTopics';

import { durationOptions } from '../../data/mockDurationOptions';
import { languageOptions } from '../../data/mockLanguageOptions';
import { apiService } from '../../utils/apiService';
import { ROUTES_KEYS, SCRIPT_STATUS, TRENDING_TOPICS_CACHE_MAX_AGE } from '../../data/constants';
import { useTrendingTopicsCache } from '../../hooks/useTrendingTopicsCache';
import { secure } from '../../utils/helperFunctions';

import styles from './css/TrendingTopics.module.css';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { WordCloudChart } from './WordCloudChart/WordCloudChart';
import LoadingOverlay from '../ui/LoadingOverlay';
import TopicDetailsSection from './TopicDetailsSection';
import HypothesisSection from './HypothesisSection';
import VideoDurationSection from './VideoDurationSection';
import HeaderSection from './HeaderSection';
import { SupabaseHelpers } from '@/utils/SupabaseHelpers';
import { useAuth } from '@/context/AuthContext';
import { ScriptData } from '@/types/scriptData';

const TrendingTopics: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { getCachedData, setCachedData, clearCache, isCacheValid } = useTrendingTopicsCache();
  const lastFetchRef = useRef<{ key: string; ts: number } | null>(null);

  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<'global' | 'region' | 'country'>('global');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('24h');
  // Category removed per request
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Topic Details State
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('1');
  const [language, setLanguage] = useState('english');
  const [subtitle_language, setsubtitle_language] = useState('english');
  const [narration_type, setnarration_type] = useState<'interview' | 'narration'>('narration');
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [scriptGeneratedOnce, setScriptGeneratedOnce] = useState(false);
  const [selectedPreviousLocation, setSelectedPreviousLocation] = useState('');
  const [selectedPreviousLocationType, setSelectedPreviousLocationType] = useState<string>('');
  const [selectedPreviousDateRange, setSelectedPreviousDateRange] = useState<string>('');
  const [selectedPreviousCountry, setSelectedPreviousCountry] = useState<string>('');
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');

  const fetchTrendingTopics = async () => {
    try {

      // Guard: avoid duplicate calls with identical params within a short window (dev StrictMode)
      const cacheKey = HelperFunctions.getSearchQuery(selectedLocation, selectedLocationType, selectedDateRange, selectedCountry);
      const now = Date.now();
      if (lastFetchRef.current && lastFetchRef.current.key === cacheKey && (now - lastFetchRef.current.ts) < 1500) {
        // console.log('Skipping duplicate fetch for key:', fetchKey);
        return;
      }
      lastFetchRef.current = { key: cacheKey, ts: now };

      const searchQuery = HelperFunctions.getSearchQuery(selectedLocation, selectedLocationType, selectedDateRange, selectedCountry);

      // Fetch fresh data from API
      // console.log('🟢 Fetching fresh data for:', locationKey);
      setSelectedTopic(null);
      setHypothesis('');
      setTrendingTopics([]);
      setLoading(true);
      setDialogTitle('Please wait');
      setDialogDescription('We are finding the trending topics for you...');
      const geminiResult = await apiService.getGeminiTrendingTopics(searchQuery, selectedDateRange);

      setLoading(false);
      // Handle Gemini results
      if (geminiResult.success && geminiResult.data) {
        // console.log('🟢 Trending topics:', JSON.stringify(geminiResult));

        // API returns array directly in data field (matching old working structure)
        const geminiData = Array.isArray(geminiResult.data) ? geminiResult.data : [];
        geminiData.sort((a: any, b: any) => b.engagement_count - a.engagement_count);

        // Cache the fresh data
        setTrendingTopics(geminiData);
        if (geminiData.length > 0) {
          setCachedData(searchQuery, geminiData);
        }
      } else {
        console.warn('Gemini API not ok, using mock data. Error:', geminiResult.error);
        HelperFunctions.showError('Failed to fetch trending topics');
      }

    } catch (err) {
      console.error('Error fetching trending topics, using mock data:', err);
      setError(null);
      setLoading(false);
      HelperFunctions.showError('Error loading trending topics');
    }
  };

  useEffect(() => {
    // Always fetch on any field change and all fields selected
    if (HelperFunctions.isAllFieldsSelected(selectedLocation, selectedLocationType, selectedDateRange, selectedCountry, selectedPreviousLocation, selectedPreviousLocationType, selectedPreviousDateRange, selectedPreviousCountry)) {

      const scriptMetadata = SecureStorageHelpers.getScriptMetadata();
      if (scriptMetadata && typeof scriptMetadata === 'object') {
        console.log('🟢 Script metadata found, redirecting to script production');
        router.replace(ROUTES_KEYS.SCRIPT_PRODUCTION);
        return;
      }

      // Try to load from cache first
      const cacheKey = HelperFunctions.getSearchQuery(selectedLocation, selectedLocationType, selectedDateRange, selectedCountry);
      const cachedData = getCachedData<TrendingTopic[]>(cacheKey);

      // Check if cachedData exists, cache is valid, and lastUpdated is less than 1 hour old
      if (cachedData && isCacheValid(cacheKey)) {
        // Last updated is less than 1 hour old
        console.log('🟡 Using cached data - no API call needed');
        setTrendingTopics(cachedData);
        setError(null);
        return;
      } else {
        console.log('🟠 No valid cache found - calling API to fetch fresh data');
        fetchTrendingTopics();
        setDialogTitle('Please wait');
        setDialogDescription('We are finding the trending topics for you...');
      }
    }
  }, [selectedLocation, selectedLocationType, selectedDateRange]);

  const handleTopicSelect = async (topic: TrendingTopic) => {
    // console.log('🟢 Handling topic select:', topic);
    setSelectedTopic(topic);
    setHypothesis('');
  };

  const handleGenerateScript = async () => {
    if (!selectedTopic) {
      return;
    }

    try {
      setGeneratingChapters(true);
      setDialogTitle('Generating Script');
      setDialogDescription('Please wait while we generate the script for you...');

      const location = selectedLocationType === 'global'
        ? selectedLocationType
        : selectedLocationType === 'region'
          ? selectedLocation
          : (selectedLocation === 'all' ? selectedCountry : (selectedLocation + ', ' + selectedCountry));

      const scriptPromise = apiService.generateScript({
        topic: selectedTopic.topic,
        hypothesis,
        region: location,
        duration: duration,
        language: language,
        narration_type: narration_type,
      });
      // console.log('[Generate] generateScript promise created');

      const [scriptResult] = await Promise.allSettled([scriptPromise]);

      // Unwrap script generation result
      const result = scriptResult.status === 'fulfilled' ? scriptResult.value : { success: false, error: 'Script generation failed' } as any;
      // console.log('🟢 Script generation result:', selectedLocationType === 'global' ? selectedLocationType : selectedLocationType === 'region' ? selectedLocation : selectedLocation + ', ' + selectedCountry);
      if (result.success && result.data?.script) {
        setScriptGeneratedOnce(true);

        // Store additional script metadata for later use
        const scriptMetadata: ScriptData = {
          title: result.data.title || 'Untitled Script',
          topic: selectedTopic?.topic || '',
          description: selectedTopic?.description || '',
          hypothesis: hypothesis || '',
          region: location,
          duration: duration,
          language: language,
          subtitle_language: subtitle_language,
          narration_type: narration_type,
          estimated_words: result.data.estimated_words || 0,
          hook: result.data.hook || '',
          main_content: result.data.main_content || '',
          conclusion: result.data.conclusion || '',
          call_to_action: result.data.call_to_action || '',
          script: result.data.script || '',
          user_id: user?.id || '',
          status: SCRIPT_STATUS.GENERATED, //approved, uploaded, generated
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          narrator_chroma_key_link: '',
          transcription: '',
          videoBackground: null,
        };

        // Store metadata in secure storage for the script production page
        SecureStorageHelpers.setScriptMetadata(scriptMetadata);

        // Navigate directly to script production page
        router.push(ROUTES_KEYS.SCRIPT_PRODUCTION);
        setGeneratingChapters(false);

      } else {
        setError(result.error || 'Failed to generate script');
        setGeneratingChapters(false);
      }
    } catch (err) {
      // console.error('Error generating script:', err);
      setError('Failed to generate script. Please try again.');
      setGeneratingChapters(false);
    } finally {
      // keep overlay until route change completes; do not unset generatingChapters here
      setGeneratingChapters(false);
      setTimeout(() => setGeneratingChapters(false), 3000);
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedPreviousLocation(selectedLocation);
    setSelectedLocation(location);
  };

  const handleLocationTypeChange = (locationType: 'global' | 'region' | 'country') => {
    setSelectedPreviousLocationType(selectedLocationType);
    setSelectedLocationType(locationType);
    setSelectedLocation('');
    setSelectedCountry('');
  };

  const handleDateRangeChange = (dateRange: string) => {
    setSelectedPreviousDateRange(selectedDateRange);
    setSelectedDateRange(dateRange);
  };

  const handleCountryChange = (country: string) => {
    setSelectedPreviousCountry(selectedCountry);
    setSelectedCountry(country);
  };

  const handlesubtitle_languageChange = (newsubtitle_language: string) => {
    setsubtitle_language(newsubtitle_language);
  };

  const handlenarration_typeChange = (newnarration_type: 'interview' | 'narration') => {
    setnarration_type(newnarration_type);
  };

  const wordClickHandler = async (w: any) => {
    // Safety check - ensure we have trending topics data
    if (!trendingTopics || trendingTopics.length === 0) {
      console.log('❌ No trending topics available for word click');
      return;
    }

    // find the topic which matches the clicked word
    const foundTopic = trendingTopics.find(t => {
      return t.topic === w.text;
    });

    if (foundTopic) {
      try {
        await handleTopicSelect(foundTopic);
      } catch (error) {
        console.error('❌ Error in handleTopicSelect:', error);
      }
    } else {
      console.log('❌ No matching topic found for:', w.text);
      console.log('❌ Available topics:', trendingTopics.map(t => t.topic));
    }
  };

  return (
    <Box className={styles.trendingTopicsContainer}>
      {(loading || generatingChapters) && (
        <LoadingOverlay
          title={dialogTitle}
          desc={dialogDescription}
        />
      )}

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
        onRefresh={() => {
          clearCache(HelperFunctions.getSearchQuery(selectedLocation, selectedLocationType, selectedDateRange, selectedCountry));
          fetchTrendingTopics();
        }}
        loading={loading}
      />

      {
        /* Cloud View - Centered word cloud with permanent details panel on right */
        Array.isArray(trendingTopics) && trendingTopics.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Centered Word Cloud Container */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>

                <WordCloudChart
                  width={900}
                  height={600}
                  data={Array.isArray(trendingTopics) ? trendingTopics.map(topic => ({
                    text: topic.topic,
                    value: topic.value || 1,
                    category: topic.category,
                    description: topic.description,
                    source_reference: topic.source_reference,
                    id: topic.id
                  })) : []}
                  handleWordClick={wordClickHandler}
                />
              </Box>

            </Box>
          </Box>
        ) :
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
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Please select all options to view trending topics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Choose a location type, location, and time range to get started
            </Typography>
          </Box>
      }

      {/* Topic Details Section */}
      {selectedTopic && (
        <Box className={styles.topicDetailsSection}>
          <Box className={styles.topicDetailsContent}>

            <TopicDetailsSection
              selectedTopic={selectedTopic}
            />

            <HypothesisSection
              selectedTopic={selectedTopic}
              hypothesis={hypothesis}
              onHypothesisChange={setHypothesis}
            />

            <VideoDurationSection
              duration={duration}
              onDurationChange={setDuration}
              durationOptions={durationOptions}
              language={language}
              onLanguageChange={setLanguage}
              languageOptions={languageOptions}
              onGenerateChapters={handleGenerateScript}
              hasChapters={false}
              onRegenerateAllAssets={() => { }}
              canGenerate={!!selectedTopic}
              subtitle_language={subtitle_language}
              onsubtitle_languageChange={handlesubtitle_languageChange}
              narration_type={narration_type}
              onnarration_typeChange={handlenarration_typeChange}
              generating={generatingChapters}
              generatedOnce={scriptGeneratedOnce}
            />

          </Box>
        </Box>
      )}

    </Box>
  );
};

export default TrendingTopics;
