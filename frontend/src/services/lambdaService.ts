import { HttpService } from './httpService';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export interface LambdaDeployFunctionParams {
  region?: string;
  timeoutInSeconds?: number;
  memorySizeInMb?: number;
  createCloudWatchLogGroup?: boolean;
}

export interface LambdaDeployFunctionResponse {
  functionName: string;
}

export interface LambdaDeploySiteParams {
  entryPoint: string;
  siteName?: string;
  region?: string;
}

export interface LambdaDeploySiteResponse {
  serveUrl: string;
  bucketName: string;
}

export interface LambdaRenderParams {
  serveUrl: string;
  compositionId: string;
  inputProps?: Record<string, any>;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
  imageFormat?: 'jpeg' | 'png';
  maxRetries?: number;
  framesPerLambda?: number;
  privacy?: 'public' | 'private';
  region?: string;
  functionName?: string;
}

export interface LambdaRenderResponse {
  renderId: string;
  bucketName: string;
}

export interface LambdaRenderProgress {
  renderId: string;
  bucketName: string;
  functionName: string;
  region?: string;
}

export interface LambdaRenderProgressResponse {
  done: boolean;
  outputFile?: string;
  fatalErrorEncountered?: boolean;
  errors?: string[];
  timeToFinish?: number;
}

export interface LambdaGetFunctionsParams {
  region?: string;
  compatibleOnly?: boolean;
}

export interface LambdaFunction {
  functionName: string;
  version: string;
  region: string;
}

export interface LambdaQuotasResponse {
  concurrencyLimit: number;
  region: string;
}

export const LambdaService = {
  async deployFunction(params: LambdaDeployFunctionParams = {}): Promise<LambdaDeployFunctionResponse> {
    return HttpService.post<LambdaDeployFunctionResponse, LambdaDeployFunctionParams>(
      API_ENDPOINTS.LAMBDA_DEPLOY_FUNCTION,
      params
    );
  },

  async deploySite(params: LambdaDeploySiteParams): Promise<LambdaDeploySiteResponse> {
    return HttpService.post<LambdaDeploySiteResponse, LambdaDeploySiteParams>(
      API_ENDPOINTS.LAMBDA_DEPLOY_SITE,
      params
    );
  },

  async renderVideo(params: LambdaRenderParams): Promise<LambdaRenderResponse> {
    return HttpService.post<LambdaRenderResponse, LambdaRenderParams>(
      API_ENDPOINTS.LAMBDA_RENDER,
      params
    );
  },

  async getRenderProgress(params: LambdaRenderProgress): Promise<LambdaRenderProgressResponse> {
    return HttpService.post<LambdaRenderProgressResponse, LambdaRenderProgress>(
      API_ENDPOINTS.LAMBDA_RENDER_PROGRESS,
      params
    );
  },

  async getFunctions(params: LambdaGetFunctionsParams = {}): Promise<LambdaFunction[]> {
    return HttpService.post<LambdaFunction[], LambdaGetFunctionsParams>(
      API_ENDPOINTS.LAMBDA_GET_FUNCTIONS,
      params
    );
  },

  async getQuotas(region?: string): Promise<LambdaQuotasResponse> {
    return HttpService.post<LambdaQuotasResponse, { region?: string }>(
      API_ENDPOINTS.LAMBDA_QUOTAS,
      { region }
    );
  },
};
