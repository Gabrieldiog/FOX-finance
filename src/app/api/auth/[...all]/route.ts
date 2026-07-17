import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

// Honeypot: os formulários de entrar/criar conta têm um campo "site" escondido
// que pessoa de verdade nunca vê nem preenche. Robô que sai preenchendo tudo
// cai aqui e leva um erro genérico antes mesmo de tocar na autenticação.
export async function POST(request: Request) {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith("/sign-in/email") || pathname.endsWith("/sign-up/email")) {
    const body: unknown = await request
      .clone()
      .json()
      .catch(() => null);
    const site = body && typeof body === "object" ? (body as Record<string, unknown>).site : undefined;
    if (typeof site === "string" && site.trim() !== "") {
      return Response.json({ message: "Não foi possível concluir." }, { status: 400 });
    }
  }
  return handler.POST(request);
}
