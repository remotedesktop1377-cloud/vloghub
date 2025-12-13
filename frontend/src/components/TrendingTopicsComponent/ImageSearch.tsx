import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    CircularProgress,
    Chip,
    Alert,
    Tooltip,
    Tabs,
    Tab,
    Badge,
    InputAdornment,
    Dialog,
    DialogContent
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Visibility as PreviewIcon,
    Download as DownloadIcon,
    Check as CheckIcon,
    AutoAwesome as AutoAwesomeIcon,
    Google as GoogleIcon,
    Image as EnvatoIcon
} from '@mui/icons-material';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL } from '../../styles/colors';
import { API_ENDPOINTS } from '../../config/apiEndpoints';
import { HelperFunctions } from '../../utils/helperFunctions';
import Image from 'next/image';

interface ImageResult {
    id: string;
    url: string;
    thumbnail: string;
    title: string;
    context: string;
    width: number;
    height: number;
    size: string;
    mime: string;
    sourceSuggestion?: string;
    suggestionIndex?: number;
    author?: string;
    authorUrl?: string;
    tags?: string[];
    category?: string;
    price?: string;
    downloadUrl?: string;
    source?: 'google' | 'envato' | 'envatoClips' | 'upload';
}

interface ImageSearchProps {
    SceneDataNarration: string;
    onImageSelect: (imageUrl: string) => void;
    onImagePreview: (imageUrl: string) => void;
    SceneDataIndex: number;
    onSceneDataUpdate: (SceneDataIndex: number, updatedSceneData: any) => void;
    onDone: () => void;
    existingImageUrls?: string[];
    onClearSelection?: () => void;
    // Optional: pre-populate suggestions (e.g., selected keywords) and auto-search
    suggestionKeywords?: string[];
    autoSearchOnMount?: boolean;
    // Report selected URLs to parent when Done is clicked
    onDoneWithSelected?: (selectedUrls: string[], modifiedKeyword?: string) => void;
    // If provided, also attach keywordsSelected merge payload on update
    currentKeywordForMapping?: string;
    // Context to refine Google queries for higher relevance
    trendingTopic?: string;
    location?: string;
    scriptTitle?: string;
    keywords?: string[];
}

type TabValue = 'google' | 'envato' | 'envatoClips' | 'youtube' | 'upload';

