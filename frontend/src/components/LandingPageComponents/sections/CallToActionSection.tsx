import React from "react";
import { Box, Typography, Card, CardContent, Chip, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export const CallToActionSection = (): JSX.Element => {
    const promptTags = [
        { label: "Style : 3D" },
        { label: "Camera : Wide Shot" },
        { label: "Lighting : Neon" },
        { label: "Character : Kids" },
    ];

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                width: "100%",
                height: "820px",
                bgcolor: "#121212",
                transform: "translateY(-1rem)",
                // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
            }}
        >
            {/* Play Button - Centered */}
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) translateY(-1rem)",
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                <IconButton
                    sx={{
                        width: 80,
                        height: 80,
                        bgcolor: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        "&:hover": {
                            transform: "scale(1.05)",
                            transition: "transform 0.3s ease",
                        },
                        transition: "transform 0.3s ease",
                    }}
                >
                    <PlayArrowIcon
                        sx={{
                            width: 32,
                            height: 32,
                            color: "black",
                            ml: 0.5,
                        }}
                    />
                </IconButton>
            </Box>

            {/* Prompt Card */}
            <Card
                sx={{
                    position: "absolute",
                    top: "500px",
                    left: "50px",
                    width: "520px",
                    bgcolor: "#000000",
                    border: "none",
                    borderRadius: "15px",
                    transform: "translateY(-1rem)",
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
