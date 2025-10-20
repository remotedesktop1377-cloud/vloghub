# Chroma Key Video Upload Feature

## Overview
The "Upload Script Narration" feature has been updated to support chroma key video uploads for script narration. This allows users to upload video files that will be processed and used for script narration in their video projects.

## Features

### 1. Video Upload Component (`ChromaKeyUpload.tsx`)
- **File Validation**: Supports MP4, AVI, MOV, MKV, and WebM formats
- **Size Limit**: Maximum file size of 500MB
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Error Handling**: Comprehensive error messages and validation
- **File Information Display**: Shows file details after successful upload

### 2. API Endpoint (`/api/chroma-key-process`)
- **Video Processing**: Uses FFmpeg to process uploaded videos
- **Format Optimization**: Converts videos to optimized formats for better performance
- **Error Handling**: Robust error handling with detailed error messages
- **Temporary File Management**: Proper cleanup of temporary files

### 3. Helper Functions (`helperFunctions.ts`)
- **`processChromaKeyVideo()`**: Processes video files using the API
- **`uploadChromaKeyToDrive()`**: Uploads processed videos to Google Drive
- **`validateChromaKeyVideo()`**: Validates file type and size

## Usage

### In Script Production Client
The chroma key upload component is integrated into the script production workflow:

1. **When no chapters exist**: Shows the upload component in the main area
2. **When chapters exist**: Shows the upload component above the chapters section
3. **After upload**: Hides the upload component and shows success status

### Component Props
```typescript
interface ChromaKeyUploadProps {
  jobName: string;                    // Job identifier for file organization
  onUploadComplete: (file: File, url: string) => void;  // Callback when upload completes
  onUploadStart: () => void;          // Callback when upload starts
  disabled?: boolean;                 // Disable the component
}
```

## Technical Details

### FFmpeg Integration
- Fixed FFmpeg path issues for Windows compatibility
- Added proper error handling for FFmpeg operations
- Optimized video processing with appropriate codecs and settings

### File Processing
- Videos are processed to optimize for web delivery
- Uses H.264 codec with AAC audio
- Applies fast preset for quicker processing
- Adds faststart flag for better streaming

### Error Handling
- File type validation
- File size validation
- FFmpeg processing errors
- Network upload errors
- User-friendly error messages

## Integration Points

### Script Production Workflow
1. User generates or uploads script
2. System creates chapters
3. User uploads chroma key video for narration
4. Video is processed and uploaded to Google Drive
5. User can proceed with video generation

### State Management
- `chromaKeyFile`: Stores the uploaded file
- `chromaKeyUrl`: Stores the Google Drive URL
- `uploadingChromaKey`: Tracks upload status
- `chromaKeyUploadProgress`: Tracks upload progress

## Styling
- Uses Material-UI components for consistent design
- Responsive design for mobile and desktop
- Custom CSS module for component-specific styles
- Toast notifications for user feedback

## Future Enhancements
- Video preview before upload
- Batch upload support
- Video compression options
- Advanced chroma key processing
- Integration with video editing tools



