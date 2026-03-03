"use client";
import React from "react";
import { useAppSelector } from "../../../../store";
import { SceneData } from "../../../../types/sceneData";
import { HelperFunctions } from "../../../../utils/helperFunctions";
import styles from "./ScenesTimeline.module.css";

interface ScenesTimelineProps {
    scenesData: SceneData[];
}

export default function ScenesTimeline({ scenesData }: ScenesTimelineProps) {
    const { timelineZoom } = useAppSelector((state) => state.projectState);

    if (!scenesData || scenesData.length === 0) return null;

    return (
        <div className={styles.container}>
            {scenesData.map((scene, index) => {
                const start = HelperFunctions.getValidNumber(scene.startTime) ?? 0;
                const end = HelperFunctions.getValidNumber(scene.endTime);
                const durationInSeconds = HelperFunctions.getValidNumber(scene.durationInSeconds) ?? 4;
                const sceneEnd = end && end > start ? end : start + durationInSeconds;
                const sceneDuration = sceneEnd - start;
                const width = sceneDuration * timelineZoom;
                const left = start * timelineZoom;
                const label = scene.title || scene.narration?.slice(0, 24) || `Scene ${index + 1}`;

                return (
                    <div
                        key={scene.id || index}
                        className={styles.sceneBlock}
                        style={{
                            left: `${left}px`,
                            width: `${Math.max(40, width)}px`,
                        }}
                        title={scene.narration || `Scene ${index + 1}`}
                    >
                        <span className={styles.sceneLabel}>{label}{label.length >= 24 ? "…" : ""}</span>
                    </div>
                );
            })}
        </div>
    );
}
