import React from "react";

export const TestimonialsSection = (): JSX.Element => {
    return (
        <section className="flex flex-col w-full items-center justify-center gap-2.5 pt-[120px] pb-10 px-20 relative bg-[#060606]">
            <div className="flex flex-col max-w-[800px] items-start gap-6 relative translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]">
                <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Plus_Jakarta_Sans',Helvetica] font-medium text-white text-[56px] text-center tracking-[-1.68px] leading-[56px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
                    See Codecraft in Action: Your Vision, Realized
                </h2>

                <p className="relative self-stretch [font-family:'Plus_Jakarta_Sans',Helvetica] font-normal text-[#7c7c7c] text-lg text-center tracking-[0] leading-[21.6px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
                    From a simple idea to a polished masterpiece, Codecraft bridges the
                    gap between imagination and reality. Explore how your prompts can turn
                    into stunning videos with just a few clicks. Witness the power of
                    AI-crafted storytelling tailored to your needs.
                </p>
            </div>
        </section>
    );
};
