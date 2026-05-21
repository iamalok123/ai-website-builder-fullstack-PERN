import {
  ArrowRightIcon,
  BracesIcon,
  CheckCircle2Icon,
  Code2Icon,
  EyeIcon,
  Globe2Icon,
  Layers3Icon,
  Loader2Icon,
  RocketIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router-dom";
import api from "@/configs/axios";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

interface Prompt {
  label: string;
  prompt: string;
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
    prompt:
      "Create a modern portfolio website to showcase my skills, projects, experience, and personal brand professionally",
  },
  {
    label: "E-commerce Website",
    prompt:
      "Build a fast, secure e-commerce website with product listings, cart system, payments, and admin dashboard",
  },
  {
    label: "Blog",
    prompt:
      "Create a clean, SEO-optimized blog website for writing articles, managing content, and growing audience online",
  },
  {
    label: "Landing Page",
    prompt:
      "Design a high-conversion landing page with strong hero section, CTA buttons, and lead capture form",
  },
  {
    label: "Resume Website",
    prompt:
      "Generate a professional resume website with skills, experience, education, projects, and downloadable CV section",
  },
  {
    label: "Personal Website",
    prompt:
      "Create a personal branding website with about section, social links, blogs, and contact form",
  },
  {
    label: "Business Website",
    prompt:
      "Build a professional business website with services, testimonials, pricing section, and customer inquiry form",
  },
  {
    label: "Marketing Website",
    prompt:
      "Create a marketing-focused website optimized for conversions, analytics tracking, funnels, and campaign integrations",
  },
  {
    label: "Educational Website",
    prompt:
      "Build an educational website with courses, student dashboard, lesson pages, progress tracking, and quizzes",
  },
];

