'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OutputVideosJob } from '@/services/dashboardService';
import { HelperFunctions } from '@/utils/helperFunctions';
import styles from './DashboardPageClient.module.css';
import LoadingOverlay from '../ui/LoadingOverlay';
import { ROUTES_KEYS } from '@/data/constants';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { ArrowBack, Refresh as RefreshIcon } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';

interface DashboardPageClientProps {
    jobs: OutputVideosJob[];
}

export default function DashboardPageClient({ jobs: initialJobs }: DashboardPageClientProps) {
    const router = useRouter();
    const [jobs, setJobs] = useState<OutputVideosJob[]>(initialJobs);
    const [refreshing, setRefreshing] = useState(false);

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
                throw new Error('Failed to refresh videos');
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
                    {flattenedVideos.map(video => (
                        <div key={video.id} className={styles.card}>
                            <div className={styles.videoWrapper}>
                                <video
                                    className={styles.videoElement}
                                    src={HelperFunctions.normalizeGoogleDriveUrl(video.webContentLink)}
                                    controls
                                //   controlsList="nodownload"
                                />
                                {/* <div className={styles.playOverlay}>
                  <div className={styles.playCircle}>
                    <div className={styles.playIcon} />
                  </div>
                </div> */}
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.jobId}>Job ID</div>
                                <div className={styles.videoName}>{video.jobId}</div>
                                {/* <div className={styles.meta}>{video.mimeType || 'video'}</div> */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
