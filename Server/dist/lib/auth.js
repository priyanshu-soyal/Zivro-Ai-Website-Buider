// dotenv
import "dotenv/config";
// betterAuth
import { betterAuth } from "better-auth";
// Prisma
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";
const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(",") || [];
// Detect HTTPS from BETTER_AUTH_URL instead of NODE_ENV
// This way cookies work correctly even with NODE_ENV=development on deployed HTTPS servers
const isHttps = process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false;
if (!process.env.BETTER_AUTH_URL) {
    throw new Error("BETTER_AUTH_URL environment variable is required");
}
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
}
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        deleteUser: { enabled: true },
    },
    trustedOrigins,
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    advanced: {
        cookies: {
            session_token: {
                name: "auth_session",
                attributes: {
                    httpOnly: true,
                    secure: isHttps,
                    sameSite: isHttps ? "none" : "lax",
                    path: "/",
                    domain: undefined,
                },
            },
        },
    },
});
