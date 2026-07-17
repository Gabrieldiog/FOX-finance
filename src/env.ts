import { z } from "zod";

// Valida as variáveis de ambiente no boot. Se faltar algo, o app não sobe —
// melhor falhar aqui do que rodar em produção com um segredo vazio.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:3000"),
  ALLOWED_EMAILS: z.string().min(1),
});

export const env = schema.parse(process.env);
