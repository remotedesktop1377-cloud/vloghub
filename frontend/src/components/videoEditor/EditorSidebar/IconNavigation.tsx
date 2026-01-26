'use client';

import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import VideocamIcon from '@mui/icons-material/Videocam';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import GridViewIcon from '@mui/icons-material/GridView';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TransformIcon from '@mui/icons-material/Transform';
import PaletteIcon from '@mui/icons-material/Palette';

export type SidebarSection = 
  | 'media' 
  | 'record' 
  | 'text' 
  | 'music' 
  | 'stock-video' 
  | 'stock-images' 
  | 'templates' 
  | 'graphics' 
  | 'transitions' 
  | 'brand-kit';

interface IconNavigationProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

const IconNavigation: React.FC<IconNavigationProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const sections: Array<{
    id: SidebarSection;
    icon: React.ReactNode;
    label: string;
    badge?: number;
  }> = [
    { id: 'media', icon: <FolderIcon />, label: 'Your media' },
    { id: 'record', icon: <VideocamIcon />, label: 'Record & create' },
    { id: 'text', icon: <TextFieldsIcon />, label: 'Text' },
    { id: 'music', icon: <MusicNoteIcon />, label: 'Music' },
    { id: 'stock-video', icon: <MovieIcon />, label: 'Stock video' },
    { id: 'stock-images', icon: <ImageIcon />, label: 'Stock images' },
    { id: 'templates', icon: <GridViewIcon />, label: 'Templates' },
    { id: 'graphics', icon: <AutoAwesomeIcon />, label: 'Graphics' },
    { id: 'transitions', icon: <TransformIcon />, label: 'Transitions' },
    { id: 'brand-kit', icon: <PaletteIcon />, label: 'Brand kit' },
  ];

  return (
    <Box
      sx={{
        width: 64,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        alignItems: 'center',
        py: 1,
      }}
    >
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <Tooltip key={section.id} title={section.label} placement="right" arrow>
            <IconButton
              onClick={() => onSectionChange(section.id)}
              sx={{
                width: 48,
                height: 48,
                mb: 0.5,
                bgcolor: isActive ? '#9c27b0' : 'transparent', // Purple accent
                color: isActive ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: isActive ? '#7b1fa2' : 'action.hover',
                  color: isActive ? 'white' : 'text.primary',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {section.badge ? (
                <Badge badgeContent={section.badge} color="error">
                  {section.icon}
                </Badge>
              ) : (
                section.icon
              )}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default IconNavigation;