const ImageSearch: React.FC<ImageSearchProps> = ({
    SceneDataNarration,
    onImageSelect,
    onImagePreview,
    SceneDataIndex,
    onSceneDataUpdate,
    onDone,
    existingImageUrls = [],
    onClearSelection,
    suggestionKeywords = [],
    autoSearchOnMount = false,
    onDoneWithSelected,
    currentKeywordForMapping,
    trendingTopic,
    location,
    scriptTitle,
    keywords = []
}) => {
    const [activeTab, setActiveTab] = useState<TabValue>('google');
    const [searchQuery, setSearchQuery] = useState('');
    const [googleImages, setGoogleImages] = useState<ImageResult[]>([]);
    const [envatoImages, setEnvatoImages] = useState<ImageResult[]>([]);
    const [envatoClips, setEnvatoClips] = useState<ImageResult[]>([]);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [envatoLoading, setEnvatoLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [envatoError, setEnvatoError] = useState<string | null>(null);
    const [googleCurrentPage, setGoogleCurrentPage] = useState(1);
    const [googleHasMore, setGoogleHasMore] = useState(false);
    const [googleLoadingMore, setGoogleLoadingMore] = useState(false);
    const [selectedBySource, setSelectedBySource] = useState<{ google: Set<string>; envato: Set<string>; envatoClips: Set<string>; upload: Set<string> }>({ google: new Set(), envato: new Set(), envatoClips: new Set(), upload: new Set() });
    const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
    const [envatoKeywords, setEnvatoKeywords] = useState<string[]>([]);
    const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<ImageResult[]>([]);

    // Ref to prevent duplicate API calls when useEffect runs multiple times
    const hasInitialSearch = useRef(false);

    const currentImages = activeTab === 'google' ? googleImages : activeTab === 'envato' ? envatoImages : activeTab === 'envatoClips' ? envatoClips : uploadedFiles;
    const currentLoading = activeTab === 'google' ? googleLoading : envatoLoading;
    const currentError = activeTab === 'google' ? googleError : envatoError;

    // Search Google Images
    const searchGoogleImages = async (query: string, suggestions: string[] = [], loadMore: boolean = false) => {
        if (loadMore) {
            setGoogleLoadingMore(true);
        } else {
            setGoogleLoading(true);
            setGoogleError(null);
            setGoogleCurrentPage(1);
        }

        try {
            // Use the provided query, or fallback to currentKeywordForMapping, or SceneDataNarration, or buildContextString
            let baseQuery = query && query.trim().length > 0 
                ? query.trim() 
                : (currentKeywordForMapping && currentKeywordForMapping.trim() 
                    ? currentKeywordForMapping.trim() 
                    : (SceneDataNarration && SceneDataNarration.trim() 
                        ? SceneDataNarration.trim() 
                        : buildContextString()));
            
            if (!loadMore) {
                setSearchQuery(baseQuery);
            }
            
            const currentPage = loadMore ? googleCurrentPage + 1 : 1;
            
            // Step 6: Call backend
            const response = await fetch(API_ENDPOINTS.GOOGLE_IMAGE_SEARCH, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: baseQuery,
                    page: currentPage,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorMessage = data.error || "Failed to search Google images";
                const errorDetails = data.details ? ` (${data.details})` : "";
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            const data = await response.json();

            const imagesWithSource = (data.images || []).map((img: any, index: number) => ({
                ...img,
                source: "google" as const,
                sourceSuggestion: suggestions.length > 0 ? suggestions[index % suggestions.length] : undefined,
                suggestionIndex: suggestions.length > 0 ? index % suggestions.length : undefined,
            }));

            if (loadMore) {
                // Append new results to existing ones
                setGoogleImages(prev => [...prev, ...imagesWithSource]);
                HelperFunctions.showSuccess(`Loaded ${imagesWithSource.length} more images`);
            } else {
                // Replace existing results with new search
                setGoogleImages(imagesWithSource);
                checkAndSelectExistingImages(imagesWithSource, "google");
                HelperFunctions.showSuccess(`Found ${imagesWithSource.length} Google images`);
            }

            setGoogleCurrentPage(currentPage);
            setGoogleHasMore(data.hasMore || false);
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : "An error occurred searching Google images";
            setGoogleError(errorMsg);
            if (!loadMore) {
                setGoogleImages([]);
            }
            HelperFunctions.showError(errorMsg);
        } finally {
            setGoogleLoading(false);
            setGoogleLoadingMore(false);
        }
    };

    // Load more Google images
    const loadMoreGoogleImages = async () => {
        if (searchQuery.trim() && googleHasMore && !googleLoadingMore) {
            await searchGoogleImages(searchQuery, googleSuggestions, true);
        }
    };

    // Search Envato Images
    const searchEnvatoImages = async (query: string) => {
        // setEnvatoLoading(true);
        // setEnvatoError(null);
        // setSearchQuery(query);
        // try {
        //     const response = await fetch(API_ENDPOINTS.ENVATO_IMAGE_SEARCH, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             query: query,
        //             page: 1
        //         }),
        //     });

        //     if (!response.ok) {
        //         const data = await response.json();
        //         const errorMessage = data.error || 'Failed to search Envato images';
        //         const errorDetails = data.details ? ` (${data.details})` : '';
        //         throw new Error(`${errorMessage}${errorDetails}`);
        //     }

        //     const data = await response.json();

        //     const imagesWithSource = (data.images || []).map((img: any) => ({
        //         ...img,
        //         source: 'envato' as const
        //     }));

        //     setEnvatoImages(imagesWithSource);
        //     checkAndSelectExistingImages(imagesWithSource, 'envato');

        //     HelperFunctions.showSuccess(`Found ${imagesWithSource.length} Envato images`);

        // } catch (err) {
        //     const errorMsg = err instanceof Error ? err.message : 'An error occurred searching Envato images';
        //     setEnvatoError(errorMsg);
        //     setEnvatoImages([]);
        //     HelperFunctions.showError(errorMsg);
        // } finally {
        //     setEnvatoLoading(false);
        // }
    };

    // Search Envato Clips (videos)
    const searchEnvatoClips = async (query: string) => {
        setEnvatoLoading(true);
        setEnvatoError(null);
        setSearchQuery(query);
        try {
            const response = await fetch(API_ENDPOINTS.ENVATO_CLIPS_SEARCH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, page: 1 }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const errorMessage = data.error || 'Failed to search Envato clips';
                const errorDetails = data.details ? ` (${data.details})` : '';
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            const data = await response.json();
            const clipsWithSource = (data.clips || []).map((clip: any) => ({
                id: `${(data.clips || []).indexOf(clip) + 1}`,
                url: clip.url,
                thumbnail: clip.thumbnail || clip.url,
                title: clip.title || 'Clip',
                context: clip.context || '',
                width: clip.width || 0,
                height: clip.height || 0,
                size: clip.size || '',
                mime: clip.mime || 'video/mp4',
                source: 'envatoClips' as const
            }));

            setEnvatoClips(clipsWithSource);
            checkAndSelectExistingImages(clipsWithSource, 'envatoClips');
            HelperFunctions.showSuccess(`Found ${clipsWithSource.length} Envato clips`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred searching Envato clips';
            setEnvatoError(errorMsg);
            setEnvatoClips([]);
            HelperFunctions.showError(errorMsg);
        } finally {
            setEnvatoLoading(false);
        }
    };

    // Build compact and meaningful context string from props
    const buildContextString = (): string => {
        const parts: string[] = [];

        // 1. Trending Topic (highest priority)
        if (trendingTopic?.trim()) {
            const topic = trendingTopic.trim();
            parts.push(`Photos, News Or latest updates about ${topic}`);
        }

        // 2. Script Title
        if (scriptTitle?.trim()) {
            const shortTitle = scriptTitle.trim();
            parts.push(`or about ${shortTitle}`);
        }

        // // 3. Location (without sentences)
        // if (location?.trim()) {
        //     const cleanedLoc = location.replace(/[,]/g, ' ').trim();
        //     parts.push(cleanedLoc);
        // }

        // // 4. Keywords (OR group)
        // if (Array.isArray(keywords) && keywords.length > 0) {
        //     const group = keywords.map(k => `${k.trim()}`).join(", ");
        //     parts.push(`relevant to ${group}`);
        // }

        // 5. Quality & relevance boosters
        // parts.push(`realistic, documentary, photojournalism`);

        // Final query
        return parts.join(" ");
    };

    // Function to check if existing image URLs match API response images and auto-select them
    const checkAndSelectExistingImages = (apiImages: ImageResult[], source: 'google' | 'envato' | 'envatoClips' | 'upload') => {
        if (existingImageUrls.length === 0) return;

        // Enforce single selection: pick the first matching URL only
        const firstMatch = existingImageUrls.find((existingUrl) => apiImages.some(apiImage => apiImage.url === existingUrl));
        if (firstMatch) {
            setSelectedBySource({
                google: new Set(source === 'google' ? [firstMatch] : []),
                envato: new Set(source === 'envato' ? [firstMatch] : []),
                envatoClips: new Set(source === 'envatoClips' ? [firstMatch] : []),
                upload: new Set(source === 'upload' ? [firstMatch] : [])
            });
        }
    };

    // Generate meaningful queries for Google (phrases)
    const generateGoogleQueries = (narration: string): string[] => {
        if (!narration) return [];

        const suggestions: string[] = [];
        // Seed with context for better precision
        if (scriptTitle && scriptTitle.trim()) suggestions.push(scriptTitle.trim());
        if (trendingTopic && trendingTopic.trim()) suggestions.push(trendingTopic.trim());
        if (location && location.trim()) suggestions.push(location.trim());
        if (keywords && Array.isArray(keywords) && keywords.length > 0) suggestions.push(keywords.slice(0, 3).join(' '));
        const words = narration.toLowerCase().split(' ');
        const stopWordsSet = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        ]);

        // Main concept query
        const meaningfulWords = words
            .filter(word =>
                word.length > 2 &&
                !stopWordsSet.has(word) &&
                !/^\d+$/.test(word)
            )
            .slice(0, 6);

        if (meaningfulWords.length > 0) {
            suggestions.push(meaningfulWords.join(' '));
        }

        // Key concepts
        const keyConcepts = words
            .filter(word =>
                word.length > 3 &&
                !stopWordsSet.has(word) &&
                /^[a-z]+$/.test(word)
            )
            .slice(0, 3);

        if (keyConcepts.length > 0) {
            suggestions.push(keyConcepts.join(' '));
        }

        // Topic-based suggestions
        const topicKeywords = {
            'technology': ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'data', 'algorithm', 'software', 'app', 'digital'],
            'nature': ['nature', 'landscape', 'mountain', 'ocean', 'forest', 'wildlife', 'environment', 'climate', 'earth'],
            'business': ['business', 'startup', 'entrepreneur', 'company', 'market', 'finance', 'investment', 'strategy'],
            'health': ['health', 'medical', 'fitness', 'wellness', 'nutrition', 'exercise', 'medicine', 'therapy'],
            'education': ['education', 'learning', 'student', 'teacher', 'school', 'university', 'knowledge', 'study']
        };

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            const topicWords = keywords.filter(keyword => narration.toLowerCase().includes(keyword));
            if (topicWords.length > 0) {
                suggestions.push(topicWords.slice(0, 3).join(' '));
            }
        }

        return Array.from(new Set(suggestions)).slice(0, 8);
    };

    // Generate meaningful keywords for Envato (single words)
    const generateEnvatoWords = (narration: string): string[] => {
        if (!narration) return [];
        const stopWordsSet = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        ]);
        const tokens = narration
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2 && !stopWordsSet.has(t) && !/^\d+$/.test(t));
        return Array.from(new Set(tokens)).slice(0, 10);
    };

    // Set initial query based on currentKeywordForMapping or SceneDataNarration
    useEffect(() => {
        if (currentKeywordForMapping && currentKeywordForMapping.trim()) {
            // When a keyword is clicked, use the exact keyword as the query
            const keywordQuery = currentKeywordForMapping.trim();
            setSearchQuery(keywordQuery);
        } else if (SceneDataNarration && SceneDataNarration.trim()) {
            // When "Add media" is clicked (no keyword), use the narration as the query
            setSearchQuery(SceneDataNarration.trim());
        }
    }, [currentKeywordForMapping, SceneDataNarration]);

    // Auto-generate suggestions from SceneData narration and auto-search
    useEffect(() => {
        // If explicit suggestion keywords provided, use them first
        if (autoSearchOnMount && suggestionKeywords && suggestionKeywords.length > 0 && !hasInitialSearch.current) {
            hasInitialSearch.current = true;
            // Apply suggestions to both Google and Envato
            setGoogleSuggestions(suggestionKeywords);
            setEnvatoKeywords(suggestionKeywords);
            
            // Determine the query to use: keyword if available, otherwise narration
            const queryToUse = currentKeywordForMapping && currentKeywordForMapping.trim() 
                ? currentKeywordForMapping.trim() 
                : (SceneDataNarration && SceneDataNarration.trim() ? SceneDataNarration.trim() : (scriptTitle || ''));
            
            setSearchQuery(queryToUse);
            searchGoogleImages(queryToUse);
            const keywordsJoined = suggestionKeywords.join(' ');
            searchEnvatoImages(keywordsJoined);
            searchEnvatoClips(keywordsJoined);
            return;
        }
        
        // If we have a keyword but no autoSearch, still set the query
        if (currentKeywordForMapping && currentKeywordForMapping.trim() && !hasInitialSearch.current) {
            const keywordQuery = currentKeywordForMapping.trim();
            setSearchQuery(keywordQuery);
        } else if (SceneDataNarration && SceneDataNarration.trim() && !hasInitialSearch.current && !currentKeywordForMapping) {
            // If no keyword but we have narration, set it as query
            setSearchQuery(SceneDataNarration.trim());
        }

        // if (SceneDataNarration && !hasInitialSearch.current) {
        //     const gSuggestions = generateGoogleQueries(SceneDataNarration);
        //     const eKeywords = generateEnvatoWords(SceneDataNarration);
        //     setGoogleSuggestions(gSuggestions);
        //     setEnvatoKeywords(eKeywords);

        //     if (gSuggestions.length > 0 || eKeywords.length > 0) {
        //         hasInitialSearch.current = true;
        //         // Search both APIs using their respective suggestions/keywords
        //         searchGoogleImages(gSuggestions.join(' '));
        //         const ek = eKeywords.join(' ');
        //         searchEnvatoImages(ek);
        //         searchEnvatoClips(ek);
        //     }
        // }
    }, [SceneDataNarration, currentKeywordForMapping, autoSearchOnMount, suggestionKeywords]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            if (activeTab === 'google') {
                searchGoogleImages(searchQuery.trim());
            } else {
                searchEnvatoImages(searchQuery.trim());
            }
        }
    };

    const handleSearchQueryChange = (newQuery: string) => {
        setSearchQuery(newQuery);
        if (newQuery.trim()) {
            setGoogleSuggestions(generateGoogleQueries(newQuery));
            setEnvatoKeywords(generateEnvatoWords(newQuery));
        } else if (SceneDataNarration) {
            setGoogleSuggestions(generateGoogleQueries(SceneDataNarration));
            setEnvatoKeywords(generateEnvatoWords(SceneDataNarration));
        }
    };

    const handleImageSelect = (imageUrl: string) => {
        const sourceKey: 'google' | 'envato' | 'envatoClips' | 'upload' = activeTab === 'envato' ? 'envato' : (activeTab === 'envatoClips' ? 'envatoClips' : activeTab === 'upload' ? 'upload' : 'google');
        const isSelected = selectedBySource[sourceKey].has(imageUrl);
        if (isSelected) {
            // Unselect if already selected
            setSelectedBySource({ google: new Set(), envato: new Set(), envatoClips: new Set(), upload: new Set() });
        } else {
            // Enforce single selection across all sources
            setSelectedBySource({
                google: new Set(sourceKey === 'google' ? [imageUrl] : []),
                envato: new Set(sourceKey === 'envato' ? [imageUrl] : []),
                envatoClips: new Set(sourceKey === 'envatoClips' ? [imageUrl] : []),
                upload: new Set(sourceKey === 'upload' ? [imageUrl] : [])
            });
        }
    };

    const handleImagePreview = (imageUrl: string) => {
        onImagePreview(imageUrl);
    };

    const handleDownloadImage = async (imageUrl: string, filename: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            HelperFunctions.showSuccess('Image downloaded successfully');
        } catch (error) {
            console.error('Failed to download image:', error);
            HelperFunctions.showError('Failed to download image');
        }
    };

    const handleDone = async () => {
        // Single selection across tabs
        const selectedUrl = selectedBySource.google.values().next().value || selectedBySource.envato.values().next().value || selectedBySource.envatoClips.values().next().value || selectedBySource.upload.values().next().value;
        if (selectedUrl) {
            // Find the selected image object to get downloadUrl and validate the URL
            const allResults: ImageResult[] = [
                ...googleImages,
                ...envatoImages,
                ...envatoClips,
                ...uploadedFiles
            ];
            const selectedObj = allResults.find((it) => it.url === selectedUrl);
            
            // Validate and normalize the URL (especially for Envato preview URLs)
            let validatedUrl = HelperFunctions.validateAndNormalizeImageUrl(
                selectedUrl,
                selectedObj?.downloadUrl
            );
            
            const updatedSceneData: any = {
                assets: {
                    images: HelperFunctions.isVideoUrl(validatedUrl) ? [] : [validatedUrl],
                    clips: HelperFunctions.isVideoUrl(validatedUrl) ? [validatedUrl] : [],
                }
            };
            if (currentKeywordForMapping) {
                updatedSceneData.keywordsSelectedMerge = {
                    [currentKeywordForMapping]: [validatedUrl]
                };
                const typed = (searchQuery || '').trim();
                if (typed && typed.toLowerCase() !== currentKeywordForMapping.toLowerCase()) {
                    updatedSceneData.modifiedKeywordForMapping = typed;
                }
            }

            // Also add to keywordsSelected array with media and selected transition effects
            try {
                // Use validated URL and validate thumbnail as well
                const validatedThumbnail = selectedObj?.thumbnail 
                    ? HelperFunctions.validateAndNormalizeImageUrl(selectedObj.thumbnail, selectedObj.downloadUrl)
                    : validatedUrl;
                const lowResMedia = validatedThumbnail;
                const highResMedia = validatedUrl;
                const typed = (searchQuery || '').trim();
                const suggestedKeyword = (currentKeywordForMapping && currentKeywordForMapping.trim())
                    || (selectedObj?.sourceSuggestion && String(selectedObj.sourceSuggestion))
                    || (typed || '');

                const keywordEntry = {
                    suggestedKeyword,
                    media: {
                        lowResMedia,
                        highResMedia
                    },
                };

                updatedSceneData.keywordsSelected = [keywordEntry];
            } catch (_e) {
                // Non-fatal; continue
            }
            onSceneDataUpdate(SceneDataIndex, updatedSceneData);
            HelperFunctions.showSuccess(HelperFunctions.isVideoUrl(selectedUrl) ? '1 video clip selected for SceneData' : '1 image selected for SceneData');
            if (onDoneWithSelected) {
                const typed = (searchQuery || '').trim();
                const mk = (currentKeywordForMapping && typed && typed.toLowerCase() !== currentKeywordForMapping.toLowerCase()) ? typed : undefined;
                onDoneWithSelected([selectedUrl], mk);
            }
        } else {
            HelperFunctions.showInfo('Please select one image');
        }
        onDone();
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
        setActiveTab(newValue);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const fileUrl = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');

        const newFile: ImageResult = {
            id: `upload-${Date.now()}`,
            url: fileUrl,
            thumbnail: fileUrl,
            title: file.name,
            context: 'Uploaded file',
            width: 0,
            height: 0,
            size: file.size.toString(),
            mime: file.type,
            source: 'upload' as const
        };

        setUploadedFiles(prev => [...prev, newFile]);

        try {
            const updatedSceneData: any = {
                assets: {
                    images: [fileUrl],
                    imagesGoogle: [],
                    imagesEnvato: []
                }
            };
            if (currentKeywordForMapping) {
                const typed = (searchQuery || '').trim();
                updatedSceneData.keywordsSelectedMerge = {
                    [currentKeywordForMapping]: [fileUrl]
                };
                if (typed && typed.toLowerCase() !== currentKeywordForMapping.toLowerCase()) {
                    updatedSceneData.modifiedKeywordForMapping = typed;
                }
            }
            onSceneDataUpdate(SceneDataIndex, updatedSceneData);
            setSelectedBySource({ google: new Set(), envato: new Set(), envatoClips: new Set(), upload: new Set() });
            HelperFunctions.showSuccess('File uploaded and added to SceneData');
        } catch (e) {
            HelperFunctions.showError('Failed to upload file');
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Tabs */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        px: 2,
                        pt: 1,
                        width: '100%',
                        display: 'flex',
                        '& .MuiTabs-flexContainer': {
                            width: '100%',
                            display: 'flex'
                        }
                    }}
                    variant="fullWidth"
                >
                    <Tab
                        value="google"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%', textTransform: 'none' }}>
                                <GoogleIcon sx={{ fontSize: 18 }} />
                                <Badge badgeContent={googleImages.length} color="primary" sx={{ fontSize: '16px' }} showZero={false}>
                                    Google Images
                                </Badge>
                            </Box>
                        }
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: '50%',
                            maxWidth: '50%',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    />
                    {/* Envato Images tab - disabled for now */}
                    {/* <Tab
                        value="envato"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%', textTransform: 'none' }}>
                                <Box
                                    sx={{
                                        width: { xs: 14, sm: 18, md: 20 },
                                        height: { xs: 14, sm: 18, md: 20 },
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Image src="/images/envato_icon.jpg" alt="Envato" fill style={{ objectFit: 'cover' }} />
                                </Box>
                                <Badge badgeContent={envatoImages.length} color="secondary" sx={{ fontSize: '16px' }} showZero={false}>
                                    Envato Images
                                </Badge>
                            </Box>
                        }
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: '50%',
                            maxWidth: '50%',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    /> */}
                    {/* Envato Clips tab - disabled for now */}
                    <Tab
                        value="envatoClips"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%', textTransform: 'none' }}>
                                <Box
                                    sx={{
                                        width: { xs: 14, sm: 18, md: 20 },
                                        height: { xs: 14, sm: 18, md: 20 },
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Image src="/images/envato_icon.jpg" alt="Envato" fill style={{ objectFit: 'cover' }} />
                                </Box>
                                <Badge badgeContent={envatoClips.length} color="secondary" sx={{ fontSize: '16px' }} showZero={false}>
                                    Envato Clips
                                </Badge>
                            </Box>
                        }
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: '50%',
                            maxWidth: '50%',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    />
                    {/* YouTube Clips tab - disabled for now */}
                    {/* <Tab
                        value="youtube"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%', textTransform: 'none' }}>
                                <Box
                                    sx={{
                                        width: { xs: 14, sm: 18, md: 20 },
                                        height: { xs: 14, sm: 18, md: 20 },
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Image src="/images/youtube.png" alt="Youtube" fill style={{ objectFit: 'cover' }} />
                                </Box>
                                <Badge badgeContent={0} color="secondary" sx={{ fontSize: '16px' }} showZero={false}>
                                    YouTube Clips (coming soon)
                                </Badge>
                            </Box>
                        }
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: '50%',
                            maxWidth: '50%',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    /> */}
                    <Tab
                        value="upload"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%', textTransform: 'none' }}>
                                <Box
                                    sx={{
                                        width: { xs: 14, sm: 18, md: 20 },
                                        height: { xs: 14, sm: 18, md: 20 },
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Image src="/images/cloud-computing.png" alt="Envato" fill style={{ objectFit: 'cover' }} />
                                </Box>
                                <Badge badgeContent={0} color="secondary" sx={{ fontSize: '16px' }} showZero={false}>
                                    Upload
                                </Badge>
                            </Box>
                        }
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            width: '50%',
                            maxWidth: '50%',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    />
                </Tabs>

                {/* Search Controls */}
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Image Search
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            fullWidth
                            size="medium"
                            placeholder="Type your search query"
                            value={searchQuery}
                            onChange={(e) => handleSearchQueryChange(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                endAdornment: searchQuery ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="clear search"
                                            edge="end"
                                            onClick={() => {
                                                // Reset query and regenerate suggestions from narration
                                                handleSearchQueryChange('');
                                                // notify parent to clear any text selection overlays
                                                onClearSelection && onClearSelection();
                                            }}
                                            size="small"
                                        >
                                            {/* Using Close icon already in bundle */}
                                            <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
                                        </IconButton>
                                    </InputAdornment>
                                ) : undefined
                            }}
                            sx={{
                                fontSize: '1rem',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />

                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={currentLoading ? <CircularProgress size={16} /> : <SearchIcon />}
                            onClick={() => {
                                if (activeTab === 'google') return handleSearch();
                                if (activeTab === 'envato') return handleSearch();
                                if (activeTab === 'envatoClips') return searchEnvatoClips(searchQuery); // reuse until dedicated clips implemented
                            }}
                            disabled={currentLoading || !searchQuery.trim()}
                            sx={{ width: '25%', height: '56px', fontSize: '1rem', textTransform: 'none' }}
                        >
                            {activeTab === 'google' ? 'Search Google' : activeTab === 'envato' ? 'Search Envato Images' : activeTab === 'envatoClips' ? 'Search Envato Clips' : 'Search'}
                        </Button>
                    </Box>

                    {/* Suggested Queries (Google) or Keywords (Envato) */}
                    {(activeTab === 'google' ? googleSuggestions.length > 0 : envatoKeywords.length > 0) && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.primary', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.6 }}>
                                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                                {activeTab === 'google' ? 'Meaningful queries:' : 'Meaningful words:'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', width: '100%' }}>
                                    {(activeTab === 'google' ? googleSuggestions : envatoKeywords).map((suggestion, index) => (
                                        <Chip
                                            key={index}
                                            label={suggestion}
                                            size="small"
                                            variant="outlined"
                                            color="default"
                                            onClick={() => {
                                                setSearchQuery(suggestion);
                                                if (activeTab === 'google') {
                                                    searchGoogleImages(suggestion);
                                                } else if (activeTab === 'envato') {
                                                    searchEnvatoImages(suggestion);
                                                } else if (activeTab === 'envatoClips') {
                                                    searchEnvatoClips(suggestion);
                                                }
                                            }}
                                            sx={{
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                color: 'text.secondary',
                                                height: 'auto',
                                                alignItems: 'flex-start',
                                                maxWidth: '100%',
                                                '& .MuiChip-label': {
                                                    fontSize: '1rem',
                                                    fontWeight: 500,
                                                    lineHeight: 1.5,
                                                    whiteSpace: 'normal',
                                                    overflow: 'visible',
                                                    textOverflow: 'unset',
                                                    display: 'block'
                                                },
                                                '&:hover': {
                                                    backgroundColor: 'action.hover',
                                                    borderColor: PRIMARY.main,
                                                    color: 'text.primary',
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                                {/* Selection Actions */}
                                {currentImages.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', mt: 1, width: '100%' }}>
                                        <Button
                                            size="large"
                                            variant="contained"
                                            onClick={handleDone}
                                            sx={{
                                                borderRadius: 1,
                                                background: PRIMARY.main,
                                                '&:hover': { background: PRIMARY.dark }
                                            }}
                                        >
                                            Done
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                </Box>
            </Box>

            {/* Error Display */}
            {
                currentError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {currentError}
                    </Alert>
                )
            }

            {/* Main Content with Transitions Sidebar */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={12} lg={12}>
                        {currentLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                                <CircularProgress />
                                <Typography sx={{ ml: 2 }}>
                                    Searching {activeTab === 'google' ? 'Google' : 'Envato'} images...
                                </Typography>
                            </Box>
                        ) : (activeTab === 'youtube') ? (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                                    YouTube integration coming soon
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    We will add YouTube API support here shortly.
                                </Typography>
                            </Box>
                        ) : (activeTab === 'upload') ? (
                            uploadedFiles.length > 0 ? (
                                <Grid container spacing={2}>
                                    {uploadedFiles.map((file, index) => (
                                        <Grid item xs={12} sm={4} md={4} key={file.id}>
                                            <Card
                                                sx={{
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                    border: selectedBySource.upload.has(file.url)
                                                        ? `2px solid ${WARNING.main}`
                                                        : '2px solid transparent',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: 3
                                                    }
                                                }}
                                            >
                                                <Box sx={{ position: 'relative' }}>
                                                    {file.mime.startsWith('video/') ? (
                                                        <Box sx={{ position: 'relative', width: '100%', height: 140 }}>
                                                            <img
                                                                src={file.thumbnail}
                                                                alt={file.title}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                                onClick={() => handleImageSelect(file.url)}
                                                            />
                                                            <Box sx={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <Box
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        setVideoPreviewUrl(file.url); 
                                                                        setVideoPreviewOpen(true); 
                                                                    }}
                                                                    sx={{
                                                                        width: 52,
                                                                        height: 52,
                                                                        borderRadius: '50%',
                                                                        backgroundColor: 'rgba(0,0,0,0.55)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M8 5v14l11-7z" />
                                                                    </svg>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <CardMedia
                                                            component="img"
                                                            height="140"
                                                            image={file.thumbnail}
                                                            alt={file.title}
                                                            sx={{ objectFit: 'cover' }}
                                                            onClick={() => handleImageSelect(file.url)}
                                                        />
                                                    )}

                                                    {/* Selection Overlay */}
                                                    {selectedBySource.upload.has(file.url) && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '50%',
                                                                backgroundColor: WARNING.main,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            <CheckIcon sx={{ fontSize: 16 }} />
                                                        </Box>
                                                    )}

                                                    {/* Source Badge */}
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            left: 8,
                                                            bgcolor: SUCCESS.main,
                                                            color: 'white',
                                                            fontSize: '0.6rem',
                                                            px: 0.5,
                                                            py: 0.1,
                                                            borderRadius: 0.5,
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        UPLOAD
                                                    </Box>

                                                    {/* Action Buttons */}
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 8,
                                                            right: 8,
                                                            display: 'flex',
                                                            gap: 0.5
                                                        }}
                                                    >
                                                        {!file.mime.startsWith('video/') && (
                                                            <Tooltip title="Preview">
                                                                <IconButton
                                                                    size="medium"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleImagePreview(file.url);
                                                                    }}
                                                                    sx={{
                                                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                                                        '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                                                    }}
                                                                >
                                                                    <PreviewIcon sx={{ fontSize: 16, color: PRIMARY.main }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Download">
                                                            <IconButton
                                                                size="medium"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownloadImage(file.url, file.title);
                                                                }}
                                                                sx={{
                                                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                                                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                                                }}
                                                            >
                                                                <DownloadIcon sx={{ fontSize: 16, color: PRIMARY.main }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>

                                                <CardContent sx={{ p: 1 }}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            fontSize: '1rem',
                                                            lineHeight: 1.4,
                                                            color: 'text.secondary'
                                                        }}
                                                    >
                                                        {file.title}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Box
                                        component="label"
                                        htmlFor="file-upload"
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            height: 200,
                                            border: '2px dashed',
                                            borderColor: 'primary.main',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: 'primary.dark',
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <Box sx={{ mb: 2 }}>
                                            <Image src="/images/cloud-computing.png" alt="Upload" width={64} height={64} />
                                        </Box>
                                        <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                                            Click to upload image or video
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Supports images and video files
                                        </Typography>
                                    </Box>
                                </Box>
                            )
                        ) : currentImages.length > 0 ? (
                            <>
                            <Grid container spacing={2}>
                                {currentImages.map((image, index) => (
                                    <Grid item xs={12} sm={4} md={4} key={image.id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                cursor: 'pointer',
                                                border: ((image.source === 'envatoClips' ? selectedBySource.envatoClips.has(image.url) : selectedBySource[image.source || 'google']?.has(image.url)))
                                                    ? `2px solid ${image.suggestionIndex === -1 ? SUCCESS.main : (image.source === 'envato' ? WARNING.main : PRIMARY.main)}`
                                                    : '2px solid transparent',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: 3
                                                }
                                            }}
                                        >
                                            <Box sx={{ position: 'relative' }}>
                                                {activeTab === 'envatoClips' ? (
                                                    <Box sx={{ position: 'relative', width: '100%', height: 140 }}>
                                                        <img
                                                            src={image.thumbnail || '/images/youtube.png'}
                                                            alt={image.title}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                try {
                                                                    const selectedUrl = image.url;
                                                                    // ensure consistent single-selection across tabs
                                                                    handleImageSelect(selectedUrl);
                                                                    const updatedSceneData: any = {
                                                                        assets: {
                                                                            images: [selectedUrl],
                                                                            imagesGoogle: [],
                                                                            imagesEnvato: []
                                                                        }
                                                                    };
                                                                    if (currentKeywordForMapping) {
                                                                        const typed = (searchQuery || '').trim();
                                                                        updatedSceneData.keywordsSelectedMerge = {
                                                                            [currentKeywordForMapping]: [selectedUrl]
                                                                        };
                                                                        if (typed && typed.toLowerCase() !== currentKeywordForMapping.toLowerCase()) {
                                                                            updatedSceneData.modifiedKeywordForMapping = typed;
                                                                        }
                                                                    }
                                                                    onSceneDataUpdate(SceneDataIndex, updatedSceneData);
                                                                    // notify parent selection if needed
                                                                    try { onImageSelect(selectedUrl); } catch { }
                                                                    HelperFunctions.showSuccess('Added video link to SceneData');
                                                                } catch (e) {
                                                                    HelperFunctions.showError('Failed to add video link');
                                                                }
                                                            }}
                                                        />
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }} onClick={() => handleImageSelect(image.url)}>
                                                            <Box
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    handleImageSelect(image.url); 
                                                                    setVideoPreviewUrl(image.url); 
                                                                    setVideoPreviewOpen(true); 
                                                                }}
                                                                sx={{
                                                                    width: 52,
                                                                    height: 52,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <CardMedia
                                                        component="img"
                                                        height="140"
                                                    image={image.thumbnail}
                                                    alt={image.title}
                                                        sx={{ objectFit: 'cover' }}
                                                        onClick={() => handleImageSelect(image.url)}
                                                    />
                                                )}

                                                {/* Selection Overlay */}
                                                {((image.source === 'envatoClips' ? selectedBySource.envatoClips.has(image.url) : selectedBySource[image.source || 'google']?.has(image.url))) && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: '50%',
                                                            backgroundColor: image.suggestionIndex === -1 ? SUCCESS.main : (image.source === 'envato' || image.source === 'envatoClips' ? WARNING.main : PRIMARY.main),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <CheckIcon sx={{ fontSize: 16 }} />
                                                    </Box>
                                                )}

                                                {/* Source Badge */}
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        left: 8,
                                                        bgcolor: image.source === 'envato' ? WARNING.main : INFO.main,
                                                        color: 'white',
                                                        fontSize: '0.6rem',
                                                        px: 0.5,
                                                        py: 0.1,
                                                        borderRadius: 0.5,
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {image.source?.toUpperCase() || 'IMG'}
                                                </Box>

                                                    {/* Action Buttons */}
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 8,
                                                            right: 8,
                                                            display: 'flex',
                                                        gap: 0.5
                                                    }}
                                                >
                                                    {activeTab !== 'envatoClips' && (
                                                        <Tooltip title="Preview">
                                                            <IconButton
                                                                size="medium"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleImagePreview(image.url);
                                                                }}
                                                                sx={{
                                                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                                                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                                                }}
                                                            >
                                                                <PreviewIcon sx={{ fontSize: 16, color: PRIMARY.main }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Download">
                                                        <IconButton
                                                            size="medium"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadImage(image.url, `${image.source}-image-${index + 1}.jpg`);
                                                            }}
                                                            sx={{
                                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                                '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                                            }}
                                                        >
                                                            <DownloadIcon sx={{ fontSize: 16, color: PRIMARY.main }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>

                                            <CardContent sx={{ p: 1 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        fontSize: '1rem',
                                                        lineHeight: 1.4,
                                                        color: 'text.secondary'
                                                    }}
                                                >
                                                    {image.title}
                                                </Typography>

                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                            {/* Load More Button for Google Images */}
                            {activeTab === 'google' && googleHasMore && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={loadMoreGoogleImages}
                                        disabled={googleLoadingMore}
                                        startIcon={googleLoadingMore ? <CircularProgress size={20} /> : null}
                                        sx={{
                                            minWidth: 200,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            borderColor: PRIMARY.main,
                                            color: PRIMARY.main,
                                            '&:hover': {
                                                borderColor: PRIMARY.dark,
                                                backgroundColor: PRIMARY.light,
                                                color: PRIMARY.dark
                                            }
                                        }}
                                    >
                                        {googleLoadingMore ? 'Loading...' : 'Load More'}
                                    </Button>
                                </Box>
                            )}
                        </>
                        ) : searchQuery && !currentLoading ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    No images found for "{searchQuery}" in {activeTab === 'google' ? 'Google' : 'Envato'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Try adjusting your search terms or switch to the other tab
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 2,
                                    mx: 'auto',
                                    mb: 2,
                                    background: activeTab === 'google' ? PURPLE.gradient.blue : SUCCESS.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {activeTab === 'google' ?
                                        <GoogleIcon sx={{ fontSize: 40, color: NEUTRAL.white }} /> :
                                        <EnvatoIcon sx={{ fontSize: 40, color: NEUTRAL.white }} />
                                    }
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                                    Search for Images in {activeTab === 'google' ? 'Google' : 'Envato Images'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                                    Enter a search query to find relevant images for your SceneData.
                                    {activeTab === 'google' ?
                                        ' Google provides free images from across the web.' :
                                        ' Envato Images provides premium stock images, graphics, and templates.'
                                    }
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Box>

            {/* Video Preview Dialog for Envato Clips */}
            <Dialog open={videoPreviewOpen} onClose={() => setVideoPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
                    {videoPreviewUrl && (
                        <video src={videoPreviewUrl} controls autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
                    )}
                </DialogContent>
            </Dialog>

        </Box >
    );
};

export default ImageSearch;

