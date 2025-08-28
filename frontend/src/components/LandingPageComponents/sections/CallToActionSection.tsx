import React, { useRef, useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Chip, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export const CallToActionSection = (): JSX.Element => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const sectionRef = useRef<HTMLDivElement | null>(null);
    const [isInViewport, setIsInViewport] = useState<boolean>(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInViewport(true);
                    if (videoRef.current) {
                        videoRef.current.play().catch(() => {
                            // Handle autoplay restrictions
                        });
                    }
                } else {
                    setIsInViewport(false);
                    if (videoRef.current) {
                        videoRef.current.pause();
                    }
                }
            },
            { threshold: 0.5 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const handleOpenPlayer = (): void => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => {
                    // Handle play restrictions
                });
            } else {
                videoRef.current.pause();
            }
        }
    };

    const handleClosePlayer = (): void => {
        if (videoRef.current) {
            try {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            } catch {
                // no-op
            }
        }
    };

    const promptTags = [
        { label: "Style : 3D" },
        { label: "Camera : Wide Shot" },
        { label: "Lighting : Neon" },
        { label: "Character : Kids" },
    ];

    return (
        <Box
            ref={sectionRef}
            component="section"
            sx={{
                position: "relative",
                width: "100%",
                height: { xs: '60vh', md: '820px' },
                bgcolor: "#121212",
                transform: "translateY(-1rem)",
                // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
            }}
        >
            {/* Full Width Video Background */}
            <video
                ref={videoRef}
                // src="https://storage.googleapis.com/gweb-gemini-cdn/gemini/uploads/71d5640dcf390153b19fdeb9514213f1ea484327.mp4"
                // src="https://www.kapwing.com/resources/content/media/2025/06/Veo-Generated-Fish-2-1.mp4"
                src="https://storage.googleapis.com/gweb-gemini-cdn/gemini/uploads/c15d5a7d18b56425f677736ce51e71535f9fd60b.compressed.mp4"
                controls={false}
                autoPlay={false}
                muted={true}
                playsInline={true}
                loop={true}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1
                }}
            />

            {/* Overlay for better text readability */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    bgcolor: "rgba(0, 0, 0, 0.4)",
                    zIndex: 2
                }}
            />

            {/* Prompt Card */}
            <Card
                sx={{
                    position: "absolute",
                    top: { xs: 0, md: '500px' },
                    left: { xs: 0, md: '50px' },
                    width: { xs: '100%', md: '520px' },
                    bgcolor: "#000000",
                    border: "none",
                    borderRadius: "15px",
                    transform: "translateY(-1rem)",
                    zIndex: 3,
                    display: { xs: 'none', md: 'block' },
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                <CardContent sx={{ p: 5 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <Typography
                                sx={{
                                    fontWeight: 400,
                                    color: "#7c7c7c",
                                    fontSize: "20px",
                                    letterSpacing: 0,
                                    lineHeight: "24px",
                                }}
                            >
                                Prompt
                            </Typography>

                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 500,
                                    color: "white",
                                    fontSize: "28px",
                                    letterSpacing: "-0.84px",
                                    lineHeight: "33.6px",
                                }}
                            >
                                "3D cartoon kids exploring the moon in space"
                            </Typography>

                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {promptTags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag.label}
                                        sx={{
                                            bgcolor: "#121212",
                                            color: "#7c7c7c",
                                            "&:hover": {
                                                bgcolor: "#1a1a1a",
                                            },
                                            py: 1,
                                            transition: "background-color 0.2s ease",
                                            borderRadius: "300px",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            letterSpacing: 0,
                                            lineHeight: "24px",
                                            height: "auto",

                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};
