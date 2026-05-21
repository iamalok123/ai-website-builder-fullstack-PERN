export default function CallToAction() {
    return (
        <section className="px-4 py-28 md:py-32">
            <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[24px] border border-white/10 bg-[#0b2926] px-6 py-14 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,249,157,0.18),transparent_32%),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[auto,60px_60px,60px_60px]" />
                <div className="relative z-10">
                    {/* Subtitle */}
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lime-200/80">
                        Ready to build?
                    </p>

                    {/* Heading */}
                    <h3 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-white md:text-5xl">
                        Start with the idea. Keep moving until the website is ready.
                    </h3>

                    {/* Description */}
                    <p className="mt-4 max-w-md text-sm leading-6 text-white/62">
                        Draft the first version, refine the details, and move toward a shareable website from the same workspace.
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={() => scrollTo({ left: 0, top: 0, behavior: 'smooth' })}
                        className="mt-8 inline-flex items-center rounded-lg bg-lime-300 px-6 py-3 text-base font-semibold text-[#08100b] shadow-lg shadow-lime-300/20 transition-all duration-200 hover:bg-lime-200 active:scale-95"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#a)" fillRule="evenodd" clipRule="evenodd" fill="currentColor">
                                <path d="M8 4a.8.8 0 0 1 .77.58l.866 3.036a4 4 0 0 0 1.018 1.73c.481.48 1.73 1.018 1.73 1.018l3.036.867a.8.8 0 0 1 0 1.538l-3.036.868a4 4 0 0 0-2.748 2.747L8.77 19.42a.8.8 0 0 1-1.538 0l-.867-3.036a4 4 0 0 0-2.748-2.747L.58 12.769a.8.8 0 0 1 0-1.538l3.036-.867a4 4 0 0 0 2.748-2.748L7.23 4.58A.8.8 0 0 1 8 4m8-4a.4.4 0 0 1 .385.29l.433 1.518a2 2 0 0 0 .51.865c.24.24.864.509.864.509l1.518.434a.4.4 0 0 1 0 .769l-1.518.433a2 2 0 0 0-1.374 1.374l-.433 1.518a.4.4 0 0 1-.77 0l-.433-1.518a2 2 0 0 0-1.374-1.374l-1.518-.433a.4.4 0 0 1 0-.77l1.518-.433a2 2 0 0 0 1.374-1.374L15.615.29A.4.4 0 0 1 16 0" />
                            </g>
                            <defs>
                                <clipPath id="a">
                                    <path fill="#fff" d="M0 0h20v20H0z" />
                                </clipPath>
                            </defs>
                        </svg>
                        <span className="ml-2">Generate my website</span>
                    </button>
                </div>

                <div className="relative z-10 mt-12 lg:mt-0">
                    <div className="rounded-lg border border-white/12 bg-black/25 p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                            <span className="size-2.5 rounded-full bg-red-300" />
                            <span className="size-2.5 rounded-full bg-yellow-300" />
                            <span className="size-2.5 rounded-full bg-lime-300" />
                            <span className="ml-3 text-xs text-white/45">project-preview.html</span>
                        </div>
                        <div className="grid gap-3 pt-4">
                            <div className="h-24 rounded-lg bg-linear-to-br from-lime-200/22 via-white/10 to-teal-300/[0.14]" />
                            <div className="grid grid-cols-3 gap-3">
                                <div className="h-18 rounded-lg bg-white/8" />
                                <div className="h-18 rounded-lg bg-white/12" />
                                <div className="h-18 rounded-lg bg-white/8" />
                            </div>
                            <div className="h-3 w-4/5 rounded-full bg-white/18" />
                            <div className="h-3 w-3/5 rounded-full bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
