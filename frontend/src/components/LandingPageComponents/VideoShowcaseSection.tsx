import React from "react";
import { Card, CardContent } from "../ui/card";

const videoCards = [
    {
        title: "The Future of AI-Driven Content Creation",
        description:
            "Discover how AI is revolutionizing the way videos are made and how Codecraft is leading the charge in innovation",
        hasGradientBorder: true,
        hasGradientBackground: false,
        textColor: "#7c7c7c",
    },
    {
        title: "How to Use Text-to-Video for Marketing Success",
        description:
            "Learn the benefits of using AI tools like Codecraft to create engaging marketing videos effortlessly.",
        hasGradientBorder: false,
        hasGradientBackground: true,
        textColor: "white",
    },
    {
        title: "Top 5 Features You'll Love About Codecraft",
        description:
            "Explore the powerful features that make Codecraft the ultimate tool for video creators",
        hasGradientBorder: true,
        hasGradientBackground: false,
        textColor: "#7c7c7c",
    },
];

export const VideoShowcaseSection = (): JSX.Element => {
    return (
        <section className="flex flex-col w-full items-center justify-center gap-10 px-[200px] py-[120px] relative bg-[#060606]">
            <div className="w-full max-w-[800px] items-center gap-6 flex flex-col relative translate-y-[-1rem] animate-fade-in opacity-0">
                <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-white text-[56px] text-center tracking-[-1.68px] leading-[56px]">
                    Stay Updated with Codecraft
                </h2>

                <p className="relative w-full max-w-[512px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#7c7c7c] text-lg text-center tracking-[0] leading-[21.6px]">
                    Explore the latest trends, updates, and tips for leveraging AI in
                    video creation.
                </p>
            </div>

            <div className="flex items-start gap-10 relative self-stretch w-full">
                {videoCards.map((card, index) => (
                    <Card
                        key={index}
                        className={`
              flex-1 grow rounded-2xl overflow-hidden border-none bg-transparent
              translate-y-[-1rem] animate-fade-in opacity-0
              ${card.hasGradientBorder
                                ? "mt-[-2.00px] mb-[-2.00px] before:content-[''] before:absolute before:inset-0 before:p-0.5 before:rounded-2xl before:[background:linear-gradient(180deg,rgba(198,172,253,1)_0%,rgba(108,56,243,1)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none"
                                : ""
                            }
              ${card.hasGradientBackground
                                ? "[background:radial-gradient(50%_50%_at_50%_148%,rgba(198,172,253,1)_0%,rgba(108,56,243,1)_100%)]"
                                : ""
                            }
              ${index === 0 ? "ml-[-2.00px]" : ""}
              ${index === videoCards.length - 1 ? "mr-[-2.00px]" : ""}
            `}
                        style={
                            {
                                "--animation-delay": `${200 + index * 200}ms`,
                            } as React.CSSProperties
                        }
                    >
                        <CardContent className="flex flex-col items-start gap-6 p-6 relative">
                            <div
                                className={`relative self-stretch w-full h-40 rounded-xl ${card.hasGradientBackground
                                    ? "bg-[#00000033]"
                                    : "bg-[#ffffff33]"
                                    }`}
                            />

                            <div className="flex flex-col items-start gap-2 relative self-stretch w-full">
                                <h3 className="relative self-stretch mt-[-1.00px] font-body-l-semibold font-[number:var(--body-l-semibold-font-weight)] text-white text-[length:var(--body-l-semibold-font-size)] tracking-[var(--body-l-semibold-letter-spacing)] leading-[var(--body-l-semibold-line-height)] [font-style:var(--body-l-semibold-font-style)]">
                                    {card.title}
                                </h3>

                                <p
                                    className="relative self-stretch [font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-lg tracking-[0] leading-[21.6px]"
                                    style={{ color: card.textColor }}
                                >
                                    {card.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};
