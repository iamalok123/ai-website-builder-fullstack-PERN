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

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
      <AuthUIProvider
        authClient={authClient} 
        navigate={navigate}
        Link={AuthLink}
      >
          {children}
      </AuthUIProvider>
    )
}
