import BuildProcess from "@/sections/BuildProcess"
import CallToAction from "@/sections/CallToAction"
import FeaturesSection from "@/sections/FeaturesSection"
import HeroSection from "@/sections/HeroSection"
import OurTestimonials from "@/sections/OurTestimonials"
import PricingSection from "@/sections/PricingSection"
import TrustedBrand from "@/sections/TrustedBrand"
import Footer from "@/components/Footer"


const Home = () => {
    return (
        <div className="min-h-screen overflow-hidden bg-[#050706] text-white">
            <HeroSection />
            <TrustedBrand />
            <FeaturesSection />
            <BuildProcess />
            <PricingSection />
            <OurTestimonials />
            <CallToAction />
            <Footer />
        </div>
    )
}

export default Home
