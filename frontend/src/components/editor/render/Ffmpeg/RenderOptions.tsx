"use client";
import { useAppSelector } from "../../../../store";
import { useAppDispatch } from "../../../../store";
import { setResolution, setQuality, setSpeed } from "../../../../store/slices/projectSlice";
import { useState } from "react";
import Image from "next/image";
import styles from "./RenderOptions.module.css";
import infoIcon from "@/assets/images/info.svg";
import AlertDialog from "@/dialogs/AlertDialog";

export default function RenderOptions() {
    const { exportSettings } = useAppSelector(state => state.projectState);
    const dispatch = useAppDispatch();
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <span className={styles.headerTitle}>Render Options</span>
                    <button
                        type="button"
                        className={styles.infoButton}
                        onClick={() => setShowInfo((prev) => !prev)}
                        aria-label="Resolution and quality info"
                    >
                        <Image alt="Info" src={infoIcon} width={16} height={16} />
                    </button>
                </div>
                <div className={styles.section}>
                    <label className={styles.label}>Resolution</label>
                    <select
                        value={exportSettings.resolution}
                        onChange={(e) => dispatch(setResolution(e.target.value))}
                        className={styles.select}
                    >
                        <option value="480p">480p</option>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p (Full HD)</option>
                    </select>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Quality</label>
                    <select
                        value={exportSettings.quality}
                        onChange={(e) => dispatch(setQuality(e.target.value))}
                        className={styles.select}
                    >
                        <option value="low">Low (Fastest)</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="ultra">Ultra (Best Quality)</option>
                    </select>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Processing Speed</label>
                    <select
                        value={exportSettings.speed}
                        onChange={(e) => dispatch(setSpeed(e.target.value))}
                        className={styles.select}
                    >
                        <option value="fastest">Fastest</option>
                        <option value="fast">Fast</option>
                        <option value="balanced">Balanced</option>
                        <option value="slow">Slow</option>
                        <option value="slowest">Slowest</option>
                    </select>
                </div>

                <div className={styles.summary}>
                    Current settings: {exportSettings.resolution} at {exportSettings.quality} quality ({exportSettings.speed} processing)
                </div>
            </div>
            <AlertDialog
                open={showInfo}
                title="Resolution vs Quality"
                message={(
                    <>
                        Resolution sets the frame size and sharpness (e.g., 480p, 720p, 1080p).
                        <br />
                        <br />
                        Quality controls - higher quality retains more detail but results in larger files and longer render times.
                    </>
                )}
                onClose={() => setShowInfo(false)}
                confirmLabel="Got it"
            />
        </div>
    );
}