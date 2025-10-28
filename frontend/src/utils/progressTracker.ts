/**
 * Progress tracking system for long-running operations
 */

export type ProgressStage =
    | 'initializing'
    | 'audio_extraction'
    | 'audio_compression'
    | 'bytes_conversion'
    | 'generateContent'
    | 'semantic_segmentation'
    | 'completed'
    | 'error';

export interface ProgressUpdate {
    jobId: string;
    stage: ProgressStage;
    progress: number; // 0-100
    message: string;
    timestamp: number;
    error?: string;
}

// In-memory store for progress updates
// In production, this should be replaced with Redis or a database
const progressStore = new Map<string, ProgressUpdate>();

/**
 * Create a new progress tracker
 */
export function createProgress(jobId: string): void {
    progressStore.set(jobId, {
        jobId,
        stage: 'initializing',
        progress: 0,
        message: 'Initializing...',
        timestamp: Date.now(),
    });
}

/**
 * Update progress for a job
 */
export function updateProgress(
    jobId: string,
    stage: ProgressStage,
    progress: number,
    message: string,
    error?: string
): void {
    const update: ProgressUpdate = {
        jobId,
        stage,
        progress: Math.min(100, Math.max(0, progress)),
        message,
        timestamp: Date.now(),
        error,
    };

    progressStore.set(jobId, update);
}

/**
 * Get current progress for a job
 */
export function getProgress(jobId: string): ProgressUpdate | null {
    return progressStore.get(jobId) || null;
}

/**
 * Mark progress as completed
 */
export function completeProgress(jobId: string): void {
    updateProgress(jobId, 'completed', 100, 'Completed successfully');
}

/**
 * Mark progress as error
 */
export function errorProgress(jobId: string, error: string): void {
    updateProgress(jobId, 'error', -1, 'An error occurred', error);
}

/**
 * Delete progress (cleanup)
 */
export function deleteProgress(jobId: string): void {
    // Keep progress for 1 hour before cleanup
    setTimeout(() => {
        progressStore.delete(jobId);
    }, 60 * 60 * 1000);
}

/**
 * Get all stages with their weight for calculating progress
 */
export function getStageWeights(): Record<ProgressStage, number> {
    return {
        'initializing': 0,
        'audio_extraction': 20,
        'audio_compression': 10,
        'bytes_conversion': 5,
        'generateContent': 30,
        'semantic_segmentation': 30,
        'completed': 5,
        'error': 0,
    };
}

/**
 * Calculate progress based on stages
 */
export function calculateProgress(stage: ProgressStage, stageProgress: number = 0): number {
    const weights = getStageWeights();
    const stages: ProgressStage[] = [
        'initializing',
        'audio_extraction',
        'audio_compression',
        'bytes_conversion',
        'generateContent',
        'semantic_segmentation',
        'completed',
    ];

    const currentStageIndex = stages.indexOf(stage);
    if (currentStageIndex === -1) return 0;

    let progress = 0;
    for (let i = 0; i < currentStageIndex; i++) {
        progress += weights[stages[i]];
    }

    if (stage === 'completed') {
        return 100;
    }

    progress += weights[stage] * stageProgress / 100;
    return progress;
}

/**
 * Generate unique job ID
 */
export function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
