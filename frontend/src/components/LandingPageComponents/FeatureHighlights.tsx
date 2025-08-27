import React, { useState } from "react";
import { Box, Typography, Button, Card, CardContent, Grid, IconButton } from "@mui/material";
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
            "Transform simple text into stunning videos effortlessly. Whether it's marketing, education, or storytelling, just describe your vision, and let Codecraft bring it to life",
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
        <Box component="section" sx={{ width: "100%", py: { xs: 8, md: 12 }, bgcolor: "#060606" }}>
            <Grid container spacing={{ xs: 4, md: 6 }} px={{ xs: 2, md: 8 }}>
                <Grid item xs={12} md={5}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: 36, md: 56 },
                                lineHeight: 1.05,
                                color: "#FFFFFF",
                                letterSpacing: "-0.04em",
                            }}
                        >
                            Why Choose VlogHub?
                        </Typography>
                        <Typography sx={{ color: "#7C7C7C", fontSize: { xs: 16, md: 18 } }}>
                            Empowering creators with speed, flexibility, and creative precision.
                        </Typography>
                        <Box sx={{
                            display: "inline-flex", alignItems: "center", gap: 1, p: 0.5, borderRadius: 50,
                        }}>

                            <Button
                                variant="outlined"
                                sx={{
                                    marginTop: 2,
                                    fontSize: { xs: '14px', md: '16px' },
                                    fontWeight: 400,
                                    borderRadius: '50px',
                                    height: 'auto',
                                    bgcolor: '#ffffff',
                                    color: '#6C38F3',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.8)'
                                    }
                                }}
                            >
                                Learn about VlogHub
                            </Button>

                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: "relative", pl: "44px" }}>
                        {/* Separated vertical rail 44px to the left of cards */}
                        <Box sx={{ position: "absolute", left: 12, top: 0, bottom: 0, width: 2, background: "linear-gradient(180deg, rgba(139,92,246,0.35) 0%, rgba(59,130,246,0.35) 100%)" }} />
                        {features.map((feature, index) => {
                            const isActive = activeId === feature.id;
                            return (
                                <Box key={feature.id} sx={{ position: "relative" }}>
                                    {/* Icon on the external rail */}
                                    <Box sx={{
                                        position: "absolute", left: -48, top: 0, width: 32, height: 32, borderRadius: "60%",
                                        background: isActive
                                            ? "radial-gradient(circle at 50% 50%, #C6ACFD 0%, #6C38F3 60%, #6C38F3 100%)"
                                            : "linear-gradient(180deg, #1c1c1c 0%, #111 100%)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: isActive ? "0 0 20px rgba(124,58,237,0.6)" : "inset 0 0 0 1px rgba(139,92,246,0.25)", zIndex: 1
                                    }}>
                                        <AutoAwesomeIcon fontSize="small" sx={{ color: isActive ? "#fff" : "#9E7BFF" }} />
                                    </Box>
                                    {/* Connector to next icon */}
                                    {index < features.length - 1 && (
                                        <Box sx={{ position: "absolute", left: -33, top: 52, bottom: -24, width: 2, background: "#252525" }} />
                                    )}

                                    <Card
                                        elevation={0}
                                        onClick={() => handleToggle(feature.id)}
                                        sx={{
                                            position: "relative", overflow: "hidden", cursor: "pointer", borderRadius: 3,
                                            border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                                            background: isActive
                                                ? "radial-gradient(circle at 50% 50%, #C6ACFD 0%, #6C38F3 60%, #6C38F3 100%)"
                                                : "#121212",
                                            transition: "transform 200ms ease, box-shadow 200ms ease, background 200ms ease",
                                            '&:hover': { boxShadow: isActive ? "0 10px 30px rgba(124,58,237,0.35)" : "0 8px 24px rgba(0,0,0,0.4)" }
                                        }}>
                                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <Typography sx={{ color: "#FFFFFF", fontSize: { xs: 22, md: 28 }, fontWeight: 600 }}>
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
                                                        mt: 2, px: { xs: 2, md: 6 }, py: { xs: 3, md: 5 }, borderRadius: 3.5,
                                                        background: "linear-gradient(180deg, rgba(37,37,37,1) 0%, rgba(18,18,18,1) 100%)",
                                                        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
                                                    }}>
                                                        <Box sx={{
                                                            height: { xs: 64, md: 60 },
                                                            borderRadius: 30,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            px: { xs: 1.5, md: 2 },
                                                            background: "#252525",
                                                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
                                                        }}>
                                                            <Typography sx={{ color: "#7C7C7C", pl: 2 }}>
                                                                What you want to share today?
                                                            </Typography>
                                                            <Box sx={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 24,
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

                                                    <Button
                                                        variant="outlined"
                                                        sx={{
                                                            marginTop: 3,
                                                            fontSize: { xs: '14px', md: '16px' },
                                                            fontWeight: 400,
                                                            borderRadius: '50px',
                                                            height: 'auto',
                                                            bgcolor: '#ffffff',
                                                            color: '#6C38F3',
                                                            textTransform: 'none',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255,255,255,0.8)'
                                                            }
                                                        }}
                                                    >
                                                        Learn More
                                                    </Button>
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


