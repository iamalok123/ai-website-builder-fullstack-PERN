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
        <div className="bg-black min-h-screen">
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