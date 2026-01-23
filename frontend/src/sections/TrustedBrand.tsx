// Company logos displayed in the trusted brands section
const COMPANY_LOGOS = [
    'company_logos/company-logo-1.svg',
    'company_logos/company-logo-2.svg',
    'company_logos/company-logo-3.svg',
    'company_logos/company-logo-4.svg',
    'company_logos/company-logo-5.svg',
] as const;

// Golden tint filter matching the navbar logo style
const goldenFilter = 'brightness(0.8) sepia(1) saturate(3) hue-rotate(15deg)';

export default function TrustedBrand() {
    return (
        <section className="mt-32 max-sm:mt-22 px-4">
            <p className="py-6 text-center text-white/80 text-base font-medium">
                Trusted by world's leading brands —
            </p>

            <div
                className="flex flex-wrap justify-center items-center gap-12 md:gap-16 max-w-4xl mx-auto py-4"
                id="logo-container"
            >
                {COMPANY_LOGOS.map((logo, index) => (
                    <img
                        key={index}
                        src={logo}
                        alt={`Company logo ${index + 1}`}
                        className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity duration-200"
                        style={{ filter: goldenFilter }}
                    />
                ))}
            </div>
        </section>
    );
}