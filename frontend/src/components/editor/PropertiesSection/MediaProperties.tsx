"use client";

import { useAppSelector } from "../../../store";
import { setMediaFiles } from "../../../store/slices/projectSlice";
import { MediaFile } from "../../../types/video_editor";
import { useAppDispatch } from "../../../store";
import styles from "./MediaProperties.module.css";

export default function MediaProperties() {
    const { mediaFiles, activeElementIndex } = useAppSelector((state) => state.projectState);
    const mediaFile = mediaFiles[activeElementIndex];
    const dispatch = useAppDispatch();
    const onUpdateMedia = (id: string, updates: Partial<MediaFile>) => {
        dispatch(setMediaFiles(mediaFiles.map(media =>
            media.id === id ? { ...media, ...updates } : media
        )));
    };

    if (!mediaFile) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                <div className={styles.gridTwo}>
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Source Video</h4>
                        <div className={styles.row}>
                            <div>
                                <label className={styles.label}>Start (s)</label>
                                <input
                                    type="number"
                                    readOnly={true}
                                    value={mediaFile.startTime}
                                    min={0}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, {
                                        startTime: Number(e.target.value),
                                        endTime: mediaFile.endTime
                                    })}
                                    className={styles.input}
                                />
                            </div>
                            <div>
                                <label className={styles.label}>End (s)</label>
                                <input
                                    type="number"
                                    readOnly={true}
                                    value={mediaFile.endTime}
                                    min={mediaFile.startTime}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, {
                                        startTime: mediaFile.startTime,
                                        endTime: Number(e.target.value)
                                    })}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Timing Position</h4>
                        <div className={styles.row}>
                            <div>
                                <label className={styles.label}>Start (s)</label>
                                <input
                                    type="number"
                                    readOnly={true}
                                    value={mediaFile.positionStart}
                                    min={0}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, {
                                        positionStart: Number(e.target.value),
                                        positionEnd: Number(e.target.value) + (mediaFile.positionEnd - mediaFile.positionStart)
                                    })}
                                    className={styles.input}
                                />
                            </div>
                            <div>
                                <label className={styles.label}>End (s)</label>
                                <input
                                    type="number"
                                    readOnly={true}
                                    value={mediaFile.positionEnd}
                                    min={mediaFile.positionStart}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, {
                                        positionEnd: Number(e.target.value)
                                    })}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Visual Properties</h4>
                    <div className={styles.gridTwo}>
                        <div>
                            <label className={styles.label}>X Position</label>
                            <input
                                type="number"
                                step="10"
                                value={mediaFile.x || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { x: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Y Position</label>
                            <input
                                type="number"
                                step="10"
                                value={mediaFile.y || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { y: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Width</label>
                            <input
                                type="number"
                                step="10"
                                value={mediaFile.width || 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { width: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Height</label>
                            <input
                                type="number"
                                step="10"
                                value={mediaFile.height || 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { height: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Z-Index</label>
                            <input
                                type="number"
                                value={mediaFile.zIndex || 0}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { zIndex: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mediaFile.opacity ?? 100}
                                onChange={(e) => onUpdateMedia(mediaFile.id, { opacity: Number(e.target.value) })}
                                className={styles.range}
                            />
                        </div>
                    </div>
                </div>

                {(mediaFile.type === "video" || mediaFile.type === "audio") && (
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Audio Properties</h4>
                        <div className={styles.gridOne}>
                            <div>
                                <label className={styles.label}>Volume</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={mediaFile.volume ?? 100}
                                    onChange={(e) => onUpdateMedia(mediaFile.id, { volume: Number(e.target.value) })}
                                    className={styles.range}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}