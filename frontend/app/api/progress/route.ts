import { NextRequest } from 'next/server';
import { getProgress } from '@/utils/progressTracker';

export const runtime = 'nodejs';

/**
 * Server-Sent Events endpoint for progress updates
 * GET /api/progress?jobId=xxx
 */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  
  if (!jobId) {
    return new Response('Missing jobId parameter', { status: 400 });
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      send(JSON.stringify({ type: 'transcribing', jobId }));

      let pollCount = 0;
      const MAX_POLLS = 600; // 5 minutes (600 * 500ms)

      // Poll for progress updates
      const interval = setInterval(() => {
        pollCount++;
        
        // Timeout after 5 minutes if job never starts
        if (pollCount > MAX_POLLS) {
          send(JSON.stringify({ type: 'timeout', message: 'Job not found or timed out' }));
          clearInterval(interval);
          setTimeout(() => controller.close(), 1000);
          return;
        }

        const progress = getProgress(jobId);
        
        if (!progress) {
          // Job not found yet, keep trying
          // Don't close connection - job might start soon
          return;
        }

        send(JSON.stringify(progress));

        // Close connection if completed or errored
        if (progress.stage === 'completed' || progress.stage === 'error') {
          clearInterval(interval);
          setTimeout(() => controller.close(), 1000);
        }
      }, 500); // Poll every 500ms

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

