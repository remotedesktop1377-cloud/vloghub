"use client";

import { deleteFile, useAppSelector, getFile } from "@/store";
import { setMediaFiles, setFilesID } from "@/store/slices/projectSlice";
import { UploadedFile } from "@/types/video_editor";
import { useAppDispatch } from "@/store";
import AddMedia from "../AddButtons/AddMedia";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import styles from "./MediaList.module.css";
import deleteIcon from "@/assets/images/delete-red.svg";
export default function MediaList() {
    const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const driveMediaFiles = mediaFiles.filter((media) => {
        if (!media?.src) return false;
        if (filesID?.includes(media.fileId)) return false;
        return true;
    });

    useEffect(() => {
        let mounted = true;

        const fetchFiles = async () => {
            try {
                const storedFilesArray: UploadedFile[] = [];

                for (const fileId of filesID || []) {
                    const file = await getFile(fileId);
                    if (file && mounted) {
                        storedFilesArray.push({
                            file: file,
                            id: fileId,
                        });
                    }
                }

                if (mounted) {
                    setFiles(storedFilesArray);
                }
            } catch (error) {
                toast.error("Error fetching files");
                console.error("Error fetching files:", error);
            }
        };

        fetchFiles();

        return () => {
            mounted = false;
        };
    }, [filesID]);

    const onDeleteMedia = async (id: string) => {
        const onUpdateMedia = mediaFiles.filter(f => f.fileId !== id);
        dispatch(setMediaFiles(onUpdateMedia));
        dispatch(setFilesID(filesID?.filter(f => f !== id) || []));
        await deleteFile(id);
    };

    const onDeleteDriveMedia = (id: string) => {
        const onUpdateMedia = mediaFiles.filter(f => f.id !== id);
        dispatch(setMediaFiles(onUpdateMedia));
    };

    return (
        <>
            {(files.length > 0 || driveMediaFiles.length > 0) && (
                <div className={styles.list}>
                    {files.map((mediaFile) => (
                        <div key={mediaFile.id} className={styles.card}>
                            <div className={styles.row}>
                                <div className={styles.fileInfo}>
                                    <AddMedia fileId={mediaFile.id} />
                                    <span className={styles.fileName} title={mediaFile.file.name}>
                                        {mediaFile.file.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onDeleteMedia(mediaFile.id)}
                                    className={styles.deleteButton}
                                    aria-label="Delete file"
                                >
                                    <Image
                                        alt="Delete"
                                        className={styles.deleteIcon}
                                        height={18}
                                        width={18}
                                        src={deleteIcon}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                    {driveMediaFiles.map((mediaFile) => (
                        <div key={mediaFile.id} className={styles.card}>
                            <div className={styles.row}>
                                <div className={styles.fileInfo}>
                                    <span className={styles.fileName} title={mediaFile.fileName}>
                                        {mediaFile.fileName}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onDeleteDriveMedia(mediaFile.id)}
                                    className={styles.deleteButton}
                                    aria-label="Delete file"
                                >
                                    <Image
                                        alt="Delete"
                                        className={styles.deleteIcon}
                                        height={18}
                                        width={18}
                                        src={deleteIcon}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}