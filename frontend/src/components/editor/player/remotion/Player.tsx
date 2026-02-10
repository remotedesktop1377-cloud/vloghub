"use client";
import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector } from "../../../../store";
import { useRef, useEffect } from "react";
import { setIsPlaying } from "../../../../store/slices/projectSlice";
import { useDispatch } from "react-redux";

const fps = 30;

export const PreviewPlayer = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { duration, currentTime, isPlaying, isMuted } = projectState;
    const playerRef = useRef<PlayerRef>(null);
    const dispatch = useDispatch();
    const safeDuration = Number.isNaN(duration) && duration > 0 ? duration : 0;
    const durationInFrames = Math.max(1, Math.floor(safeDuration * fps) + 1);
    const resolutionWidth = Number.isNaN(projectState.resolution?.width) ? 1920 : projectState.resolution.width;
    const resolutionHeight = Number.isNaN(projectState.resolution?.height) ? 1080 : projectState.resolution.height;

    // update frame when current time with marker
    useEffect(() => {
        const frame = Number.isFinite(currentTime) ? Math.round(currentTime * fps) : 0;
        if (playerRef.current && !isPlaying) {
            playerRef.current.pause();
            playerRef.current.seekTo(frame);
        }
    }, [currentTime, fps]);

    useEffect(() => {
        playerRef?.current?.addEventListener("play", () => {
            dispatch(setIsPlaying(true));
        });
        playerRef?.current?.addEventListener("pause", () => {
            dispatch(setIsPlaying(false));
        });
        return () => {
            playerRef?.current?.removeEventListener("play", () => {
                dispatch(setIsPlaying(true));
            });
            playerRef?.current?.removeEventListener("pause", () => {
                dispatch(setIsPlaying(false));
            });
        };
    }, [playerRef]);

    // to control with keyboard
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