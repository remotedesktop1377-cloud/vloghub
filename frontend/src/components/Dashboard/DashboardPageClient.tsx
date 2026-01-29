'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { OutputVideosJob } from '@/services/dashboardService';
import { HelperFunctions } from '@/utils/helperFunctions';
import styles from './DashboardPageClient.module.css';
import LoadingOverlay from '../ui/LoadingOverlay';
import { ROUTES_KEYS, RENDER_STATUS, SCRIPT_STATUS } from '@/data/constants';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { ArrowBack, Refresh as RefreshIcon, Publish as PublishIcon, Delete as DeleteIcon, Download as DownloadIcon, Edit as EditIcon, YouTube, Facebook, Add as AddIcon, CheckCircle } from '@mui/icons-material';
import { Button, CircularProgress, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography, IconButton, Tabs, Tab, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import { ProfileDropdown } from '../auth/ProfileDropdown';
import AlertDialog from '@/dialogs/AlertDialog';
import { getSupabase } from '@/utils/supabase';
import { DB_TABLES } from '@/config/DbTables';
import { SecureStorageHelpers } from '@/utils/helperFunctions';

interface DashboardPageClientProps {
    jobs?: OutputVideosJob[];
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
    const [jobs, setJobs] = useState<OutputVideosJob[]>(initialJobs || []);
    const [loadingJobs, setLoadingJobs] = useState(!initialJobs || initialJobs.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const [publishingVideoId, setPublishingVideoId] = useState<string | null>(null);
    const [publishingToFacebookVideoId, setPublishingToFacebookVideoId] = useState<string | null>(null);
    const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
    const [showManualDeleteDialog, setShowManualDeleteDialog] = useState(false);
    const [manualVideoId, setManualVideoId] = useState('');
    const [publishedVideos, setPublishedVideos] = useState<PublishedVideo[]>([]);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
    const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);
    const [showConfirmDeleteVideoDialog, setShowConfirmDeleteVideoDialog] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState<{ id: string; name: string; projectId?: string; generatedVideoId?: string } | null>(null);
    const [deletingVideoStatus, setDeletingVideoStatus] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [inProgressProjects, setInProgressProjects] = useState<any[]>([]);
    const [loadingInProgress, setLoadingInProgress] = useState(false);
    const hasLoadedJobsRef = useRef(false);
    const hasLoadedPublishedVideosRef = useRef(false);

    useEffect(() => {
        if (user && !hasLoadedJobsRef.current && loadingJobs) {
            hasLoadedJobsRef.current = true;
            loadJobs();
        }
        if (user && !hasLoadedPublishedVideosRef.current) {
            hasLoadedPublishedVideosRef.current = true;
            loadPublishedVideos();
        }
        if (user && activeTab === 1 && inProgressProjects.length === 0) {
            loadInProgressProjects();
        }
    }, [user, activeTab]);

    const loadJobs = async () => {
        try {
            setLoadingJobs(true);

            if (!user?.email) {
                setAlertMessage('User authentication required');
                setShowAlertDialog(true);
                return;
            }

            const supabase = getSupabase();
            const supabaseAny: any = supabase;

            const profileResult: any = await supabaseAny
                .from(DB_TABLES.PROFILES)
                .select('id')
                .eq('email', user.email)
                .maybeSingle();

            if (!profileResult?.data || profileResult?.error) {
                setAlertMessage('User profile not found. Please sign in again.');
                setShowAlertDialog(true);
                return;
            }

            const userUuid = profileResult.data.id;

            const { data: userProjects, error: projectsError } = await supabaseAny
                .from(DB_TABLES.PROJECTS)
                .select('id, job_id')
                .eq('user_id', userUuid);

            if (projectsError) {
                console.log('Error fetching user projects:', projectsError);
                setAlertMessage(projectsError.message || 'Failed to load videos');
                setShowAlertDialog(true);
                return;
            }

            if (!userProjects || userProjects.length === 0) {
                setJobs([]);
                return;
            }

            const projectIds = userProjects.map((p: any) => p.id);
            const projectJobMap = new Map<string, string>(userProjects.map((p: any) => [p.id, p.job_id]));

            const { data: generatedVideos, error: videosError } = await supabaseAny
                .from(DB_TABLES.GENERATED_VIDEOS)
                .select('id, google_drive_video_id, google_drive_video_name, google_drive_video_url, google_drive_thumbnail_url, project_id, render_status')
                .in('project_id', projectIds)
                .eq('render_status', RENDER_STATUS.SUCCESS)
                .order('updated_at', { ascending: false });

            if (videosError) {
                console.log('Error fetching generated videos:', videosError);
                setAlertMessage(videosError.message || 'Failed to load videos');
                setShowAlertDialog(true);
                return;
            }

            const jobsMap = new Map<string, OutputVideosJob>();

            if (generatedVideos && Array.isArray(generatedVideos)) {
                generatedVideos.forEach((video: any) => {
                    if (!video.project_id) return;

                    const jobId = projectJobMap.get(video.project_id);
                    if (!jobId) return;
                    const videoId = video.google_drive_video_id || video.id;
                    const videoUrl = video.google_drive_video_url || `https://drive.google.com/file/d/${videoId}/view`;
                    // Use format that works with normalizeGoogleDriveUrl to proxy through API endpoint
                    const webContentLink = `https://drive.google.com/uc?id=${videoId}`;

                    if (!jobsMap.has(jobId)) {
                        jobsMap.set(jobId, {
                            jobId,
                            videos: []
                        });
                    }

                    const job = jobsMap.get(jobId)!;
                    job.videos.push({
                        id: videoId,
                        name: video.google_drive_video_name || 'Untitled Video',
                        webViewLink: videoUrl,
                        webContentLink: webContentLink,
                        thumbnailLink: video.google_drive_thumbnail_url || null,
                        jobId,
                        projectId: video.project_id,
                        generatedVideoId: video.id
                    });
                });
            }

            const jobsArray = Array.from(jobsMap.values());
            setJobs(jobsArray);
        } catch (e: any) {
            console.log('Error loading jobs:', e);
            HelperFunctions.showError(e?.message || 'Failed to load videos');
            setAlertMessage(e?.message || 'Failed to load videos');
            setShowAlertDialog(true);
        } finally {
            setLoadingJobs(false);
        }
    };

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

    const loadInProgressProjects = async () => {
        try {
            setLoadingInProgress(true);

            if (!user?.email) {
                return;
            }

            const supabase = getSupabase();
            const supabaseAny: any = supabase;

            const profileResult: any = await supabaseAny
                .from(DB_TABLES.PROFILES)
                .select('id')
                .eq('email', user.email)
                .maybeSingle();

            if (!profileResult?.data || profileResult?.error) {
                return;
            }

            const userUuid = profileResult.data.id;

            const { data: projects, error } = await supabaseAny
                .from(DB_TABLES.PROJECTS)
                .select('id, job_id, title, status, raw_project_json, updated_at, video_thumbnail_url')
                .eq('user_id', userUuid)
                .eq('status', RENDER_STATUS.RENDERING)
                .order('updated_at', { ascending: false });

            if (error) {
                console.log('Error fetching in-progress projects:', error);
                return;
            }

            setInProgressProjects(projects || []);
        } catch (e: any) {
            console.log('Error loading in-progress projects:', e);
        } finally {
            setLoadingInProgress(false);
        }
    };

    const handleEditProject = async (project: any) => {
        try {
            if (!project.raw_project_json) {
                toast.error('Project data not found');
                return;
            }

            const projectJson = JSON.parse(project.raw_project_json);
            const updatedScriptData = HelperFunctions.convertProjectJSONToScriptData(projectJson);
            SecureStorageHelpers.setScriptMetadata(updatedScriptData);
            router.push(ROUTES_KEYS.SCRIPT_PRODUCTION);
        } catch (error: any) {
            console.log('Error loading project for editing:', error);
            toast.error('Failed to load project data');
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await loadJobs();
            await loadInProgressProjects();
            HelperFunctions.showSuccess('Dashboard refreshed successfully');
        } catch (e: any) {
            HelperFunctions.showError(e?.message || 'Failed to refresh dashboard');
        } finally {
            setRefreshing(false);
        }
    };

    const handleBackClick = () => {
        // if (typeof window !== 'undefined' && window.history.length > 1) {
        //     router.back();
        // } else {
        router.replace(ROUTES_KEYS.TRENDING_TOPICS);
        // }
    };

    const loadPublishedVideos = async () => {
        try {
            const response = await fetch(`${API_ENDPOINTS.PUBLISHED_VIDEOS}?userId=${user.id}`);
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
        }
    };

    const isVideoPublished = (videoId: string, platform?: string): PublishedVideo | null => {
        if (platform) {
            const publishedForPlatform = publishedVideos.find(pv => {
                const driveId = pv.google_drive_video_id || (pv as any).final_video_id;
                return driveId === videoId && pv.platform === platform;
            });
            return publishedForPlatform || null;
        }

        const publishedAny = publishedVideos.find(pv => {
            const driveId = pv.google_drive_video_id || (pv as any).final_video_id;
            return driveId === videoId;
        });
        return publishedAny || null;
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
            const response = await fetch(API_ENDPOINTS.YOUTUBE_PUBLISH, {
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
                    const rawMessage = data.error || 'Failed to publish video to YouTube';
                    const needsReconnect =
                        response.status === 400 && (
                            rawMessage.includes('YouTube account not connected') ||
                            rawMessage.includes('OAuth tokens not found') ||
                            rawMessage.includes('access token not found') ||
                            rawMessage.includes('access token expired') ||
                            rawMessage.includes('Failed to refresh YouTube access token')
                        ) ||
                        (response.status === 401 || response.status === 403) &&
                        rawMessage.toLowerCase().includes('authentication credentials');

                    const message = needsReconnect
                        ? 'YouTube session is no longer valid. Please reconnect your YouTube account from Profile menu.'
                        : rawMessage;

                    toast.error(message);
                    setAlertMessage(message);
                    setShowAlertDialog(true);
                    console.log('Failed to publish video to YouTube', rawMessage);
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
            const response = await fetch(API_ENDPOINTS.FACEBOOK_PUBLISH, {
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

        setConfirmDeleteVideoId(videoId);
        setShowConfirmDeleteDialog(true);
    };

    const deleteVideoById = async (videoId: string) => {
        if (!user) return;

        setDeletingVideoId(videoId);
        try {
            const response = await fetch(`${API_ENDPOINTS.YOUTUBE_DELETE}?videoId=${videoId}&userId=${user.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403 && data.error?.includes('Permission denied')) {
                    toast.error('Delete permission not available. Please reconnect your YouTube account.', {
                        autoClose: 5000,
                    });
                    setTimeout(() => {
                        router.push(ROUTES_KEYS.DASHBOARD);
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
        setConfirmDeleteVideoId(videoId);
        setShowConfirmDeleteDialog(true);
    };

    const handleDeleteVideo = (video: { id: string; name: string; projectId?: string; generatedVideoId?: string }) => {
        setVideoToDelete(video);
        setShowConfirmDeleteVideoDialog(true);
    };

    const handleDownloadVideo = (video: { id: string; name: string; webContentLink: string }) => {
        try {
            const downloadUrl = HelperFunctions.normalizeGoogleDriveUrl(video.webContentLink);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${video.name}.mp4`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('Download started');
        } catch (error: any) {
            console.log('Error downloading video:', error);
            console.log('Failed to download video');
        }
    };

    const confirmDeleteVideo = async () => {
        if (!videoToDelete || !user?.email) {
            return;
        }

        try {
            setDeletingVideoStatus(true);
            const supabase = getSupabase();
            const supabaseAny: any = supabase;

            if (!videoToDelete.generatedVideoId) {
                toast.error('Video ID not found');
                return;
            }

            const { error } = await supabaseAny
                .from(DB_TABLES.GENERATED_VIDEOS)
                .update({ render_status: RENDER_STATUS.DELETED, updated_at: new Date().toISOString() })
                .eq('id', videoToDelete.generatedVideoId);

            if (error) {
                console.log('Error deleting video:', error);
                toast.error(error.message || 'Failed to delete video');
                return;
            }

            setJobs(prevJobs => {
                return prevJobs.map(job => {
                    const updatedVideos = job.videos.filter(video => video.id !== videoToDelete.id);
                    if (updatedVideos.length === 0) {
                        return null;
                    }
                    return {
                        ...job,
                        videos: updatedVideos
                    };
                }).filter((job): job is OutputVideosJob => job !== null);
            });

            toast.success('Video deleted successfully');
            setShowConfirmDeleteVideoDialog(false);
            setVideoToDelete(null);
        } catch (e: any) {
            console.log('Error deleting video:', e);
            toast.error(e?.message || 'Failed to delete video');
        } finally {
            setDeletingVideoStatus(false);
        }
    };

    if (loadingJobs && activeTab === 0) {
        return <LoadingOverlay title="Loading videos..." desc="Fetching videos from Google Drive..." />;
    }

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

                    <h1 className={styles.title}>Dashboard</h1>
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

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Ready to Publish" />
                    <Tab label="In Progress" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <>
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
                                                onError={(e) => {
                                                    const videoElement = e.target as HTMLVideoElement;
                                                    const error = videoElement.error;
                                                    if (error) {
                                                        console.warn('Video playback error:', error.code, error.message);
                                                        // Show user-friendly message for processing errors
                                                        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || error.code === MediaError.MEDIA_ERR_DECODE) {
                                                            const wrapper = videoElement.parentElement;
                                                            if (wrapper) {
                                                                wrapper.innerHTML = `
                                                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; color: rgba(255, 255, 255, 0.9); background: rgba(0, 0, 0, 0.5);">
                                                                        <p style="margin: 0 0 10px 0; font-size: 14px;">Video is still processing on Google Drive</p>
                                                                        <p style="margin: 0 0 15px 0; font-size: 12px; opacity: 0.7;">Please try again in a few minutes</p>
                                                                        <a href="${video.webViewLink}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none; font-size: 12px;">Open in Google Drive</a>
                                                                    </div>
                                                                `;
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                            {publishedVideo && (
                                                <>
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
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
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
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <div className={styles.videoName}>{video.name}</div>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton
                                                        onClick={() => handleDownloadVideo(video)}
                                                        size="small"
                                                        sx={{
                                                            color: '#3b82f6',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                                            },
                                                        }}
                                                        title="Download video"
                                                    >
                                                        <DownloadIcon sx={{ fontSize: 20 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDeleteVideo(video)}
                                                        disabled={deletingVideoStatus}
                                                        size="small"
                                                        sx={{
                                                            color: '#ef4444',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                            },
                                                            '&:disabled': {
                                                                opacity: 0.6,
                                                            },
                                                        }}
                                                        title="Delete video"
                                                    >
                                                        {deletingVideoStatus && videoToDelete?.id === video.id ? (
                                                            <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                                                        ) : (
                                                            <DeleteIcon sx={{ fontSize: 20 }} />
                                                        )}
                                                    </IconButton>
                                                </Box>
                                            </Box>

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
                </>
            )}

            {activeTab === 1 && (
                <>
                    {loadingInProgress ? (
                        <LoadingOverlay title="Loading projects..." desc="Fetching in-progress projects..." />
                    ) : inProgressProjects.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyTitle}>No projects in progress</div>
                            <div className={styles.emptyDescription}>
                                Projects that are currently being rendered will appear here.
                            </div>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {inProgressProjects.map((project: any) => (
                                <div key={project.id} className={styles.card}>
                                    <div className={styles.videoWrapper} style={{ position: 'relative', backgroundColor: '#1f2937', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {project.video_thumbnail_url ? (
                                            <img
                                                src={HelperFunctions.normalizeGoogleDriveUrl(project.video_thumbnail_url)}
                                                alt={project.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <Box sx={{ 
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: 1.5, 
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            backgroundColor: project.video_thumbnail_url ? 'rgba(0, 0, 0, 0.5)' : 'transparent'
                                        }}>
                                            <CircularProgress size={32} />
                                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Rendering in progress...</Typography>
                                        </Box>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, fontSize: '0.875rem' }}>
                                            Job ID: {project.job_id}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <div className={styles.videoName}>{project.title || 'Untitled Project'}</div>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleEditProject(project)}
                                                fullWidth
                                                sx={{
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    color: '#ffffff',
                                                    fontWeight: 600,
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                    },
                                                }}
                                            >
                                                Edit Project
                                            </Button>
                                        </Box>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
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
            <AlertDialog
                open={showConfirmDeleteDialog}
                title="Delete YouTube Video"
                message={confirmDeleteVideoId ? `Are you sure you want to delete video "${confirmDeleteVideoId}" from YouTube? This action cannot be undone.` : ''}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                showCancel
                onClose={() => {
                    setShowConfirmDeleteDialog(false);
                    setConfirmDeleteVideoId(null);
                }}
                onConfirm={async () => {
                    if (confirmDeleteVideoId) {
                        setShowConfirmDeleteDialog(false);
                        await deleteVideoById(confirmDeleteVideoId);
                    }
                    setConfirmDeleteVideoId(null);
                }}
            />
            <AlertDialog
                open={showConfirmDeleteVideoDialog}
                title="Delete Video"
                message={videoToDelete ? `Are you sure you want to delete "${videoToDelete.name}"? This will remove it from your dashboard. This action cannot be undone.` : ''}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                showCancel
                onClose={() => {
                    setShowConfirmDeleteVideoDialog(false);
                    setVideoToDelete(null);
                }}
                onConfirm={confirmDeleteVideo}
            />
        </div>
    );
}