export default function HeroSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!session?.user) {
        return toast.error("You must be logged in to create a website");
      } else if (!input.trim()) {
        return toast.error("Please enter a message");
      }
      setLoading(true);
      const { data } = await api.post("/api/user/project", {
        initial_prompt: input,
      });
      setLoading(false);
      if (!data.projectId) {
        toast.error("Failed to get project ID");
        return;
      }
      toast.success("Project created! Generating your website...");
      navigate(`/projects/${data.projectId}`);
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (input) return;

    const currentWord = placeholders[textIndex];
    const delay = !deleting && charIndex === currentWord.length ? 2000 : 50;

    const timeout = window.setTimeout(() => {
      if (!deleting && charIndex === currentWord.length) {
        setDeleting(true);
        return;
      }

      if (deleting && charIndex === 0) {
        setDeleting(false);
        setTextIndex((prev) => (prev + 1) % placeholders.length);
        return;
      }

      setCharIndex((prev) => prev + (deleting ? -1 : 1));
    }, delay);

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, input, textIndex]);

  const animatedPlaceholder = placeholders[textIndex].substring(0, charIndex);

  const heroSignals = [
    { label: "Prompt", value: "Idea captured", icon: WandSparklesIcon },
    { label: "Layout", value: "Sections planned", icon: Layers3Icon },
    { label: "Code", value: "Responsive build", icon: Code2Icon },
    { label: "Launch", value: "Preview ready", icon: Globe2Icon },
  ];

  const workspaceCards = [
    {
      title: "Preview",
      description: "Inspect the website before exporting.",
      icon: EyeIcon,
    },
    {
      title: "Clean code",
      description: "Generated HTML and styling stay editable.",
      icon: BracesIcon,
    },
    {
      title: "Publish flow",
      description: "Save, download, and launch after generation.",
      icon: RocketIcon,
    },
  ];

  return (
    <section id="home" className="relative isolate px-3 pt-6 sm:px-4 md:pt-10">
      <div className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-190 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-140 w-[min(1100px,95vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(199,242,132,0.24),rgba(20,184,166,0.16)_36%,rgba(5,7,6,0)_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(circle_at_center,black,transparent_68%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl flex-col items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[#070a08]/90 px-3 py-12 shadow-2xl shadow-black/40 sm:rounded-[28px] sm:px-4 md:px-8 md:py-16 lg:px-12">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
          viewBox="0 0 1200 720"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 230H210C260 230 264 160 330 160H510"
            stroke="url(#heroLineA)"
            strokeWidth="1"
          />
          <path
            d="M1200 235H990C930 235 920 170 850 170H670"
            stroke="url(#heroLineB)"
            strokeWidth="1"
          />
          <path
            d="M0 520H250C305 520 312 452 376 452H520"
            stroke="url(#heroLineA)"
            strokeWidth="1"
          />
          <path
            d="M1200 520H982C928 520 916 452 850 452H680"
            stroke="url(#heroLineB)"
            strokeWidth="1"
          />
          <path
            d="M560 130V645"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <path
            d="M610 180V645"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <path
            d="M650 120V645"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="heroLineA" x1="0" x2="520" y1="0" y2="0">
              <stop stopColor="white" stopOpacity="0" />
              <stop offset="0.6" stopColor="#D9F99D" stopOpacity="0.32" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="heroLineB" x1="1200" x2="670" y1="0" y2="0">
              <stop stopColor="white" stopOpacity="0" />
              <stop offset="0.55" stopColor="#5EEAD4" stopOpacity="0.3" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className="pointer-events-none absolute right-0 top-0 h-80 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(217,249,157,0.32),transparent_58%)] blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-1/2 bg-[radial-gradient(circle_at_20%_80%,rgba(94,234,212,0.2),transparent_58%)] blur-2xl" />

        <div className="relative z-10 flex w-full flex-col items-center">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-center text-xs font-medium text-lime-100 shadow-lg shadow-black/20 backdrop-blur-md">
            <SparklesIcon className="size-3.5 text-lime-300" />
            <span className="truncate sm:whitespace-normal">
              AI website studio for founders, freelancers, and teams
            </span>
            <ArrowRightIcon className="size-3.5" />
          </div>

          <h1 className="mx-auto mt-7 max-w-5xl text-center text-4xl font-semibold leading-[1.04] tracking-normal text-white sm:text-5xl md:text-7xl lg:text-[86px]">
            From one prompt to a
            <span className="block bg-linear-to-r from-lime-200 via-white to-teal-200 bg-clip-text text-transparent">
              launch-ready website
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-center text-sm leading-6 text-white/68 sm:text-base md:text-lg md:leading-7">
            Describe the business, offer, audience, and style. Zephyr turns it
            into responsive pages, structured content, editable code, preview,
            download, and publish controls.
          </p>

          <div className="mt-7 grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
            {heroSignals.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/10 bg-white/5.5 p-3 text-left backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-lime-200/25 hover:bg-white/7.5 sm:p-4"
              >
                <item.icon className="size-4 text-lime-300" />
                <p className="mt-3 text-xs uppercase tracking-wide text-white/40">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <form
            onSubmit={onSubmitHandler}
            className="mt-8 w-full max-w-5xl rounded-[10px] border border-white/15 bg-black/35 shadow-[0_0_48px_rgba(217,249,157,0.12),0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl transition focus-within:border-lime-300/60 focus-within:shadow-[0_0_70px_rgba(217,249,157,0.2),0_18px_70px_rgba(0,0,0,0.35)] focus-within:ring-2 focus-within:ring-lime-300/20"
          >
            <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-lime-300" />
                Start with plain language
              </span>
              <span className="hidden sm:inline">Generation workspace</span>
            </div>
            <textarea
              className="min-h-36 w-full resize-none bg-transparent p-4 text-base leading-7 text-white outline-none placeholder:text-white/42 wrap-break-word sm:p-5"
              placeholder={`Create a ${animatedPlaceholder}`}
              rows={3}
              minLength={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  input.trim() &&
                  !loading
                ) {
                  e.preventDefault();
                  onSubmitHandler(e as unknown as React.FormEvent);
                }
              }}
              required
            />

            <div className="flex flex-col gap-3 p-4 pt-0 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pt-0">
              <p className="text-xs leading-5 text-white/45">
                Try a template prompt below or write your own.
              </p>
              <button
                className={`inline-flex h-11 w-full items-center justify-center rounded-lg bg-lime-300 px-5 font-semibold text-[#08100b] shadow-lg shadow-lime-300/20 transition hover:bg-lime-200 active:scale-[0.98] sm:w-auto ${loading ? "cursor-not-allowed opacity-80" : ""}`}
              >
                {loading ? (
                  <Loader2Icon className="size-5 animate-spin" />
                ) : (
                  <>
                    <SparklesIcon className="size-4" />
                    <span className="ml-2">Create website</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <Marquee
            gradient={false}
            speed={30}
            pauseOnHover
            className="mt-6 w-full max-w-5xl px-2"
          >
            {prompts.map((item) => {
              const isSelected = selected === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setInput(item.prompt);
                    setSelected(item.label);
                  }}
                  className={`mx-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200
                                        ${
                                          isSelected
                                            ? "border-lime-300/60 bg-lime-300/15 text-lime-100 backdrop-blur-sm"
                                            : "border-white/12 bg-white/5.5 text-white/75 hover:border-white/25 hover:bg-white/10 hover:text-white"
                                        }
                                    `}
                >
                  {item.label}
                </button>
              );
            })}
          </Marquee>

          <div className="mt-9 grid w-full max-w-5xl grid-cols-1 gap-3 md:grid-cols-3">
            {workspaceCards.map((item) => (
              <div
                key={item.title}
                className="group rounded-lg border border-white/10 bg-white/4.5 p-4 text-left shadow-xl shadow-black/20 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-lime-200/25 hover:bg-white/7.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-lime-200/20 bg-lime-200/10">
                    <item.icon className="size-4 text-lime-200" />
                  </div>
                  <div className="h-px flex-1 bg-linear-to-r from-lime-200/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
