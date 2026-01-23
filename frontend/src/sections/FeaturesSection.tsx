import { ChartSplineIcon, LayoutPanelTopIcon, NotebookPenIcon } from "lucide-react";

interface Feature {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
}

// Feature data
const FEATURES: Feature[] = [
    {
        icon: LayoutPanelTopIcon,
        title: "AI Layout Generator",
        description: "Automatically creates a complete website layout from a single prompt.",
    },
    {
        icon: NotebookPenIcon,
        title: "AI Content Writer",
        description: "Generates high-quality headlines, text, and call-to-actions instantly.",
    },
    {
        icon: ChartSplineIcon,
        title: "Performance Optimization",
        description: "Ensures fast load speed, clean code, and high PageSpeed scores.",
    },
];

export default function FeaturesSection() {
    return (
        <section
            id="features"
            className="grid mt-32 max-sm:mt-22 rounded-xl max-w-6xl mx-4 md:mx-auto border border-white/20 bg-white/5 backdrop-blur-md grid-cols-1 divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0"
        >
            {FEATURES.map((item, index) => (
                <div
                    key={index}
                    className="flex flex-col items-start gap-4 hover:bg-white/5 transition-all duration-300 p-8 pb-14"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <item.icon className="size-5 text-amber-400" />
                        </div>
                        <h2 className="font-medium text-lg text-white">{item.title}</h2>
                    </div>
                    <p className="text-white/70 text-sm/6 max-w-72">{item.description}</p>
                </div>
            ))}
        </section>
    );
}