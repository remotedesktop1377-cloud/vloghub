# Recommended Project Structure

This document outlines the recommended project structure for the YouTube Research Video Clip Finder application.

## Directory Structure

```
youtube-clip-finder/
│
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Common UI elements
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── search/          # Search components
│   │   │   ├── player/          # Video player components
│   │   │   ├── trimmer/         # Clip trimming components
│   │   │   └── metadata/        # Metadata editing components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service clients
│   │   ├── store/               # Redux store
│   │   │   ├── actions/         # Redux actions
│   │   │   ├── reducers/        # Redux reducers
│   │   │   └── middleware/      # Redux middleware
│   │   ├── utils/               # Utility functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── styles/              # Global styles
│   │   ├── App.js               # Main App component
│   │   └── index.js             # Entry point
│   ├── package.json
│   └── tailwind.config.js       # Tailwind CSS configuration
│
├── server/                      # Backend application
│   ├── api/                     # API routes
│   │   ├── routes/              # Route definitions
│   │   └── controllers/         # Route controllers
│   ├── services/                # Business logic services
│   │   ├── youtube/             # YouTube API service
│   │   ├── transcription/       # Transcription service
│   │   ├── clip-detection/      # Clip detection service
│   │   ├── metadata/            # Metadata service
│   │   └── download/            # Download service
│   ├── models/                  # Database models
│   ├── utils/                   # Utility functions
│   ├── middleware/              # Express middleware
│   ├── config/                  # Configuration files
│   ├── ai/                      # AI modules
│   │   ├── prompt-enhancer/     # Prompt enhancement logic
│   │   ├── sentiment/           # Sentiment analysis
│   │   ├── entity-recognition/  # Named entity recognition
│   │   └── segment-detection/   # Segment detection algorithms
│   ├── db/                      # Database scripts and migrations
│   ├── app.js                   # Express application
│   └── server.js                # Server entry point
│
├── shared/                      # Shared code between client and server
│   ├── constants/               # Shared constants
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Shared utility functions
│
├── scripts/                     # Utility scripts
│   ├── setup.js                 # Setup script
│   └── seed-data.js             # Seed data script
│
├── storage/                     # Local storage for clips
│   ├── downloads/               # Downloaded clips
│   └── temp/                    # Temporary storage
│
├── tests/                       # Tests
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests using Playwright
│
├── docs/                        # Documentation
│   ├── api/                     # API documentation
│   ├── user-guide/              # User guide
│   └── developer/               # Developer documentation
│
├── .github/                     # GitHub workflows
│   └── workflows/               # CI/CD workflows
│
├── kubernetes/                  # Kubernetes configuration
│   ├── deployments/             # Deployment configurations
│   └── services/                # Service configurations
│
├── docker/                      # Docker configuration
│   ├── client/                  # Client Dockerfile
│   └── server/                  # Server Dockerfile
│
├── .env.example                 # Example environment variables
├── docker-compose.yml           # Docker Compose configuration
├── package.json                 # Root package.json for scripts
├── README.md                    # Project README
└── LICENSE                      # License file
```

## Key Components

### Frontend (React)

The frontend is built using React with the following key components:

1. **Search Interface**: Components for entering search queries and displaying results
2. **Video Player**: Custom player with clip selection capabilities
3. **Clip Trimmer**: Interface for precise clip selection and trimming
4. **Metadata Editor**: Forms for editing clip metadata and tags
5. **Download Manager**: Interface for managing clip downloads and storage

### Backend (Node.js/Express or FastAPI)

The backend provides the following services:

1. **YouTube API Service**: Handles communication with YouTube Data API
2. **Prompt Enhancement**: NLP-based query expansion and refinement
3. **Transcription Service**: Handles video transcription using Whisper or YouTube captions
4. **Clip Detection**: Algorithms for identifying relevant segments in videos
5. **Metadata Service**: Manages clip metadata and tagging
6. **Download Service**: Handles video download and storage

### Database (PostgreSQL)

The database stores:

1. **User data**: User preferences and settings
2. **Projects**: Research project information
3. **Clips**: Metadata about extracted clips
4. **Tags**: Tag information for organization
5. **Search history**: Previous search queries and results

### AI/NLP Modules

The application includes several AI modules:

1. **Prompt Enhancer**: Refines user input into structured queries
2. **Semantic Search**: Embedding-based retrieval
3. **Clip Detector**: Identifies topic and speaker changes
4. **Sentiment Analysis**: Classifies clip tone
5. **Named Entity Recognition**: Identifies persons, locations, etc.

## Development Guidelines

1. Follow consistent naming conventions across the project
2. Document all components and functions
3. Write unit tests for critical functionality
4. Use TypeScript for type safety
5. Follow the container/presentation component pattern in React
6. Use environment variables for configuration
7. Implement proper error handling throughout the application 