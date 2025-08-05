import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import SearchPage from './pages/Search/SearchPage';
import ClipEditor from './pages/ClipEditor/ClipEditor';
import ProjectsPage from './pages/Projects/ProjectsPage';
import SettingsPage from './pages/Settings/SettingsPage';

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/editor/:videoId" element={<ClipEditor />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App; 