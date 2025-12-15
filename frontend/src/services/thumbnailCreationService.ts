import { API_ENDPOINTS } from "@/config/apiEndpoints";
import HttpService from "./httpService";
import { GoogleDriveServiceFunctions } from "./googleDriveService";

export interface ThumbnailCreationResponse {
    success: boolean;
    originalTitle?: string;
    enhancedText?: string;
    thumbnail?: string;
    imageUrl?: string;
    error?: string;
}

export const ThumbnailCreationService = {

    async getThumbnail(title: string): Promise<string | null> {
        const enhancedTitle = await this.enhanceTitleForThumbnail(title);
        if (enhancedTitle && enhancedTitle.success && enhancedTitle?.enhancedText) {
            return await this.generateThumbnail(enhancedTitle.enhancedText);
        } else {
            return null;
        }
        return null;
    },

    async enhanceTitleForThumbnail(title: string): Promise<ThumbnailCreationResponse> {
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return {
                success: false,
                error: 'Title is required and must be a non-empty string'
            };
        }

        try {
            const response = await HttpService.post<ThumbnailCreationResponse>(
                API_ENDPOINTS.ENHANCE_TITLE_FOR_THUMBNAIL,
                { title: title.trim() }
            );
            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to refine title'
            };
        }
    },

    async generateThumbnail(enhancedTitle: string): Promise<string | null> {
        if (!enhancedTitle || typeof enhancedTitle !== 'string' || enhancedTitle.trim().length === 0) {
            return null;
        }

        try {
            const response = await HttpService.post<ThumbnailCreationResponse>(
                API_ENDPOINTS.GENERATE_THUMBNAIL,
                { enhancedTitle: enhancedTitle.trim() }
            );
            
            if (response.success && response.thumbnail) {
                // console.log('=== Thumbnail Generated Successfully ===');
                // console.log('Thumbnail URL:', response.imageUrl);
                // console.log('=========================================');
                return response.thumbnail;
            }
            return null;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    },

    async uploadThumbnailToDrive(jobId: string, thumbnailDataUrl: string): Promise<string | null> {
        if (!jobId || !thumbnailDataUrl) {
            console.error('JobId and thumbnail data URL are required');
            return null;
        }

        try {
            const matches = thumbnailDataUrl.match(/^data:(.*?);base64,(.*)$/);
            if (!matches) {
                console.error('Invalid thumbnail data URL format');
                return null;
            }

            const mime = matches[1] || 'image/jpeg';
            const b64 = matches[2] || '';
            const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
            const len = bin.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
            const blob = new Blob([bytes], { type: mime });
            const file = new File([blob], 'thumbnail.jpg', { type: mime });

            const uploadResult = await GoogleDriveServiceFunctions.uploadMediaToDrive(
                jobId,
                'input',
                file
            );

            if (uploadResult.success && uploadResult.webViewLink) {
                // console.log('=== Thumbnail Uploaded to Google Drive ===');
                // console.log('Thumbnail Drive URL:', uploadResult.webViewLink);
                // console.log('===========================================');
                return uploadResult.webViewLink;
            } else {
                console.error('Failed to upload thumbnail to Google Drive:', uploadResult);
                return null;
            }
        } catch (error) {
            console.error('Error uploading thumbnail to Google Drive:', error);
            return null;
        }
    },
};

export default ThumbnailCreationService;
