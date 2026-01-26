'use client';

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import CropFreeIcon from '@mui/icons-material/CropFree';
import GetAppIcon from '@mui/icons-material/GetApp';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { EditorProject } from '@/types/videoEditor';

interface PreviewControlsProps {
  project: EditorProject;
  onAspectRatioChange?: (aspectRatio: EditorProject['aspectRatio']) => void;
  onExport?: () => void;
  showSafeZones?: boolean;
  onToggleSafeZones?: (show: boolean) => void;
}

const PreviewControls: React.FC<PreviewControlsProps> = ({
  project,
  onAspectRatioChange,
  onExport,
  showSafeZones: externalShowSafeZones,
  onToggleSafeZones,
}) => {
  const [showGrid, setShowGrid] = useState(false);
  const [internalShowSafeZones, setInternalShowSafeZones] = useState(false);
  const showSafeZones = externalShowSafeZones !== undefined ? externalShowSafeZones : internalShowSafeZones;
  
  const handleToggleSafeZones = () => {
    const newValue = !showSafeZones;
    if (onToggleSafeZones) {
      onToggleSafeZones(newValue);
    } else {
      setInternalShowSafeZones(newValue);
    }
  };
  const [aspectMenuAnchor, setAspectMenuAnchor] = useState<null | HTMLElement>(null);

  const aspectRatios: Array<{ value: EditorProject['aspectRatio']; label: string }> = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:5', label: '4:5 (Instagram)' },
    { value: '21:9', label: '21:9 (Ultrawide)' },
  ];

  const handleAspectRatioClick = (event: React.MouseEvent<HTMLElement>) => {
    setAspectMenuAnchor(event.currentTarget);
  };

  const handleAspectRatioSelect = (value: EditorProject['aspectRatio']) => {
    if (onAspectRatioChange) {
      onAspectRatioChange(value);
    }
    setAspectMenuAnchor(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Tooltip title="Aspect Ratio">
        <IconButton size="small" onClick={handleAspectRatioClick}>
          <AspectRatioIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={aspectMenuAnchor}
        open={Boolean(aspectMenuAnchor)}
        onClose={() => setAspectMenuAnchor(null)}
      >
        {aspectRatios.map((ratio) => (
          <MenuItem
            key={ratio.value}
            selected={project.aspectRatio === ratio.value}
            onClick={() => handleAspectRatioSelect(ratio.value)}
          >
            {ratio.label}
          </MenuItem>
        ))}
      </Menu>

      <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'}>
        <IconButton
          size="small"
          onClick={() => setShowGrid(!showGrid)}
          sx={{
            color: showGrid ? '#9c27b0' : 'text.secondary',
          }}
        >
          {showGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Tooltip title={showSafeZones ? 'Hide Safe Zones' : 'Show Safe Zones'}>
        <IconButton
          size="small"
          onClick={handleToggleSafeZones}
          sx={{
            color: showSafeZones ? '#9c27b0' : 'text.secondary',
          }}
        >
          <CropFreeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      <Tooltip title="Quick Export">
        <IconButton size="small" onClick={onExport}>
          <GetAppIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Fullscreen">
        <IconButton
          size="small"
          onClick={() => {
            // TODO: Implement fullscreen
            console.log('Fullscreen clicked');
          }}
        >
          <FullscreenIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Grid Overlay (if enabled) */}
      {showGrid && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 10,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '33.33% 33.33%',
          }}
        />
      )}

    </Box>
  );
};

export default PreviewControls;

