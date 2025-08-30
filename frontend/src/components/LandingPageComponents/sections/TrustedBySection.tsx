'use client'
import React from "react";
import { Box, Typography, Container, Card, CardContent } from "@mui/material";

const statisticsData = [
    {
        value: "605K+",
        description: "Videos generated globally"
    },
    {
        value: "17K+",
        description: "Satisfied creators using Vloghub"
    },
    {
        value: "20K+",
        description: "Successful projects delivered"
    }
];

export const TrustedBySection = (): JSX.Element => {
    return (
        <Box
            component="section"
            sx={{
                pt: 20,
                pb: 20,
                bgcolor: "#060606",
                position: "relative",
            }}
        >
            <Container maxWidth="xl" sx={{
                p: { xs: 2, md: 5 },
                flex: 1,
                bgcolor: "#121212",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "30px",
                overflow: "hidden",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                },
            }}>
                {/* Main Text Section */}
                <Box
                    sx={{
                        mb: 5,
                        textAlign: { xs: "center", md: "left" },
                        pl: { xs: 0, md: 17 },
                        pr: { xs: 0, md: 20 },
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem", lg: "2.5rem" },
                            fontWeight: 500,
                            lineHeight: 1.6,
                            letterSpacing: "-0.01em",
                            color: "white",

                        }}
                    >
                        Trusted by creators worldwide to deliver{" "}
                        <Box
                            component="span"
                            sx={{
                                background: "linear-gradient(135deg, #C6ACFD 0%, #6C38F3 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                            }}
                        >
                            high-quality video
                        </Box>{" "}
                        solutions. Whether you're a brand, creator, or storyteller, Vloghub empowers your journey with{" "}
                        <Box
                            component="span"
                            sx={{
                                background: "linear-gradient(135deg, #C6ACFD 0%, #6C38F3 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                color: "transparent",
                            }}
                        >
                            cutting-edge AI technology
                        </Box>.
                    </Typography>
                </Box>

                {/* Statistics Cards Section */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 4,
                        justifyContent: "center",
                        alignItems: "stretch",
                        pl: { xs: 0, md: 17 },
                        pr: { xs: 0, md: 17 },
                    }}
                >
                    {statisticsData.map((stat, index) => (
                        <Card
                            key={index}
                            sx={{
                                flex: 1,
                                bgcolor: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "16px",
                                overflow: "hidden",
                                backdropFilter: "blur(10px)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                                },
                            }}
                        >
                            <CardContent
                                sx={{
                                    p: 4,
                                    textAlign: "left",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem", lg: "2.5rem" },
                                        fontWeight: 600,
                                        lineHeight: 1,
                                        color: "white",
                                        mb: 2,
                                    }}
                                >
                                    {stat.value}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                                        fontWeight: 500,
                                        lineHeight: 1.4,
                                        color: "rgba(255, 255, 255, 0.8)",

                                    }}
                                >
                                    {stat.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Container>
        </Box>
    );
};
