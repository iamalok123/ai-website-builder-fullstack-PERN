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
                "Upto 80 Creations",
                "Extended Revisions",
                "Advanced AI Models",
                "Priority email support",
                "Advanced analytics",
            ],
        },
        {
            title: "Enterprise",
            description: "Add credits to create more projects",
            price: "$49",
            buttonText: "Get Started",
            features: [
                "Upto 200 Creations",
                "Increased Revisions",
                "Advanced AI Models",
                "Email + chat support",
                "Advanced analytics",
            ],
        },
    ];
    return (
        <section id="pricing" className="flex flex-col md:flex-row gap-14 items-start justify-between max-w-7xl mx-auto mt-32 px-4">
            <div className="max-w-sm">
                <h3 className="font-domine text-3xl text-white">OUR PRICING</h3>
                <p className="mt-4 text-sm/6 text-white">Choose a plan that fits your goals and scale. Every plan includes powerful AI features, fast performance, and all the tools you need without limits.</p>
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2.5 border border-amber-400/50 rounded-md bg-amber-400/10">
                            <SparklesIcon className="size-5 text-amber-400" />
                        </div>
                        <p>Advanced AI features included</p>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2.5 border border-amber-400/50 rounded-md bg-amber-400/10">
                            <ZapIcon className="size-5 text-amber-400" />
                        </div>
                        <p>Lightning fast load speed always</p>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2.5 border border-amber-400/50 rounded-md bg-amber-400/10">
                            <ShieldCheckIcon className="size-5 text-amber-400" />
                        </div>
                        <p>Clear honest usage with limits</p>
                    </div>
                </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-end flex-1'>
                {data.map((item, index) => (
                    <div key={index} className={`group w-full max-w-80 rounded-xl p-6 pb-10 border ${item.mostPopular ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-900'}`}>
                        <div className={`flex flex-col items-center justify-center text-center`}>
                            <h3 className='text-lg font-semibold'>{item.title}</h3>
                            <p className={item.mostPopular ? 'text-gray-400' : 'text-gray-600'}>{item.description}</p>
                            <p className='mt-4 text-2xl font-semibold'>
                                {item.price} <span className={`text-sm font-normal ${item.mostPopular ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                            </p>
                            <button className={`mt-4 w-full rounded-lg py-2.5 font-medium transition ${item.mostPopular ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{item.buttonText}</button>
                        </div>
                        <div className='mt-2 flex flex-col'>
                            {item.features.map((feature, index) => (
                                <div key={index} className={`flex items-center gap-2 border-b py-3 ${item.mostPopular ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className={`rounded-full p-1 ${item.mostPopular ? 'bg-white/10' : 'bg-gray-900'}`}>
                                        <CheckIcon className={`size-3 text-white`} strokeWidth={2.5} />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}