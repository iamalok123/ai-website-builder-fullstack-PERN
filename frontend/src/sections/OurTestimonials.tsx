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
        <section className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 pt-28 md:pt-32">
            {/* Section Header */}
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lime-200/80">
                Proof
            </p>
            <h3 className="mt-3 text-center text-3xl font-semibold text-white md:text-5xl">
                Built for people who need to move fast.
            </h3>
            <p className="mt-4 max-w-xl text-center text-sm leading-6 text-white/58">
                Creators use Zephyr to turn raw ideas into a live-looking website draft, then iterate until it is ready to share.
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
        <div className="mx-2 w-full max-w-[88] space-y-4 rounded-lg border border-white/10 bg-white/5.5 p-5 text-white/78 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/7.5">
            {/* Rating & Date */}
            <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                    {[...Array(item.rating)].map((_, index) => (
                        <StarIcon
                            key={index}
                            className="size-4 fill-lime-300 text-lime-300"
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
                    className="size-9 rounded-full ring-2 ring-lime-200/25"
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
