import { Link } from "react-router-dom";


const Footer = () => {
  return (
    <footer className="relative overflow-hidden px-6 md:px-16 lg:px-24 xl:px-32 w-full text-sm text-white bg-linear-to-b from-gray-900 to-black pt-10">
      <img
        src="logo.svg"
        alt="Logo"
        width={400}
        height={400}
        className="hidden md:block absolute -bottom-30 -left-80 opacity-10 w-full h-full pointer-events-none"
        style={{ filter: 'brightness(1.2) sepia(1) saturate(3) hue-rotate(15deg)' }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/">
            <img
              src="logo.svg"
              alt="Zephyr Logo"
              width={68}
              height={26}
              className="h-7 w-auto"
              style={{ filter: 'brightness(1.2) sepia(1) saturate(3) hue-rotate(15deg)' }}
            />
          </Link>
          <p className="text-sm/7 mt-6 text-white">Zephyr is a cutting-edge AI-powered website builder that transforms simple text descriptions into beautiful, fully functional websites in seconds.</p>
        </div>
        <div className="flex flex-col lg:items-center lg:justify-center">
          <div className="flex flex-col text-sm space-y-2.5">
            <h2 className="font-semibold mb-5 text-amber-400">Product</h2>
            <Link to="/" className="hover:text-amber-400 transition text-white">AI Generator</Link>
            <Link to="/pricing" className="hover:text-amber-400 transition text-white">Pricing</Link>
            <Link to="/community" className="hover:text-amber-400 transition text-white">Community</Link>
            <a className="hover:text-amber-400 transition text-white" href="https://github.com/iamalok123" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-amber-400 mb-5">Subscribe to our newsletter</h2>
          <div className="text-sm space-y-6 max-w-sm">
            <p className="text-white">Get the latest updates on new features, AI improvements, and tips for building better websites.</p>
            <div className="flex items-center">
              <input className="rounded-l-md bg-white/10 border border-white/20 outline-none w-full max-w-64 h-11 px-3 text-white placeholder:text-white/60" type="email" placeholder="Enter your email" />
              <button className="bg-linear-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition px-4 h-11 text-white rounded-r-md font-medium">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t mt-6 border-white/20">
        <p className="text-center text-white">
          © 2025 <a href="https://github.com/iamalok123" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">Zephyr</a> by Alok Kumar. All Rights Reserved.
        </p>
        <div className="flex items-center gap-4 text-white">
          <Link to="/" className="hover:text-amber-400 transition">
            Privacy Policy
          </Link>
          <Link to="/" className="hover:text-amber-400 transition">
            Terms of Service
          </Link>
          <a href="https://github.com/iamalok123/ai-website-builder-fullstack-PERN" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer