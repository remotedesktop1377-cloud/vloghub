import React from "react";
import { Separator } from "../../components/ui/separator";

export const NewsletterSubscriptionSection: React.FC = () =>  {
    const aboutLinks = [
        "About Codecraft",
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
        <footer className="flex flex-col items-center gap-10 pt-20 pb-[170px] px-[200px] w-full bg-[#121212] overflow-hidden">
            {/* Follow Us Section */}
            <div className="flex items-center justify-center gap-8 w-full translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
                <div className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-white text-lg tracking-[-0.36px] leading-[21.6px] whitespace-nowrap">
                    Follow Us
                </div>

                <img
                    className="flex-[0_0_auto]"
                    alt="Social media icons"
                    src="https://c.animaapp.com/metqtyo3gRfinE/img/frame-1000004725.svg"
                />
            </div>

            {/* First Separator */}
            <div className="w-[520px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                <Separator className="bg-gray-600" />
            </div>

            {/* About Section */}
            <section className="inline-flex flex-col items-center gap-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                <h3 className="mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-white text-lg tracking-[-0.36px] leading-[21.6px] whitespace-nowrap">
                    About
                </h3>

                <nav className="inline-flex items-start gap-6">
                    {aboutLinks.map((link, index) => (
                        <a
                            key={index}
                            href="#"
                            className="mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#7c7c7c] text-base tracking-[0] leading-[19.2px] whitespace-nowrap hover:text-white transition-colors"
                        >
                            {link}
                        </a>
                    ))}
                </nav>
            </section>

            {/* Second Separator */}
            <div className="w-[520px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
                <Separator className="bg-gray-600" />
            </div>

            {/* Footer Links */}
            <nav className="inline-flex items-center gap-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:800ms]">
                {footerLinks.map((link, index) => (
                    <React.Fragment key={index}>
                        <a
                            href="#"
                            className="mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#7c7c7c] text-base text-right tracking-[0] leading-6 whitespace-nowrap hover:text-white transition-colors"
                        >
                            {link}
                        </a>
                        {index < footerLinks.length - 1 && (
                            <img
                                className="w-px h-3"
                                alt="Separator"
                                src="https://c.animaapp.com/metqtyo3gRfinE/img/vector-402.svg"
                            />
                        )}
                    </React.Fragment>
                ))}
            </nav>

            {/* Background Elements */}
            <div className="absolute w-[464px] h-[464px] top-[-167px] -left-8 opacity-50" />

            <img
                className="absolute w-[1140px] h-[214px] top-[317px] left-[150px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:1000ms]"
                alt="Codecraft logo"
                src="https://c.animaapp.com/metqtyo3gRfinE/img/logotext.svg"
            />
        </footer>
    );
};

