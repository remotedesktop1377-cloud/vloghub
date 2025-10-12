'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { HelperFunctions } from '../../utils/helperFunctions';
import { TrendingTopic } from '../../types/TrendingTopics';

import { durationOptions } from '../../data/mockDurationOptions';
import { languageOptions } from '../../data/mockLanguageOptions';
import { apiService } from '../../utils/apiService';
import { ROUTES_KEYS } from '../../data/constants';
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

const TrendingTopics: React.FC = () => {
  const router = useRouter();
  const { getCachedData, setCachedData, clearCache, isCacheValid } = useTrendingTopicsCache();

  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState<'global' | 'region' | 'country'>('global');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('24h');
  // Category removed per request
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Topic Details State
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('5');
  const [language, setLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
  const [narrationType, setNarrationType] = useState<'interview' | 'narration'>('narration');
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [scriptGeneratedOnce, setScriptGeneratedOnce] = useState(false);
  const [selectedPreviousLocation, setSelectedPreviousLocation] = useState('');
  const [selectedPreviousLocationType, setSelectedPreviousLocationType] = useState<'global' | 'region' | 'country'>('global');
  const [selectedPreviousDateRange, setSelectedPreviousDateRange] = useState<string>('');
  const [selectedPreviousCountry, setSelectedPreviousCountry] = useState<string>('');

  // Function to clear cache for current location and date range
  const clearCurrentLocationCache = () => {
    if (!isAllFieldsSelected()) {
      HelperFunctions.showInfo('Please select all options before clearing cache');
      return;
    }

    try {
      const cacheRegion = `${selectedLocationType}_${selectedLocation}_${selectedDateRange}`;
      clearCache(cacheRegion);
      HelperFunctions.showSuccess('Cache cleared for current location and time range');
    } catch (error) {
      console.warn('Error clearing cache:', error);
      HelperFunctions.showError('Failed to clear cache');
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

    try {
      setLoading(true);
      setError(null);

      const locationKey = selectedLocationType === 'global'
        ? selectedLocationType
        : selectedLocationType === 'region'
          ? selectedLocation
          : (selectedLocation === 'all' ? selectedCountry : (selectedLocation + ', ' + selectedCountry));
      const cacheRegion = `${selectedLocationType}_${selectedLocation}_${selectedDateRange}`;

      // // Check cache first (unless force refresh is requested)
      // if (!forceRefresh) {
      //   const cachedData = getCachedData<TrendingTopic[]>(cacheRegion);
      //   if (cachedData && isCacheValid(cacheRegion)) {
      //     console.log('🟡 Using cached data for:', cacheRegion);
      //     setTrendingTopics(cachedData);
      //     setLastUpdated(new Date().toISOString()); // Update UI timestamp
      //     setError(null);
      //     setLoading(false);
      //     return;
      //   }
      // }

      // Fetch fresh data from API
      console.log('🟢 Fetching fresh data for:', locationKey);
      setSelectedTopic(null);
      setHypothesis('');  
      setTrendingTopics([]);
      const geminiResult = await apiService.getGeminiTrendingTopics(locationKey, dateRange);

      // Handle Gemini results
      if (geminiResult.success && geminiResult.data) {
        console.log('🟢 Trending topics:', JSON.stringify(geminiResult));

        // API returns array directly in data field (matching old working structure)
        const geminiData = Array.isArray(geminiResult.data) ? geminiResult.data : [];
        geminiData.sort((a: any, b: any) => b.engagement_count - a.engagement_count);

        // Cache the fresh data
        // setCachedData(cacheRegion, geminiData);
        setTrendingTopics(geminiData);
        setLastUpdated(new Date().toISOString());

        // Show success message only on manual refresh
        if (forceRefresh) {
          HelperFunctions.showSuccess('Fresh trending topics loaded!');
        }

      } else {
        console.warn('Gemini API not ok, using mock data. Error:', geminiResult.error);
        setLastUpdated(new Date().toISOString());
        HelperFunctions.showError('Failed to fetch trending topics');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching trending topics, using mock data:', err);
      setError(null);
      setLastUpdated(new Date().toISOString());
      HelperFunctions.showError('Error loading trending topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch on any field change and all fields selected
    if (isAllFieldsSelected() && selectedLocation !== selectedPreviousLocation && selectedLocationType !== selectedPreviousLocationType && selectedDateRange !== selectedPreviousDateRange) {
      // // Try to load from cache first
      // const cacheRegion = `${selectedLocationType}_${selectedLocation}_${selectedDateRange}`;
      // const cachedData = getCachedData<TrendingTopic[]>(cacheRegion);

      // if (cachedData && isCacheValid(cacheRegion)) {
      //   console.log('🟡 Using cached data - no API call needed');
      //   setTrendingTopics(cachedData);
      //   setLastUpdated(new Date().toISOString());
      //   setError(null);
      // } else {
      // console.log('🟠 No valid cache found - calling API to fetch fresh data');
      // Call API when no cached data is available
      fetchTrendingTopics(selectedLocationType, selectedLocation, selectedDateRange, true);
      // }
    }
  }, [selectedLocation, selectedLocationType, selectedDateRange]);

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

  const handleRefresh = () => {
    if (isAllFieldsSelected()) {
      console.log('🟢 Refreshing trending topics for1:', selectedLocation, selectedLocationType, selectedDateRange);
      fetchTrendingTopics(selectedLocationType, selectedLocation, selectedDateRange, true);
    } else {
      HelperFunctions.showInfo('Please select all options before refreshing');
    }
  };

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
      setError(null);

      const location = selectedLocationType === 'global'
        ? selectedLocationType
        : selectedLocationType === 'region'
          ? selectedLocation
          : (selectedLocation === 'all' ? selectedCountry : (selectedLocation + ', ' + selectedCountry));

      const result = await apiService.generateScript({
        topic: selectedTopic.topic,
        hypothesis,
        region: location,
        duration: duration,
        language: language,
        narrationType: narrationType,
      });
      // console.log('🟢 Script generation result:', selectedLocationType === 'global' ? selectedLocationType : selectedLocationType === 'region' ? selectedLocation : selectedLocation + ', ' + selectedCountry);
      if (result.success && result.data?.script) {
        setScriptGeneratedOnce(true);

        // Store additional script metadata for later use
        const scriptMetadata = {
          title: result.data.title || 'Untitled Script',
          topic: selectedTopic?.topic || '',
          description: selectedTopic?.description || '',
          hypothesis: hypothesis || '',
          region: location,
          duration: duration,
          language: language,
          subtitleLanguage: subtitleLanguage,
          narrationType: narrationType,
          estimatedWords: result.data.estimatedWords || 0,
          hook: result.data.hook || '',
          mainContent: result.data.mainContent || '',
          conclusion: result.data.conclusion || '',
          callToAction: result.data.callToAction || '',
          script: result.data.script || '',
        };

        // Store metadata in secure storage for the script production page
        secure.j.scriptMetadata.set(scriptMetadata);

        // Store the script data for the production page
        const scriptData = {
          ...scriptMetadata
        };

        // Store in secure storage as backup
        secure.j.approvedScript.set(scriptData);

        // Navigate directly to script production page
        router.push(ROUTES_KEYS.SCRIPT_PRODUCTION);

        setError(null);
      } else {
        setError(result.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error('Error generating script:', err);
      setError('Failed to generate script. Please try again.');
    } finally {
      // keep overlay until route change completes; do not unset generatingChapters here
      setTimeout(() => setGeneratingChapters(false), 3000);
    }
  };

  const handleSubtitleLanguageChange = (newSubtitleLanguage: string) => {
    setSubtitleLanguage(newSubtitleLanguage);
  };

  const handleNarrationTypeChange = (newNarrationType: 'interview' | 'narration') => {
    setNarrationType(newNarrationType);
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
          title={loading ? 'Please wait' : 'Generating Script'}
          desc={loading ? 'We are finding the trending topics for you...' : 'Please wait we are generating the script for you...'}
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
        onRefresh={handleRefresh}
        onClearCache={clearCurrentLocationCache}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* Show message when not all fields are selected */}
      {(!Array.isArray(trendingTopics) || trendingTopics.length === 0) && (
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
      )}

      {
        /* Cloud View - Centered word cloud with permanent details panel on right */
        Array.isArray(trendingTopics) && trendingTopics.length > 0 && (
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
        )
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
              subtitleLanguage={subtitleLanguage}
              onSubtitleLanguageChange={handleSubtitleLanguageChange}
              narrationType={narrationType}
              onNarrationTypeChange={handleNarrationTypeChange}
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
