"use client";

import { useState } from "react";
import { TextElement } from "../../../../types/video_editor";
import { useAppDispatch, useAppSelector } from "../../../../store";
import { setTextElements } from "../../../../store/slices/projectSlice";
import toast from "react-hot-toast";
import styles from "./AddText.module.css";

export default function AddTextButton() {
    const [textConfig, setTextConfig] = useState<Partial<TextElement>>({
        text: "Example",
        positionStart: 0,
        positionEnd: 10,
        x: 600,
        y: 500,
        fontSize: 200,
        color: "#ff0000",
        backgroundColor: "transparent",
        align: "center",
        zIndex: 0,
        opacity: 100,
        rotation: 0,
        animation: "none"
    });
    const { textElements } = useAppSelector((state) => state.projectState);
    const dispatch = useAppDispatch();

    const onAddText = (textElement: TextElement) => {
        dispatch(setTextElements([...textElements, textElement]));
    };

    const handleAddText = () => {
        const lastEnd = textElements.length > 0 ? Math.max(...textElements.map(f => f.positionEnd)) : 0;

        const newTextElement: TextElement = {
            id: crypto.randomUUID(),
            text: textConfig.text || "",
            positionStart: lastEnd || 0,
            positionEnd: lastEnd + 10 || 10,
            x: textConfig.x || 0,
            y: textConfig.y || 0,
            width: textConfig.width,
            height: textConfig.height,
            font: textConfig.font || "Arial",
            fontSize: textConfig.fontSize || 24,
            color: textConfig.color || "#ffffff",
            backgroundColor: textConfig.backgroundColor || "transparent",
            align: textConfig.align || "center",
            zIndex: textConfig.zIndex || 0,
            opacity: textConfig.opacity || 100,
            rotation: textConfig.rotation || 0,
            fadeInDuration: textConfig.fadeInDuration,
            fadeOutDuration: textConfig.fadeOutDuration,
            animation: textConfig.animation || "none"
        };

        onAddText(newTextElement);
        setTextConfig({
            text: "Example",
            positionStart: lastEnd,
            positionEnd: lastEnd + 10,
            x: 500,
            y: 600,
            fontSize: 200,
            color: "#ff0000",
            backgroundColor: "transparent",
            align: "center",
            zIndex: 0,
            opacity: 100,
            rotation: 0,
            animation: "none"
        });
        toast.success("Text added successfully.");
    };

    return (
        <div className={styles.wrapper}>
            {(
                <div className={styles.panel}>
                    <div className={styles.card}>
                        <div className={styles.form}>
                            <div>
                                <label className={styles.labelLarge}>Text Content</label>
                                <textarea
                                    value={textConfig.text}
                                    onChange={(e) => setTextConfig({ ...textConfig, text: e.target.value })}
                                    className={styles.textarea}
                                />
                            </div>

                            <div className={styles.gridTwo}>
                                <div>
                                    <label className={styles.label}>Start Time (s)</label>
                                    <input
                                        type="number"
                                        value={textConfig.positionStart}
                                        onChange={(e) => setTextConfig({ ...textConfig, positionStart: Number(e.target.value) })}
                                        className={styles.input}
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>End Time (s)</label>
                                    <input
                                        type="number"
                                        value={textConfig.positionEnd}
                                        onChange={(e) => setTextConfig({ ...textConfig, positionEnd: Number(e.target.value) })}
                                        className={styles.input}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className={styles.gridTwo}>
                                <div>
                                    <label className={styles.label}>X Position</label>
                                    <input
                                        type="number"
                                        value={textConfig.x}
                                        onChange={(e) => setTextConfig({ ...textConfig, x: Number(e.target.value) })}
                                        className={styles.input}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>Y Position</label>
                                    <input
                                        type="number"
                                        value={textConfig.y}
                                        onChange={(e) => setTextConfig({ ...textConfig, y: Number(e.target.value) })}
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            <div className={styles.gridTwo}>
                                <div>
                                    <label className={styles.label}>Font Size</label>
                                    <input
                                        type="number"
                                        value={textConfig.fontSize}
                                        onChange={(e) => setTextConfig({ ...textConfig, fontSize: Number(e.target.value) })}
                                        className={styles.input}
                                        min={0}
                                    />
                                </div>

                                <div>
                                    <label className={styles.label}>Z-Index</label>
                                    <input
                                        type="number"
                                        value={textConfig.zIndex}
                                        onChange={(e) => setTextConfig({ ...textConfig, zIndex: Number(e.target.value) })}
                                        className={styles.input}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className={styles.gridOne}>
                                <div>
                                    <label className={styles.label}>Font Type</label>
                                    <select
                                        value={textConfig.font}
                                        onChange={(e) => setTextConfig({ ...textConfig, font: e.target.value })}
                                        className={styles.select}
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Inter">Inter</option>
                                        <option value="Lato">Lato</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.gridTwo}>
                                <div>
                                    <label className={styles.label}>Text Color</label>
                                    <input
                                        type="color"
                                        value={textConfig.color}
                                        onChange={(e) => setTextConfig({ ...textConfig, color: e.target.value })}
                                        className={styles.colorInput}
                                    />
                                </div>

                            </div>
                            <div className={styles.buttonRow}>
                                <button
                                    onClick={handleAddText}
                                    className={styles.primaryButton}
                                >
                                    Add Text
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}