"use client";

import { useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles } from "../../../../store/slices/projectSlice";
import Image from "next/image";
import styles from "./UploadMedia.module.css";
import uploadIcon from "@/assets/images/media-upload.svg";
import toast from "react-hot-toast";
import { GoogleDriveServiceFunctions } from "@/services/googleDriveService";
import { HelperFunctions, SecureStorageHelpers } from "@/utils/helperFunctions";

export default function AddMedia() {
    const { mediaFiles } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const uploadResult = await GoogleDriveServiceFunctions.uploadMediaToDrive(jobId, "input", file);
            if (!uploadResult?.success || !uploadResult.fileId) {
                toast.error(uploadResult?.message || "Failed to upload media");
                continue;
            }

            const mediaType = HelperFunctions.categorizeFile(file.type);
            const duration = await HelperFunctions.extractMediaDuration(file, mediaType);
            const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 4;
            const relevantClips = updatedMedia.filter(clip => clip.type === mediaType);
            const lastEnd = relevantClips.length > 0
                ? Math.max(...relevantClips.map(f => f.positionEnd))
                : 0;
            const viewLink = uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.fileId}/view?usp=drive_link`;
            const src = HelperFunctions.normalizeGoogleDriveUrl(viewLink);
            const mediaId = crypto.randomUUID();

            updatedMedia.push({
                id: mediaId,
                fileName: uploadResult.fileName || file.name,
                fileId: mediaId,
                type: mediaType,
                startTime: 0,
                endTime: safeDuration,
                src,
                positionStart: lastEnd,
                positionEnd: lastEnd + safeDuration,
                includeInMerge: true,
                playbackSpeed: 1,
                volume: 100,
                zIndex: updatedMedia.length,
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
            toast.success("Media uploaded successfully");
        }
        e.target.value = "";
    };

    return (
        <div className={styles.wrapper}>
            <label
                htmlFor="file-upload"
                className={styles.button}
            >
                <Image
                    alt="Add Media"
                    className={styles.icon}
                    height={12}
                    width={12}
                    src={uploadIcon}
                />
                <span className={styles.label}>Add Media</span>
            </label>
            <input
                type="file"
                accept="video/*,audio/*,image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
            />
        </div>
    );
}
