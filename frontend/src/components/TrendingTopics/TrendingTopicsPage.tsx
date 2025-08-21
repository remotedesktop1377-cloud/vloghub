import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import { mockTrendingTopics, TrendingTopic } from '../../data/mockTrendingTopics';
import { Chapter } from '../../types/chapters';
import { fallbackImages } from '../../data/mockImages';
import { regions, Region } from '../../data/mockRegions';
import { durationOptions, DurationOption } from '../../data/mockDurationOptions';
import { USE_HARDCODED, HARDCODED_TOPIC, HARDCODED_HYPOTHESIS, DEFAULT_AI_PROMPT } from '../../data/constants';
import { apiService } from '../../utils/apiService';
import { HelperFunctions } from '../../utils/helperFunctions';
import { generateChapterImages } from '../../utils/chapterImageGenerator';
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
import { mockChapters } from '@/data/mockChapters';


const TrendingTopics: React.FC = () => {

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

  // Chroma Key Upload states
  const [chromaKeyFile, setChromaKeyFile] = useState<File | null>(null);
  const [chromaKeyUrl, setChromaKeyUrl] = useState<string | null>(null);
  const [uploadingChromaKey, setUploadingChromaKey] = useState(false);
  const [chromaKeyUploadProgress, setChromaKeyUploadProgress] = useState(0);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEnhancedOptions, setPendingEnhancedOptions] = useState<string[]>([]);
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
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [mediaManagementOpen, setMediaManagementOpen] = useState<boolean>(false);
  const [mediaManagementChapterIndex, setMediaManagementChapterIndex] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDraggingUpload, setIsDraggingUpload] = useState<boolean>(false);
  const [trendView, setTrendView] = useState<'cloud' | 'grid'>('grid');

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

      // Fetch from Gemini API only
      const geminiResult = await apiService.getGeminiTrendingTopics(region);

      // Handle Gemini results
      if (geminiResult.success && geminiResult.data) {
        const geminiData = geminiResult.data.data || [];
        console.log('🟢 Gemini API Response Data:', geminiData);
        console.log('🟢 Gemini Topics with Values:', geminiData.map((t: any) => ({
          topic: t.topic,
          value: t.value
        })));
        // Sort by value (higher = first)
        const sortedGeminiData = geminiData.sort((a: any, b: any) => b.value - a.value);
        setTrendingTopics(sortedGeminiData);
      } else {
        console.warn('Gemini API not ok, using mock data. Error:', geminiResult.error);
        setTrendingTopics(mockTrendingTopics);
      }

      setError(null);
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
      setSelectedTopic({ id: 'hardcoded', category: 'Hardcoded', topic: HARDCODED_TOPIC, value: 20, timestamp: new Date().toISOString() });
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
    if (!selectedTopic || !selectedTopicDetails.trim()) return;
    try {
      setEnhancingDetails(true);
      if (USE_HARDCODED) {
        const enhanced = `${selectedTopicDetails} (refined for clarity and impact)`;
        setPendingField('topicDetails');
        setPendingEnhancedOptions([enhanced]);
        setConfirmOpen(true);
      } else {
        const result = await apiService.enhanceTopicDetails({
          topic: selectedTopic.topic,
          details: selectedTopicDetails,
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
      setSelectedTopicDetails(selectedOption);
    } else if (pendingField === 'hypothesis') {
      setHypothesis(selectedOption);
    }
    setConfirmOpen(false);
    setPendingEnhancedOptions([]);
    setPendingField(null);
  };

  const handleConfirmReject = () => {
    setConfirmOpen(false);
    setPendingEnhancedOptions([]);
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
      
      // Clear all existing assets when generating new chapters
      setChapterImagesMap({});
      setGeneratedImages([]);
      setUploadedImages([]);

      const result = await apiService.generateChapters({
        topic: selectedTopic.topic,
        hypothesis,
        details: selectedTopicDetails,
        region: selectedRegion,
        duration: duration
      });

      if (result.success && result.data?.chapters && Array.isArray(result.data.chapters)) {
        const chaptersWithEmptyMedia = result.data.chapters.map((chapter: Chapter) => ({
          ...chapter,
          media: { image: null, audio: null, video: null }
        }));

        setChapters(chaptersWithEmptyMedia);
        setChaptersGenerated(true);
        setError(null);

        // Auto-generate images for chapters
        try {
          const chaptersWithImages = await generateChapterImages(chaptersWithEmptyMedia);
          setChapters(chaptersWithImages);

          // Add generated images to the stock images array
          const newGeneratedImages: string[] = [];
          const chapterImagesForMap: Record<number, string[]> = {};

          chaptersWithImages.forEach((chapter, index) => {
            // Add primary image to generated images
            if (chapter.assets?.image) {
              newGeneratedImages.push(chapter.assets.image);
            }

            // Add all generated images (primary + additional) to chapter images map for testing
            const allChapterImages: string[] = [];
            if (chapter.assets?.image) {
              allChapterImages.push(chapter.assets.image);
            }
            if ((chapter as any).additionalImages && Array.isArray((chapter as any).additionalImages)) {
              allChapterImages.push(...(chapter as any).additionalImages);
              // Also add additional images to the generated images array for stock
              newGeneratedImages.push(...(chapter as any).additionalImages);
            }
            
            if (allChapterImages.length > 0) {
              chapterImagesForMap[index] = allChapterImages;
            }
          });

          if (newGeneratedImages.length > 0) {
            setGeneratedImages(prev => [...prev, ...newGeneratedImages]);
          }

          // Set the chapter images map with all generated images
          if (Object.keys(chapterImagesForMap).length > 0) {
            setChapterImagesMap(prev => ({ ...prev, ...chapterImagesForMap }));
          }

          console.log(`🎨 Generated ${newGeneratedImages.length} total images for ${chaptersWithImages.length} chapters`);
        } catch (imageError) {
          console.error('Error generating chapter images:', imageError);
          // Don't set error state as chapters are still generated, just without images
        }
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
    setEditHeading(chapters[index].on_screen_text || '');
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

  // Video Production Actions
  const handleDownloadAllNarrations = () => {
    if (!chapters.length) return;
    
    try {
      chapters.forEach((chapter, index) => {
        if (chapter.assets?.audio) {
          // Create a download link for each audio file
          const link = document.createElement('a');
          link.href = chapter.assets.audio;
          link.download = `chapter-${index + 1}-narration.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    } catch (error) {
      console.error('Error downloading narrations:', error);
    }
  };

  const handleUploadChromaKey = () => {
    // Create a file input for chroma key upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        
        try {
          setUploadingChromaKey(true);
          setChromaKeyUploadProgress(0);
          
          // Simulate upload progress
          const totalSteps = 10;
          for (let i = 1; i <= totalSteps; i++) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay per step
            setChromaKeyUploadProgress((i / totalSteps) * 100);
          }
          
          // Store the file and create URL
          const url = URL.createObjectURL(file);
          setChromaKeyFile(file);
          setChromaKeyUrl(url);
          
          console.log('Chroma key uploaded:', file.name, url);
          toast.success(`Chroma key "${file.name}" uploaded successfully!`);
        } catch (error) {
          console.error('Error uploading chroma key:', error);
          toast.error('Failed to upload chroma key. Please try again.');
        } finally {
          setUploadingChromaKey(false);
          setChromaKeyUploadProgress(0);
        }
      }
    };
    input.click();
  };

  const handleGenerateVideo = async () => {
    if (!chapters.length) {
      toast.error('No chapters available for video generation');
      return;
    }
    
    if (!chromaKeyFile || !chromaKeyUrl) {
      toast.error('Please upload a chroma key before generating video');
      return;
    }
    
    try {
      console.log('Generating video with chapters:', chapters);
      console.log('Using chroma key:', chromaKeyFile.name);
      // TODO: Implement video generation API call
      toast.success('Video generation started! This feature is coming soon.');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Error generating video. Please try again.');
    }
  };

  const handleRegenerateAllAssets = async () => {
    if (!chapters.length) {
      toast.error('No chapters available for asset regeneration');
      return;
    }
    
    try {
      setGeneratingChapters(true);
      console.log('Regenerating all assets for chapters:', chapters);
      
      // Call the same image generation function that's used during chapter creation
      const { generateChapterImages } = await import('@/utils/chapterImageGenerator');
      const updatedChapters = await generateChapterImages(chapters);
      setChapters(updatedChapters);
      
      // Update generatedImages to include new AI images
      const newGeneratedImages = updatedChapters
        .map(chapter => chapter.assets?.image)
        .filter((image): image is string => Boolean(image));

      if (newGeneratedImages.length > 0) {
        setGeneratedImages(prev => [...prev, ...newGeneratedImages]);
      }
      
      toast.success('All assets regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating assets:', error);
      toast.error('Error regenerating assets. Please try again.');
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    // Reorder chapters
    const updatedChapters = Array.from(chapters);
    const [reorderedChapter] = updatedChapters.splice(source.index, 1);
    updatedChapters.splice(destination.index, 0, reorderedChapter);
    setChapters(updatedChapters);

    // Reorder chapter images map to follow the chapters
    const updatedChapterImagesMap: Record<number, string[]> = {};

    // Create a temporary mapping of old indices to their images
    const tempImageMap: Record<number, string[]> = {};
    Object.keys(chapterImagesMap).forEach(key => {
      tempImageMap[parseInt(key)] = chapterImagesMap[parseInt(key)];
    });

    // Reorder the images based on the new chapter order
    updatedChapters.forEach((chapter, newIndex) => {
      // Find the original index of this chapter
      const originalIndex = chapters.findIndex(c => c.id === chapter.id);
      if (originalIndex !== -1 && tempImageMap[originalIndex]) {
        updatedChapterImagesMap[newIndex] = tempImageMap[originalIndex];
      }
    });

    setChapterImagesMap(updatedChapterImagesMap);

    // Update selected chapter index if needed
    if (selectedChapterIndex === source.index) {
      setSelectedChapterIndex(destination.index);
    } else if (selectedChapterIndex >= Math.min(source.index, destination.index) &&
      selectedChapterIndex <= Math.max(source.index, destination.index)) {
      // Adjust selected index if it's in the affected range
      if (source.index < destination.index && selectedChapterIndex > source.index) {
        setSelectedChapterIndex(selectedChapterIndex - 1);
      } else if (source.index > destination.index && selectedChapterIndex < source.index) {
        setSelectedChapterIndex(selectedChapterIndex + 1);
      }
    }
  };

  const wordClickHandler = useCallback(async (w: any) => {
    console.log('🔍 Word clicked:', w.text);
    console.log('🔍 Available topics:', trendingTopics.map(t => t.topic));
    
    // find the topic which matches the clicked word
    const selectedTopic = trendingTopics.find(t => t.topic === w.text);

    if (selectedTopic) {
      console.log('✅ Selecting topic:', selectedTopic.topic);
      await handleTopicSelect(selectedTopic);
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
        <Alert severity="error" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      {trendView === 'grid' ? (
        /* Grid View - Single grid for trending topics */
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box className={styles.gridSection}>
            {/* Trending Topics Grid */}
            <Box className={styles.gridColumn}>
              <Box className={styles.gridLabel}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 2 }}>
                  Trending Topics
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {trendingTopics.map((topic, index) => (
                  <Grid item xs={12} sm={6} md={5} lg={4} key={`gemini-${index}`}>
                    <Card
                      className={styles.topicCard}
                      onClick={() => handleTopicSelect(topic)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        },
                        border: '1px solid blue'
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                          {topic.topic}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                          <Chip
                            label={topic.category}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', mb: 1, alignSelf: 'flex-start' }}
                          />
                          <Chip
                            label={`${topic.value} posts`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', width: 'fit-content', pl: 1, pr: 1 }}
                          />

                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>


          </Box>
        </Paper>
      ) : (
        /* Cloud View - Single word cloud for trending topics */
        <Paper sx={{ p: 2, mb: 2 }}>
          {trendingTopics.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No trends to display.</Typography>
          ) : (
            <Box className={styles.wordCloudSection}>
              {/* Single Word Cloud */}
              <Box className={styles.wordCloudColumn} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box className={styles.wordCloudLabel}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 2 }}>
                    Trending Topics
                  </Typography>
                </Box>
                <Box className={styles.wordCloudContainer}>
                  <WordCloudChart
                    width={800}
                    height={450}
                    data={trendingTopics.map(topic => {
                      return {
                        text: topic.topic,
                        value: topic.value || 1, // Higher value = larger word
                        category: topic.category,
                        description: topic.description,
                        source_reference: topic.source_reference
                      };
                    })}
                    handleWordClick={wordClickHandler}
                  />
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
          <SelectedTopicHeader selectedTopic={selectedTopic} />

          <Box className={styles.topicDetailsContent}>

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
              hasChapters={chapters.length > 0}
              onDownloadAllNarrations={handleDownloadAllNarrations}
              onUploadChromaKey={handleUploadChromaKey}
              onGenerateVideo={handleGenerateVideo}
              onRegenerateAllAssets={handleRegenerateAllAssets}
              chromaKeyFile={chromaKeyFile}
              uploadingChromaKey={uploadingChromaKey}
              chromaKeyUploadProgress={chromaKeyUploadProgress}
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
              mediaManagementOpen={mediaManagementOpen}
              mediaManagementChapterIndex={mediaManagementChapterIndex}
              onMediaManagementOpen={setMediaManagementOpen}
              onMediaManagementChapterIndex={setMediaManagementChapterIndex}
              onChaptersUpdate={(updatedChapters) => {
                setChapters(updatedChapters);
                // Update generatedImages to keep sync with chapter AI images
                const currentAIImages = updatedChapters
                  .map(chapter => chapter.assets?.image)
                  .filter((image): image is string => Boolean(image));

                // Update generatedImages to include current AI images
                setGeneratedImages(prev => {
                  // Remove old AI images and add current ones, keeping other generated images
                  const nonAIImages = prev.filter(img =>
                    !chapters.some(ch => ch.assets?.image === img)
                  );
                  return [...nonAIImages, ...currentAIImages];
                });
              }}
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
