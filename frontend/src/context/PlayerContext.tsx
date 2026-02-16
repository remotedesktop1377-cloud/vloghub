"use client";
import React, { createContext, useContext, useRef, ReactNode } from "react";
import { PlayerRef } from "@remotion/player";

interface PlayerContextType {
    playerRef: React.MutableRefObject<PlayerRef | null>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const playerRef = useRef<PlayerRef | null>(null);
    
    return (
        <PlayerContext.Provider value={{ playerRef }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayerRef = (): React.MutableRefObject<PlayerRef | null> => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayerRef must be used within PlayerProvider");
    }
    return context.playerRef;
};

