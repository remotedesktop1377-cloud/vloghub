import React, { useEffect, useState, useRef } from 'react';
import WordCloud from 'react-d3-cloud';
import styles from './WordCloudChart.module.css';

export interface WordData {
    text: string;
    value: number;
    category?: string;
    description?: string;
    source_reference?: string;
}

interface IWordCloudChartProps {
    data: WordData[];
    handleWordClick: (word: WordData) => void;
    width?: number;
    height?: number;
}

export function WordCloudChart(props: IWordCloudChartProps) {
    const [data, setData] = useState<WordData[]>([]);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        word: WordData | null;
    }>({
        visible: false,
        x: 0,
        y: 0,
        word: null
    });

    // Use useRef to maintain stable references that never change
    const stableRefs = useRef({
        randomSeed: Math.random(),
        fontSize: (word: any) => Math.max(10, (50 * word.value) / 100),
        rotate: () => 0,
        fill: (d: any, i: any) => `hsl(${200 + (d.value / 100) * 60}, 70%, 50%)`,
        handleWordClick: (word: any) => {
            setSelectedWord(word.text);
            props.handleWordClick(word);
        },
        handleWordMouseEnter: (event: any, word: any) => {
            const rect = event.target.getBoundingClientRect();
            const containerRect = event.target.closest('div').getBoundingClientRect();
            setTooltip({
                visible: true,
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top - containerRect.top,
                word: word
            });
        },
        handleWordMouseLeave: () => {
            setTooltip(prev => ({ ...prev, visible: false }));
        }
    });

    useEffect(() => {
        if (props.data && props.data.length > 0) {
            const values = props.data.map((r) => r.value);
            const newMax = Math.max(...values);
            setData(props.data);

            // Update the stable references with new max value
            // Make biggest word 30px, smallest word 15px (ensuring all words are visible)
            stableRefs.current.fontSize = (word: any) => {
                const calculatedSize = Math.max(15, (15 * word.value) / newMax + 15);
                console.log(`🔤 Word "${word.text}" (value: ${word.value}) → fontSize: ${calculatedSize}px`);
                return calculatedSize;
            };
            stableRefs.current.fill = (d: any, i: any) => {
                // Highlight selected word with different color
                if (selectedWord === d.text) {
                    return '#1DA1F2'; // Blue for selected
                }
                // Default color based on value
                return `hsl(${200 + (d.value / newMax) * 60}, 70%, 50%)`;
            };
        }
    }, [props.data, selectedWord]);

    if (!data || data.length === 0) {
        return <div 
            className={styles.loadingContainer}
            style={{
                width: props.width || 500,
                height: props.height || 450,
            }}
        >
            Loading word cloud...
        </div>;
    }

    return (
        <div 
            className={styles.wordCloudContainer}
            style={{
                width: props.width || 500,
                height: props.height || 450,
            }}
        >
            <div 
                className={styles.wordCloudWrapper}
                style={{
                    width: (props.width || 500) - 20,
                    height: (props.height || 450) - 20,
                }}
            >
                <WordCloud
                    width={(props.width || 500) - 20}
                    height={(props.height || 450) - 20}
                    data={data}
                    fontSize={stableRefs.current.fontSize}
                    rotate={stableRefs.current.rotate}
                    padding={5}
                    spiral="archimedean"
                    random={() => 0.5}
                    onWordClick={(e, d) => {
                        // console.log('Word clicked:', d);
                        stableRefs.current.handleWordClick(d);
                    }}
                    onWordMouseOver={(e, d) => {
                        stableRefs.current.handleWordMouseEnter(e, d);
                    }}
                    onWordMouseOut={() => {
                        stableRefs.current.handleWordMouseLeave();
                    }}
                    fill={stableRefs.current.fill}
                    fontWeight="bold"
                />
                {tooltip.visible && tooltip.word && (
                    <div
                        className={`${styles.tooltip} ${tooltip.visible ? styles.visible : ''}`}
                        style={{
                            left: tooltip.x,
                            top: tooltip.y,
                        }}
                    >
                        <div className={styles.tooltipTitle}>
                            <strong>{tooltip.word.text}</strong>
                        </div>
                        <div className={styles.tooltipField}>
                            <span className={styles.tooltipLabel}>Engagement:</span> {tooltip.word.value}
                        </div>
                        {tooltip.word.category && (
                            <div className={styles.tooltipField}>
                                <span className={styles.tooltipLabel}>Category:</span> {tooltip.word.category}
                            </div>
                        )}
                        {tooltip.word.description && (
                            <div className={styles.tooltipField}>
                                <span className={styles.tooltipLabel}>Description:</span> {tooltip.word.description}
                            </div>
                        )}
                        {tooltip.word.source_reference && (
                            <div className={styles.tooltipField}>
                                <span className={styles.tooltipLabel}>Source:</span> {tooltip.word.source_reference}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
