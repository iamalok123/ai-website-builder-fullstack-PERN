export default function CallToAction() {
    return (
        <section className="flex flex-col items-center justify-center max-w-7xl mx-auto my-32 max-sm:my-22 px-4">
            {/* Subtitle */}
            <p className="text-amber-400 font-medium text-sm tracking-wide uppercase">
                Ready to Build?
            </p>

            {/* Heading */}
            <h3 className="text-3xl md:text-4xl font-semibold max-w-md text-center text-white mt-3">
                Your Website Is Just One Prompt Away
            </h3>

            {/* Description */}
            <p className="mt-4 text-sm/6 text-white/70 max-w-md text-center">
                Describe your idea in a sentence and our AI handles layout, content, and performance automatically in seconds.
            </p>

            {/* CTA Button */}
            <button
                onClick={() => scrollTo({ left: 0, top: 0, behavior: 'smooth' })}
                className="mt-8 flex items-center bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all duration-200 px-6 text-base py-3 font-medium rounded-full shadow-lg shadow-amber-500/25 active:scale-95"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#a)" fillRule="evenodd" clipRule="evenodd" fill="#fff">
                        <path d="M8 4a.8.8 0 0 1 .77.58l.866 3.036a4 4 0 0 0 1.018 1.73c.481.48 1.73 1.018 1.73 1.018l3.036.867a.8.8 0 0 1 0 1.538l-3.036.868a4 4 0 0 0-2.748 2.747L8.77 19.42a.8.8 0 0 1-1.538 0l-.867-3.036a4 4 0 0 0-2.748-2.747L.58 12.769a.8.8 0 0 1 0-1.538l3.036-.867a4 4 0 0 0 2.748-2.748L7.23 4.58A.8.8 0 0 1 8 4m8-4a.4.4 0 0 1 .385.29l.433 1.518a2 2 0 0 0 .51.865c.24.24.864.509.864.509l1.518.434a.4.4 0 0 1 0 .769l-1.518.433a2 2 0 0 0-1.374 1.374l-.433 1.518a.4.4 0 0 1-.77 0l-.433-1.518a2 2 0 0 0-1.374-1.374l-1.518-.433a.4.4 0 0 1 0-.77l1.518-.433a2 2 0 0 0 1.374-1.374L15.615.29A.4.4 0 0 1 16 0" />
                    </g>
                    <defs>
                        <clipPath id="a">
                            <path fill="#fff" d="M0 0h20v20H0z" />
                        </clipPath>
                    </defs>
                </svg>
                <span className="ml-2">Generate My Website</span>
            </button>

            {/* Hand Image */}
            <img
                src="/company_logos/hand.png"
                alt="Hand"
                width={200}
                height={200}
                className="w-40 mt-16 opacity-90"
            />
        </section>
    );
}