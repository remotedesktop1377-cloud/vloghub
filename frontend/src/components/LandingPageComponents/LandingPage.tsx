import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { TestimonialsSection } from "../LandingPageComponents/TestimonialsSection";
import { CallToActionSection } from "../LandingPageComponents/CallToActionSection";
import { VideoShowcaseSection } from "../LandingPageComponents/VideoShowcaseSection";
import { NewsletterSubscriptionSection } from "../LandingPageComponents/NewsletterSubscriptionSection";
import { HeroSection } from "../LandingPageComponents/HeroSection";
import { TrustedBySection } from "../LandingPageComponents/TrustedBySection";
import Image from "next/image";
import FeatureHighlightsMUI from "./FeatureHighlights";
import { useRouter } from "next/navigation";

const LandingPage: React.FC = () => {
    const router = useRouter();
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#060606', }}>
            {/* Hero Section */}
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                {/* Background Wave Graphics */}
                <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', marginTop: '100px' }}>
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
                                fontSize: { xs: '44px', md: '64px', color: '#fff' },
                                fontWeight: 500,
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                                mb: 3
                            }}
                        >
                            Transform Ideas into <br /> Stunning Videos
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: { xs: '16px', md: '15px' },
                                color: '#7C7C7C',
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
                                gap: 2,
                                justifyContent: 'center',
                                alignItems: 'center',
                                pt: 8
                            }}
                        >
                            <Button
                                sx={{
                                    px: 4,
                                    py: 2,
                                    fontSize: { xs: '14px', md: '16px' },
                                    fontWeight: 600,
                                    borderRadius: '50px',
                                    height: 'auto',
                                    textTransform: 'none',
                                    background: 'linear-gradient(180deg, #6D28D9 0%, #9333EA 100%)',
                                    color: 'white',
                                    boxShadow: '0 0 40px rgba(124,58,237,0.35)',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #6D28D9 0%, #6D28D9 100%)',
                                    }
                                }}
                                onClick={() => {
                                    router.push('/trending-topics');
                                }}
                            >
                                ✨ Generate AI Video
                            </Button>
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
                                        fontFamily: "Plus Jakarta Sans, Helvetica",
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

                        {/* Preview cards (bottom) */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 5,
                                mt: 15,
                                position: 'relative',
                                justifyContent: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 320,
                                    height: 192,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Image src="/img9.jpg" alt="Preview 1" fill style={{ objectFit: 'cover' }} />
                            </Box>
                            <Box
                                sx={{
                                    width: 320,
                                    height: 192,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
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
                            left: -20,
                            top: '80px',
                            height: 240,
                            width: 288,
                            borderRadius: 6,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            overflow: 'hidden'
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
                            height: 240,
                            width: 288,
                            borderRadius: 6,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            overflow: 'hidden'
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