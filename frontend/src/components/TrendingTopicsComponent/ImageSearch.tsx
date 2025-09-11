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
import { toast } from 'react-toastify';
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
    source?: 'google' | 'envato';
}

interface ImageSearchProps {
    chapterNarration: string;
    onImageSelect: (imageUrl: string) => void;
    onImagePreview: (imageUrl: string) => void;
    chapterIndex: number;
    onChapterUpdate: (chapterIndex: number, updatedChapter: any) => void;
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
}

type TabValue = 'google' | 'envato' | 'envatoClips' | 'youtube' | 'upload';

const ImageSearch: React.FC<ImageSearchProps> = ({
    chapterNarration,
    onImageSelect,
    onImagePreview,
    chapterIndex,
    onChapterUpdate,
    onDone,
    existingImageUrls = [],
    onClearSelection,
    suggestionKeywords = [],
    autoSearchOnMount = false,
    onDoneWithSelected,
    currentKeywordForMapping
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
    const [selectedBySource, setSelectedBySource] = useState<{ google: Set<string>; envato: Set<string>; envatoClips: Set<string> }>({ google: new Set(), envato: new Set(), envatoClips: new Set() });
    const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
    const [envatoKeywords, setEnvatoKeywords] = useState<string[]>([]);
    const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);


    // Ref to prevent duplicate API calls when useEffect runs multiple times
    const hasInitialSearch = useRef(false);

    const currentImages = activeTab === 'google' ? googleImages : activeTab === 'envato' ? envatoImages : envatoClips;
    const currentLoading = activeTab === 'google' ? googleLoading : envatoLoading;
    const currentError = activeTab === 'google' ? googleError : envatoError;

    // Search Google Images
    const searchGoogleImages = async (query: string, suggestions: string[] = []) => {
        setGoogleLoading(true);
        setGoogleError(null);

        try {
            const combinedQuery = suggestions.length > 0 ? createCombinedSearchQuery(suggestions) : query;

            const response = await fetch(API_ENDPOINTS.GOOGLE_IMAGE_SEARCH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: combinedQuery,
                    page: 1,
                    imagesPerPage: 10
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorMessage = data.error || 'Failed to search Google images';
                const errorDetails = data.details ? ` (${data.details})` : '';
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            const data = await response.json();

            const imagesWithSource = (data.images || []).map((img: any, index: number) => ({
                ...img,
                source: 'google' as const,
                sourceSuggestion: suggestions.length > 0 ? suggestions[index % suggestions.length] : undefined,
                suggestionIndex: suggestions.length > 0 ? index % suggestions.length : undefined
            }));

            setGoogleImages(imagesWithSource);
            checkAndSelectExistingImages(imagesWithSource, 'google');

            toast.success(`Found ${imagesWithSource.length} Google images`);

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred searching Google images';
            setGoogleError(errorMsg);
            setGoogleImages([]);
            toast.error(errorMsg);
        } finally {
            setGoogleLoading(false);
        }
    };

    // Search Envato Images
    const searchEnvatoImages = async (query: string) => {
        setEnvatoLoading(true);
        setEnvatoError(null);

        try {
            const response = await fetch(API_ENDPOINTS.ENVATO_IMAGE_SEARCH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    page: 1
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorMessage = data.error || 'Failed to search Envato images';
                const errorDetails = data.details ? ` (${data.details})` : '';
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            const data = await response.json();

            const imagesWithSource = (data.images || []).map((img: any) => ({
                ...img,
                source: 'envato' as const
            }));

            setEnvatoImages(imagesWithSource);
            checkAndSelectExistingImages(imagesWithSource, 'envato');

            toast.success(`Found ${imagesWithSource.length} Envato images`);

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred searching Envato images';
            setEnvatoError(errorMsg);
            setEnvatoImages([]);
            toast.error(errorMsg);
        } finally {
            setEnvatoLoading(false);
        }
    };

    // Search Envato Clips (videos)
    const searchEnvatoClips = async (query: string) => {
        setEnvatoLoading(true);
        setEnvatoError(null);

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
                id: clip.id || clip.url,
                url: clip.url,
                thumbnail: clip.thumbnail || clip.url,
                title: clip.title || 'Clip',
                context: clip.context || '',
                width: clip.width || 0,
                height: clip.height || 0,
                size: clip.size || '',
                mime: clip.mime || 'video/mp4',
                source: 'envato' as const
            }));

            setEnvatoClips(clipsWithSource);
            checkAndSelectExistingImages(clipsWithSource, 'envatoClips');
            toast.success(`Found ${clipsWithSource.length} Envato clips`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An error occurred searching Envato clips';
            setEnvatoError(errorMsg);
            setEnvatoClips([]);
            toast.error(errorMsg);
        } finally {
            setEnvatoLoading(false);
        }
    };

    // Create a comprehensive search query by combining all suggestions
    const createCombinedSearchQuery = (suggestions: string[]): string => {
        if (suggestions.length === 0) return '';

        const cleanSuggestions = suggestions.map(suggestion =>
            suggestion.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ')
        );

        const uniqueSuggestions = Array.from(new Set(cleanSuggestions))
            .filter(suggestion => suggestion.length > 2);

        if (uniqueSuggestions.length === 0) return suggestions[0];
        if (uniqueSuggestions.length === 1) return uniqueSuggestions[0];

        const relevantSuggestions = uniqueSuggestions.slice(0, Math.min(4, uniqueSuggestions.length));

        let combinedQuery = '';
        if (relevantSuggestions.length === 2) {
            combinedQuery = `${relevantSuggestions[0]} and ${relevantSuggestions[1]}`;
        } else if (relevantSuggestions.length === 3) {
            combinedQuery = `${relevantSuggestions[0]}, ${relevantSuggestions[1]}, and ${relevantSuggestions[2]}`;
        } else if (relevantSuggestions.length >= 4) {
            combinedQuery = `${relevantSuggestions[0]}, ${relevantSuggestions[1]}, ${relevantSuggestions[2]}, and ${relevantSuggestions[3]}`;
        }

        if (combinedQuery.length > 100) {
            combinedQuery = relevantSuggestions.slice(0, 3).join(' ');
        }

        return combinedQuery;
    };

    // Function to check if existing image URLs match API response images and auto-select them
    const checkAndSelectExistingImages = (apiImages: ImageResult[], source: 'google' | 'envato' | 'envatoClips') => {
        if (existingImageUrls.length === 0) return;

        // Enforce single selection: pick the first matching URL only
        const firstMatch = existingImageUrls.find((existingUrl) => apiImages.some(apiImage => apiImage.url === existingUrl));
        if (firstMatch) {
            setSelectedBySource({ google: new Set(source === 'google' ? [firstMatch] : []), envato: new Set(source === 'envato' ? [firstMatch] : []), envatoClips: new Set(source === 'envatoClips' ? [firstMatch] : []) });
        }
    };

    // Generate meaningful queries for Google (phrases)
    const generateGoogleQueries = (narration: string): string[] => {
        if (!narration) return [];

        const suggestions: string[] = [];
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

        return Array.from(new Set(suggestions)).slice(0, 5);
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

    // Auto-generate suggestions from chapter narration and auto-search
    useEffect(() => {
        // If explicit suggestion keywords provided, use them first
        if (autoSearchOnMount && suggestionKeywords && suggestionKeywords.length > 0 && !hasInitialSearch.current) {
            hasInitialSearch.current = true;
            // Apply suggestions to both Google and Envato
            setGoogleSuggestions(suggestionKeywords);
            setEnvatoKeywords(suggestionKeywords);
            // Trigger both searches using provided suggestions
            searchGoogleImages('', suggestionKeywords);
            const keywordsJoined = suggestionKeywords.join(' ');
            searchEnvatoImages(keywordsJoined);
            searchEnvatoClips(keywordsJoined);
            return;
        }

        if (chapterNarration && !hasInitialSearch.current) {
            const gSuggestions = generateGoogleQueries(chapterNarration);
            const eKeywords = generateEnvatoWords(chapterNarration);
            setGoogleSuggestions(gSuggestions);
            setEnvatoKeywords(eKeywords);

            if (gSuggestions.length > 0 || eKeywords.length > 0) {
                hasInitialSearch.current = true;
                // Search both APIs using their respective suggestions/keywords
                searchGoogleImages('', gSuggestions);
                const ek = eKeywords.join(' ');
                searchEnvatoImages(ek);
                searchEnvatoClips(ek);
            }
        }
    }, [chapterNarration]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            if (activeTab === 'google') {
                searchGoogleImages(searchQuery.trim());
            } else {
                searchEnvatoImages(searchQuery.trim());
            }
        }
    };

    const handleSearchBoth = () => {
        if (searchQuery.trim()) {
            const query = searchQuery.trim();
            const gSuggestions = generateGoogleQueries(query);
            const eKeywords = generateEnvatoWords(query);
            searchGoogleImages(query, gSuggestions);
            searchEnvatoImages(eKeywords.join(' '));
            toast.info('Searching both Google and Envato...');
        }
    };

    const handleSearchQueryChange = (newQuery: string) => {
        setSearchQuery(newQuery);
        if (newQuery.trim()) {
            setGoogleSuggestions(generateGoogleQueries(newQuery));
            setEnvatoKeywords(generateEnvatoWords(newQuery));
        } else if (chapterNarration) {
            setGoogleSuggestions(generateGoogleQueries(chapterNarration));
            setEnvatoKeywords(generateEnvatoWords(chapterNarration));
        }
    };

    const handleImageSelect = (imageUrl: string) => {
        const sourceKey: 'google' | 'envato' | 'envatoClips' = activeTab === 'envato' ? 'envato' : (activeTab === 'envatoClips' ? 'envatoClips' : 'google');
        const isSelected = selectedBySource[sourceKey].has(imageUrl);
        if (isSelected) {
            // Unselect if already selected
            setSelectedBySource({ google: new Set(), envato: new Set(), envatoClips: new Set() });
        } else {
            // Enforce single selection across both sources
            setSelectedBySource({ google: new Set(sourceKey === 'google' ? [imageUrl] : []), envato: new Set(sourceKey === 'envato' ? [imageUrl] : []), envatoClips: new Set(sourceKey === 'envatoClips' ? [imageUrl] : []) });
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
            toast.success('Image downloaded successfully');
        } catch (error) {
            console.error('Failed to download image:', error);
            toast.error('Failed to download image');
        }
    };

    const toggleSelectAll = () => { };

    const handleDone = () => {
        // Single selection across tabs
        const selectedUrl = selectedBySource.google.values().next().value || selectedBySource.envato.values().next().value || selectedBySource.envatoClips.values().next().value;
        if (selectedUrl) {
            const isGoogle = selectedBySource.google.size === 1 && selectedBySource.google.has(selectedUrl);
            const isEnvato = selectedBySource.envato.size === 1 && selectedBySource.envato.has(selectedUrl);
            const isEnvatoClip = selectedBySource.envatoClips.size === 1 && selectedBySource.envatoClips.has(selectedUrl);
            const updatedChapter: any = {
                assets: {
                    images: [selectedUrl],
                    imagesGoogle: isGoogle ? [selectedUrl] : [],
                    imagesEnvato: isEnvato ? [selectedUrl] : []
                }
            };
            if (currentKeywordForMapping) {
                updatedChapter.keywordsSelectedMerge = {
                    [currentKeywordForMapping]: [selectedUrl]
                };
                const typed = (searchQuery || '').trim();
                if (typed && typed.toLowerCase() !== currentKeywordForMapping.toLowerCase()) {
                    updatedChapter.modifiedKeywordForMapping = typed;
                }
            }
            onChapterUpdate(chapterIndex, updatedChapter);
            toast.success('1 image selected for chapter');
            if (onDoneWithSelected) {
                const typed = (searchQuery || '').trim();
                const mk = (currentKeywordForMapping && typed && typed.toLowerCase() !== currentKeywordForMapping.toLowerCase()) ? typed : undefined;
                onDoneWithSelected([selectedUrl], mk);
            }
        } else {
            toast.info('Please select one image');
        }
        onDone();
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
        setActiveTab(newValue);
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
                    <Tab
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
                                {/* <EnvatoIcon sx={{ fontSize: 18 }} /> */}
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
                    />
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
                    <Tab
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
                                    <Image src="/images/youtube.jpg" alt="Youtube" fill style={{ objectFit: 'cover' }} />
                                </Box>
                                <Badge badgeContent={envatoClips.length} color="secondary" sx={{ fontSize: '16px' }} showZero={false}>
                                    YouTube Clips
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
                                    <Image src="/images/envato_icon.jpg" alt="Envato" fill style={{ objectFit: 'cover' }} />
                                </Box>
                                <Badge badgeContent={envatoClips.length} color="secondary" sx={{ fontSize: '16px' }} showZero={false}>
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
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                                mr: 1,
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                color: 'text.secondary',
                                                height: 36,
                                                '& .MuiChip-label': {
                                                    fontSize: '1rem',
                                                    fontWeight: 500,
                                                    lineHeight: 1.5
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
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
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

            {/* Images Grid */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {currentLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>
                            Searching {activeTab === 'google' ? 'Google' : 'Envato'} images...
                        </Typography>
                    </Box>
                ) : currentImages.length > 0 ? (
                    <Grid container spacing={2}>
                        {currentImages.map((image, index) => (
                            <Grid item xs={6} sm={4} md={3} key={image.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        border: (selectedBySource[image.source || 'google']?.has(image.url))
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
                                            <Box
                                                onClick={() => { setVideoPreviewUrl(image.url); setVideoPreviewOpen(true); }}
                                                sx={{ position: 'relative', width: '100%', height: 140, cursor: 'pointer' }}
                                            >
                                                <img
                                                    src={image.thumbnail || '/images/youtube.jpg'}
                                                    alt={image.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                                <Box sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Box sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
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
                                        {(selectedBySource[image.source || 'google']?.has(image.url)) && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    backgroundColor: image.suggestionIndex === -1 ? SUCCESS.main : (image.source === 'envato' ? WARNING.main : PRIMARY.main),
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
                                            <Tooltip title="Preview">
                                                <IconButton
                                                    size="medium"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (activeTab === 'envatoClips') {
                                                            setVideoPreviewUrl(image.url);
                                                            setVideoPreviewOpen(true);
                                                        } else {
                                                            handleImagePreview(image.url);
                                                        }
                                                    }}
                                                    sx={{
                                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                                        '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                                    }}
                                                >
                                                    <PreviewIcon sx={{ fontSize: 16, color: PRIMARY.main }} />
                                                </IconButton>
                                            </Tooltip>
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
                            Enter a search query to find relevant images for your chapter.
                            {activeTab === 'google' ?
                                ' Google provides free images from across the web.' :
                                ' Envato Images provides premium stock images, graphics, and templates.'
                            }
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Video Preview Dialog for Envato Clips */}
            <Dialog open={videoPreviewOpen} onClose={() => setVideoPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
                    {videoPreviewUrl && (
                        <video src={'https://previews.customer.envatousercontent.com/8a627632-09af-472a-9ddd-bc3006a82635/watermarked_preview/watermarked_preview.mp4'} controls autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
                        // <video src={videoPreviewUrl} controls autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
                    )}
                </DialogContent>
            </Dialog>

        </Box >
    );
};

export default ImageSearch;

