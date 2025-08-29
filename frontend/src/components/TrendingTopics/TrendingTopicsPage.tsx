import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { TrendingTopic } from '../../data/mockTrendingTopics';

import { durationOptions, } from '../../data/mockDurationOptions';
import { languageOptions, } from '../../data/mockLanguageOptions';
import { apiService } from '../../utils/apiService';

import styles from './TrendingTopics.module.css';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { WordCloudChart } from '../WordCloudChart/WordCloudChart';
import LoadingOverlay from '../LoadingOverlay';
import TopicDetailsSection from './TopicDetailsSection';
import HypothesisSection from './HypothesisSection';
import VideoDurationSection from './VideoDurationSection';

import ScriptApprovalDialog from './ScriptApprovalDialog';
import HeaderSection from './HeaderSection';

import AppLoadingOverlay from '../ui/loadingView/AppLoadingOverlay';

const TrendingTopics: React.FC = () => {
  const router = useRouter();

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
  const [selectedTopicDetails, setSelectedTopicDetails] = useState<string>('');
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('5');
  const [language, setLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [editedScript, setEditedScript] = useState<string>('');
  const [showScriptDialog, setShowScriptDialog] = useState(false);

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

    try {
      setLoading(true);
      setError(null);

      // Fetch from Gemini API with location type and date range
      const geminiResult = await apiService.getGeminiTrendingTopics(locationType as 'global' | 'region' | 'country', location, dateRange);

      // Handle Gemini results
      if (geminiResult.success && geminiResult.data) {
        const geminiData = geminiResult.data.data || [];
        // console.log('🟢 Gemini API Response Data:', geminiData);
        const sortedGeminiData = geminiData.sort((a: any, b: any) => b.value - a.value);
        setTrendingTopics(sortedGeminiData);

      } else {
        console.warn('Gemini API not ok, using mock data. Error:', geminiResult.error);
        setLastUpdated(new Date().toISOString());
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching trending topics, using mock data:', err);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllFieldsSelected()) {
      fetchTrendingTopics(selectedLocationType, selectedLocation, selectedDateRange);
    }
  }, [selectedLocation, selectedLocationType, selectedDateRange]);

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const handleLocationTypeChange = (locationType: 'global' | 'region' | 'country') => {
    setSelectedLocationType(locationType);
    setSelectedLocation('');
    setSelectedCountry('');
  };

  const handleDateRangeChange = (dateRange: string) => {
    setSelectedDateRange(dateRange);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
  };

  const handleRefresh = () => {
    if (isAllFieldsSelected()) {
      console.log('🟢 Refreshing trending topics for1:', selectedLocation, selectedLocationType, selectedDateRange);
      fetchTrendingTopics(selectedLocationType, selectedLocation, selectedDateRange, true);
    } else {
      toast.info('Please select all options before refreshing');
    }
  };

  const handleTopicSelect = async (topic: TrendingTopic) => {
    console.log('🟢 Handling topic select:', topic);
    setSelectedTopic(topic);
    setHypothesis('');
  };

  const handleGenerateScript = async () => {
    if (!selectedTopic) {
      return;
    }

    try {
      setGeneratingChapters(true); // Keep using same loading state for now
      setError(null);

      const result = await apiService.generateScript({
        topic: selectedTopic.topic,
        hypothesis,
        region: selectedLocation, // Keep for backward compatibility
        duration: duration,
        language: language,
      });
      console.log('🟢 Script generation result:', result);
      if (result.success && result.data?.script) {
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
    // console.log('Script approved, navigating to script production page...');

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
  }, [trendingTopics, handleTopicSelect]);

  return (
    <Box className={styles.trendingTopicsContainer}>
      {loading && (
        <AppLoadingOverlay />
      )}
      {/* Loading Overlay for AI Operations */}
      {generatedScript && (
        <LoadingOverlay
          title={'Generating Script'}
          desc={'Please wait while AI processes your request'}
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
      {trendingTopics.length === 0 && (
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
        trendingTopics.length > 0 && (
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
        script={editedScript}
        topic={selectedTopic?.topic || ''}
        language={language}
        onScriptChange={handleScriptChange}
        intendedDuration={duration}
      />

    </Box>
  );
};

export default TrendingTopics;
