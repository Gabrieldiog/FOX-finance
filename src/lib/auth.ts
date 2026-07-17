import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { db } from "@/db";
import { env } from "@/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import * as schema from "@/db/schema";

// Cadastro é só por convite: o e-mail precisa estar na allowlist (env).
const convidados = env.ALLOWED_EMAILS.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Verificação por e-mail (Resend) entra ao publicar; por ora o convite é o portão.
    requireEmailVerification: false,
    minPasswordLength: 8,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  rateLimit: { enabled: true, window: 10, max: 100 },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!convidados.includes(user.email.toLowerCase())) {
            throw new APIError("FORBIDDEN", { message: "Cadastro é só por convite." });
          }
          return { data: user };
        },
      },
    },
  },
});
