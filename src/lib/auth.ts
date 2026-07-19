import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/db";
import { env } from "@/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import { senhaFraca } from "@/lib/senha-fraca";
import { bloqueadoAte, limparErrosDeSenha, normalizarEmail, registrarErroDeSenha } from "@/lib/protecao-login";
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
  // Cache de sessão no cookie (assinado com o BETTER_AUTH_SECRET): a maioria das
  // navegações lê a sessão do próprio cookie em vez de bater no banco a cada
  // getSession. Corta uma ida ao banco por página — o que pesa muito quando o
  // banco está longe. O sign-out limpa o cookie; uma mudança de dado da conta
  // leva no máximo o maxAge pra refletir.
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const body = (ctx.body ?? {}) as Record<string, unknown>;

      // Senha fácil não entra: nem no cadastro, nem numa troca de senha.
      if (ctx.path === "/sign-up/email" || ctx.path === "/change-password") {
        const senha = String(body.password ?? body.newPassword ?? "");
        const email = typeof body.email === "string" ? body.email : undefined;
        const motivo = senhaFraca(senha, email);
        if (motivo) throw new APIError("BAD_REQUEST", { message: motivo });
      }

      // Conta travada por excesso de erros de senha não tenta nem verificar.
      if (ctx.path === "/sign-in/email") {
        const email = normalizarEmail(body.email);
        if (!email) return;
        const ate = await bloqueadoAte(email);
        if (ate) {
          const min = Math.max(1, Math.ceil((ate.getTime() - Date.now()) / 60_000));
          throw new APIError("TOO_MANY_REQUESTS", {
            message: `Muitas tentativas de senha. Espere ${min} min e tente de novo.`,
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = normalizarEmail((ctx.body as Record<string, unknown> | undefined)?.email);
      if (!email) return;

      if (ctx.context.newSession) {
        await limparErrosDeSenha(email);
        return;
      }
      // Sem sessão nova, o endpoint devolveu erro. Só conta como erro de senha
      // o 401 (credencial errada) — a própria trava (429) não realimenta o contador.
      const retorno = ctx.context.returned as { statusCode?: number; status?: number } | undefined;
      const status = retorno?.statusCode ?? retorno?.status;
      if (retorno instanceof APIError && status === 401) {
        await registrarErroDeSenha(email);
      }
    }),
  },
  // Por IP, guardado no banco: na Vercel cada request pode cair numa instância
  // nova, então janela em memória não segura flood nenhum.
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 600, max: 6 },
    },
  },
});
