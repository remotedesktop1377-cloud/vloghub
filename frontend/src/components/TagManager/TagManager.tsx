import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Badge,
  LinearProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Label as TagIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

interface Tag {
  id: string;
  name: string;
  tag_type: string;
  category_id?: string;
  description?: string;
  confidence: number;
  confidence_level: string;
  source: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TagCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
}

interface TagStatistics {
  total_tags: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
  top_used: Array<{ name: string; count: number }>;
}

const TagManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [statistics, setStatistics] = useState<TagStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [minConfidence, setMinConfidence] = useState<number | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    tag_type: '',
    category_id: '',
    description: '',
    confidence: 1.0,
    confidence_level: 'manual',
    source: 'user_input'
  });

  const tagTypes = [
    'person', 'location', 'organization', 'event', 'topic', 
    'sentiment', 'speaker', 'language', 'genre', 'custom'
  ];

  const confidenceLevels = ['high', 'medium', 'low', 'manual'];
  const sources = ['ai_analysis', 'user_input', 'youtube_api', 'transcript', 'external_api'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    searchTags();
  }, [searchQuery, selectedType, selectedCategory, selectedSource, minConfidence]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load initial tags
      await searchTags();
      
      // Load statistics
      const statsResponse = await fetch('/api/metadata/tags/statistics');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setStatistics(stats);
      }
      
      // Load categories (mock data for now)
      setCategories([
        { id: '1', name: 'People', description: 'Historical figures and speakers', color: '#2196F3' },
        { id: '2', name: 'Locations', description: 'Geographic locations', color: '#4CAF50' },
        { id: '3', name: 'Events', description: 'Historical events', color: '#FF9800' },
        { id: '4', name: 'Topics', description: 'Subject matter', color: '#9C27B0' },
        { id: '5', name: 'Sentiments', description: 'Emotional tone', color: '#F44336' },
      ]);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchTags = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedType) params.append('tag_type', selectedType);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedSource) params.append('source', selectedSource);
      if (minConfidence !== null) params.append('min_confidence', minConfidence.toString());
      params.append('limit', '100');

      const response = await fetch(`/api/metadata/tags?${params}`);
      if (response.ok) {
        const tagsData = await response.json();
        setTags(tagsData);
      }
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };

  const handleCreateTag = async () => {
    try {
      const response = await fetch('/api/metadata/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        resetForm();
        await searchTags();
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag) return;

    try {
      const response = await fetch(`/api/metadata/tags/${selectedTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id || null,
          is_active: true
        })
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setSelectedTag(null);
        resetForm();
        await searchTags();
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const response = await fetch(`/api/metadata/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await searchTags();
        await loadStatistics();
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/metadata/tags/statistics');
      if (response.ok) {
        const stats = await response.json();
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tag_type: '',
      category_id: '',
      description: '',
      confidence: 1.0,
      confidence_level: 'manual',
      source: 'user_input'
    });
  };

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({
      name: tag.name,
      tag_type: tag.tag_type,
      category_id: tag.category_id || '',
      description: tag.description || '',
      confidence: tag.confidence,
      confidence_level: tag.confidence_level,
      source: tag.source
    });
    setEditDialogOpen(true);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ai_analysis': return '#9C27B0';
      case 'user_input': return '#2196F3';
      case 'youtube_api': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Tag Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Tag
        </Button>
      </Box>

      <Tabs value={selectedTab} onChange={(_, value) => setSelectedTab(value)} sx={{ mb: 3 }}>
        <Tab label="All Tags" />
        <Tab label="Statistics" />
        <Tab label="Categories" />
      </Tabs>

      {selectedTab === 0 && (
        <>
          {/* Search and Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {tagTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                    >
                      <MenuItem value="">All Sources</MenuItem>
                      {sources.map((source) => (
                        <MenuItem key={source} value={source}>{source}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Min Confidence"
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    value={minConfidence || ''}
                    onChange={(e) => setMinConfidence(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('');
                      setSelectedCategory('');
                      setSelectedSource('');
                      setMinConfidence(null);
                    }}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tags Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="center">Usage</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <LinearProgress />
                      <Typography align="center" sx={{ mt: 1 }}>Loading tags...</Typography>
                    </TableCell>
                  </TableRow>
                ) : tags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary">No tags found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <TagIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="subtitle2">{tag.name}</Typography>
                            {tag.description && (
                              <Typography variant="caption" color="textSecondary">
                                {tag.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tag.tag_type} 
                          size="small" 
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        {tag.category_id && (
                          <Chip 
                            label={categories.find(c => c.id === tag.category_id)?.name || 'Unknown'}
                            size="small"
                            style={{ 
                              backgroundColor: categories.find(c => c.id === tag.category_id)?.color || '#gray'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box
                            width={8}
                            height={8}
                            borderRadius="50%"
                            bgcolor={getConfidenceColor(tag.confidence_level)}
                            mr={1}
                          />
                          <Typography variant="body2">
                            {(tag.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tag.source}
                          size="small"
                          style={{ backgroundColor: getSourceColor(tag.source), color: 'white' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Badge badgeContent={tag.usage_count} color="primary">
                          <TrendingIcon />
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={tag.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={tag.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Tag">
                          <IconButton size="small" onClick={() => openEditDialog(tag)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Tag">
                          <IconButton size="small" onClick={() => handleDeleteTag(tag.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {selectedTab === 1 && statistics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Tags</Typography>
                <Typography variant="h4">{statistics.total_tags}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={9}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Used Tags</Typography>
                {statistics.top_used.map((item, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{item.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {item.count} uses
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 2 && (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      width={24}
                      height={24}
                      borderRadius="50%"
                      bgcolor={category.color}
                      mr={2}
                    />
                    <Typography variant="h6">{category.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {category.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Tag Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tag Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.tag_type}
                  onChange={(e) => setFormData({ ...formData, tag_type: e.target.value })}
                >
                  {tagTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTag}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tag</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tag Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditTag}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagManager; 