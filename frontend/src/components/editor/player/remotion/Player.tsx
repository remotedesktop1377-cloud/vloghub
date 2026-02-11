"use client";
import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector } from "../../../../store";
import { useRef, useEffect } from "react";
import { setIsPlaying } from "../../../../store/slices/projectSlice";
import { useDispatch } from "react-redux";

const fps = 30;

export const PreviewPlayer = () => {
    const dispatch = useDispatch();

    const projectState = useAppSelector((state) => state.projectState);
    const { duration, currentTime, isPlaying, isMuted } = projectState;
    const playerRef = useRef<PlayerRef>(null);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const durationInFrames = Math.max(1, Math.floor(safeDuration * fps) + 1);
    const resolutionWidth = Number.isFinite(projectState.resolution?.width) ? projectState.resolution.width : 1920;
    const resolutionHeight = Number.isFinite(projectState.resolution?.height) ? projectState.resolution.height : 1080;
    useEffect(() => {
        const frame = Number.isFinite(currentTime) ? Math.round(currentTime * fps) : 0;
        if (playerRef.current && !isPlaying) {
            playerRef.current.pause();
            playerRef.current.seekTo(frame);
        }
    }, [currentTime, isPlaying]);

    useEffect(() => {
        const handlePlay = () => {
            if (!isPlaying) {
                dispatch(setIsPlaying(true));
            }
        };
        const handlePause = () => {
            if (isPlaying) {
                dispatch(setIsPlaying(false));
            }
        };
        playerRef?.current?.addEventListener("play", handlePlay);
        playerRef?.current?.addEventListener("pause", handlePause);
        return () => {
            playerRef?.current?.removeEventListener("play", handlePlay);
            playerRef?.current?.removeEventListener("pause", handlePause);
        };
    }, [dispatch, isPlaying]);

    useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.mute();
        } else {
            playerRef.current.unmute();
        }
    }, [isMuted]);

    return (
        <Player
            ref={playerRef}
            component={Composition}
            inputProps={{}}
            durationInFrames={durationInFrames}
            compositionWidth={resolutionWidth}
            compositionHeight={resolutionHeight}
            fps={fps}
            style={{ width: "100%", height: "100%" }}
            controls
            clickToPlay={false}
            acknowledgeRemotionLicense={true}
        />
    )
};