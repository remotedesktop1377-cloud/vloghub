import React, { useState } from 'react';
import {
  Box,
  TextField,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

interface ClipData {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  sentiment: string;
  entities: string[];
  keywords: string[];
  selected: boolean;
}

interface MetadataEditorProps {
  clip: ClipData;
  onChange: (updatedClip: ClipData) => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ clip, onChange }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newEntity, setNewEntity] = useState('');

  const sentimentOptions = [
    'positive', 'negative', 'neutral', 'hopeful', 'inspiring',
    'somber', 'angry', 'determined', 'defiant', 'excited'
  ];

  const handleFieldChange = (field: keyof ClipData, value: any) => {
    onChange({ ...clip, [field]: value });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !clip.keywords.includes(newKeyword.trim())) {
      handleFieldChange('keywords', [...clip.keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    handleFieldChange('keywords', clip.keywords.filter(k => k !== keyword));
  };

  const handleAddEntity = () => {
    if (newEntity.trim() && !clip.entities.includes(newEntity.trim())) {
      handleFieldChange('entities', [...clip.entities, newEntity.trim()]);
      setNewEntity('');
    }
  };

  const handleRemoveEntity = (entity: string) => {
    handleFieldChange('entities', clip.entities.filter(e => e !== entity));
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Title"
        value={clip.title}
        onChange={(e) => handleFieldChange('title', e.target.value)}
        margin="normal"
        size="small"
      />

      <TextField
        fullWidth
        label="Description"
        value={clip.description}
        onChange={(e) => handleFieldChange('description', e.target.value)}
        margin="normal"
        size="small"
        multiline
        rows={3}
      />

      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Sentiment</InputLabel>
        <Select
          value={clip.sentiment}
          onChange={(e) => handleFieldChange('sentiment', e.target.value)}
        >
          {sentimentOptions.map((sentiment) => (
            <MenuItem key={sentiment} value={sentiment}>
              {sentiment}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Keywords */}
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        Keywords
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          {clip.keywords.map((keyword) => (
            <Chip
              key={keyword}
              label={keyword}
              size="small"
              onDelete={() => handleRemoveKeyword(keyword)}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Stack>
        <Box display="flex" gap={1}>
          <TextField
            size="small"
            placeholder="Add keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
          />
          <IconButton size="small" onClick={handleAddKeyword}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Entities */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Entities
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          {clip.entities.map((entity) => (
            <Chip
              key={entity}
              label={entity}
              size="small"
              variant="outlined"
              onDelete={() => handleRemoveEntity(entity)}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Stack>
        <Box display="flex" gap={1}>
          <TextField
            size="small"
            placeholder="Add entity"
            value={newEntity}
            onChange={(e) => setNewEntity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEntity()}
          />
          <IconButton size="small" onClick={handleAddEntity}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default MetadataEditor; 