import { useEffect, useRef, useState } from "react";

type Step = {
    title: string;
    description: string;
};

const LEFT_STEPS: Step[] = [
    {
        title: "AI Generates Smart Layouts",
        description:
            "Our AI Layout Generator creates a complete website structure with proper sections, spacing, and layout flow, ensuring a clean, modern, and high-conversion design from the start.",
    },
    {
        title: "Website Is Optimized & Published",
        description:
            "Performance Optimization is applied automatically to improve speed, structure, and responsiveness, so your website is fast, stable, and ready to publish across all devices.",
    },
];

const RIGHT_STEPS: Step[] = [
    {
        title: "Describe Your Website Idea",
        description:
            "Explain your business type, target audience, and style in a few words. Our system understands your intent and prepares everything needed to build a website that fits your vision.",
    },
    {
        title: "Content Is Written Automatically",
        description:
            "The AI Content Writer generates headlines, section text, and call-to-actions tailored to your website goals, keeping everything clear, engaging, and optimized for user interaction.",
    },
];

export default function BuildProcess() {
    const segmentRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const [progress, setProgress] = useState<number[]>([0, 0, 0]);

    useEffect(() => {
        const handleScroll = () => {
            const updated = segmentRefs.current.map((el) => {
                if (!el) return 0;

                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                // Start filling when element enters viewport, complete when it reaches middle
                const startTrigger = windowHeight * 0.75;
                const endTrigger = windowHeight * 0.35;

                // Calculate progress based on element position
                const elementTop = rect.top;

                if (elementTop >= startTrigger) return 0;
                if (elementTop <= endTrigger) return 1;

                const percent = (startTrigger - elementTop) / (startTrigger - endTrigger);
                return Math.min(Math.max(percent, 0), 1);
            });

            setProgress(updated);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section id="process" className="flex flex-col items-center mt-32 max-sm:mt-22 px-4">
            {/* Section Header */}
            <p className="text-amber-400 font-medium text-sm tracking-wide uppercase">
                Simple 4-Step Process
            </p>

            <h3 className="text-3xl md:text-4xl font-semibold max-w-md text-white text-center mt-4">
                Build Your Website in Just Four Simple Steps
            </h3>

            {/* Process Steps */}
            <div className="flex flex-col md:flex-row mt-16 md:mt-24 gap-8 md:gap-0">
                {/* Left Column */}
                <div className="flex flex-col">
                    {LEFT_STEPS.map((step, index) => (
                        <div key={index} className="max-w-lg md:h-60 md:mt-60 first:mt-0 mb-8 md:mb-0">
                            <h3 className="text-xl font-semibold text-white border-b border-amber-400/50 pb-2 inline-block">
                                {step.title}
                            </h3>
                            <p className="mt-4 text-white/70 text-sm/6">{step.description}</p>
                        </div>
                    ))}
                </div>

                {/* Progress Bar - Desktop Only */}
                <div className="hidden md:flex flex-col items-center mx-12">
                    {/* Start Node */}
                    <div className={`size-4 rounded-sm transition-colors duration-300 ${progress[0] > 0 ? "bg-amber-400" : "bg-white/30"}`} />

                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex flex-col items-center">
                            {/* Progress Segment */}
                            <div
                                ref={(el) => { segmentRefs.current[i] = el; }}
                                data-index={i}
                                className="relative w-1 h-60 bg-white/20 rounded-full overflow-hidden"
                            >
                                <div
                                    style={{ height: `${progress[i] * 100}%` }}
                                    className="absolute top-0 left-0 w-full bg-linear-to-b from-amber-400 to-amber-500 transition-all duration-100 ease-out rounded-full"
                                />
                            </div>
                            {/* End Node */}
                            <div className={`size-4 rounded-sm transition-colors duration-300 ${progress[i] >= 0.95 ? "bg-amber-400" : "bg-white/30"}`} />
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col">
                    {RIGHT_STEPS.map((step, index) => (
                        <div key={index} className={`max-w-lg md:h-60 ${index === 0 ? "" : "md:mt-60"} mb-8 md:mb-0`}>
                            <h3 className="text-xl font-semibold text-white border-b border-amber-400/50 pb-2 inline-block">
                                {step.title}
                            </h3>
                            <p className="mt-4 text-white/70 text-sm/6">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}