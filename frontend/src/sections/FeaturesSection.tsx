import {
  ChartSplineIcon,
  Code2Icon,
  DownloadIcon,
  LayoutPanelTopIcon,
  NotebookPenIcon,
  Repeat2Icon,
} from "lucide-react";

interface Feature {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  phase: string;
  title: string;
  description: string;
}

// Feature data
const FEATURES: Feature[] = [
  {
    icon: LayoutPanelTopIcon,
    phase: "01",
    title: "Structured page planning",
    description:
      "Turns your request into a proper landing page flow with hero, proof, features, pricing, and CTA sections.",
  },
  {
    icon: NotebookPenIcon,
    phase: "02",
    title: "Conversion-ready content",
    description:
      "Writes clearer headlines, section copy, and calls-to-action around the goal of the website.",
  },
  {
    icon: ChartSplineIcon,
    phase: "03",
    title: "Responsive by default",
    description:
      "Keeps generated layouts usable across desktop and mobile, with clean spacing and readable hierarchy.",
  },
  {
    icon: Code2Icon,
    phase: "04",
    title: "Editable code output",
    description:
      "Produces frontend code you can preview, save, revise, download, and continue improving.",
  },
  {
    icon: Repeat2Icon,
    phase: "05",
    title: "Prompt-based revisions",
    description:
      "After the first website is created, ask for changes without starting the entire project again.",
  },
  {
    icon: DownloadIcon,
    phase: "06",
    title: "Export and publish flow",
    description:
      "Use the same workspace to preview, save, download, and publish when the generation is complete.",
  },
];

const FLOW_STEPS = [
  {
    label: "Prompt",
    detail: "Your idea, offer, audience, and preferred style.",
  },
  {
    label: "Generate",
    detail: "AI plans sections, writes copy, and builds the page.",
  },
  {
    label: "Ship",
    detail: "Preview, revise, save, download, and publish.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="px-4 pt-28 md:pt-32">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-white/10 bg-[#07110f] shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(217,249,157,0.16),transparent_30%),radial-gradient(circle_at_88%_6%,rgba(45,212,191,0.14),transparent_28%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[auto,auto,64px_64px,64px_64px]" />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-80 w-full opacity-55 lg:block"
          viewBox="0 0 1200 320"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M78 214C214 112 312 290 452 174C574 72 654 98 766 172C908 266 1000 90 1124 154"
            stroke="url(#featureFlowLine)"
            strokeWidth="1.4"
          />
          <path
            d="M116 250C270 160 350 316 506 220C650 130 714 138 846 210C980 284 1034 164 1136 198"
            stroke="url(#featureFlowLineSoft)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="featureFlowLine" x1="78" x2="1124" y1="214" y2="154">
              <stop stopColor="#D9F99D" stopOpacity="0" />
              <stop offset="0.18" stopColor="#D9F99D" stopOpacity="0.48" />
              <stop offset="0.55" stopColor="#5EEAD4" stopOpacity="0.42" />
              <stop offset="1" stopColor="#D9F99D" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="featureFlowLineSoft" x1="116" x2="1136" y1="250" y2="198">
              <stop stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.18" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10 grid gap-10 px-6 py-14 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-14 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lime-200/80">
              Website generation flow
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-5xl">
              A guided path from rough idea to ready-to-share website.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/62 md:text-base">
              Zephyr is designed like a production workflow, not a random output
              machine. Each step keeps the website structured, editable, and
              ready for the next action.
            </p>
            <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-white/4.5">
              <div className="border-r border-white/10 p-4">
                <p className="text-2xl font-semibold text-lime-200">01</p>
                <p className="mt-1 text-xs text-white/48">Prompt</p>
              </div>
              <div className="border-r border-white/10 p-4">
                <p className="text-2xl font-semibold text-teal-200">06</p>
                <p className="mt-1 text-xs text-white/48">Core stages</p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-semibold text-white">∞</p>
                <p className="mt-1 text-xs text-white/48">Revisions</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-8 hidden h-[calc(100%-4rem)] w-px bg-linear-to-b from-lime-200/0 via-lime-200/30 to-teal-200/0 md:block" />
            <div className="space-y-4">
              {FLOW_STEPS.map((step, index) => (
                <div
                  key={step.label}
                  className="relative rounded-lg border border-white/10 bg-black/24 p-5 shadow-xl shadow-black/20 backdrop-blur-md"
                >
                  <div className="flex gap-4">
                    <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg border border-lime-200/25 bg-lime-200/10 text-sm font-semibold text-lime-100">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{step.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/58">{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 border-t border-white/10 bg-black/10 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item, index) => (
            <div
              key={index}
              className="group relative min-h-64 overflow-hidden border-b border-white/10 p-6 transition duration-300 hover:bg-white/4.5 md:border-r lg:p-8 nth-[3n]:lg:border-r-0"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-lime-200/0 to-transparent transition duration-300 group-hover:via-lime-200/45" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg border border-lime-200/20 bg-lime-200/10 transition duration-300 group-hover:border-lime-200/35 group-hover:bg-lime-200/15">
                  <item.icon className="size-5 text-lime-200" />
                </div>
                <span className="rounded-full border border-white/10 bg-white/4.5 px-2.5 py-1 text-xs font-medium text-white/42">
                  {item.phase}
                </span>
              </div>
              <h3 className="mt-8 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/58">
                {item.description}
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-px w-12 bg-linear-to-r from-lime-200/80 to-transparent transition-all duration-300 group-hover:w-24" />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/32 transition duration-300 group-hover:text-lime-100/70">
                  Connected
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
