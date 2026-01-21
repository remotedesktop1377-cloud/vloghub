import { useState, useEffect, useRef } from 'react';
import type { ProgressUpdate, ProgressStage } from '@/utils/progressTracker';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

interface UseTranscriptionProgressOptions {
    jobId: string | null;
    onComplete?: (data: any) => void;
    onError?: (error: string) => void;
}

export interface TranscriptionProgress {
    stage: ProgressStage;
    progress: number;
    message: string;
    error?: string;
    isLoading: boolean;
}

export function useTranscriptionProgress({ jobId, onComplete, onError }: UseTranscriptionProgressOptions): TranscriptionProgress {
    const [progress, setProgress] = useState<TranscriptionProgress>({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing...',
        isLoading: false,
    });

    const eventSourceRef = useRef<EventSource | null>(null);

    // Use refs to store callbacks to avoid re-creating EventSource on callback changes
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);

    // Update refs when callbacks change
    useEffect(() => {
        onCompleteRef.current = onComplete;
        onErrorRef.current = onError;
    }, [onComplete, onError]);

    useEffect(() => {
        if (!jobId) {
            setProgress({
                stage: 'initializing',
                progress: 0,
                message: 'No job ID provided',
                isLoading: false,
            });
            return;
        }

        setProgress({
            stage: 'initializing',
            progress: 0,
            message: 'Extracting Audio from Video...',
            isLoading: true,
        });

        const eventSource = new EventSource(`${API_ENDPOINTS.PROGRESS}?jobId=${jobId}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'transcribing') {
                    // console.log('Connected to progress stream');
                    setProgress(prev => ({ ...prev, message: 'Transcribing...', isLoading: true }));
                    return;
                }

                if (data.type === 'timeout') {
                    console.log('Progress tracking timed out');
                    setProgress({
                        stage: 'error',
                        progress: 0,
                        message: data.message || 'Job timed out',
                        isLoading: false,
                    });
                    eventSource.close();
                    if (onErrorRef.current) {
                        onErrorRef.current(data.message || 'Job timed out');
                    }
                    return;
                }

                // Handle progress update
                if (data.stage) {
                    setProgress({
                        stage: data.stage as ProgressStage,
                        progress: data.progress || 0,
                        message: data.message || '',
                        error: data.error,
                        isLoading: data.stage !== 'completed' && data.stage !== 'error',
                    });

                    // Handle completion
                    if (data.stage === 'completed') {
                        eventSource.close();
                        if (onCompleteRef.current) {
                            // Wait a moment for final cleanup
                            setTimeout(() => onCompleteRef.current?.(data), 500);
                        }
                    }

                    // Handle error
                    if (data.stage === 'error') {
                        eventSource.close();
                        if (onErrorRef.current && data.error) {
                            onErrorRef.current(data.error);
                        }
                    }
                }
            } catch (error) {
                console.log('Error parsing progress data:', error);
            }
        };

    eventSource.onerror = (event) => {
      console.log('EventSource error:', event);
      // Only update if we haven't already marked as complete
      setProgress(prev => {
        if (prev.stage === 'completed' || prev.stage === 'error') {
          return prev;
        }
        return {
          ...prev,
          message: 'Connection lost. Attempting to reconnect...',
          isLoading: true,
        };
      });
      // Don't close the connection - let it try to reconnect
    };

        // Cleanup on unmount
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [jobId]); // Only depend on jobId

    return progress;
}

