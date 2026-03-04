"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles } from "../../../../store/slices/projectSlice";
import Image from "next/image";
import styles from "./UploadMedia.module.css";
import uploadIcon from "@/assets/images/media-upload.svg";
import toast from "react-hot-toast";
import { GoogleDriveServiceFunctions } from "@/services/googleDriveService";
import { HelperFunctions, SecureStorageHelpers } from "@/utils/helperFunctions";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export default function AddMedia() {
    const { mediaFiles } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
    });

    const uploadImageToRemotion = async (currentJobId: string, file: File): Promise<string | null> => {
        const dataUrl = await fileToDataUrl(file);
        if (!dataUrl) return null;

        const response = await fetch(API_ENDPOINTS.LAMBDA_UPLOAD_SCENE_IMAGES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId: currentJobId,
                scenes: [
                    {
                        id: 'scene-1',
                        assets: { images: [dataUrl], clips: [] },
                    },
                ],
            }),
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Failed to upload image to Remotion');
        }

        const data = await response.json();
        const uploadedUrl = data?.scenes?.[0]?.assets?.images?.[0];
        return typeof uploadedUrl === 'string' && uploadedUrl.trim().length > 0 ? uploadedUrl : null;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoading(true);
        try {
            const newFiles = Array.from(e.target.files || []);
            if (!newFiles.length) {
                e.target.value = "";
                return;
            }

            const scriptMetadata = SecureStorageHelpers.getScriptMetadata();
            const jobId = scriptMetadata?.jobId || scriptMetadata?.project?.jobId || "";
            if (!jobId) {
                toast.error("Job ID not found");
                e.target.value = "";
                return;
            }

        const updatedMedia = [...mediaFiles];
        for (const file of newFiles) {
            const mediaType = HelperFunctions.categorizeFile(file.type);
            let sourceUrl = "";
            let uploadedFileName = file.name;

            if (mediaType === "image") {
                try {
                    const remotionImageUrl = await uploadImageToRemotion(jobId, file);
                    if (!remotionImageUrl) {
                        toast.error("Failed to upload image to Remotion");
                        continue;
                    }
                    sourceUrl = remotionImageUrl;
                } catch (error: any) {
                    toast.error(error?.message || "Failed to upload image to Remotion");
                    continue;
                }
            } else {
                const uploadResult = await GoogleDriveServiceFunctions.uploadMediaToDrive(jobId, "input", file);
                if (!uploadResult?.success || !uploadResult.fileId) {
                    toast.error(uploadResult?.message || "Failed to upload media");
                    continue;
                }
                const viewLink = uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.fileId}/view?usp=drive_link`;
                sourceUrl = HelperFunctions.normalizeGoogleDriveUrl(viewLink);
                uploadedFileName = uploadResult.fileName || file.name;
            }

            const duration = await HelperFunctions.extractMediaDuration(file, mediaType);
            const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 4;
            const relevantClips = updatedMedia.filter(clip => clip.type === mediaType);
            const lastEnd = relevantClips.length > 0
                ? Math.max(...relevantClips.map(f => f.positionEnd))
                : 0;
            const mediaId = crypto.randomUUID();
            const nextLayerIndex = updatedMedia
                .filter((m) => m.type === "video" || m.type === "image")
                .reduce((max, m) => Math.max(max, (m.timelineLayerIndex ?? -1) + 1), 0);

            updatedMedia.push({
                id: mediaId,
                fileName: uploadedFileName,
                fileId: mediaId,
                type: mediaType,
                startTime: 0,
                endTime: safeDuration,
                src: sourceUrl,
                positionStart: lastEnd,
                positionEnd: lastEnd + safeDuration,
                includeInMerge: true,
                playbackSpeed: 1,
                volume: 100,
                zIndex: updatedMedia.length,
                timelineLayerIndex: (mediaType === "video" || mediaType === "image") ? nextLayerIndex : undefined,
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                rotation: 0,
                opacity: 100,
                crop: { x: 0, y: 0, width: 1920, height: 1080 },
            });
        }

            dispatch(setMediaFiles(updatedMedia));
            if (updatedMedia.length > mediaFiles.length) {
                console.log(JSON.stringify(updatedMedia));
                toast.success("Media uploaded successfully");
            }
            e.target.value = "";
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <label
                htmlFor="file-upload"
                className={styles.button}
                style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
                {isLoading ? (
                    <>
                        <div className={styles.spinner}></div>
                        <span className={styles.label}>Uploading...</span>
                    </>
                ) : (
                    <>
                        <Image
                            alt="Add Media"
                            className={styles.icon}
                            height={12}
                            width={12}
                            src={uploadIcon}
                        />
                        <span className={styles.label}>Add Media</span>
                    </>
                )}
            </label>
            <input
                type="file"
                accept="video/*,audio/*,image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
            />
        </div>
    );
}
