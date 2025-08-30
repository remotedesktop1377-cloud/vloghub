'use client'
import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import Image from "next/image";

const videoCards = [
    {
        title: "The Future of AI-Driven Content Creation",
        description:
            "Discover how AI is revolutionizing the way videos are made and how Vloghub is leading the charge in innovation",
        hasGradientBorder: true,
        hasGradientBackground: false,
        textColor: "#7c7c7c",
        image: "/images/block3.png",
    },
    {
        title: "How to Use Text-to-Video for Marketing Success",
        description:
            "Learn the benefits of using AI tools like Vloghub to create engaging marketing videos effortlessly.",
        hasGradientBorder: false,
        hasGradientBackground: true,
        textColor: "white",
        image: "/images/block1.png",
    },
    {
        title: "Top 5 Features You'll Love About Vloghub",
        description:
            "Explore the powerful features that make Vloghub the ultimate tool for video creators",
        hasGradientBorder: true,
        hasGradientBackground: false,
        textColor: "#7c7c7c",
        image: "/images/block2.png",
    },
];

export const VideoShowcaseSection = (): JSX.Element => {
    return (
        <Box
            component="section"
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: { xs: 6, md: 10 },
                px: { xs: 2, sm: 4, md: 10, lg: 20 },
                py: { xs: 8, md: 12 },
                position: "relative",
                bgcolor: "#060606",
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", md: "800px" },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: { xs: 3, md: 4 },
                    position: "relative",
                    transform: "translateY(-1rem)",
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                <Typography
                    variant="h2"
                    sx={{
                        position: "relative",
                        alignSelf: "stretch",
                        fontWeight: 500,
                        color: "white",
                        fontSize: { xs: "28px", sm: "36px", md: "56px" },
                        textAlign: "center",
                        letterSpacing: { xs: "-0.6px", md: "-1.68px" },
                        lineHeight: { xs: "36px", sm: "42px", md: "56px" },
                    }}
                >
                    Stay Updated with Vloghub
                </Typography>

                <Typography
                    sx={{
                        position: "relative",
                        width: "100%",
                        maxWidth: { xs: "90%", sm: "512px" },
                        color: "#7c7c7c",
                        fontSize: { xs: "14px", md: "18px" },
                        textAlign: "center",
                        letterSpacing: 0,
                        lineHeight: { xs: "20px", md: "21.6px" },
                    }}
                >
                    Explore the latest trends, updates, and tips for leveraging AI in
                    video creation.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    alignItems: { xs: "stretch", md: "flex-start" },
                    flexDirection: { xs: "column", md: "row" },
                    gap: { xs: 3, md: 10 },
                    position: "relative",
                    alignSelf: "stretch",
                    width: "100%",
                    justifyContent: "center",
                }}
            >
                {videoCards.map((card, index) => (
                    <Card
                        key={index}
                        sx={{
                            flex: 1,
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: "none",
                            bgcolor: "transparent",
                            transform: "translateY(-1rem)",
                            // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                            position: "relative",
                            ...(card.hasGradientBorder && {
                                "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    inset: 0,
                                    padding: "2px",
                                    borderRadius: "16px",
                                    background: "linear-gradient(180deg, rgba(198,172,253,1) 0%, rgba(108,56,243,1) 100%)",
                                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                    WebkitMaskComposite: "xor",
                                    maskComposite: "exclude",
                                    zIndex: 1,
                                    pointerEvents: "none",
                                },
                            }),
                            ...(card.hasGradientBackground && {
                                background: "radial-gradient(50% 50% at 50% 148%, rgba(198,172,253,1) 0%, rgba(108,56,243,1) 100%)",
                            }),
                            ml: { xs: 0, md: index === 0 ? -0.25 : 0 },
                            mr: { xs: 0, md: index === videoCards.length - 1 ? -0.25 : 0 },
                            mt: { xs: 0, md: card.hasGradientBorder ? -0.25 : 0 },
                            mb: { xs: 0, md: card.hasGradientBorder ? -0.25 : 0 },
                        }}
                    >
                        <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "center", md: "flex-start" }, gap: { xs: 3, md: 6 }, p: { xs: 3, md: 6 }, position: "relative" }}>
                            <Box
                                sx={{
                                    position: "relative",
                                    alignSelf: "stretch",
                                    width: "100%",
                                    height: { xs: "140px", md: "160px" },
                                    borderRadius: "12px",
                                    bgcolor: card.hasGradientBackground ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                                }}
                            >
                                <Image src={card.image} alt={card.title} fill style={{ objectFit: 'cover', borderRadius: '12px' }} />
                            </Box>

                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "center", md: "flex-start" }, gap: 2, position: "relative", alignSelf: "stretch", width: "100%", textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        position: "relative",
                                        alignSelf: "stretch",
                                        fontWeight: 600,
                                        color: "white",
                                        fontSize: { xs: "18px", md: "20px" },
                                        letterSpacing: 0,
                                        lineHeight: "28px",
                                        mt: -0.25,
                                    }}
                                >
                                    {card.title}
                                </Typography>

                                <Typography
                                    sx={{
                                        position: "relative",
                                        alignSelf: "stretch",
                                        fontWeight: 400,
                                        fontSize: { xs: "14px", md: "18px" },
                                        letterSpacing: 0,
                                        lineHeight: { xs: "20px", md: "21.6px" },
                                        color: card.textColor,
                                    }}
                                >
                                    {card.description}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};
