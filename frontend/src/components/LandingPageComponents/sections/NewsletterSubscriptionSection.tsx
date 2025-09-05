'use client'
import React from "react";
import { Box, Typography, Divider, Link } from "@mui/material";

export const NewsletterSubscriptionSection: React.FC = () => {
    const aboutLinks = [
        "About Vloghub",
        "Responsibility",
        "Research",
        "Technology",
    ];

    const footerLinks = [
        "Global Network",
        "Cookies Policy",
        "Terms and Conditions",
    ];

    return (
        <Box
            component="footer"
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                pt: 20,
                pb: "170px",
                px: "200px",
                width: "100%",
                bgcolor: "#121212",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Follow Us Section */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    transform: "translateY(-1rem)",
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 500,
                        color: "white",
                        fontSize: "18px",
                        letterSpacing: "-0.36px",
                        lineHeight: "21.6px",
                        whiteSpace: "nowrap",
                    }}
                >
                    Follow Us
                </Typography>

                <Box
                    component="img"
                    sx={{ flex: "0 0 auto" }}
                    alt="Social media icons"
                    src="https://c.animaapp.com/metqtyo3gRfinE/img/frame-1000004725.svg"
                />
            </Box>

            {/* First Separator */}
            <Box
                sx={{
                    width: "520px",
                    transform: "translateY(-1rem)",
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                <Divider sx={{ bgcolor: "gray.600" }} />
            </Box>

            {/* About Section */}
            <Box
                component="section"
                sx={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transform: "translateY(-1rem)",
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                <Box
                    component="nav"
                    sx={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 6,
                    }}
                >
                    {aboutLinks.map((link, index) => (
                        <Link
                            key={index}
                            href="#"
                            sx={{

                                fontWeight: 400,
                                color: "#7c7c7c",
                                fontSize: "16px",
                                letterSpacing: 0,
                                lineHeight: "19.2px",
                                whiteSpace: "nowrap",
                                "&:hover": { color: "white" },
                                transition: "color 0.2s ease",
                                textDecoration: "none",
                                mt: -0.25,
                            }}
                        >
                            {link}
                        </Link>
                    ))}
                </Box>
            </Box>

            {/* Footer Links */}
            <Box
                component="nav"
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    transform: "translateY(-1rem)",
                    // Note: animate-fade-in would need to be implemented with MUI transitions or CSS animations
                }}
            >
                {footerLinks.map((link, index) => (
                    <React.Fragment key={index}>
                        <Link
                            href="#"
                            sx={{
                                fontWeight: 400,
                                color: "#7c7c7c",
                                fontSize: "16px",
                                textAlign: "right",
                                letterSpacing: 0,
                                lineHeight: "24px",
                                whiteSpace: "nowrap",
                                "&:hover": { color: "white" },
                                transition: "color 0.2s ease",
                                textDecoration: "none",
                                mt: -0.25,
                            }}
                        >
                            {link}
                        </Link>
                        {index < footerLinks.length - 1 && (
                            <Box
                                component="img"
                                sx={{
                                    width: "1px",
                                    height: "12px",
                                }}
                                alt="Separator"
                                src="https://c.animaapp.com/metqtyo3gRfinE/img/vector-402.svg"
                            />
                        )}
                    </React.Fragment>
                ))}
            </Box>

        </Box>
    );
};

