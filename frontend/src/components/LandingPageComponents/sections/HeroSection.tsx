import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";

export const HeroSection = (): JSX.Element => {
    return (
        <Box
            component="section"
            sx={{
                pt: 20,
                pb: 20,
                bgcolor: "#121212",
                position: "relative",
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    position: "relative",
                    zIndex: 2,
                    textAlign: "center",
                    px: { xs: 2, md: 4 },
                }}
            >
                <Box
                    sx={{
                        maxWidth: "900px",
                        mx: "auto",
                    }}
                >
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "1.5rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
                            fontWeight: 500,
                            lineHeight: 0.7,
                            letterSpacing: "-0.05em",
                            mb: 3,
                            color: "white",
                        }}
                    >
                        AI technology to{" "}
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
                            Generate
                        </Box>
                    </Typography>

                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "1.5rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
                            fontWeight: 500,
                            lineHeight: 0.7,
                            letterSpacing: "-0.05em",
                            mb: 3,
                            color: "white",
                        }}
                    >
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
                            Visually Captivating Videos
                        </Box>
                    </Typography>

                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "1.5rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
                            fontWeight: 500,
                            lineHeight: 0.7,
                            letterSpacing: "-0.05em",
                            mb: 3,
                            color: "white",

                        }}
                    >
                        from text prompts. Making
                    </Typography>

                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: { xs: "1.5rem", sm: "2.5rem", md: "3.5rem", lg: "4rem" },
                            fontWeight: 500,
                            lineHeight: 0.7,
                            letterSpacing: "-0.05em",
                            mb: 6,
                            color: "white",

                        }}
                    >
                        content creation{" "}
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
                            Faster & Easier
                        </Box>
                    </Typography>
                </Box>

            </Container>

        </Box>
    );
};
