import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  VideoLibrary as VideoIcon,
  ContentCut as ClipIcon,
  Analytics as AnalyticsIcon,
  Folder as ProjectIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  clipCount: number;
  lastModified: string;
  status: 'active' | 'completed' | 'draft';
}

interface DashboardStats {
  totalProjects: number;
  totalVideos: number;
  totalClips: number;
  processingJobs: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalVideos: 0,
    totalClips: 0,
    processingJobs: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls
      setTimeout(() => {
        setStats({
          totalProjects: 5,
          totalVideos: 23,
          totalClips: 147,
          processingJobs: 2,
        });

        setRecentProjects([
          {
            id: '1',
            name: 'Nelson Mandela Documentary',
            description: 'Historical footage and speeches',
            videoCount: 8,
            clipCount: 34,
            lastModified: '2024-08-05',
            status: 'active',
          },
          {
            id: '2',
            name: 'Climate Change Research',
            description: 'Environmental impact videos',
            videoCount: 5,
            clipCount: 28,
            lastModified: '2024-08-03',
            status: 'completed',
          },
          {
            id: '3',
            name: 'Education Reform',
            description: 'Educational policy discussions',
            videoCount: 10,
            clipCount: 85,
            lastModified: '2024-08-01',
            status: 'draft',
          },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactElement;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/search')}
        >
          New Project
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<ProjectIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Videos Processed"
            value={stats.totalVideos}
            icon={<VideoIcon />}
            color="#dc004e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clips Generated"
            value={stats.totalClips}
            icon={<ClipIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processing Jobs"
            value={stats.processingJobs}
            icon={<AnalyticsIcon />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      {/* Recent Projects */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Recent Projects
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/projects')}
            >
              View All
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Videos</TableCell>
                  <TableCell align="center">Clips</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Last Modified</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {project.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {project.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{project.videoCount}</TableCell>
                    <TableCell align="center">{project.clipCount}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={project.status}
                        color={getStatusColor(project.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{project.lastModified}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard; 