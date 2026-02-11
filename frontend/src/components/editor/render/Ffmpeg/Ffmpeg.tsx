'use client'

import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import FfmpegRender from "./FfmpegRender";
import RenderOptions from "./RenderOptions";

export default function Ffmpeg() {
    const [loadFfmpeg, setLoadedFfmpeg] = useState(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const [logMessages, setLogMessages] = useState<string>("");

    const loadFFmpegFunction = async () => {
        if (typeof window === "undefined") return;
        setLoadedFfmpeg(false);
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on("log", ({ message }) => {
            setLogMessages(message);
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        setLoadedFfmpeg(true);
    };

    useEffect(() => {
        loadFFmpegFunction();
    }, []);

    return (
        <div className="flex flex-col justify-center items-center py-2">
            <RenderOptions />
            <FfmpegRender loadFunction={loadFFmpegFunction} loadFfmpeg={loadFfmpeg} logMessages={logMessages} ffmpeg={ffmpegRef.current as FFmpeg} />
        </div>
    );
}
