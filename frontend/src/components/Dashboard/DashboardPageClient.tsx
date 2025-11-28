'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardService, OutputVideosJob } from '@/services/dashboardService';
import { HelperFunctions } from '@/utils/helperFunctions';
import styles from './DashboardPageClient.module.css';
import LoadingOverlay from '../ui/LoadingOverlay';

export default function DashboardPageClient() {
  const router = useRouter();
  const [jobs, setJobs] = useState<OutputVideosJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const data = await DashboardService.fetchOutputVideos();
        if (!active) {
          return;
        }
        setJobs(data.jobs || []);
      } catch (e: any) {
        HelperFunctions.showError(e?.message || 'Failed to load dashboard videos');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const flattenedVideos = jobs.flatMap(job =>
    (job.videos || []).map(v => ({
      ...v,
      jobId: job.jobId,
    })),
  );

  const handleBackClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/trending-topics');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <button className={styles.backButton} onClick={handleBackClick}>
            <span className={styles.backIcon} />
          </button>
          <h1 className={styles.title}>Dashboard - Rendered Videos from Completed Jobs</h1>
        </div>
        <p className={styles.subtitle}>
          Review final rendered videos from your completed jobs. Videos are loaded from the output folder in your Google Drive job directories.
        </p>
      </div>

      {loading && (
        <LoadingOverlay title="Loading videos from Google Drive" desc="This may take a few moments" />
      )}

      {!loading && flattenedVideos.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No final videos found yet</div>
          <div className={styles.emptyDescription}>
            When your background processing finishes and uploads the final video to the output folder of a job on Google Drive, it will appear here.
          </div>
        </div>
      )}

      {!loading && flattenedVideos.length > 0 && (
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
