"use client";

import { useAppSelector } from "../../../store";
import { setTextElements } from "../../../store/slices/projectSlice";
import { TextElement } from "../../../types/video_editor";
import { useAppDispatch } from "../../../store";
import styles from "./TextProperties.module.css";

export default function TextProperties() {
    const { textElements, activeElementIndex } = useAppSelector((state) => state.projectState);
    const textElement = textElements[activeElementIndex];
    const dispatch = useAppDispatch();

    const onUpdateText = (id: string, updates: Partial<TextElement>) => {
        dispatch(setTextElements(textElements.map(text =>
            text.id === id ? { ...text, ...updates } : text
        )));
    };

    if (!textElement) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.grid}>
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Text Properties</h4>
                    <div>
                        <textarea
                            value={textElement.text}
                            onChange={(e) => onUpdateText(textElement.id, { text: e.target.value })}
                            className={styles.textarea}
                            rows={3}
                        />
                    </div>
                </div>
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Timing Position</h4>
                    <div className={styles.row}>
                        <div>
                            <label className={styles.label}>Start (s)</label>
                            <input
                                type="number"
                                value={textElement.positionStart}
                                min={0}
                                readOnly={true}
                                onChange={(e) => onUpdateText(textElement.id, {
                                    positionStart: Number(e.target.value),
                                    positionEnd: Number(e.target.value) + (textElement.positionEnd - textElement.positionStart)
                                })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>End (s)</label>
                            <input
                                type="number"
                                readOnly={true}
                                value={textElement.positionEnd}
                                min={textElement.positionStart}
                                onChange={(e) => onUpdateText(textElement.id, {
                                    positionEnd: Number(e.target.value)
                                })}
                                className={styles.input}
                            />
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
                                value={textElement.x || 0}
                                onChange={(e) => onUpdateText(textElement.id, { x: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Y Position</label>
                            <input
                                type="number"
                                step="10"
                                value={textElement.y || 0}
                                onChange={(e) => onUpdateText(textElement.id, { y: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Font Size</label>
                            <input
                                type="number"
                                step="5"
                                value={textElement.fontSize || 24}
                                onChange={(e) => onUpdateText(textElement.id, { fontSize: Number(e.target.value) })}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Font Type</label>
                            <select
                                value={textElement.font}
                                onChange={(e) => onUpdateText(textElement.id, { font: e.target.value })}
                                className={styles.select}
                            >
                                <option value="Arial">Arial</option>
                                <option value="Inter">Inter</option>
                                <option value="Lato">Lato</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Style Properties</h4>
                    <div className={styles.gridTwo}>
                        <div>
                            <label className={styles.label}>Text Color</label>
                            <input
                                type="color"
                                value={textElement.color || "#ffffff"}
                                onChange={(e) => onUpdateText(textElement.id, { color: e.target.value })}
                                className={styles.colorInput}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={textElement.opacity}
                                onChange={(e) => onUpdateText(textElement.id, { opacity: Number(e.target.value) })}
                                className={styles.range}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}