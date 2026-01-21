'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { OutputVideosJob } from '@/services/dashboardService';
import { HelperFunctions } from '@/utils/helperFunctions';
import styles from './DashboardPageClient.module.css';
import LoadingOverlay from '../ui/LoadingOverlay';
import { ROUTES_KEYS } from '@/data/constants';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { ArrowBack, Refresh as RefreshIcon, Publish as PublishIcon, Delete as DeleteIcon, YouTube, Facebook, Add as AddIcon, CheckCircle } from '@mui/icons-material';
import { Button, CircularProgress, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography, IconButton } from '@mui/material';
import { toast } from 'react-toastify';
import { ProfileDropdown } from '../auth/ProfileDropdown';
import AlertDialog from '@/dialogs/AlertDialog';

interface DashboardPageClientProps {
    jobs: OutputVideosJob[];
}

interface PublishedVideo {
    id: string;
    google_drive_video_id: string;
    youtube_video_id?: string;
    facebook_video_id?: string;
    youtube_title?: string;
    facebook_title?: string;
    youtube_url?: string;
    facebook_url?: string;
    external_video_id?: string;
    external_url?: string;
    title?: string;
    platform?: string;
    thumbnail_url: string | null;
    published_at: string;
    job_id: string | null;
}

export default function DashboardPageClient({ jobs: initialJobs }: DashboardPageClientProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user as any;
    const [jobs, setJobs] = useState<OutputVideosJob[]>(initialJobs);
    const [refreshing, setRefreshing] = useState(false);
    const [publishingVideoId, setPublishingVideoId] = useState<string | null>(null);
    const [publishingToFacebookVideoId, setPublishingToFacebookVideoId] = useState<string | null>(null);
    const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
    const [showManualDeleteDialog, setShowManualDeleteDialog] = useState(false);
    const [manualVideoId, setManualVideoId] = useState('');
    const [publishedVideos, setPublishedVideos] = useState<PublishedVideo[]>([]);
    const [loadingPublishedVideos, setLoadingPublishedVideos] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (user) {
            loadPublishedVideos();
        }
    }, [user]);

    const flattenedVideos = useMemo(
        () =>
            (jobs || []).flatMap(job =>
                (job.videos || []).map(v => ({
                    ...v,
                    jobId: job.jobId,
                })),
            ),
        [jobs],
    );

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            const response = await fetch(`${API_ENDPOINTS.API_GOOGLE_DRIVE_OUTPUT_VIDEOS}?refresh=true`);
            if (!response.ok) {
                const data = await response.json();
                setAlertMessage(data.error || 'Failed to refresh videos');
                setShowAlertDialog(true);
                return;
            }
            const data = await response.json();
            setJobs(data.jobs || []);
            HelperFunctions.showSuccess('Dashboard refreshed successfully');
        } catch (e: any) {
            HelperFunctions.showError(e?.message || 'Failed to refresh dashboard');
        } finally {
            setRefreshing(false);
        }
    };

    const handleBackClick = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push(ROUTES_KEYS.TRENDING_TOPICS);
        }
    };

    const loadPublishedVideos = async () => {
        if (!user) return;
        setLoadingPublishedVideos(true);
        try {
            const response = await fetch(`/api/published-videos?userId=${user.id}`);
            if (!response.ok) {
                const data = await response.json();
                setAlertMessage(data.error || 'Failed to fetch published videos');
                setShowAlertDialog(true);
                return;
            }
            const data = await response.json();
            setPublishedVideos(data.videos || []);
        } catch (error: any) {
            console.log('Error loading published videos:', error);
        } finally {
            setLoadingPublishedVideos(false);
        }
    };

    const isVideoPublished = (videoId: string, platform?: string): PublishedVideo | null => {
        const published = publishedVideos.find(pv => {
            const driveId = pv.google_drive_video_id || (pv as any).final_video_id;
            return driveId === videoId;
        });
        if (!published) return null;
        if (platform) {
            return published.platform === platform ? published : null;
        }
        return published;
    };

    const handlePublishToYouTube = async (video: { id: string; name: string; webContentLink: string; jobId: string; thumbnailLink?: string | null }) => {
        if (!user) {
            toast.error('Please sign in to publish videos');
            return;
        }

        const publishedVideo = isVideoPublished(video.id, 'youtube');
        if (publishedVideo) {
            const confirmMessage = `This video has already been published to YouTube.\n\nTitle: ${publishedVideo.youtube_title || publishedVideo.title}\nPublished: ${new Date(publishedVideo.published_at).toLocaleString()}\n\nDo you want to publish it again? This will create a duplicate video on YouTube.`;
            if (!confirm(confirmMessage)) {
                return;
            }
        }

        setPublishingVideoId(video.id);
        try {
            const response = await fetch('/api/youtube-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId: video.id,
                    videoName: video.name,
                    videoUrl: video.webContentLink,
                    thumbnailLink: video.thumbnailLink || null,
                    jobId: video.jobId,
                    userId: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.alreadyPublished) {
                    const confirmMessage = `This video has already been published to YouTube.\n\nTitle: ${data.youtubeTitle}\nPublished: ${new Date(data.publishedAt).toLocaleString()}\n\nDo you want to publish it again? This will create a duplicate video on YouTube.`;
                    if (!confirm(confirmMessage)) {
                        setPublishingVideoId(null);
                        return;
                    }
                } else {
                    const message = data.error || 'Failed to publish video to YouTube';
                    toast.error(message);
                    setAlertMessage(message);
                    setShowAlertDialog(true);
                    console.log('Failed to publish video to YouTube', data.error);
                }
                return;
            }

            setAlertMessage(`Video published successfully to YouTube! ${data.videoUrl ? `Watch it here: ${data.videoUrl}` : ''}`);
            setShowAlertDialog(true);
            loadPublishedVideos();
        } catch (error: any) {
            const message = error?.message || 'Failed to publish video to YouTube';
            toast.error(message);
            setAlertMessage(message);
            setShowAlertDialog(true);
            console.log('Error publishing video:', message);
        } finally {
            setPublishingVideoId(null);
        }
    };

    const handlePublishToFacebook = async (video: { id: string; name: string; webContentLink: string; jobId: string; thumbnailLink?: string | null }) => {
        if (!user) {
            toast.error('Please sign in to publish videos');
            return;
        }

        const publishedVideo = isVideoPublished(video.id, 'facebook');
        if (publishedVideo) {
            const confirmMessage = `This video has already been published to Facebook.\n\nTitle: ${publishedVideo.facebook_title || publishedVideo.title}\nPublished: ${new Date(publishedVideo.published_at).toLocaleString()}\n\nDo you want to publish it again? This will create a duplicate video on Facebook.`;
            if (!confirm(confirmMessage)) {
                return;
            }
        }

        setPublishingToFacebookVideoId(video.id);
        try {
            const response = await fetch('/api/facebook-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId: video.id,
                    videoName: video.name,
                    videoUrl: video.webContentLink,
                    thumbnailLink: video.thumbnailLink || null,
                    jobId: video.jobId,
                    userId: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.alreadyPublished) {
                    const confirmMessage = `This video has already been published to Facebook.\n\nTitle: ${data.facebookTitle}\nPublished: ${new Date(data.publishedAt).toLocaleString()}\n\nDo you want to publish it again? This will create a duplicate video on Facebook.`;
                    if (!confirm(confirmMessage)) {
                        setPublishingToFacebookVideoId(null);
                        return;
                    }
                } else {
                    toast.error(data.error || 'Failed to publish video to Facebook');
                    setAlertMessage(data.error || 'Failed to publish video to Facebook');
                    setShowAlertDialog(true);
                    console.log('Failed to publish video to Facebook', data.error);
                }

                return;
            }

            toast.success(`Video published successfully to Facebook! ${data.videoUrl ? `View it here: ${data.videoUrl}` : ''}`);
            setAlertMessage(`Video published successfully to Facebook! ${data.videoUrl ? `View it here: ${data.videoUrl}` : ''}`);
            setShowAlertDialog(true);
            loadPublishedVideos();
        } catch (error: any) {
            const message = error?.message || 'Failed to publish video to Facebook';
            toast.error(message);
            setAlertMessage(message);
            setShowAlertDialog(true);
            console.log('Error publishing video:', message);
        } finally {
            setPublishingToFacebookVideoId(null);
        }
    };

    const handleDeleteYouTubeVideo = async (videoId: string) => {
        if (!user) {
            toast.error('Please sign in to delete videos');
            return;
        }

        if (!confirm('Are you sure you want to delete this video from YouTube? This action cannot be undone.')) {
            return;
        }

        await deleteVideoById(videoId);
    };

    const deleteVideoById = async (videoId: string) => {
        if (!user) return;

        setDeletingVideoId(videoId);
        try {
            const response = await fetch(`/api/youtube-delete?videoId=${videoId}&userId=${user.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403 && data.error?.includes('Permission denied')) {
                    toast.error('Delete permission not available. Please reconnect your YouTube account.', {
                        autoClose: 5000,
                    });
                    setTimeout(() => {
                        router.push(ROUTES_KEYS.SOCIAL_MEDIA);
                    }, 2000);
                } else {
                    toast.error(data.error || 'Failed to delete video from YouTube');
                    setAlertMessage(data.error || 'Failed to delete video from YouTube');
                    setShowAlertDialog(true);
                }
                return;
            }

            toast.success('Video deleted successfully from YouTube');
            loadPublishedVideos();
            setShowManualDeleteDialog(false);
            setManualVideoId('');
        } catch (error: any) {
            console.log('Error deleting video:', error);
            toast.error(error.message || 'Failed to delete video from YouTube');
        } finally {
            setDeletingVideoId(null);
        }
    };

    const handleManualDelete = () => {
        if (!manualVideoId.trim()) {
            toast.error('Please enter a video ID');
            return;
        }

        const videoId = manualVideoId.trim();
        if (!confirm(`Are you sure you want to delete video "${videoId}" from YouTube? This action cannot be undone.`)) {
            return;
        }

        deleteVideoById(videoId);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerRow}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={handleBackClick}
                        size="medium"
                        sx={{ fontSize: '1.25rem' }}
                    >
                        Back
                    </Button>

                    <h1 className={styles.title}>Dashboard - Completed Job Videos</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            className={styles.refreshButton}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Refresh videos from Google Drive"
                        >
                            {refreshing ? (
                                <CircularProgress size={20} />
                            ) : (
                                <RefreshIcon fontSize="small" />
                            )}
                        </button>
                        <button
                            className={styles.refreshButton}
                            onClick={() => setShowManualDeleteDialog(true)}
                            title="Delete YouTube Video by ID"
                        >
                            {deletingVideoId ? (
                                <CircularProgress size={16} sx={{ color: '#ffffff' }} />
                            ) : (
                                <DeleteIcon sx={{ fontSize: 18 }} />
                            )}
                        </button>
                        {user && (
                            <Box sx={{ ml: 0 }}>
                                <ProfileDropdown />
                            </Box>
                        )}
                    </div>
                </div>
                {/* <p className={styles.subtitle}>
                    Review final videos from your completed jobs. Videos are loaded from the output folder in your Google Drive job directories.
                </p> */}
            </div>

            {refreshing && (
                <LoadingOverlay title="Refreshing videos from Google Drive" desc="This may take a few moments" />
            )}

            {flattenedVideos.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyTitle}>No final videos found yet</div>
                    <div className={styles.emptyDescription}>
                        When your background processing finishes and uploads the final video to the output folder of a job on Google Drive, it will appear here.
                    </div>
                </div>
            )}

            {flattenedVideos.length > 0 && (
                <div className={styles.grid}>
                    {flattenedVideos.map(video => {
                        const publishedVideoYouTube = isVideoPublished(video.id, 'youtube');
                        const publishedVideoFacebook = isVideoPublished(video.id, 'facebook');
                        const publishedVideo = publishedVideoYouTube || publishedVideoFacebook;
                        return (
                            <div key={video.id} className={styles.card}>
                                <div className={styles.videoWrapper} style={{ position: 'relative' }}>
                                    <video
                                        className={styles.videoElement}
                                        src={HelperFunctions.normalizeGoogleDriveUrl(video.webContentLink)}
                                        controls
                                    />
                                    {publishedVideo && (
                                        <>
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    bgcolor: 'rgba(34, 197, 94, 0.9)',
                                                    color: '#ffffff',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    zIndex: 10,
                                                }}
                                            >
                                                <CheckCircle sx={{ fontSize: 16 }} />
                                                Published
                                            </Box>
                                            {publishedVideoYouTube && publishedVideoYouTube.youtube_video_id && (
                                                <IconButton
                                                    onClick={() => handleDeleteYouTubeVideo(publishedVideoYouTube.youtube_video_id!)}
                                                    disabled={deletingVideoId === publishedVideoYouTube.youtube_video_id}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        left: 8,
                                                        bgcolor: 'rgba(239, 68, 68, 0.9)',
                                                        color: '#ffffff',
                                                        zIndex: 10,
                                                        '&:hover': {
                                                            bgcolor: 'rgba(220, 38, 38, 0.9)',
                                                        },
                                                        '&:disabled': {
                                                            opacity: 0.6,
                                                        },
                                                    }}
                                                    size="small"
                                                >
                                                    {deletingVideoId === publishedVideoYouTube.youtube_video_id ? (
                                                        <CircularProgress size={16} sx={{ color: '#ffffff' }} />
                                                    ) : (
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    )}
                                                </IconButton>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '30px' }}>
                                        <div className={styles.jobId}>Job ID</div>
                                        <Box sx={{ mt: 1, mb: 0.5, display: 'flex', gap: 1 }}>
                                            {publishedVideoYouTube && publishedVideoYouTube.youtube_url && (
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    startIcon={<YouTube />}
                                                    href={publishedVideoYouTube.youtube_url}
                                                    target="_blank"
                                                    sx={{
                                                        color: '#FF0000',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'none',
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255, 0, 0, 0.1)',
                                                        },
                                                    }}
                                                >
                                                    View on YouTube
                                                </Button>
                                            )}
                                            {publishedVideoFacebook && publishedVideoFacebook.facebook_url && (
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    startIcon={<Facebook />}
                                                    href={publishedVideoFacebook.facebook_url}
                                                    target="_blank"
                                                    sx={{
                                                        color: '#1877F2',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'none',
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(24, 119, 242, 0.1)',
                                                        },
                                                    }}
                                                >
                                                    View on Facebook
                                                </Button>
                                            )}
                                        </Box>
                                    </div>
                                    <div className={styles.videoName}>{video.name}</div>

                                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                        <Button
                                            variant="contained"
                                            startIcon={publishingVideoId === video.id ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <PublishIcon />}
                                            onClick={() => handlePublishToYouTube(video)}
                                            disabled={publishingVideoId === video.id || publishingToFacebookVideoId === video.id || !user}
                                            fullWidth
                                            sx={{
                                                background: publishedVideoYouTube
                                                    ? 'linear-gradient(135deg, #666666 0%, #555555 100%)'
                                                    : 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                                                color: '#ffffff',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    background: publishedVideoYouTube
                                                        ? 'linear-gradient(135deg, #555555 0%, #444444 100%)'
                                                        : 'linear-gradient(135deg, #CC0000 0%, #990000 100%)',
                                                },
                                                '&:disabled': {
                                                    opacity: 0.6,
                                                },
                                            }}
                                        >
                                            {publishingVideoId === video.id
                                                ? 'Publishing...'
                                                : publishedVideoYouTube
                                                    ? 'Publish Again'
                                                    : 'Publish to YouTube'}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={publishingToFacebookVideoId === video.id ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <PublishIcon />}
                                            onClick={() => handlePublishToFacebook(video)}
                                            disabled={publishingToFacebookVideoId === video.id || publishingVideoId === video.id || !user}
                                            fullWidth
                                            sx={{
                                                background: publishedVideoFacebook
                                                    ? 'linear-gradient(135deg, #666666 0%, #555555 100%)'
                                                    : 'linear-gradient(135deg, #1877F2 0%, #0C63D4 100%)',
                                                color: '#ffffff',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    background: publishedVideoFacebook
                                                        ? 'linear-gradient(135deg, #555555 0%, #444444 100%)'
                                                        : 'linear-gradient(135deg, #0C63D4 0%, #0A52B8 100%)',
                                                },
                                                '&:disabled': {
                                                    opacity: 0.6,
                                                },
                                            }}
                                        >
                                            {publishingToFacebookVideoId === video.id
                                                ? 'Publishing...'
                                                : publishedVideoFacebook
                                                    ? 'Publish Again'
                                                    : 'Publish to Facebook'}
                                        </Button>
                                    </Box>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog
                open={showManualDeleteDialog}
                onClose={() => {
                    setShowManualDeleteDialog(false);
                    setManualVideoId('');
                }}
                PaperProps={{
                    sx: {
                        bgcolor: '#1f2937',
                        color: '#ffffff',
                    },
                }}
            >
                <DialogTitle>Delete YouTube Video by ID</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="YouTube Video ID"
                        placeholder="e.g., q1ey_BSfNPs"
                        fullWidth
                        variant="outlined"
                        value={manualVideoId}
                        onChange={(e) => setManualVideoId(e.target.value)}
                        sx={{
                            mt: 2,
                            '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#ef4444',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&.Mui-focused': {
                                    color: '#ef4444',
                                },
                            },
                        }}
                    />
                    <Box sx={{ mt: 2, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        Enter the YouTube video ID you want to delete. You can find it in the video URL: youtube.com/watch?v=VIDEO_ID
                    </Box>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 1, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600, mb: 1 }}>
                            ⚠️ Important: Delete Permissions Required
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                            If you get a "Permission denied" error, you need to reconnect your YouTube account to grant delete permissions.
                            Go to <strong>Social Media</strong> page and reconnect YouTube.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1 }}>
                    <Button
                        onClick={() => {
                            setShowManualDeleteDialog(false);
                            setManualVideoId('');
                        }}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleManualDelete}
                        disabled={!manualVideoId.trim() || deletingVideoId !== null}
                        variant="contained"
                        sx={{
                            bgcolor: '#ef4444',
                            '&:hover': {
                                bgcolor: '#dc2626',
                            },
                            '&:disabled': {
                                opacity: 0.6,
                            },
                        }}
                    >
                        {deletingVideoId ? 'Deleting...' : 'Delete Video'}
                    </Button>
                </DialogActions>
            </Dialog>

            <AlertDialog
                open={showAlertDialog}
                title="Video Publish Status"
                message={alertMessage}
                onClose={() => setShowAlertDialog(false)}
            />
        </div>
    );
}
