import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { category, transaction } from "@/db/schema";

// LGPD: o usuário baixa TODOS os próprios dados, num JSON. Escopado pela sessão.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const uid = session.user.id;
  const [transacoes, categorias] = await Promise.all([
    db.select().from(transaction).where(eq(transaction.userId, uid)),
    db.select().from(category).where(eq(category.userId, uid)),
  ]);

  const dados = {
    exportadoEm: new Date().toISOString(),
    perfil: { nome: session.user.name, email: session.user.email },
    transacoes,
    categorias,
  };

  return new NextResponse(JSON.stringify(dados, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="fox-meus-dados.json"',
    },
  });
}
