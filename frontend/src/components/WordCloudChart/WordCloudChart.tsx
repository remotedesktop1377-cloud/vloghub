import React, { useEffect, useState, useRef } from 'react';
import WordCloud from 'react-d3-cloud';

export interface WordData {
    text: string;
    value: number;
}

interface IWordCloudChartProps {
    data: WordData[];
    handleWordClick: (word: WordData) => void;
    width?: number;
    height?: number;
}

export function WordCloudChart(props: IWordCloudChartProps) {
    const [data, setData] = useState<WordData[]>([]);
    const [max, setMax] = useState(100);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    
    // Use useRef to maintain stable references that never change
    const stableRefs = useRef({
        randomSeed: Math.random(),
        fontSize: (word: any) => Math.max(10, (50 * word.value) / 100),
        rotate: () => 0,
        fill: (d: any, i: any) => `hsl(${200 + (d.value / 100) * 60}, 70%, 50%)`,
        handleWordClick: (word: any) => {
            setSelectedWord(word.text);
            props.handleWordClick(word);
        }
    });

    useEffect(() => {
        if (props.data && props.data.length > 0) {
            const values = props.data.map((r) => r.value);
            const newMax = Math.max(...values);
            setMax(newMax);
            setData(props.data);
            
            // Update the stable references with new max value
            stableRefs.current.fontSize = (word: any) => Math.max(10, (50 * word.value) / newMax);
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
        return <div>Loading word cloud...</div>;
    }

    return (
        <div style={{ width: props.width || 1000, height: props.height || 300, overflow: 'hidden', cursor: 'pointer' }}>
            <WordCloud
                width={props.width || 1000}
                height={props.height || 300}
                data={data}
                fontSize={stableRefs.current.fontSize}
                rotate={stableRefs.current.rotate}
                padding={2}
                spiral="rectangular"
                random={() => stableRefs.current.randomSeed}
                onWordClick={(e, d) => {
                    stableRefs.current.handleWordClick(d);
                }}
                fill={stableRefs.current.fill}
                fontWeight="bold"
            />
        </div>
    );
}
