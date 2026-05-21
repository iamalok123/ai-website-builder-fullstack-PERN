// Company logos displayed in the trusted brands section
const COMPANY_LOGOS = [
    'company_logos/company-logo-1.svg',
    'company_logos/company-logo-2.svg',
    'company_logos/company-logo-3.svg',
    'company_logos/company-logo-4.svg',
    'company_logos/company-logo-5.svg',
] as const;

export default function TrustedBrand() {
    return (
        <section className="px-4 pt-16 md:pt-20">
            <p className="text-center text-sm font-medium text-white/45">
                Built for creators shipping polished websites without a traditional design handoff
            </p>

            <div
                className="mx-auto mt-7 flex max-w-5xl flex-wrap items-center justify-center gap-8 rounded-[10px] border border-white/10 bg-white/[0.035] px-6 py-6 backdrop-blur-md md:gap-14"
                id="logo-container"
            >
                {COMPANY_LOGOS.map((logo, index) => (
                    <img
                        key={index}
                        src={logo}
                        alt={`Company logo ${index + 1}`}
                        className="h-7 w-auto opacity-45 grayscale invert transition duration-200 hover:opacity-80"
                    />
                ))}
            </div>
        </section>
    );
}
