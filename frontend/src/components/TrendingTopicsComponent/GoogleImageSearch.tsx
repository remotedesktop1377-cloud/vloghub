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
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Visibility as PreviewIcon,
    Download as DownloadIcon,
    Check as CheckIcon,
    AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL } from '../../styles/colors';
import { API_ENDPOINTS } from '../../config/apiEndpoints';

interface GoogleImage {
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
}

interface GoogleImageSearchProps {
    chapterNarration: string;
    onImageSelect: (imageUrl: string) => void;
    onImagePreview: (imageUrl: string) => void;
    chapterIndex: number;
    onChapterUpdate: (chapterIndex: number, updatedChapter: any) => void;
    onDone: () => void;
    existingImageUrls?: string[];
}

const GoogleImageSearch: React.FC<GoogleImageSearchProps> = ({
    chapterNarration,
    onImageSelect,
    onImagePreview,
    chapterIndex,
    onChapterUpdate,
    onDone,
    existingImageUrls = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [images, setImages] = useState<GoogleImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    // Ref to prevent duplicate API calls when useEffect runs multiple times
    const hasInitialSearch = useRef(false);



    // Search all suggestions by combining them into a single query
    // Note: Google API limit is 10 images per request, so we'll get max 10 images
    const searchAllSuggestions = async (suggestions: string[]) => {
        if (suggestions.length === 0) return;

        setLoading(true);
        setError(null);
        setImages([]);
        setSelectedImages(new Set());

        try {
            // Create a single comprehensive search query from all suggestions
            const combinedQuery = createCombinedSearchQuery(suggestions);



            // Make a single API call with the combined query
            const response = await fetch(API_ENDPOINTS.GOOGLE_IMAGE_SEARCH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: combinedQuery,
                    page: 1,
                    imagesPerPage: 10 // Google API limit is 10 images per request
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorMessage = data.error || 'Failed to search images';
                const errorDetails = data.details ? ` (${data.details})` : '';
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            const data = await response.json();

            // Add source suggestion info to each image (distribute across suggestions)
            const imagesWithSource = (data.images || []).map((img: any, index: number) => {
                const suggestionIndex = index % suggestions.length;
                const sourceSuggestion = suggestions[suggestionIndex];

                return {
                    ...img,
                    sourceSuggestion,
                    suggestionIndex
                };
            });

            setImages(imagesWithSource);

            // Check for existing selected images and auto-select them
            checkAndSelectExistingImages(imagesWithSource);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    // Create a comprehensive search query by combining all suggestions
    const createCombinedSearchQuery = (suggestions: string[]): string => {
        if (suggestions.length === 0) return '';

        // Clean and normalize each suggestion
        const cleanSuggestions = suggestions.map(suggestion =>
            suggestion.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ')
        );

        // Remove duplicates and very short suggestions
        const uniqueSuggestions = Array.from(new Set(cleanSuggestions))
            .filter(suggestion => suggestion.length > 2);

        if (uniqueSuggestions.length === 0) return '';

        if (uniqueSuggestions.length === 1) {
            return uniqueSuggestions[0];
        }

        // Combine suggestions intelligently
        // Take the first 3-4 most relevant suggestions and combine them
        const relevantSuggestions = uniqueSuggestions.slice(0, Math.min(4, uniqueSuggestions.length));

        // Create a natural-sounding combined query
        let combinedQuery = '';

        if (relevantSuggestions.length === 2) {
            combinedQuery = `${relevantSuggestions[0]} and ${relevantSuggestions[1]}`;
        } else if (relevantSuggestions.length === 3) {
            combinedQuery = `${relevantSuggestions[0]}, ${relevantSuggestions[1]}, and ${relevantSuggestions[2]}`;
        } else if (relevantSuggestions.length >= 4) {
            combinedQuery = `${relevantSuggestions[0]}, ${relevantSuggestions[1]}, ${relevantSuggestions[2]}, and ${relevantSuggestions[3]}`;
        }

        // If the combined query is too long, truncate it
        if (combinedQuery.length > 100) {
            combinedQuery = relevantSuggestions.slice(0, 3).join(' ');
        }

        return combinedQuery;
    };

    // Function to check if existing image URLs match API response images and auto-select them
    // Also adds missing existing images to the beginning of the images array
    const checkAndSelectExistingImages = (apiImages: GoogleImage[]) => {
        if (existingImageUrls.length === 0) {
            return;
        }
        
        const matchingUrls = new Set<string>();
        const missingExistingImages: GoogleImage[] = [];
        
        // Check each existing image URL
        existingImageUrls.forEach((existingUrl, index) => {
            const foundInApi = apiImages.some(apiImage => apiImage.url === existingUrl);
            
            if (foundInApi) {
                // Image exists in API response - mark as matching
                matchingUrls.add(existingUrl);
            } else {
                // Image doesn't exist in API response - add to missing list
                missingExistingImages.push({
                    id: `existing-${existingUrl.slice(-10)}`, // Generate unique ID
                    url: existingUrl,
                    thumbnail: existingUrl, // Use full URL as thumbnail
                    title: 'Previously Selected Image',
                    context: 'This image was previously selected for this chapter',
                    width: 800, // Default dimensions
                    height: 600,
                    size: 'Unknown',
                    mime: 'image/jpeg',
                    sourceSuggestion: 'Previously Selected',
                    suggestionIndex: -1 // Special index for existing images
                });
            }
        });
        
        // Combine missing existing images with API images (existing images first)
        if (missingExistingImages.length > 0) {
            const combinedImages = [...missingExistingImages, ...apiImages];
            setImages(combinedImages);
        }
        
        // Auto-select all existing images (both matching and missing)
        if (existingImageUrls.length > 0) {
            setSelectedImages(new Set(existingImageUrls));
        }
    };

    // Auto-generate search query from chapter narration and auto-search all suggestions
    useEffect(() => {
        if (chapterNarration && !hasInitialSearch.current) {
            // Generate suggested queries
            const suggestions = generateSuggestedQueries(chapterNarration);
            setSuggestedQueries(suggestions);

            // Auto-search all suggested queries if available
            if (suggestions.length > 0) {
                hasInitialSearch.current = true;
                searchAllSuggestions(suggestions);
            }
        }
    }, [chapterNarration]);

    // Enhanced search query generation
    const generateEnhancedSearchQuery = (narration: string): string => {
        if (!narration) return '';

        // Clean and normalize the narration
        let cleanNarration = narration
            .replace(/[^\w\s]/g, ' ') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        // Extract key concepts (nouns, adjectives, main topics)
        const words = cleanNarration.split(' ');

        // Filter out common stop words and short words
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
        ]);

        const meaningfulWords = words
            .filter(word =>
                word.length > 2 &&
                !stopWords.has(word.toLowerCase()) &&
                !/^\d+$/.test(word) // Not just numbers
            )
            .slice(0, 6); // Take up to 6 meaningful words

        // If we have meaningful words, use them
        if (meaningfulWords.length > 0) {
            return meaningfulWords.join(' ');
        }

        // Fallback: use first 5 words if no meaningful words found
        return words.slice(0, 5).join(' ');
    };

    // Generate suggested search queries
    const generateSuggestedQueries = (narration: string): string[] => {
        if (!narration) return [];

        const suggestions: string[] = [];

        // 1. Main concept query (what we already generate)
        const mainQuery = generateEnhancedSearchQuery(narration);
        if (mainQuery) suggestions.push(mainQuery);

        // 2. Extract key nouns and concepts
        const words = narration.toLowerCase().split(' ');
        const stopWordsSet = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
        ]);

        const keyConcepts = words
            .filter(word =>
                word.length > 3 &&
                !stopWordsSet.has(word) &&
                /^[a-z]+$/.test(word) // Only letters
            )
            .slice(0, 3);

        if (keyConcepts.length > 0) {
            suggestions.push(keyConcepts.join(' '));
        }

        // 3. Look for specific topics (technology, nature, business, etc.)
        const topicKeywords = {
            'technology': ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'data', 'algorithm', 'software', 'app', 'digital'],
            'nature': ['nature', 'landscape', 'mountain', 'ocean', 'forest', 'wildlife', 'environment', 'climate', 'earth'],
            'business': ['business', 'startup', 'entrepreneur', 'company', 'market', 'finance', 'investment', 'strategy'],
            'health': ['health', 'medical', 'fitness', 'wellness', 'nutrition', 'exercise', 'medicine', 'therapy'],
            'education': ['education', 'learning', 'student', 'teacher', 'school', 'university', 'knowledge', 'study']
        };

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => narration.toLowerCase().includes(keyword))) {
                const topicWords = keywords.filter(keyword => narration.toLowerCase().includes(keyword));
                if (topicWords.length > 0) {
                    suggestions.push(topicWords.slice(0, 3).join(' '));
                }
            }
        }

        // 4. Add visual descriptors
        const visualWords = words.filter(word =>
            ['beautiful', 'amazing', 'stunning', 'colorful', 'bright', 'dark', 'modern', 'vintage', 'abstract'].includes(word)
        );

        if (visualWords.length > 0 && keyConcepts.length > 0) {
            suggestions.push(`${visualWords[0]} ${keyConcepts[0]}`);
        }

        // Remove duplicates and limit to 5 suggestions
        const uniqueSuggestions = Array.from(new Set(suggestions));
        return uniqueSuggestions.slice(0, 5);
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            // Create a single search query from the user input
            const userQuery = searchQuery.trim();
            searchAllSuggestions([userQuery]);
        }
    };

    const handleSearchQueryChange = (newQuery: string) => {
        setSearchQuery(newQuery);

        // Generate new suggestions based on the new query
        if (newQuery.trim()) {
            const suggestions = generateSuggestedQueries(newQuery);
            setSuggestedQueries(suggestions);
        } else {
            // If query is empty, generate suggestions from chapter narration
            if (chapterNarration) {
                const suggestions = generateSuggestedQueries(chapterNarration);
                setSuggestedQueries(suggestions);
            }
        }

        // Clear any existing search results when query changes
        if (images.length > 0) {
            setImages([]);
            setSelectedImages(new Set());
        }
    };



    const handleImageSelect = (imageUrl: string) => {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(imageUrl)) {
            newSelected.delete(imageUrl);
        } else {
            newSelected.add(imageUrl);
        }
        setSelectedImages(newSelected);
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
        } catch (error) {
            console.error('Failed to download image:', error);
        }
    };

    const toggleSelectAll = () => {
        let newSelected: Set<string>;
        if (selectedImages.size === images.length) {
            newSelected = new Set();
        } else {
            newSelected = new Set(images.map(img => img.url));
        }
        setSelectedImages(newSelected);
    };

    const handleDone = () => {
        if (selectedImages.size > 0) {
            // Convert Set to Array for the chapter assets
            const selectedImageUrls = Array.from(selectedImages);

            // Create updated chapter with selected images in assets.images array
            const updatedChapter = {
                assets: {
                    images: selectedImageUrls
                }
            };

            // Update the chapter
            onChapterUpdate(chapterIndex, updatedChapter);


        }

        // Call the onDone callback to close the dialog
        onDone();
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Search Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>

                {/* Search Input */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type your search query or see auto-generated results from combined suggestions below..."
                        value={searchQuery}
                        onChange={(e) => handleSearchQueryChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                        startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            background: PURPLE.gradient.blue,
                            '&:hover': {
                                background: PURPLE.gradient.blue,
                                opacity: 0.9
                            }
                        }}
                    >
                        Search
                    </Button>
                </Box>

                {/* Suggested Queries */}
                {suggestedQueries.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                            Suggested searches (combined into single search for variety):
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {suggestedQueries.map((suggestion, index) => (
                                <Chip
                                    key={index}
                                    label={suggestion}
                                    size="small"
                                    variant="outlined"
                                    color="default"
                                    onClick={() => {
                                        setSearchQuery(suggestion);
                                        // Don't make another API call - just update the search query
                                        // The images are already loaded from the combined search
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            borderColor: PRIMARY.main
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontStyle: 'italic' }}>
                            💡 Single API call with combined suggestions for maximum efficiency!
                        </Typography>
                        {suggestedQueries.length > 0 && (
                            <Typography variant="caption" sx={{ color: 'info.main', mt: 1, display: 'block', fontWeight: 500 }}>
                                🔍 Combined search: "{createCombinedSearchQuery(suggestedQueries)}"
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Selection Actions */}
                {images.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={toggleSelectAll}
                                sx={{ borderRadius: 1 }}
                            >
                                {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                            </Button>

                            <Chip
                                label={`${selectedImages.size} of ${images.length} selected`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Box>

                        {/* Done Button */}
                        <Button
                            size="small"
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

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Images Grid */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <CircularProgress />
                    </Box>
                ) : images.length > 0 ? (
                    <>
                        <Grid container spacing={2}>
                            {images.map((image, index) => (
                                <Grid item xs={6} sm={4} md={3} key={image.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            cursor: 'pointer',
                                            border: selectedImages.has(image.url) 
                                                ? `2px solid ${image.suggestionIndex === -1 ? SUCCESS.main : PRIMARY.main}` 
                                                : '2px solid transparent',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 3
                                            }
                                        }}
                                    >
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={image.thumbnail}
                                                alt={image.title}
                                                sx={{ objectFit: 'cover' }}
                                                onClick={() => handleImageSelect(image.url)}
                                            />

                                            {/* Selection Overlay */}
                                            {selectedImages.has(image.url) && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        backgroundColor: image.suggestionIndex === -1 ? SUCCESS.main : PRIMARY.main,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white'
                                                    }}
                                                >
                                                    <CheckIcon sx={{ fontSize: 16 }} />
                                                </Box>
                                            )}
                                            
                                            {/* Previously Selected Badge */}
                                            {image.suggestionIndex === -1 && (
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
                                                    PREV
                                                </Box>
                                            )}

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
                                                        size="small"
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
                                                <Tooltip title="Download">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadImage(image.url, `image-${index + 1}.jpg`);
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

                                        <CardContent sx={{ p: 1.5 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.2,
                                                    fontSize: '0.75rem',
                                                    color: 'text.secondary'
                                                }}
                                            >
                                                {image.title}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={`${image.width}×${image.height}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                                />
                                                {image.sourceSuggestion && (
                                                    <Chip
                                                        label={image.sourceSuggestion}
                                                        size="small"
                                                        variant="filled"
                                                        color={image.suggestionIndex === -1 ? "secondary" : "primary"}
                                                        sx={{ fontSize: '0.6rem', height: 20 }}
                                                    />
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>


                    </>
                ) : searchQuery && !loading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No images found for "{searchQuery}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Try adjusting your search terms
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
                            background: PURPLE.gradient.blue,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <SearchIcon sx={{ fontSize: 40, color: NEUTRAL.white }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                            Search for Images
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                            Enter a search query to find relevant images for your chapter. The search will suggest queries based on your chapter narration. All suggestions are combined into one single API call for maximum efficiency!
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default GoogleImageSearch;
