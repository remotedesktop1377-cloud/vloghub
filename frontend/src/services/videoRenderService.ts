import { HttpService } from './httpService';

const getBackendBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_PYTHON_BACKEND_URL is not set');
  }
  return url.replace(/\/+$/, '');
};

export const VideoRenderService = {
  async processProjectJson(scriptProductionJSON: any): Promise<{ jobId: string; finalVideo: string; scenes: string[] }> {
    const baseUrl = getBackendBaseUrl();
    return HttpService.post<{ jobId: string; finalVideo: string; scenes: string[] }>(
      `${baseUrl}/api/process-project-from-json`,
      scriptProductionJSON,
    );
  },
};

export default VideoRenderService;


