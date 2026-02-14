"use client";
import Ffmpeg from "./Ffmpeg";
import LambdaRender from "../Lambda/LambdaRender";

export default function ExportList() {
    return (
        <div className="flex flex-col justify-center items-center h-full w-full gap-4">
            <div className="w-full max-w-2xl">
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Local Render (FFmpeg)</h2>
                    <Ffmpeg />
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Cloud Render (AWS Lambda)</h2>
                    <LambdaRender />
                </div>
            </div>
        </div>
    )
}