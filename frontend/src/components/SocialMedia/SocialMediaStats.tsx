'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  VideoLibrary,
  Visibility,
  ThumbUp,
  Comment,
  Share,
} from '@mui/icons-material';
import { BACKGROUND, TEXT, PURPLE, SUCCESS, INFO, NEUTRAL } from '../../styles/colors';
import styles from './SocialMediaStats.module.css';

interface PostStats {
  date: string;
  posts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

const generateMockData = (days: number): PostStats[] => {
  const data: PostStats[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      posts: Math.floor(Math.random() * 5) + 1,
      views: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 50) + 5,
    });
  }
  
  return data;
};

const mockStats = {
  totalPosts: 1247,
  totalViews: 2450000,
  totalLikes: 125000,
  totalComments: 15200,
  totalShares: 8900,
  averageEngagement: 6.2,
  topPlatform: 'YouTube',
};

export default function SocialMediaStats() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | '365'>('30');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    return generateMockData(days);
  }, [timeRange]);

  const totalStats = useMemo(() => {
    return chartData.reduce(
      (acc, day) => ({
        posts: acc.posts + day.posts,
        views: acc.views + day.views,
        likes: acc.likes + day.likes,
        comments: acc.comments + day.comments,
        shares: acc.shares + day.shares,
      }),
      { posts: 0, views: 0, likes: 0, comments: 0, shares: 0 },
    );
  }, [chartData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.views, d.likes, d.comments, d.shares)),
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ color: TEXT.primary, fontWeight: 600 }}>
          Posting Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: TEXT.secondary }}>Platform</InputLabel>
            <Select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              label="Platform"
              sx={{
                color: TEXT.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: NEUTRAL.gray[600],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: NEUTRAL.gray[500],
                },
                '& .MuiSvgIcon-root': {
                  color: TEXT.secondary,
                },
              }}
            >
              <MenuItem value="all">All Platforms</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
              <MenuItem value="instagram">Instagram</MenuItem>
              <MenuItem value="twitter">Twitter</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: TEXT.secondary }}>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7' | '30' | '90' | '365')}
              label="Time Range"
              sx={{
                color: TEXT.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: NEUTRAL.gray[600],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: NEUTRAL.gray[500],
                },
                '& .MuiSvgIcon-root': {
                  color: TEXT.secondary,
                },
              }}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: BACKGROUND.secondary,
              border: `1px solid ${NEUTRAL.gray[700]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: TEXT.secondary, mb: 1 }}>
                    Total Posts
                  </Typography>
                  <Typography variant="h4" sx={{ color: TEXT.primary, fontWeight: 700 }}>
                    {formatNumber(totalStats.posts)}
                  </Typography>
                </Box>
                <VideoLibrary sx={{ fontSize: 40, color: PURPLE.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: BACKGROUND.secondary,
              border: `1px solid ${NEUTRAL.gray[700]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: TEXT.secondary, mb: 1 }}>
                    Total Views
                  </Typography>
                  <Typography variant="h4" sx={{ color: TEXT.primary, fontWeight: 700 }}>
                    {formatNumber(totalStats.views)}
                  </Typography>
                </Box>
                <Visibility sx={{ fontSize: 40, color: INFO.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: BACKGROUND.secondary,
              border: `1px solid ${NEUTRAL.gray[700]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: TEXT.secondary, mb: 1 }}>
                    Total Likes
                  </Typography>
                  <Typography variant="h4" sx={{ color: TEXT.primary, fontWeight: 700 }}>
                    {formatNumber(totalStats.likes)}
                  </Typography>
                </Box>
                <ThumbUp sx={{ fontSize: 40, color: SUCCESS.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: BACKGROUND.secondary,
              border: `1px solid ${NEUTRAL.gray[700]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: TEXT.secondary, mb: 1 }}>
                    Engagement Rate
                  </Typography>
                  <Typography variant="h4" sx={{ color: TEXT.primary, fontWeight: 700 }}>
                    {mockStats.averageEngagement}%
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: PURPLE.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card
        sx={{
          bgcolor: BACKGROUND.secondary,
          border: `1px solid ${NEUTRAL.gray[700]}`,
          borderRadius: 3,
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: TEXT.primary, mb: 3, fontWeight: 600 }}>
          Media Posted Over Time
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            height: 300,
            pb: 2,
          }}
        >
          {chartData.map((day, index) => {
            const postsHeight = (day.posts / 5) * 100;
            const viewsHeight = (day.views / maxValue) * 100;
            
            return (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    gap: 0.5,
                    height: '100%',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: `${viewsHeight}%`,
                      background: PURPLE.gradient.primary,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                    title={`${day.date}: ${formatNumber(day.views)} views`}
                  />
                  <Box
                    sx={{
                      width: '100%',
                      height: `${postsHeight}%`,
                      background: INFO.main,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                    title={`${day.date}: ${day.posts} posts`}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: TEXT.secondary,
                    fontSize: '0.7rem',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                  }}
                >
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mt: 3, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: PURPLE.main, borderRadius: 1 }} />
            <Typography variant="body2" sx={{ color: TEXT.secondary }}>
              Views
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: INFO.main, borderRadius: 1 }} />
            <Typography variant="body2" sx={{ color: TEXT.secondary }}>
              Posts
            </Typography>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: BACKGROUND.secondary,
              border: `1px solid ${NEUTRAL.gray[700]}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: TEXT.primary, mb: 3, fontWeight: 600 }}>
              Engagement Breakdown
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ThumbUp sx={{ color: SUCCESS.main }} />
                  <Typography variant="body1" sx={{ color: TEXT.secondary }}>
                    Likes
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                  {formatNumber(totalStats.likes)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Comment sx={{ color: INFO.main }} />
                  <Typography variant="body1" sx={{ color: TEXT.secondary }}>
                    Comments
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                  {formatNumber(totalStats.comments)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Share sx={{ color: PURPLE.main }} />
                  <Typography variant="body1" sx={{ color: TEXT.secondary }}>
                    Shares
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                  {formatNumber(totalStats.shares)}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              bgcolor: BACKGROUND.secondary,
              border: `1px solid ${NEUTRAL.gray[700]}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: TEXT.primary, mb: 3, fontWeight: 600 }}>
              Platform Performance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: TEXT.secondary }}>
                    YouTube
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                    45%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: NEUTRAL.gray[800],
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: '45%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #FF0000 0%, #CC0000 100%)',
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: TEXT.secondary }}>
                    Instagram
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                    32%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: NEUTRAL.gray[800],
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: '32%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #E4405F 0%, #833AB4 100%)',
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: TEXT.secondary }}>
                    Twitter
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                    23%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: NEUTRAL.gray[800],
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: '23%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #1DA1F2 0%, #0D8BD9 100%)',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

