import { Loader2Icon, SparklesIcon } from "lucide-react";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router-dom";
import api from "@/configs/axios";
import { toast } from "sonner";

interface Prompt {
    label: string;
    prompt: string;
}

export default function HeroSection() {
    const [selected, setSelected] = useState<string | null>(null);
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const { data: session } = authClient.useSession();
    const navigate = useNavigate();



    const onSubmitHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(input);

        try {
            if (!session?.user) {
                return toast.error('You must be logged in to create a website');
            } else if (!input.trim()) {
                return toast.error('Please enter a message');
            }
            setLoading(true);
            const { data } = await api.post('/api/user/project', { initial_prompt: input });
            setLoading(false);
            if (!data.projectId) {
                toast.error('Failed to get project ID');
                return;
            }
            toast.success('Project created! Generating your website...');
            navigate(`/projects/${data.projectId}`);
        } catch (error: any) {
            console.log(error);
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
    }
    const placeholders = [
        "portfolio website...",
        "e-commerce store...",
        "business landing page...",
        "personal blog...",
        "startup website...",
    ];


    const prompts: Prompt[] = [
        {
            label: "Portfolio Website",
            prompt: "Create a modern portfolio website to showcase my skills, projects, experience, and personal brand professionally",
        },
        {
            label: "E-commerce Website",
            prompt: "Build a fast, secure e-commerce website with product listings, cart system, payments, and admin dashboard",
        },
        {
            label: "Blog",
            prompt: "Create a clean, SEO-optimized blog website for writing articles, managing content, and growing audience online",
        },
        {
            label: "Landing Page",
            prompt: "Design a high-conversion landing page with strong hero section, CTA buttons, and lead capture form",
        },
        {
            label: "Resume Website",
            prompt: "Generate a professional resume website with skills, experience, education, projects, and downloadable CV section",
        },
        {
            label: "Personal Website",
            prompt: "Create a personal branding website with about section, social links, blogs, and contact form",
        },
        {
            label: "Business Website",
            prompt: "Build a professional business website with services, testimonials, pricing section, and customer inquiry form",
        },
        {
            label: "Marketing Website",
            prompt: "Create a marketing-focused website optimized for conversions, analytics tracking, funnels, and campaign integrations",
        },
        {
            label: "Educational Website",
            prompt: "Build an educational website with courses, student dashboard, lesson pages, progress tracking, and quizzes",
        },
    ];


    useEffect(() => {
        if (input) return;

        const currentWord = placeholders[textIndex];

        if (!deleting && charIndex === currentWord.length) {
            setTimeout(() => setDeleting(true), 2000);
            return;
        }

        if (deleting && charIndex === 0) {
            setDeleting(false);
            setTextIndex((prev) => (prev + 1) % placeholders.length);
            return;
        }

        const timeout = setTimeout(() => {
            setCharIndex((prev) => prev + (deleting ? -1 : 1));
        }, 50);

        return () => clearTimeout(timeout);
    }, [charIndex, deleting, textIndex, prompt]);

    const animatedPlaceholder = placeholders[textIndex].substring(0, charIndex);

    return (
        <section id="home" className="flex flex-col items-center justify-center">
            <div className="absolute top-25 -z-1 left-1/4 size-72 bg-purple-600 blur-[300px]"></div>
            <div className="flex items-center mt-16 max-sm:mt-22">
                <div className="flex -space-x-2 pr-3">
                    <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200" alt="image" className="size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-1" />
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200" alt="image" className="size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-2" />
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop" alt="image" className="size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-3" />
                    <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="image" className="size-7 rounded-full border-2 border-white hover:-translate-y-0.5 transition z-4" />
                </div>
                <div>
                    <svg width="79" height="16" viewBox="0 0 79 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.06923 1.47645C7.21819 1.0143 7.87205 1.0143 8.02101 1.47645L9.12739 4.90897C9.19397 5.11555 9.38623 5.25558 9.60328 5.25558H13.1921C13.6755 5.25558 13.8775 5.87334 13.4875 6.15896L10.5772 8.29045C10.4034 8.41777 10.3307 8.64213 10.3968 8.84722L11.5068 12.291C11.6555 12.7523 11.1265 13.1342 10.7354 12.8477L7.84056 10.7275C7.66466 10.5987 7.42558 10.5987 7.24968 10.7275L4.3548 12.8477C3.96374 13.1342 3.43477 12.7523 3.58348 12.291L4.69347 8.84722C4.75958 8.64213 4.68686 8.41777 4.51302 8.29045L1.60274 6.15896C1.21276 5.87334 1.41479 5.25558 1.89818 5.25558H5.48696C5.70401 5.25558 5.89627 5.11555 5.96285 4.90897L7.06923 1.47645Z" fill="#9810FA" />
                        <path d="M23.0536 1.47645C23.2026 1.0143 23.8564 1.0143 24.0054 1.47645L25.1118 4.90897C25.1783 5.11555 25.3706 5.25558 25.5877 5.25558H29.1764C29.6598 5.25558 29.8619 5.87334 29.4719 6.15896L26.5616 8.29045C26.3878 8.41777 26.315 8.64213 26.3811 8.84722L27.4911 12.291C27.6398 12.7523 27.1109 13.1342 26.7198 12.8477L23.8249 10.7275C23.649 10.5987 23.41 10.5987 23.2341 10.7275L20.3392 12.8477C19.9481 13.1342 19.4191 12.7523 19.5679 12.291L20.6778 8.84722C20.744 8.64213 20.6712 8.41777 20.4974 8.29045L17.5871 6.15896C17.1971 5.87334 17.3992 5.25558 17.8826 5.25558H21.4713C21.6884 5.25558 21.8806 5.11555 21.9472 4.90897L23.0536 1.47645Z" fill="#9810FA" />
                        <path d="M39.0224 1.47645C39.1713 1.0143 39.8252 1.0143 39.9741 1.47645L41.0805 4.90897C41.1471 5.11555 41.3394 5.25558 41.5564 5.25558H45.1452C45.6286 5.25558 45.8306 5.87334 45.4406 6.15896L42.5303 8.29045C42.3565 8.41777 42.2838 8.64213 42.3499 8.84722L43.4599 12.291C43.6086 12.7523 43.0796 13.1342 42.6886 12.8477L39.7937 10.7275C39.6178 10.5987 39.3787 10.5987 39.2028 10.7275L36.3079 12.8477C35.9169 13.1342 35.3879 12.7523 35.5366 12.291L36.6466 8.84722C36.7127 8.64213 36.64 8.41777 36.4661 8.29045L33.5559 6.15896C33.1659 5.87334 33.3679 5.25558 33.8513 5.25558H37.4401C37.6571 5.25558 37.8494 5.11555 37.916 4.90897L39.0224 1.47645Z" fill="#9810FA" />
                        <path d="M55.0067 1.47645C55.1557 1.0143 55.8096 1.0143 55.9585 1.47645L57.0649 4.90897C57.1315 5.11555 57.3237 5.25558 57.5408 5.25558H61.1296C61.613 5.25558 61.815 5.87334 61.425 6.15896L58.5147 8.29045C58.3409 8.41777 58.2682 8.64213 58.3343 8.84722L59.4443 12.291C59.593 12.7523 59.064 13.1342 58.6729 12.8477L55.7781 10.7275C55.6022 10.5987 55.3631 10.5987 55.1872 10.7275L52.2923 12.8477C51.9012 13.1342 51.3723 12.7523 51.521 12.291L52.631 8.84722C52.6971 8.64213 52.6244 8.41777 52.4505 8.29045L49.5402 6.15896C49.1503 5.87334 49.3523 5.25558 49.8357 5.25558H53.4245C53.6415 5.25558 53.8338 5.11555 53.9004 4.90897L55.0067 1.47645Z" fill="#9810FA" />
                        <path d="M70.9794 1.47645C71.1283 1.0143 71.7822 1.0143 71.9312 1.47645L73.0375 4.90897C73.1041 5.11555 73.2964 5.25558 73.5134 5.25558H77.1022C77.5856 5.25558 77.7876 5.87334 77.3977 6.15896L74.4874 8.29045C74.3135 8.41777 74.2408 8.64213 74.3069 8.84722L75.4169 12.291C75.5656 12.7523 75.0367 13.1342 74.6456 12.8477L71.7507 10.7275C71.5748 10.5987 71.3357 10.5987 71.1598 10.7275L68.265 12.8477C67.8739 13.1342 67.3449 12.7523 67.4936 12.291L68.6036 8.84722C68.6697 8.64213 68.597 8.41777 68.4232 8.29045L65.5129 6.15896C65.1229 5.87334 65.3249 5.25558 65.8083 5.25558H69.3971C69.6142 5.25558 69.8064 5.11555 69.873 4.90897L70.9794 1.47645Z" fill="#9810FA" />
                    </svg>
                    <p className="text-sm text-gray-300">Trusted by <span className="font-medium text-white">1000+</span> users</p>
                </div>
            </div>

            <h1 className="text-center text-5xl/17 md:text-[64px]/20 font-semibold max-w-2xl m-1 max-sm:mt-8 text-white">
                Build custom apps with AI
            </h1>

            <p className="text-center text-base text-white max-w-md mt-2">
                "No code. No design skills. Just describe your idea and launch instantly."
            </p>

            <form
                onSubmit={onSubmitHandler}
                className="focus-within:ring-2 focus-within:ring-amber-400/50 border border-white/60 bg-white/5 backdrop-blur-md rounded-xl max-w-3xl max-sm:max-w-auto w-full mt-8 shadow-lg mx-3">
                <textarea
                    className="w-full max-sm:w-auto resize-none p-4 outline-none text-white placeholder:text-white/60 bg-transparent"
                    placeholder={`Create a ${animatedPlaceholder}`}
                    rows={3}
                    minLength={10}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && input.trim() && !loading) {
                            e.preventDefault();
                            onSubmitHandler(e as unknown as React.FormEvent);
                        }
                    }}
                    required
                />

                <div className="flex items-center justify-end p-4 pt-0">
                    <button className={`flex items-center bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition px-4 h-9 rounded-lg font-medium ${loading ? "cursor-not-allowed opacity-80" : ""}`}>
                        {loading ? (
                            <Loader2Icon className="size-5 animate-spin" />
                        ) : (
                            <>
                                <SparklesIcon className="size-4" />
                                <span className="ml-2">Create</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <Marquee gradient={false} speed={30} pauseOnHover className="max-w-2xl w-full mt-6 px-2">
                {prompts.map((item) => {
                    const isSelected = selected === item.label;

                    return (
                        <button key={item.label}
                            onClick={() => {
                                setInput(item.prompt);
                                setSelected(item.label);
                            }}
                            className={`px-4 py-1.5 mx-2 border rounded-full text-sm font-medium transition-all duration-200
                                ${isSelected
                                    ? "border-amber-400/50 bg-amber-400/20 text-white backdrop-blur-sm"
                                    : "text-white/90 bg-white/5 border-white/15 hover:bg-white/15 hover:border-white/30 hover:text-white"
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </Marquee>
        </section>
    );
}