import { ChevronUpIcon } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const features = [
    {
        id: "text-to-video",
        title: "Text-to-Video",
        description:
            "Transform simple text into stunning videos effortlessly. Whether it's marketing, education, or storytelling, just describe your vision, and let Codecraft bring it to life",
        isExpanded: true,
        hasDemo: true,
    },
    {
        id: "video-style-transfer",
        title: "Video Style Transfer",
        description:
            "Redefine your content with artistic video styles. Apply unique aesthetics to your footage and create standout visuals in just a few steps",
        isExpanded: false,
        hasDemo: false,
    },
    {
        id: "deepfake",
        title: "Deepfake",
        description:
            "Seamlessly integrate AI-powered deepfake technology for personalized content. Create tailored videos while maintaining ethical AI usage.",
        isExpanded: false,
        hasDemo: false,
    },
    {
        id: "virtual-background",
        title: "Virtual Background",
        description:
            "Enhance your videos with immersive virtual backgrounds. Perfect for remote presentations, vlogs, or creative projects",
        isExpanded: false,
        hasDemo: false,
    },
];

export const FeaturesHighlightSection: React.FC = () => {
    return (
        <section className="flex w-full items-start gap-20 px-20 py-[120px] bg-[#060606]">
            <div className="w-[420px] items-start gap-10 flex flex-col translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
                <div className="flex flex-col items-start gap-6 w-full">
                    <h2 className="mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-white text-[56px] tracking-[-1.68px] leading-[56px]">
                        Why Choose Codecraft?
                    </h2>

                    <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#7c7c7c] text-lg tracking-[0] leading-[21.6px]">
                        Empowering creators with speed, flexibility, and creative precision.
                    </p>
                </div>

                <div className="inline-flex flex-col items-start gap-2.5 p-1 rounded-[300px] shadow-[0px_1px_3px_#6c39f41a,0px_5px_5px_#6c39f417,0px_12px_7px_#6c39f40d,0px_20px_8px_#6c39f403,0px_32px_9px_transparent] [background:radial-gradient(50%_50%_at_50%_50%,rgba(198,172,253,0.3)_0%,rgba(108,56,243,0.3)_100%)]">
                    <Button className="inline-flex items-center gap-1 px-6 py-3 bg-white rounded-[300px] h-auto hover:bg-gray-50 transition-colors">
                        <span className="[background:radial-gradient(50%_50%_at_50%_50%,rgba(198,172,253,1)_0%,rgba(108,56,243,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-xl tracking-[-0.60px] leading-7 whitespace-nowrap">
                            Learn about Codecraft
                        </span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col items-start gap-9 flex-1 grow relative translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                <img
                    className="absolute w-0.5 h-[782px] top-7 left-[27px]"
                    alt="Vector"
                    src="https://c.animaapp.com/metqtyo3gRfinE/img/vector-405.svg"
                />

                {features.map((feature, index) => (
                    <div
                        key={feature.id}
                        className="flex items-start gap-10 w-full translate-y-[-1rem] animate-fade-in opacity-0"
                        style={{ ["--animation-delay" as any]: `${400 + index * 200}ms` } as React.CSSProperties}
                    >
                        <img
                            className={`flex-[0_0_auto] ${index === 0 ? "mt-[-2.00px] ml-[-8.00px]" : ""}`}
                            alt="Frame"
                            src={
                                index === 0
                                    ? "https://c.animaapp.com/metqtyo3gRfinE/img/frame-1000004736.svg"
                                    : "https://c.animaapp.com/metqtyo3gRfinE/img/frame-1000004761.svg"
                            }
                        />

                        <Card
                            className={`flex-1 grow rounded-[20px] border-0 ${feature.isExpanded ? "[background:radial-gradient(50%_50%_at_57%_59%,rgba(198,172,253,1)_0%,rgba(108,56,243,1)_100%)]" : "bg-[#121212]"}`}
                        >
                            <CardContent className="flex flex-col items-start gap-4 p-6">
                                <div className="flex items-center justify-between w-full">
                                    <h3 className="mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-semibold text-white text-[28px] tracking-[0.15px] leading-[33.6px] whitespace-nowrap">
                                        {feature.title}
                                    </h3>

                                    <ChevronUpIcon className="w-6 h-6 text-white" />
                                </div>

                                <p
                                    className={`[font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-base tracking-[0.15px] leading-6 ${feature.isExpanded ? "text-white" : "text-[#ffffff80]"}`}
                                >
                                    {feature.description}
                                </p>

                                {feature.hasDemo && (
                                    <>
                                        <div className="w-full h-40 rounded-2xl bg-[linear-gradient(0deg,rgba(37,37,37,1)_0%,rgba(18,18,18,1)_100%)] relative">
                                            <div className="flex w-[527px] items-center gap-6 pl-6 pr-4 py-3 absolute top-10 left-[54px] bg-[#252525] rounded-[160px]">
                                                <div className="flex-1 [font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-[#7c7c7c] text-base tracking-[0.15px] leading-6">
                                                    What you want to share today?
                                                </div>

                                                <img
                                                    className="flex-[0_0_auto] mt-[-2.00px] mb-[-28.00px] mr-[-8.00px]"
                                                    alt="Frame"
                                                    src="https://c.animaapp.com/metqtyo3gRfinE/img/frame-1000004736-1.svg"
                                                />
                                            </div>
                                        </div>

                                        <div className="inline-flex flex-col items-start gap-2.5 p-0.5 rounded-[300px] shadow-[0px_1px_3px_#6c39f41a,0px_5px_5px_#6c39f417,0px_12px_7px_#6c39f40d,0px_20px_8px_#6c39f403,0px_32px_9px_transparent] [background:radial-gradient(50%_50%_at_50%_50%,rgba(198,172,253,0.12)_0%,rgba(108,56,243,0.12)_100%)]">
                                            <Button className="inline-flex items-center gap-1 px-4 py-2 bg-white rounded-[300px] h-auto hover:bg-gray-50 transition-colors">
                                                <span className="[background:radial-gradient(50%_50%_at_50%_50%,rgba(198,172,253,1)_0%,rgba(108,56,243,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-sm tracking-[-0.42px] leading-6 whitespace-nowrap">
                                                    Learn More
                                                </span>
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </section>
    );
};