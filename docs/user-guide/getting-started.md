# Getting Started

Welcome to the YouTube Research Video Clip Finder! This guide will help you get up and running with the application.

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- YouTube API key (for advanced features)

## Installation

### Option 1: Web Application

1. Navigate to `https://youtube-clip-finder.example.com`
2. Create an account or sign in with your existing credentials
3. Accept the terms of service

### Option 2: Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/youtube-clip-finder.git
   cd youtube-clip-finder
   ```

2. Install dependencies:
   ```bash
   # Backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```

3. Configure your environment:
   - Copy `.env.example` to `.env`
   - Add your YouTube API key to the `.env` file

4. Start the application:
   ```bash
   # Start backend
   python src/app.py
   
   # Start frontend (in a separate terminal)
   cd frontend
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## First Steps

1. **Set up your API key**: Go to Settings → API Configuration and enter your YouTube API key
2. **Create your first project**: Click "New Project" on the dashboard
3. **Run your first search**: Enter a research topic like "Nelson Mandela speech after prison release"
4. **Select and trim clips**: Click on search results to preview and trim relevant segments
5. **Download and organize**: Save clips to your local machine or cloud storage

## Next Steps

- Explore the [Search & Prompt Enhancement](./search-prompt-enhancement.md) guide to improve your search results
- Learn how to use the [Clip Extraction & Editing](./clip-extraction.md) features
- Set up your [Downloading & Storage](./downloading-storage.md) preferences

## Need Help?

- Check our [Troubleshooting](./troubleshooting.md) guide
- Visit the [FAQ](./faq.md) section
- Contact support at support@youtube-clip-finder.example.com 