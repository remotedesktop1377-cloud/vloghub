import React, { useState } from "react";
import { Box, Typography, Button, Card, CardContent, Grid, IconButton, TextField } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

type Feature = {
    id: string;
    title: string;
    description: string;
    isHighlighted?: boolean;
    hasCta?: boolean;
};

const features: Feature[] = [
    {
        id: "text-to-video",
        title: "Text-to-Video",
        description:
            "Transform simple text into stunning videos effortlessly. Whether it's marketing, education, or storytelling, just describe your vision, and let Vloghub bring it to life",
        isHighlighted: true,
        hasCta: true,
    },
    {
        id: "video-style-transfer",
        title: "Video Style Transfer",
        description:
            "Redefine your content with artistic video styles. Apply unique aesthetics to your footage and create standout visuals in just a few steps",
    },
    {
        id: "deepfake",
        title: "Deepfake",
        description:
            "Seamlessly integrate AI-powered deepfake technology for personalized content. Create tailored videos while maintaining ethical AI usage.",
    },
    {
        id: "virtual-background",
        title: "Virtual Background",
        description:
            "Enhance your videos with immersive virtual backgrounds. Perfect for remote presentations, vlogs, or creative projects",
    },
];

const FeatureHighlights: React.FC = () => {
    const [activeId, setActiveId] = useState<string>(features[0].id);

    const handleToggle = (id: string) => {
        setActiveId((prev) => (prev === id ? "" : id));
    };

    return (
        <Box
            component="section"
            sx={{
                width: "100%",
                py: { xs: 8, md: 12 },
                bgcolor: "#060606"
            }}
        >
            <Grid
                container
                spacing={{ xs: 4, md: 6 }}
                sx={{ px: { xs: 2, md: 8 } }}
            >
                <Grid item xs={12} md={6}>
                    {/* Left Column */}
                    <Box
                        sx={{
                            width: "420px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 10,
                            transform: "translateY(-1rem)",
                            ml: 5,
                            // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5, width: "100%" }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 500,
                                    color: "white",
                                    fontSize: "56px",
                                    letterSpacing: "-1.68px",
                                    lineHeight: "56px",
                                }}
                            >
                                Why Choose Vloghub?
                            </Typography>

                            <Typography
                                sx={{
                                    fontWeight: 400,
                                    color: "#7c7c7c",
                                    fontSize: "18px",
                                    letterSpacing: 0,
                                    lineHeight: "21.6px",
                                }}
                            >
                                Empowering creators with speed, flexibility, and creative precision.
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 2.5,
                                p: 1,
                                borderRadius: "300px",
                                boxShadow: "0px 1px 3px #6c39f41a, 0px 5px 5px #6c39f417, 0px 12px 7px #6c39f40d, 0px 20px 8px #6c39f403, 0px 32px 9px transparent",
                                background: "radial-gradient(50% 50% at 50% 50%, rgba(198,172,253,0.3) 0%, rgba(108,56,243,0.3) 100%)",
                            }}
                        >
                            <Button
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 4,
                                    py: 2,
                                    bgcolor: "white",
                                    borderRadius: "300px",
                                    height: "auto",
                                    "&:hover": { bgcolor: "#f9fafb" },
                                    transition: "background-color 0.2s ease",
                                    textTransform: "none",
                                }}
                            >
                                <Typography
                                    sx={{
                                        background: "radial-gradient(50% 50% at 50% 50%, rgba(198,172,253,1) 0%, rgba(108,56,243,1) 100%)",
                                        WebkitBackgroundClip: "text",
                                        backgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        fontWeight: 500,
                                        fontSize: "20px",
                                        letterSpacing: "-0.60px",
                                        lineHeight: "28px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Learn about Vloghub
                                </Typography>
                            </Button>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        position: "relative",
                    }}>
                        {/* Separated vertical rail 44px to the left of cards */}
                        <Box sx={{
                            position: "absolute",
                            left: -100,
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: "linear-gradient(180deg, rgba(139,92,246,0.35) 0%, rgba(59,130,246,0.35) 100%)"
                        }} />
                        {features.map((feature, index) => {
                            const isActive = activeId === feature.id;
                            return (
                                <Box key={feature.id} sx={{ position: "relative" }}>
                                    {/* Icon on the external rail */}
                                    <Box sx={{
                                        position: "absolute",
                                        left: -115,
                                        top: 0,
                                        width: 32,
                                        height: 32,
                                        borderRadius: "60%",
                                        background: isActive
                                            ? "radial-gradient(circle at 50% 50%, #C6ACFD 0%, #6C38F3 60%, #6C38F3 100%)"
                                            : "linear-gradient(180deg, #1c1c1c 0%, #111 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: isActive ? "0 0 20px rgba(124,58,237,0.6)" : "inset 0 0 0 1px rgba(139,92,246,0.25)",
                                        zIndex: 1
                                    }}>
                                        <AutoAwesomeIcon
                                            fontSize="small"
                                            sx={{ color: isActive ? "#fff" : "#9E7BFF" }}
                                        />
                                    </Box>
                                    {/* Connector to next icon */}
                                    {index < features.length - 1 && (
                                        <Box sx={{
                                            position: "absolute",
                                            left: -100,
                                            top: 52,
                                            bottom: -24,
                                            width: 2,
                                            background: "#252525"
                                        }} />
                                    )}

                                    <Card
                                        elevation={0}
                                        onClick={() => handleToggle(feature.id)}
                                        sx={{
                                            position: "relative",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            borderRadius: 3,
                                            border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                                            background: isActive
                                                ? "radial-gradient(circle at 50% 50%, #C6ACFD 0%, #6C38F3 60%, #6C38F3 100%)"
                                                : "#121212",
                                            transition: "transform 200ms ease, box-shadow 200ms ease, background 200ms ease",
                                            '&:hover': {
                                                boxShadow: isActive ? "0 10px 30px rgba(124,58,237,0.35)" : "0 8px 24px rgba(0,0,0,0.4)"
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                            <Box sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between"
                                            }}>
                                                <Typography sx={{
                                                    color: "#FFFFFF",
                                                    fontSize: { xs: 22, md: 28 },
                                                    fontWeight: 600
                                                }}>
                                                    {feature.title}
                                                </Typography>
                                                <IconButton size="small" sx={{ color: "#FFFFFF" }}>
                                                    {isActive ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>

                                            <Typography sx={{
                                                mt: 1.5,
                                                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                                                fontSize: { xs: 14, md: 16 }
                                            }}>
                                                {feature.description}
                                            </Typography>

                                            {isActive && (
                                                <>
                                                    <Box sx={{
                                                        mt: 2,
                                                        px: { xs: 2, md: 6 },
                                                        py: { xs: 3, md: 5 },
                                                        borderRadius: 3.5,
                                                        background: "linear-gradient(180deg, rgba(37,37,37,1) 0%, rgba(18,18,18,1) 100%)",
                                                        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
                                                    }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                    >
                                                        <Box sx={{
                                                            height: { xs: 64, md: 60 },
                                                            borderRadius: 30,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            px: { xs: 1.5, md: 2 },
                                                            background: "#252525",
                                                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
                                                            gap: 2
                                                        }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        >
                                                            <TextField
                                                                fullWidth
                                                                variant="standard"
                                                                placeholder="What you want to share today?"
                                                                InputProps={{
                                                                    disableUnderline: true,
                                                                }}
                                                                sx={{
                                                                    ml: 1,
                                                                    mr: 2,
                                                                    input: {
                                                                        color: "#FFFFFF",
                                                                        '::placeholder': { color: "#7C7C7C" },
                                                                        fontSize: { xs: 14, md: 16 },
                                                                    },
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onFocus={(e) => e.stopPropagation()}
                                                            />
                                                            <Box sx={{
                                                                width: 80,
                                                                height: 40,
                                                                borderRadius: 10,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                background: "radial-gradient(circle at 50% 50%, rgba(139,92,246,1) 0%, rgba(147,51,234,1) 100%)",
                                                                boxShadow: "0 0 32px rgba(124,58,237,0.55)",
                                                            }}>
                                                                <AutoAwesomeIcon sx={{ color: "#fff" }} />
                                                            </Box>
                                                        </Box>
                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            display: "inline-flex",
                                                            flexDirection: "column",
                                                            alignItems: "flex-start",
                                                            gap: 2.5,
                                                            p: 0.5,
                                                            mt: 2,
                                                            borderRadius: "300px",
                                                            boxShadow: "0px 1px 3px #6c39f41a, 0px 5px 5px #6c39f417, 0px 12px 7px #6c39f40d, 0px 20px 8px #6c39f403, 0px 32px 9px transparent",
                                                            background: "radial-gradient(50% 50% at 50% 50%, rgba(198,172,253,0.12) 0%, rgba(108,56,243,0.12) 100%)",
                                                        }}
                                                    >
                                                        <Button
                                                            sx={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 1,
                                                                px: 4,
                                                                py: 2,
                                                                bgcolor: "white",
                                                                borderRadius: "300px",
                                                                height: "auto",
                                                                "&:hover": { bgcolor: "#f9fafb" },
                                                                transition: "background-color 0.2s ease",
                                                                textTransform: "none",
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    background: "radial-gradient(50% 50% at 50% 50%, rgba(198,172,253,1) 0%, rgba(108,56,243,1) 100%)",
                                                                    WebkitBackgroundClip: "text",
                                                                    backgroundClip: "text",
                                                                    WebkitTextFillColor: "transparent",
                                                                    fontWeight: 500,
                                                                    fontSize: "14px",
                                                                    letterSpacing: "-0.42px",
                                                                    lineHeight: "24px",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                Learn More
                                                            </Typography>
                                                        </Button>
                                                    </Box>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Box>
                            );
                        })}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FeatureHighlights;


