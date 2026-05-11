import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { authClient } from "@/lib/auth-client"
import { useNavigate, NavLink } from "react-router-dom"
import type { ComponentProps, ReactNode } from "react"

type AuthLinkProps = Omit<ComponentProps<typeof NavLink>, 'to'> & {
  href: string;
};

const AuthLink = ({ href, ...props }: AuthLinkProps) => (
  <NavLink {...props} to={href} />
);

const frontendBaseURL = (
  import.meta.env.VITE_APP_URL || window.location.origin
).replace(/\/$/, "");

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
      <AuthUIProvider
        authClient={authClient} 
        navigate={navigate}
        Link={AuthLink}
        baseURL={frontendBaseURL}
        redirectTo="/"
        social={{ providers: ["google"] }}
      >
          {children}
      </AuthUIProvider>
    )
}
