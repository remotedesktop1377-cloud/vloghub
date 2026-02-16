"use client";
import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector } from "../../../../store";
import { useRef, useEffect, useMemo, memo } from "react";
import { setIsPlaying } from "../../../../store/slices/projectSlice";
import { useDispatch } from "react-redux";
import { usePlayerRef } from "../../../../context/PlayerContext";

const fps = 30;

const PreviewPlayerComponent = () => {
    const dispatch = useDispatch();

    // Use selective selectors instead of entire projectState to prevent unnecessary re-renders
    const duration = useAppSelector((state) => state.projectState.duration);
    const currentTime = useAppSelector((state) => state.projectState.currentTime);
    const isPlaying = useAppSelector((state) => state.projectState.isPlaying);
    const isMuted = useAppSelector((state) => state.projectState.isMuted);
    const resolution = useAppSelector((state) => state.projectState.resolution);
    
    // Use shared playerRef from context so Timeline can read currentTime
    const contextPlayerRef = usePlayerRef();
    const playerRef = contextPlayerRef;
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const durationInFrames = Math.max(1, Math.floor(safeDuration * fps) + 1);
    const resolutionWidth = Number.isFinite(resolution?.width) ? resolution.width : 1920;
    const resolutionHeight = Number.isFinite(resolution?.height) ? resolution.height : 1080;
    // Memoize resolution to prevent unnecessary Player re-renders
    const playerProps = useMemo(() => ({
        durationInFrames,
        compositionWidth: resolutionWidth,
        compositionHeight: resolutionHeight,
    }), [durationInFrames, resolutionWidth, resolutionHeight]);

    // Only seek when explicitly needed (user interaction when paused)
    // Don't react to currentTime changes during playback - that causes video restarts
    useEffect(() => {
        // Only seek when paused and currentTime changed (user seeking)
        if (!playerRef.current || isPlaying) {
            return;
        }
        
        const targetFrame = Number.isFinite(currentTime) ? Math.round(currentTime * fps) : 0;
        const currentFrame = playerRef.current.getCurrentFrame();
        
        // Only seek if the difference is more than 1 frame to prevent unnecessary seeks
        const frameDifference = Math.abs(currentFrame - targetFrame);
        if (frameDifference > 1) {
            playerRef.current.seekTo(targetFrame);
        }
        // Remove currentTime from dependencies - only seek when isPlaying changes to false
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, fps]);

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
            durationInFrames={playerProps.durationInFrames}
            compositionWidth={playerProps.compositionWidth}
            compositionHeight={playerProps.compositionHeight}
            fps={fps}
            style={{ width: "100%", height: "100%" }}
            controls
            clickToPlay={false}
            acknowledgeRemotionLicense={true}
            loop={false}
            bufferStateDelayInMilliseconds={0}
            showPlaybackRateControl={true}
        />
    )
};

// Memoize PreviewPlayer to prevent re-renders when only currentTime changes during playback
export const PreviewPlayer = memo(PreviewPlayerComponent);