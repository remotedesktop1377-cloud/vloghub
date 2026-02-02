"use client";

import { useAppDispatch, useAppSelector } from "../../../../store";
import { setFilesID } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import Image from "next/image";
import styles from "./UploadMedia.module.css";
import uploadIcon from "@/assets/images/media-upload.svg";

export default function AddMedia() {
    const { mediaFiles, filesID } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        const updatedFiles = [...filesID || []];
        for (const file of newFiles) {
            const fileId = crypto.randomUUID();
            await storeFile(file, fileId);
            updatedFiles.push(fileId)
        }
        dispatch(setFilesID(updatedFiles));
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
