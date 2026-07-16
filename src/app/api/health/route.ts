import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// Liveness + checagem do banco. Responde 200 mesmo com o banco fora (reporta
// `db: "down"`), pra servir de health check simples de monitoramento.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    return NextResponse.json({ ok: true, db: "down" });
  }
}
