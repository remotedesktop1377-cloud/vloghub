# YouTube Clip Searcher - Frontend

This is the frontend application for the YouTube Clip Searcher project, built with Next.js 15 and Material-UI.

## Getting Started (Frontend)

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env.local` if provided.
   - Add API URLs for the Python backend (e.g., `NEXT_PUBLIC_API_BASE=http://127.0.0.1:10000`).

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser.
   - The dev server auto-reloads when files change.

5. **Stop the server**
   - Use `Ctrl + C` in the terminal.

> 💡 Make sure the FastAPI backend is running before interacting with features that require processing or clip downloads.

## Available Scripts

- `npm run dev` - Runs the development server
- `npm run build` - Builds the production application
- `npm run start` - Starts the production server
- `npm run lint` - Runs the linter

## Project Structure

- `pages/` - Next.js pages (routing)
- `src/components/` - Reusable React components
- `src/pages/` - Page components (moved from old React structure)

## Features

- Dashboard with project overview
- YouTube video search and analysis
- Clip editor with timeline
- Metadata management
- Transcript viewing
- Project organization 
