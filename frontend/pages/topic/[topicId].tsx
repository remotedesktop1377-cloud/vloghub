import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
  Divider,
  Alert,
  Container,
  IconButton,
  CardMedia,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  TrendingUp as TrendingIcon,
  Twitter as TwitterIcon,
  ContentCut as CutIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Create as CreateIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';

interface TopicData {
  id: string;
  name: string;
  tweet_volume: number;
  url: string;
  promoted_content?: string;
  query: string;
  region: string;
}

const TopicDetailPage: React.FC = () => {
  const router = useRouter();
  const { topicId, region } = router.query;

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [hypothesis, setHypothesis] = useState('');
  const [duration, setDuration] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersGenerated, setChaptersGenerated] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editHeading, setEditHeading] = useState('');
  const [editNarration, setEditNarration] = useState('');

  const durationOptions = [
    { value: '1', label: '1 minutes' },
    { value: '3', label: '3 minutes' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
  ];

  const getHypothesisSuggestions = (topicName: string): string[] => {
    const name = topicName.toLowerCase();

    if (name.includes('cricket') || name.includes('sports') || name.includes('football')) {
      return [
        "How does this sport impact local economy and tourism?",
        "What are the social and cultural implications for the community?",
        "How can we improve youth engagement and development through sports?",
        "What role does this sport play in national identity and pride?"
      ];
    }

    if (name.includes('weather') || name.includes('climate')) {
      return [
        "How does climate change affect local agriculture and food security?",
        "What adaptation strategies can communities implement?",
        "How does extreme weather impact urban infrastructure and planning?",
        "What are the economic consequences of changing weather patterns?"
      ];
    }

    if (name.includes('food') || name.includes('restaurant')) {
      return [
        "How does this food trend reflect changing cultural preferences?",
        "What impact does this have on local farmers and suppliers?",
        "How can we make this food more accessible to different communities?",
        "What are the health and nutrition implications?"
      ];
    }

    if (name.includes('startup') || name.includes('tech') || name.includes('ai')) {
      return [
        "How can this technology solve local problems and challenges?",
        "What are the job market implications and skill requirements?",
        "How does this innovation impact traditional industries?",
        "What are the ethical considerations and potential risks?"
      ];
    }

    if (name.includes('music') || name.includes('fashion')) {
      return [
        "How does this trend reflect generational changes and values?",
        "What impact does this have on local artists and creators?",
        "How can we preserve cultural heritage while embracing new trends?",
        "What are the economic opportunities for local businesses?"
      ];
    }

    if (name.includes('education') || name.includes('school')) {
      return [
        "How can we improve access to quality education for all students?",
        "What role does technology play in modern learning?",
        "How do educational policies impact student outcomes?",
        "What are the challenges and opportunities in remote learning?"
      ];
    }

    if (name.includes('politics') || name.includes('news')) {
      return [
        "How does this political development affect local communities?",
        "What are the long-term implications for democracy and governance?",
        "How can citizens become more engaged in the political process?",
        "What are the economic and social consequences of this policy?"
      ];
    }

    if (name.includes('traffic') || name.includes('transport')) {
      return [
        "How can we improve public transportation infrastructure?",
        "What are the environmental impacts of current transport systems?",
        "How does traffic congestion affect local businesses and quality of life?",
        "What innovative solutions can reduce transportation costs?"
      ];
    }

    // Default suggestions for general topics
    return [
      "How does this topic impact local communities and daily life?",
      "What are the underlying causes and contributing factors?",
      "How can we address the challenges and leverage opportunities?",
      "What lessons can other regions learn from this situation?",
      "How does this reflect broader social, economic, or cultural trends?"
    ];
  };

  useEffect(() => {
    if (topicId && region) {
      // Fetch topic details from the API
      fetchTopicDetails(topicId as string, region as string);
    }
  }, [topicId, region]);

  const fetchTopicDetails = async (topicId: string, region: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trending-topics?region=${region}`);

      if (response.ok) {
        const data = await response.json();
        const foundTopic = data.trends.find((t: TopicData) => t.id === topicId);

        if (foundTopic) {
          setTopic({ ...foundTopic, region });
        } else {
          setError('Topic not found');
        }
      } else {
        setError('Failed to fetch topic details');
      }
    } catch (err) {
      console.error('Error fetching topic details:', err);
      setError('Failed to load topic details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChapters = async () => {
    if (!hypothesis.trim()) {
      setError('Please enter a hypothesis');
      return;
    }

    try {
      setGeneratingChapters(true);
      setError(null);
      setChapters([]);
      setChaptersGenerated(false);

      const response = await fetch('/api/generate-chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic?.name,
          hypothesis,
          duration: parseInt(duration)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generated chapters:', data);

        if (data.chapters && Array.isArray(data.chapters)) {
          setChapters(data.chapters);
          setChaptersGenerated(true);
          setError(null);
        } else {
          setError('Invalid response format from API');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || `Failed to generate chapters (${response.status})`);
      }
    } catch (err) {
      console.error('Error generating chapters:', err);
      setError('Failed to generate chapters. Please try again.');
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleBackToTopics = () => {
    router.push(`/?region=${topic?.region || 'pakistan'}`);
  };

  const formatTweetVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const handleAddChapter = () => {
    const newChapter = {
      id: (chapters.length + 1).toString(),
      heading: `New Chapter ${chapters.length + 1}`,
      narration: 'New chapter narration content will be generated here.',
      visuals: 'Visual direction for the new chapter.',
      brollIdeas: ['B-roll idea 1', 'B-roll idea 2', 'B-roll idea 3'],
      duration: '1 min'
    };

    setChapters([...chapters, newChapter]);
  };

  const handleAddChapterAfter = (index: number) => {
    const newChapter = {
      id: (chapters.length + 1).toString(),
      heading: `New Chapter ${chapters.length + 1}`,
      narration: 'New chapter narration content will be generated here.',
      visuals: 'Visual direction for the new chapter.',
      brollIdeas: ['B-roll idea 1', 'B-roll idea 2', 'B-roll idea 3'],
      duration: '1 min'
    };

    const updatedChapters = [...chapters];
    updatedChapters.splice(index + 1, 0, newChapter);
    setChapters(updatedChapters);
  };

  const handleDeleteChapter = (index: number) => {
    const updatedChapters = chapters.filter((_, i) => i !== index);
    setChapters(updatedChapters);
  };

  const handleEditChapter = (index: number) => {
    setEditingChapter(index);
    setEditHeading(chapters[index].heading || '');
    setEditNarration(chapters[index].narration || '');
  };

  const handleSaveEdit = (index: number) => {
    const updatedChapters = [...chapters];
    updatedChapters[index] = {
      ...updatedChapters[index],
      heading: editHeading,
      narration: editNarration
    };
    setChapters(updatedChapters);
    setEditingChapter(null);
    setEditHeading('');
    setEditNarration('');
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setEditHeading('');
    setEditNarration('');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    if (source.index === destination.index) return;
    
    const updatedChapters = Array.from(chapters);
    const [reorderedChapter] = updatedChapters.splice(source.index, 1);
    updatedChapters.splice(destination.index, 0, reorderedChapter);
    
    setChapters(updatedChapters);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Typography>Loading topic details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !topic) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Topic not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToTopics}
        >
          Back to Trending Topics
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToTopics}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Topic Details
        </Typography>
      </Box>

      {/* Selected Topic Display */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#1DA1F2',
              mr: 2,
              width: 56,
              height: 56,
              fontSize: '1.5rem'
            }}
          >
            <TrendingIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ wordBreak: 'break-word' }}>
              {topic.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                icon={<TwitterIcon />}
                label={`${formatTweetVolume(topic.tweet_volume)} tweets`}
                size="medium"
                variant="outlined"
                sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
              />
              {topic.promoted_content && (
                <Chip
                  label="Promoted"
                  size="medium"
                  color="secondary"
                  variant="outlined"
                />
              )}
              <Chip
                label={topic.region.toUpperCase()}
                size="medium"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Two Column Layout */}
      <Box sx={{ display: 'flex', gap: 3, }}>
        {/* Left Column - Topic Details, Hypothesis, Video Generation */}
        <Box sx={{ flex: 1 }}>

          {/* Hypothesis Input */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Hypothesis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Describe your hypothesis, angle, or unique perspective on this topic. This will help generate relevant video content.
            </Typography>

            {/* Hypothesis Suggestions */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                💡 Suggested hypotheses for "{topic.name}":
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {getHypothesisSuggestions(topic.name).map((suggestion: string, index: number) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    onClick={() => setHypothesis(suggestion)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(29, 161, 242, 0.1)',
                        borderColor: '#1DA1F2',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Enter your hypothesis, research question, or unique angle on this topic..."
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              sx={{ mb: 2 }}
            />

          </Paper>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Video Duration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the desired length for your generated video content.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={duration}
                  label="Duration"
                  onChange={(e) => setDuration(e.target.value)}
                >
                  {durationOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                size="large"
                startIcon={<CutIcon />}
                onClick={handleGenerateChapters}
                disabled={!hypothesis.trim() || generatingChapters}
                sx={{
                  bgcolor: '#1DA1F2',
                  '&:hover': { bgcolor: '#0d8bd9' },
                  px: 4,
                  py: 1.5
                }}
              >
                {generatingChapters ? 'Generating Chapters...' : 'Generate Chapters'}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Right Column - Chapters List */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, border: '2px dashed #e0e0e0', minHeight: '400px' }}>
                         {chaptersGenerated && chapters.length > 0 ? (
               <DragDropContext onDragEnd={handleDragEnd}>
                 <Droppable droppableId="chapters">
                   {(provided) => (
                     <Box 
                       {...provided.droppableProps}
                       ref={provided.innerRef}
                       sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                     >
                                       {chapters.map((chapter, index) => (
                         <Draggable key={chapter.id || index.toString()} draggableId={chapter.id || index.toString()} index={index}>
                           {(provided, snapshot) => (
                             <Card
                               ref={provided.innerRef}
                               {...provided.draggableProps}
                               variant="outlined"
                               sx={{
                                 borderColor: '#e0e0e0',
                                 borderRadius: 2,
                                 transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                 boxShadow: snapshot.isDragging ? 8 : 1,
                                 '&:hover': {
                                   boxShadow: 2,
                                   borderColor: '#1DA1F2',
                                   '& .chapter-actions': {
                                     opacity: 1,
                                   }
                                 }
                               }}
                             >
                                                   <CardContent sx={{ p: 3, height: 'auto' }}>
                                 <Box sx={{ display: 'flex', alignItems: 'flex-start', height: '100%' }}>
                                                                       {/* Drag Handle */}
                                    <Box 
                                      {...provided.dragHandleProps}
                                      sx={{ 
                                        mr: 2, 
                                        cursor: 'grab',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9c27b0',
                                        '&:active': { cursor: 'grabbing' },
                                        minHeight: '100%',
                                        alignSelf: 'stretch'
                                      }}
                                    >
                                      <DragIcon fontSize="small" />
                                    </Box>
                                   
                                   {/* Content */}
                                   <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-start', height: '100%' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              {editingChapter === index ? (
                                <TextField
                                  value={editHeading}
                                  onChange={(e) => setEditHeading(e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    flexGrow: 1,
                                    '& .MuiOutlinedInput-root': {
                                      fontWeight: 'bold',
                                      color: '#1DA1F2'
                                    }
                                  }}
                                />
                              ) : (
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1DA1F2' }}>
                                  {chapter.heading || `Chapter ${index + 1}`}
                                </Typography>
                              )}
                              <Chip
                                label={chapter.duration}
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: '#1DA1F2', color: '#1DA1F2', fontWeight: 'bold' }}
                              />
                            </Box> */}

                            {/* Narration Content */}
                            {editingChapter === index ? (
                              <TextField
                                value={editNarration}
                                onChange={(e) => setEditNarration(e.target.value)}
                                variant="outlined"
                                multiline
                                rows={4}
                                fullWidth
                                sx={{ mb: 2 }}
                              />
                            ) : (
                              <Box sx={{
                                p: 2,
                                bgcolor: '#f8f9fa',
                                borderRadius: 1,
                                border: '1px solid #e9ecef',
                                maxHeight: '200px',
                                overflow: 'auto',
                                mb: 2
                              }}>
                                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#495057' }}>
                                  {chapter.narration || 'Narration content will be generated here.'}
                                </Typography>
                              </Box>
                            )}

                            {/* Visuals */}
                            {/* {chapter.visuals && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                                  🎬 Visual Direction:
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  {chapter.visuals}
                                </Typography>
                              </Box>
                            )} */}

                            {/* B-roll Ideas */}
                            {/* {chapter.brollIdeas && chapter.brollIdeas.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                                  📹 B-roll Ideas:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {chapter.brollIdeas.map((idea: string, ideaIndex: number) => (
                                    <Chip
                                      key={ideaIndex}
                                      label={idea}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        borderColor: '#666',
                                        color: '#666',
                                        fontSize: '0.75rem'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )} */}
                          </Box>

                          {/* Chapter Actions */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                            {editingChapter === index ? (
                              <>
                                {/* Save Button */}
                                <IconButton
                                  size="small"
                                  onClick={() => handleSaveEdit(index)}
                                  sx={{
                                    color: '#4caf50',
                                    '&:hover': {
                                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                                      color: '#388e3c'
                                    },
                                    width: 36,
                                    height: 36,
                                  }}
                                  title="Save changes"
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>

                                {/* Cancel Button */}
                                <IconButton
                                  size="small"
                                  onClick={handleCancelEdit}
                                  sx={{
                                    color: '#ff9800',
                                    '&:hover': {
                                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                                      color: '#f57c00'
                                    },
                                    width: 36,
                                    height: 36,
                                  }}
                                  title="Cancel editing"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </>
                                                         ) : (
                               <>


                                 {/* Edit Chapter Button */}
                                 <IconButton
                                   className="chapter-actions"
                                   size="small"
                                   onClick={() => handleEditChapter(index)}
                                   sx={{
                                     opacity: 0,
                                     transition: 'opacity 0.2s ease',
                                     color: '#ff9800',
                                     '&:hover': {
                                       bgcolor: 'rgba(255, 152, 0, 0.1)',
                                       color: '#f57c00'
                                     },
                                     width: 36,
                                     height: 36,
                                   }}
                                   title="Edit chapter"
                                 >
                                   <CreateIcon fontSize="small" />
                                 </IconButton>

                                {/* Delete Icon */}
                                <IconButton
                                  className="chapter-actions"
                                  size="small"
                                  onClick={() => handleDeleteChapter(index)}
                                  sx={{
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    color: '#ff4444',
                                    '&:hover': {
                                      bgcolor: 'rgba(255,68,68,0.1)',
                                      color: '#cc0000'
                                    },
                                    width: 36,
                                    height: 36,
                                  }}
                                  title="Delete chapter"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                                
                                {/* Add Chapter After This One Button - Below Delete Icon */}
                                <IconButton
                                  className="chapter-actions"
                                  size="small"
                                  onClick={() => handleAddChapterAfter(index)}
                                  sx={{
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    color: '#1DA1F2',
                                    '&:hover': {
                                      bgcolor: 'rgba(29, 161, 242, 0.1)',
                                      color: '#0d8bd9'
                                    },
                                    width: 36,
                                    height: 36,
                                  }}
                                  title="Add chapter after this one"
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                                                   </CardContent>
                             </Card>
                           )}
                         </Draggable>
                       ))}
                       {provided.placeholder}
                     </Box>
                   )}
                 </Droppable>
               </DragDropContext>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                textAlign: 'center',
                py: 8
              }}>
                <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                  📚 Generated Chapters
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', mb: 3, maxWidth: '300px' }}>
                  Your video chapters will appear here once you generate them using the form on the left.
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  color: '#ccc',
                  fontSize: '0.875rem'
                }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Enter your hypothesis and click "Generate Chapters" to get started
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

    </Container>
  );
};

export default TopicDetailPage;
