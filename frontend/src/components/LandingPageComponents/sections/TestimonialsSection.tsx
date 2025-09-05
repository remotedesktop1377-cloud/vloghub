'use client'
import React from "react";
import { Box, Typography } from "@mui/material";

export const TestimonialsSection = (): JSX.Element => {
    return (
        <Box
            component="section"
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 2.5,
                pt: "120px",
                pb: 10,
                px: { xs: 0, md: 10 },
                position: "relative",
                bgcolor: "#060606",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: { xs: '80%', md: '800px' },
                    alignItems: { xs: 'center', md: 'flex-start' },
                    gap: 6,
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
                        fontSize: { xs: '28px', sm: '36px', md: '56px' },
                        textAlign: "center",
                        letterSpacing: { xs: '-0.6px', md: '-1.68px' },
                        lineHeight: { xs: '36px', sm: '42px', md: '56px' },
                        transform: "translateY(-1rem)",
                        // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                        mt: -0.25,
                    }}
                >
                    See Vloghub in Action: Your Vision, Realized
                </Typography>

                <Typography
                    sx={{
                        position: "relative",
                        alignSelf: "stretch",
                        fontWeight: 400,
                        color: "#7c7c7c",
                        fontSize: { xs: '14px', md: '18px' },
                        textAlign: "center",
                        letterSpacing: 0,
                        lineHeight: { xs: '20px', md: '21.6px' },
                        transform: "translateY(-1rem)",
                        // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                    }}
                >
                    From a simple idea to a polished masterpiece, Vloghub bridges the
                    gap between imagination and reality. Explore how your prompts can turn
                    into stunning videos with just a few clicks. Witness the power of
                    AI-crafted storytelling tailored to your needs.
                </Typography>
            </Box>
        </Box>
    );
};
