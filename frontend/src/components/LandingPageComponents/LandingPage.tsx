import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { CallToActionSection } from "./sections/CallToActionSection";
import { VideoShowcaseSection } from "./sections/VideoShowcaseSection";
import { NewsletterSubscriptionSection } from "./sections/NewsletterSubscriptionSection";
import { HeroSection } from "./sections/HeroSection";
import { TrustedBySection } from "./sections/TrustedBySection";
import { BACKGROUND, TEXT, PURPLE, SHADOW, HOVER, NEUTRAL } from "../../styles/colors";
import { ROUTES_KEYS } from "../../data/constants";
import Image from "next/image";
import FeatureHighlightsMUI from "./sections/FeatureHighlights";
import Link from "next/link";

const LandingPage: React.FC = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: BACKGROUND.default, }}>
            {/* Hero Section */}
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                {/* Background Wave Graphics */}
                <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', marginTop: '180px' }}>
                    {/* Hosted wave background image */}
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            // zIndex: 1,
                            backgroundImage: 'url(/waves.svg)',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            // backgroundPosition: 'center',
                            opacity: 1,
                            mixBlendMode: 'screen'
                        }}
                    />
                </Box>

                {/* Hero Section */}
                <Box
                    component="main"
                    sx={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        pt: 5
                    }}
                >
                    <Container maxWidth="lg" sx={{ mb: 4, mt: 3 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: '36px', sm: '44px', md: '80px' },
                                color: TEXT.primary,
                                fontWeight: 500,
                                lineHeight: { xs: 1.15, md: 1.1 },
                                letterSpacing: '-0.03em',
                                mb: { xs: 2, md: 3 },
                                px: { xs: 2, md: 0 }
                            }}
                        >
                            Transform Ideas into <br /> Stunning Videos
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: { xs: '16px', md: '18px' },
                                color: TEXT.muted,
                                maxWidth: '600px',
                                mx: 'auto',
                                mb: 4,
                                fontWeight: 400
                            }}
                        >
                            Vloghub: The AI-powered solution for effortless video creation.
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 2, md: 3 },
                                justifyContent: 'center',
                                alignItems: 'center',
                                pt: { xs: 4, md: 8 },
                                px: { xs: 2, md: 0 }
                            }}
                        >
                            <Link href={ROUTES_KEYS.TRENDING_TOPICS} prefetch>
                                <Button
                                    sx={{
                                        px: 4,
                                        py: 2,
                                        fontSize: { xs: '14px', md: '20px' },
                                        fontWeight: 500,
                                        borderRadius: '50px',
                                        height: 'auto',
                                        textTransform: 'none',
                                        background: PURPLE.gradient.primary,
                                        color: TEXT.primary,
                                        boxShadow: `0 0 40px ${SHADOW.primary}`,
                                        '&:hover': {
                                            background: PURPLE.gradient.secondary,
                                        }
                                    }}
                                >
                                    ✨ Generate AI Video
                                </Button>
                            </Link>
                            <Button
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: { xs: 3, md: 4 },
                                    py: { xs: 1.5, md: 2 },
                                    bgcolor: NEUTRAL.white,
                                    borderRadius: "300px",
                                    height: "auto",
                                    "&:hover": { bgcolor: HOVER.light },
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
                                        fontSize: { xs: "16px", md: "20px" },
                                        letterSpacing: "-0.60px",
                                        lineHeight: "28px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Learn about Vloghub
                                </Typography>
                            </Button>
                        </Box>

                        {/* Preview cards (bottom) */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 2, md: 5 },
                                mt: { xs: 6, md: 12 },
                                position: 'relative',
                                justifyContent: 'center',
                                alignItems: 'center',
                                px: { xs: 2, md: 0 }
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: '100%', sm: 320, md: 358 },
                                    maxWidth: 400,
                                    height: { xs: 200, sm: 220, md: 254 },
                                    borderRadius: 10,
                                    bgcolor: BACKGROUND.overlay.light,
                                    border: `1px solid ${BACKGROUND.overlay.light}`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Image src="/img9.jpg" alt="Preview 1" fill style={{ objectFit: 'cover' }} />
                            </Box>
                            <Box
                                sx={{
                                    width: { xs: '100%', sm: 320, md: 358 },
                                    maxWidth: 400,
                                    height: { xs: 200, sm: 220, md: 254 },
                                    borderRadius: 10,
                                    bgcolor: BACKGROUND.overlay.light,
                                    border: `1px solid ${BACKGROUND.overlay.medium}`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Image src="/img6.png" alt="Preview 2" fill style={{ objectFit: 'cover' }} />
                            </Box>
                        </Box>
                    </Container>

                    {/* Floating corner cards like Figma */}
                    <Box
                        sx={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            left: -40,
                            top: '80px',
                            width: 318,
                            height: 226,
                            borderRadius: 10,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                            display: { xs: 'none', md: 'block' }
                        }}
                    >
                        <Image src="/img1.png" alt="Preview 1" fill style={{ objectFit: 'cover' }} />

                    </Box>
                    <Box
                        sx={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            right: -20,
                            top: '190px',
                            width: 318,
                            height: 226,
                            borderRadius: 6,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                            display: { xs: 'none', md: 'block' }
                        }}
                    >
                        <Image src="/img7.jpg" alt="Preview 1" fill style={{ objectFit: 'cover' }} />

                    </Box>
                </Box>
            </Box>

            {/* Hero Section */}
            <HeroSection />

            {/* Trusted By Section */}
            <TrustedBySection />

            {/* Testimonials Section */}
            <TestimonialsSection />

            {/* Call to Action Section */}
            <CallToActionSection />

            {/* Features Highlight Section */}
            <FeatureHighlightsMUI />

            {/* Video Showcase Section */}
            <VideoShowcaseSection />

            {/* Newsletter Subscription Section */}
            <NewsletterSubscriptionSection />
        </Box>
    );
};

export default LandingPage;