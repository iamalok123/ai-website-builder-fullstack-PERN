import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";


const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) || [];
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret);
const skipOAuthStateCookieCheck = process.env.SKIP_OAUTH_STATE_COOKIE_CHECK === "true";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: googleOAuthConfigured ? {
        google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            prompt: "select_account",
        },
    } : undefined,
    account: {
        skipStateCookieCheck: skipOAuthStateCookieCheck,
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
        updateAccountOnSignIn: true,
    },
    user : {
        deleteUser: {
            enabled: true,
        }
    },
    trustedOrigins,
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    advanced: {
        cookies: {
            session_token: {
                name: "auth_session",
                attributes: {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                    path: "/",
                }
            }
        }
    }
});
