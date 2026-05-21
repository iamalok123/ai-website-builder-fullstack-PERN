import { CheckIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react";

interface PricingItem {
    title: string;
    description: string;
    mostPopular?: boolean;
    price: string;
    buttonText: string;
    features: string[];
}

export default function PricingSection() {
    const data: PricingItem[] = [
        {
            title: "Pro",
            mostPopular: true,
            description: "Add credits to create more projects",
            price: "$19",
            buttonText: "Get Started",
            features: [
                "Up to 80 creations",
                "Extended revisions",
                "AI website generation",
                "Publish and download",
                "Version history",
            ],
        },
        {
            title: "Enterprise",
            description: "Add credits to create more projects",
            price: "$49",
            buttonText: "Get Started",
            features: [
                "Up to 200 creations",
                "Increased revisions",
                "AI website generation",
                "Publish and download",
                "Version history",
            ],
        },
    ];
    return (
        <section id="pricing" className="px-4 pt-28 md:pt-32">
            <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-14 rounded-[24px] border border-white/10 bg-[#050706] px-6 py-14 md:flex-row md:px-10 lg:px-14">
            <div className="max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lime-200/80">Credits</p>
                <h3 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-5xl">Start small, then scale website creation.</h3>
                <p className="mt-4 text-sm leading-6 text-white/60">Choose a credit pack that fits your goals. Every pack supports AI generation, revisions, publishing, downloads, and project history.</p>
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className="rounded-lg border border-lime-200/20 bg-lime-200/10 p-2.5">
                            <SparklesIcon className="size-5 text-lime-200" />
                        </div>
                        <p>AI generation and revisions included</p>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                        <div className="rounded-lg border border-lime-200/20 bg-lime-200/10 p-2.5">
                            <ZapIcon className="size-5 text-lime-200" />
                        </div>
                        <p>Responsive HTML output with Tailwind</p>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                        <div className="rounded-lg border border-lime-200/20 bg-lime-200/10 p-2.5">
                            <ShieldCheckIcon className="size-5 text-lime-200" />
                        </div>
                        <p>Clear honest usage with limits</p>
                    </div>
                </div>
            </div>
            <div className='grid flex-1 grid-cols-1 items-end gap-6 md:grid-cols-2'>
                {data.map((item, index) => (
                    <div key={index} className={`group w-full rounded-lg border p-6 pb-8 shadow-2xl transition duration-300 hover:-translate-y-1 ${item.mostPopular ? 'border-lime-200/30 bg-linear-to-b from-lime-200/[0.14] to-white/[0.035] text-white shadow-lime-950/30' : 'border-white/10 bg-white/[0.035] text-white shadow-black/20'}`}>
                        {item.mostPopular && (
                            <p className="mb-4 inline-flex rounded-full border border-lime-200/25 bg-lime-200/10 px-3 py-1 text-xs font-medium text-lime-100">Most popular</p>
                        )}
                        <div className={`flex flex-col items-center justify-center text-center`}>
                            <h3 className='text-lg font-semibold'>{item.title}</h3>
                            <p className='text-sm text-white/52'>{item.description}</p>
                            <p className='mt-4 text-2xl font-semibold'>
                                {item.price} <span className='text-sm font-normal text-white/45'>credit pack</span>
                            </p>
                            <button className={`mt-4 w-full rounded-lg py-2.5 font-semibold transition ${item.mostPopular ? 'bg-lime-300 text-[#08100b] hover:bg-lime-200' : 'border border-white/15 bg-white/[8 text-white hover:bg-white/[0.14]'}`}>{item.buttonText}</button>
                        </div>
                        <div className='mt-2 flex flex-col'>
                            {item.features.map((feature, index) => (
                                <div key={index} className='flex items-center gap-2 border-b border-white/10 py-3 text-sm text-white/72'>
                                    <div className='rounded-full bg-lime-200/15 p-1'>
                                        <CheckIcon className='size-3 text-lime-200' strokeWidth={2.5} />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            </div>
        </section>
    );
}
