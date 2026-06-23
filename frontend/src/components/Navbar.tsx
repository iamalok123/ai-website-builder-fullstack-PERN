import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { UserButton } from "@daveyplate/better-auth-ui";
import api from "@/configs/axios";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    let isMounted = true;

    if (session?.user) {
      api.get('/api/user/credits')
        .then(({ data }) => {
          if (isMounted) {
            setCredits(data.credits);
          }
        })
        .catch((error) => {
          toast.error(getErrorMessage(error));
          console.log(error);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [session?.user, location.pathname]);

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
      {/* Desktop Navbar - Rounded Pill Style */}
      <nav className="z-50 flex w-full items-center justify-center px-3 py-4 sm:px-4">
        <div className="flex w-full max-w-4xl items-center justify-between rounded-full border border-white/10 bg-[#070a08]/75 px-4 py-2.5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl md:max-w-6xl">
          {/* Logo */}
          <Link to='/'>
            <img src="/logo.svg" alt="Logo" width={68} height={26} className="h-7 w-auto" style={{ filter: 'brightness(1.55) sepia(0.75) saturate(1.7) hue-rotate(58deg)' }} />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full border transition-all duration-200 ${isActive(link.to)
                  ? 'border-lime-200/35 bg-lime-200/10 font-medium text-lime-50 shadow-inner shadow-lime-200/5'
                  : 'border-transparent bg-transparent text-white/76 hover:border-white/12 hover:bg-white/[0.07] hover:text-white'
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
                className="rounded-full bg-lime-300 px-5 py-1.5 text-sm font-semibold text-[#08100b] shadow-lg shadow-lime-300/15 transition hover:bg-lime-200 active:scale-95"
                onClick={() => navigate('/auth/sign-in')}
              >
                Get started
              </button>
            ) : (
              <>
                <button className="rounded-full border border-white/10 bg-white/5.5 px-4 py-1.5 text-xs text-white/80 transition hover:border-lime-200/25 hover:bg-white/8.5 active:scale-95 sm:px-5 sm:text-sm">
                  Credits :
                  <span className="pl-1 font-semibold text-lime-200">
                    {credits}
                  </span>
                </button>
                <UserButton size='icon' />
              </>
            )

            }

            <button
              className="rounded-full border border-white/10 bg-white/5.5 p-2 text-white transition active:scale-90 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
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
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-8 bg-[#050706]/92 text-lg text-white backdrop-blur-xl md:hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(217,249,157,0.14),transparent_38%)]" />
          {/* Mobile Nav Links */}
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`relative px-6 py-3 rounded-full transition ${isActive(link.to)
                ? 'border border-lime-200/25 bg-lime-200/10 font-medium text-lime-50'
                : 'border border-transparent text-white/76 hover:border-white/10 hover:bg-white/[0.07] hover:text-white'
                }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Close Button */}
          <button
            className="relative mt-4 aspect-square rounded-lg border border-white/10 bg-white/5.5 p-2 font-medium text-white transition hover:border-lime-200/25 hover:bg-white/8.5 active:scale-90"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
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
