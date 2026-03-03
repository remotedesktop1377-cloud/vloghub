"use client";

import { useState } from "react";
import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import Image from "next/image";
import toast from "react-hot-toast";
import { HelperFunctions } from "@/utils/helperFunctions";
import addIcon from "@/assets/images/add.svg";
import styles from "./AddMedia.module.css";

export default function AddMedia({ fileId }: { fileId: string }) {
    const { mediaFiles } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async () => {
        setIsLoading(true);
        try {
        const updatedMedia = [...mediaFiles];

        const file = await getFile(fileId);
        const mediaId = crypto.randomUUID();
        const nextLayerIndex = mediaFiles
            .filter((m) => m.type === "video" || m.type === "image")
            .reduce((max, m) => Math.max(max, (m.timelineLayerIndex ?? -1) + 1), 0);

        if (fileId) {
            const mediaType = HelperFunctions.categorizeFile(file.type);
            const relevantClips = mediaFiles.filter(clip => clip.type === mediaType);
            const lastEnd = relevantClips.length > 0
                ? Math.max(...relevantClips.map(f => f.positionEnd))
                : 0;
            const duration = await HelperFunctions.extractMediaDuration(file, mediaType);
            const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 4;

            updatedMedia.push({
                id: mediaId,
                fileName: file.name,
                fileId: fileId,
                startTime: 0,
                endTime: safeDuration,
                src: URL.createObjectURL(file),
                positionStart: lastEnd,
                positionEnd: lastEnd + safeDuration,
                includeInMerge: true,
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                rotation: 0,
                opacity: 100,
                crop: { x: 0, y: 0, width: 1920, height: 1080 },
                playbackSpeed: 1,
                volume: 100,
                type: mediaType,
                zIndex: 0,
                timelineLayerIndex: (mediaType === "video" || mediaType === "image") ? nextLayerIndex : undefined,
            });
        }
            dispatch(setMediaFiles(updatedMedia));
            toast.success('Media added successfully.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
        >
            <label
                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium sm:text-base py-2 px-2"
                style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
                {isLoading ? (
                    <div className={styles.spinner}></div>
                ) : (
                    <Image
                        alt="Add Media"
                        className="Black"
                        height={12}
                        width={12}
                        src={addIcon}
                    />
                )}
                {/* <span className="text-xs">Add Media</span> */}
                <button
                    onClick={handleFileChange}
                    disabled={isLoading}
                >
                </button>
            </label>
        </div>
    );
}
