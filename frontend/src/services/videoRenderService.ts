import { HttpService } from './httpService';

const getBackendBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_PYTHON_BACKEND_URL is not set');
  }
  return url.replace(/\/+$/, '');
};

export interface ProcessProjectResponse {
  jobId: string;
  finalVideo: string;
  scenes: string[];
  videoThumbnailUrl?: string;
  driveUpload?: {
    success?: boolean;
    projectFolderId?: string;
    targetFolderId?: string;
    fileId?: string;
    fileName?: string;
    webViewLink?: string;
    message?: string;
  } | null;
}

export const VideoRenderService = {
  async processProjectJson(scriptProductionJSON: any): Promise<ProcessProjectResponse> {
    const baseUrl = getBackendBaseUrl();
    return HttpService.post<ProcessProjectResponse>(
      `${baseUrl}/api/process-project-from-json`,
      scriptProductionJSON,
    );
  },
};

export default VideoRenderService;
