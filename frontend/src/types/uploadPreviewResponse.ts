export interface UploadPreviewResponse {
    success: boolean;
    projectFolderId: string;
    sceneFolderId: string;
    previewFolderId: string;
    fileId: string;
    fileName: string;
    webViewLink?: string;
}