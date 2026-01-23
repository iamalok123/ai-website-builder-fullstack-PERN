import { StarIcon } from "lucide-react";
import Marquee from "react-fast-marquee";

interface Testimonial {
    review: string;
    name: string;
    date: string;
    rating: number;
    image: string;
}

// Testimonial data
const TESTIMONIALS: Testimonial[] = [
    {
        review:
            "Zephyr is incredible! I described my business idea and had a fully functional website in under 30 seconds. The AI understood exactly what I needed.",
        name: "Richard Nelson",
        date: "12 Jan 2025",
        rating: 5,
        image:
            "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
    },
    {
        review:
            "As a non-technical founder, I was amazed at how easy it was. Just typed what I wanted and Zephyr created a stunning landing page with perfect styling.",
        name: "Sophia Martinez",
        date: "15 Mar 2025",
        rating: 5,
        image:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    },
    {
        review:
            "The AI revisions feature is a game-changer. I can iterate on my website endlessly until it's perfect. The version history saved me multiple times!",
        name: "Ethan Roberts",
        date: "20 Feb 2025",
        rating: 5,
        image:
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
    },
    {
        review:
            "I've tried other website builders, but nothing compares to Zephyr's AI. The generated code is clean, responsive, and actually production-ready.",
        name: "Isabella Kim",
        date: "20 Sep 2025",
        rating: 5,
        image:
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
    },
    {
        review:
            "From prompt to published website in minutes! The one-click publishing and download feature makes deploying my sites incredibly simple.",
        name: "Liam Johnson",
        date: "04 Oct 2025",
        rating: 5,
        image:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop",
    },
    {
        review:
            "The credit system is very fair and the results are outstanding. Built 5 different websites for my clients, each one unique and beautiful.",
        name: "Ava Patel",
        date: "01 Nov 2025",
        rating: 5,
        image:
            "https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage1.png",
    },
];

export default function OurTestimonials() {
    return (
        <section className="flex flex-col items-center justify-between max-w-6xl mx-auto mt-32 max-sm:mt-22 px-4">
            {/* Section Header */}
            <p className="text-purple-400 font-medium text-sm tracking-wide uppercase">
                What Our Users Say
            </p>
            <h3 className="text-3xl md:text-4xl font-semibold text-white mt-3">
                Loved by Creators
            </h3>
            <p className="mt-4 text-sm/6 text-white/70 max-w-md text-center">
                Thousands of entrepreneurs, freelancers, and businesses trust Zephyr to bring their website ideas to life instantly.
            </p>

            {/* Marquee Rows */}
            <Marquee pauseOnHover className="mt-12" gradient={false} speed={25}>
                {TESTIMONIALS.map((item, index) => (
                    <TestimonialCard key={index} item={item} />
                ))}
            </Marquee>
            <Marquee pauseOnHover className="mt-4" direction="right" gradient={false} speed={25}>
                {TESTIMONIALS.map((item, index) => (
                    <TestimonialCard key={index} item={item} />
                ))}
            </Marquee>
        </section>
    );
}

function TestimonialCard({ item }: { item: Testimonial }) {
    return (
        <div className="w-full max-w-88 mx-2 space-y-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            {/* Rating & Date */}
            <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                    {[...Array(item.rating)].map((_, index) => (
                        <StarIcon
                            key={index}
                            className="size-4 fill-purple-400 text-purple-400"
                        />
                    ))}
                </div>
                <p className="text-white/50 text-sm">{item.date}</p>
            </div>

            {/* Review */}
            <p className="text-white/80 text-sm leading-relaxed">"{item.review}"</p>

            {/* User Info */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <img
                    className="size-9 rounded-full ring-2 ring-purple-400/30"
                    width={40}
                    height={40}
                    src={item.image}
                    alt={item.name}
                />
                <p className="font-medium text-white">{item.name}</p>
            </div>
        </div>
    );
}
