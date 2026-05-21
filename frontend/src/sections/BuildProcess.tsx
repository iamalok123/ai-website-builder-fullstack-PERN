import { useEffect, useRef, useState } from "react";

type Step = {
    title: string;
    description: string;
};

const LEFT_STEPS: Step[] = [
    {
        title: "AI plans the page structure",
        description:
            "Zephyr maps the prompt into a real website journey: hero message, offer explanation, feature proof, pricing or CTA, and responsive section order.",
    },
    {
        title: "You revise, save, and launch",
        description:
            "Use follow-up prompts to change colors, content, layout, or sections. When the generation is finished, preview, save, download, or publish from the workspace.",
    },
];

const RIGHT_STEPS: Step[] = [
    {
        title: "Describe the business idea",
        description:
            "Start with the audience, offer, style, and goal. The system uses that context to avoid generic pages and build around the thing you are actually shipping.",
    },
    {
        title: "Code and content are generated",
        description:
            "The builder writes page copy and frontend structure together, so the design, text, and call-to-action feel like one finished website instead of loose blocks.",
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
        <section id="process" className="px-4 pt-28 md:pt-32">
            <div className="mx-auto max-w-7xl rounded-[24px] border border-white/10 bg-white/[0.035] px-6 py-14 backdrop-blur-md md:px-10 lg:px-14">
            {/* Section Header */}
            <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-lime-200/80">
                Build story
            </p>

            <h3 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold leading-tight text-white md:text-5xl">
                A modern website workflow without switching tools.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-white/58 md:text-base">
                Move from a rough business idea to a polished website draft with fewer handoffs, fewer blank screens, and a clearer path to launch.
            </p>

            {/* Process Steps */}
            <div className="mt-12 flex flex-col gap-5 md:mt-16 lg:mt-24 lg:flex-row lg:gap-0">
                {/* Left Column */}
                <div className="flex flex-col gap-5 lg:gap-0">
                    {LEFT_STEPS.map((step, index) => (
                        <div key={index} className="max-w-full rounded-lg border border-white/10 bg-black/20 p-6 lg:mb-0 lg:mt-60 lg:h-60 lg:max-w-lg first:mt-0">
                            <h3 className="inline-block border-b border-lime-200/50 pb-2 text-xl font-semibold text-white">
                                {step.title}
                            </h3>
                            <p className="mt-4 text-sm leading-6 text-white/58">{step.description}</p>
                        </div>
                    ))}
                </div>

                {/* Progress Bar - Desktop Only */}
                <div className="mx-12 hidden flex-col items-center lg:flex">
                    {/* Start Node */}
                    <div className={`size-4 rounded-sm transition-colors duration-300 ${progress[0] > 0 ? "bg-lime-300" : "bg-white/25"}`} />

                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex flex-col items-center">
                            {/* Progress Segment */}
                            <div
                                ref={(el) => { segmentRefs.current[i] = el; }}
                                data-index={i}
                                className="relative h-60 w-1 overflow-hidden rounded-full bg-white/15"
                            >
                                <div
                                    style={{ height: `${progress[i] * 100}%` }}
                                    className="absolute left-0 top-0 w-full rounded-full bg-linear-to-b from-lime-200 to-teal-300 transition-all duration-100 ease-out"
                                />
                            </div>
                            {/* End Node */}
                            <div className={`size-4 rounded-sm transition-colors duration-300 ${progress[i] >= 0.95 ? "bg-lime-300" : "bg-white/25"}`} />
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-5 lg:gap-0">
                    {RIGHT_STEPS.map((step, index) => (
                        <div key={index} className={`max-w-full rounded-lg border border-white/10 bg-black/20 p-6 lg:mb-0 lg:h-60 lg:max-w-lg ${index === 0 ? "" : "lg:mt-60"}`}>
                            <h3 className="inline-block border-b border-lime-200/50 pb-2 text-xl font-semibold text-white">
                                {step.title}
                            </h3>
                            <p className="mt-4 text-sm leading-6 text-white/58">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            </div>
        </section>
    );
}
