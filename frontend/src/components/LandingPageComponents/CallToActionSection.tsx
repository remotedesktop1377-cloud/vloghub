import { PlayIcon } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

export const CallToActionSection = (): JSX.Element => {
    const promptTags = [
        { label: "Style : 3D" },
        { label: "Camera : Wide Shot" },
        { label: "Lighting : Neon" },
        { label: "Character : Kids" },
    ];

    return (
        <section className="relative w-full h-[820px] bg-[#00000033] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300">
                    <PlayIcon className="w-8 h-8 text-black ml-1" fill="currentColor" />
                </div>
            </div>

            <Card className="absolute top-[504px] left-[50px] w-[520px] bg-black border-none translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                <CardContent className="p-8">
                    <div className="flex flex-col gap-10">
                        <div className="flex flex-col gap-4">
                            <div className="[font-family:'Inter',Helvetica] font-normal text-[#7c7c7c] text-xl tracking-[0] leading-[24.0px]">
                                Prompt
                            </div>

                            <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-white text-[28px] tracking-[-0.84px] leading-[33.6px]">
                                "3D cartoon kids exploring the moon in space"
                            </h3>

                            <div className="flex flex-wrap gap-2">
                                {promptTags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-[#121212] text-[#7c7c7c] hover:bg-[#1a1a1a] transition-colors duration-200 px-4 py-2 rounded-[300px] [font-family:'Inter',Helvetica] font-normal text-base tracking-[0] leading-6"
                                    >
                                        {tag.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};
