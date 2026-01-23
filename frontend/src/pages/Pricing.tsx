import { useState } from "react";
import { appPlans } from "../assets/assets";
import Footer from "../components/Footer";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import api from "@/configs/axios";

interface plan {
    id: string;
    name: string;
    price: string;
    credits: number;
    description: string;
    features: string[];
}


const Pricing = () => {
    const { data: session } = authClient.useSession();
    const [plans] = useState<plan[]>(appPlans);

    const handlePurchase = async (planId: string) => {
        try {
            if (!session?.user) {
                return toast("Please log in to purchase credits")
            }
            const { data } = await api.post("/api/user/purchase-credits", {
                planId,
            })
            window.location.href = data.payment_link;


        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message);
            console.log(error);
        }
    }

    return (
        <>
            <div className="w-full max-w-5xl mx-auto z-20 max-md:px-4 min-h-[80vh] ">
                <div className="text-center mt-12">
                    <h1 className="text-3xl font-medium text-white">Choose Your Plan</h1>
                    <p className="text-white mt-2 max-w-md mx-auto text-sm">Start for free and scale up as you grow. Find the perfect plan for your content creation needs.</p>
                </div>

                <div className='pt-18 py-4 px-4 '>
                    <div className='grid grid-cols-1 md:grid-cols-3 flex-wrap gap-8 pt-3 items-end'>
                        {plans.map((plan, idx) => {
                            const isProPlan = plan.id === 'pro';
                            return (
                                <div
                                    key={idx}
                                    className={`relative p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-400 mx-auto w-full max-w-sm ${isProPlan
                                        ? 'bg-gray-900 border-2 border-gray-400 text-white md:scale-110 md:-mt-6 md:mb-6'
                                        : 'bg-white border border-gray-300 text-gray-900 hover:border-gray-400'
                                        }`}
                                >
                                    {/* Special Banner for Pro Plan */}
                                    {isProPlan && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                                                ⭐ Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <h3 className={`text-xl font-bold ${isProPlan ? 'text-white' : ''}`}>{plan.name}</h3>
                                    <div className="my-2">
                                        <span className={`text-4xl font-bold ${isProPlan ? 'text-white' : ''}`}>{plan.price}</span>
                                        <span className={isProPlan ? 'text-indigo-200' : 'text-gray-600'}> / {plan.credits} credits</span>
                                    </div>

                                    <p className={`mb-6 ${isProPlan ? 'text-indigo-100' : 'text-gray-600'}`}>{plan.description}</p>

                                    <ul className="space-y-1.5 mb-6 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center">
                                                <svg className={`h-5 w-5 mr-2 ${isProPlan ? 'text-amber-400' : 'text-gray-900'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className={isProPlan ? 'text-white' : 'text-gray-700'}>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => handlePurchase(plan.id)}
                                        className={`w-full py-2 px-4 active:scale-95 text-sm rounded-md transition-all ${isProPlan
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md'
                                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                                            }`}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <p className="mx-auto text-center text-sm max-w-md mt-14 mb-20 text-white font-light">
                    Project {"       "}
                    <span className="text-white font-medium px-1">
                        Creation / Revision
                    </span>
                    consume {"       "}
                    <span className="text-white font-medium px-1">
                        5 credits
                    </span>
                    .
                    You can purchase more credits to create more projects.
                </p>
            </div>
            <Footer />
        </>
    )
}

export default Pricing;