import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { UserButton } from "@daveyplate/better-auth-ui";
import api from "@/configs/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = authClient.useSession();

  const getCredits = async () => {
    try {
      const { data } = await api.get('/api/user/credits');
      setCredits(data.credits);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || error.message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      console.log(error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      getCredits();
    }
  }, [session?.user]);

  // Nav links configuration
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/projects', label: 'My Projects' },
    { to: '/community', label: 'Community' },
    { to: '/pricing', label: 'Pricing' },
  ];

  // Check if link is active
  const isActive = (path: string) => location.pathname === path;


  return (
    <>
      {/* Background Gradient Glow On top of the navbar */}
      <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none h-[700px]">
        <svg
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1600px] h-[800px] opacity-60"
          viewBox="0 0 1600 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="800" cy="100" rx="700" ry="500" fill="url(#heroGradient)" />
          <defs>
            <radialGradient id="heroGradient" cx="0.5" cy="0.3" r="0.7" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>


      {/* Desktop Navbar - Rounded Pill Style */}
      <nav className="z-50 flex items-center justify-center w-full py-4 px-4">
        <div className="flex items-center justify-between w-full max-w-4xl border border-slate-700 rounded-full px-4 py-2.5 text-white backdrop-blur-md bg-black/20">
          {/* Logo */}
          <Link to='/'>
            <img src={assets.logo} alt="logo" className="h-5 sm:h-7" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full border transition-all duration-200 ${isActive(link.to)
                  ? 'border-white/10 bg-white/10 font-medium'
                  : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/10'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {!session?.user ? (
              <button
                className="px-5 py-1.5 text-sm bg-indigo-600 active:scale-95 hover:bg-indigo-700 transition rounded-full"
                onClick={() => navigate('/auth/signin')}
              >
                Get started
              </button>
            ) : (
                <>
                  <button className="bg-white/10 px-5 py-1.5 text-xs sm:text-sm border text-gray-200 active:scale-95 hover:bg-white/20 transition rounded-full">
                    Credits : 
                    <span className="text-indigo-300 pl-1">
                      {credits}
                    </span>
                  </button>
                <UserButton size='icon' />
                </>
            )

            }

            <button
              className="md:hidden active:scale-90 transition"
              onClick={() => setMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>


      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-100 bg-black/80 text-white backdrop-blur-sm flex flex-col items-center justify-center text-lg gap-8 md:hidden">
          {/* Mobile Nav Links */}
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`px-6 py-3 rounded-full transition ${isActive(link.to)
                ? 'border border-white/10 bg-white/10 font-medium'
                : 'hover:border hover:border-white/10 hover:bg-white/10'
                }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Close Button */}
          <button
            className="mt-4 bg-gray-800 hover:bg-black text-white p-2 rounded-md aspect-square font-medium active:scale-90 transition"
            onClick={() => setMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;