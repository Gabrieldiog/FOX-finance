import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import * as schema from "@/db/schema";

// Cadastro aberto: qualquer pessoa cria a própria conta, que é salva no banco.
// Cada conta é isolada das outras (ver a camada de dados escopada por user_id),
// então o dado de uma pessoa nunca alcança o da outra.
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  rateLimit: { enabled: true, window: 10, max: 100 },
});
