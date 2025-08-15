import React, { useEffect, useState } from 'react';
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
    const [randomSeed] = useState(Math.random());

    useEffect(() => {
        if (props.data && props.data.length > 0) {
            const values = props.data.map((r) => r.value);
            console.log('props.data', props.data);
            setMax(Math.max(...values));
            setData(props.data);
        }
    }, [props.data, props.width, props.height]);

    // @ts-ignore
    const fontSize = (word) => Math.max(10, (50 * word.value) / max);
    // @ts-ignore
    const rotate = () => 0;

    if (!data || data.length === 0) {
        return <div>Loading word cloud...</div>;
    }

    return (
        <div style={{ width: props.width || 1000, height: props.height || 300, overflow: 'hidden' }}>
            <WordCloud
                width={props.width || 1000}
                height={props.height || 300}
                data={data}
                fontSize={fontSize}
                rotate={rotate}
                padding={2}
                spiral="rectangular"
                // random={() => randomSeed}
                onWordClick={props.handleWordClick}
            />
        </div>
    );
}
