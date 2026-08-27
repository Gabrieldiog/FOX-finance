import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { costSetting } from "@/db/schema";
import type { Custos } from "@/lib/custo-por-km";

// REGRA DE OURO: sessionUserId vem SEMPRE da sessão no servidor, nunca de
// req/body/param. Configuração de outro usuário é invisível daqui.

// Os mesmos defaults declarados no schema, repetidos aqui de propósito: quem
// nunca abriu os ajustes não tem linha nenhuma no banco e mesmo assim precisa
// de um custo por km para a calculadora responder. Sem isto, o app exigiria um
// cadastro antes de dizer qualquer coisa.
export const CUSTOS_PADRAO: Custos = {
  fuelPriceCents: 600,
  kmPerLiterCenti: 3000,
  maintenanceCentsPerKm: 15,
  vehicleValueCents: 0,
  vehicleLifetimeKm: 100000,
  depreciationFactorCenti: 60,
  fixedCostCentsPerMonth: 0,
  workedDaysPerMonth: 22,
  targetCentsPerHour: 2500,
  includeReturnTrip: true,
};

export async function getCustos(sessionUserId: string): Promise<Custos> {
  const [row] = await db
    .select()
    .from(costSetting)
    .where(eq(costSetting.userId, sessionUserId))
    .limit(1);
  if (!row) return { ...CUSTOS_PADRAO };
  return {
    fuelPriceCents: row.fuelPriceCents,
    kmPerLiterCenti: row.kmPerLiterCenti,
    maintenanceCentsPerKm: row.maintenanceCentsPerKm,
    vehicleValueCents: row.vehicleValueCents,
    vehicleLifetimeKm: row.vehicleLifetimeKm,
    depreciationFactorCenti: row.depreciationFactorCenti,
    fixedCostCentsPerMonth: row.fixedCostCentsPerMonth,
    workedDaysPerMonth: row.workedDaysPerMonth,
    targetCentsPerHour: row.targetCentsPerHour,
    includeReturnTrip: row.includeReturnTrip,
  };
}

// Grava só o que veio. Campo ausente fica no default do schema (primeira vez) ou
// no valor que já estava lá (atualizações seguintes).
export async function setCustos(
  sessionUserId: string,
  parcial: Partial<Custos>,
): Promise<void> {
  await db
    .insert(costSetting)
    .values({ userId: sessionUserId, ...parcial })
    .onConflictDoUpdate({
      target: costSetting.userId,
      set: { ...parcial, updatedAt: new Date() },
    });
}
