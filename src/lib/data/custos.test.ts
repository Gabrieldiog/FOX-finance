import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { getCustos, setCustos } from "./custos";

const A = "xcusto-user-a";
const B = "xcusto-user-b";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xcusto-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xcusto-b@fox.test", emailVerified: true },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("quem nunca configurou nada recebe os defaults, sem linha no banco", async () => {
  const c = await getCustos(A);
  expect(c.fuelPriceCents).toBe(600);
  expect(c.kmPerLiterCenti).toBe(3000);
  expect(c.maintenanceCentsPerKm).toBe(15);
  expect(c.targetCentsPerHour).toBe(2500);
  expect(c.includeReturnTrip).toBe(true);
});

test("salvar cria a linha; salvar de novo atualiza, não duplica", async () => {
  await setCustos(A, { fuelPriceCents: 649 });
  expect((await getCustos(A)).fuelPriceCents).toBe(649);

  await setCustos(A, { fuelPriceCents: 715, targetCentsPerHour: 3000 });
  const c = await getCustos(A);
  expect(c.fuelPriceCents).toBe(715);
  expect(c.targetCentsPerHour).toBe(3000);
  // campo que não foi enviado continua no default
  expect(c.maintenanceCentsPerKm).toBe(15);
});

test("um usuário não lê nem sobrescreve a configuração do outro", async () => {
  await setCustos(A, { fuelPriceCents: 999 });
  // B continua no default, sem enxergar nada de A
  expect((await getCustos(B)).fuelPriceCents).toBe(600);

  await setCustos(B, { fuelPriceCents: 111 });
  expect((await getCustos(A)).fuelPriceCents).toBe(999);
  expect((await getCustos(B)).fuelPriceCents).toBe(111);
});

test("o banco recusa valores impossíveis", async () => {
  await expect(setCustos(A, { workedDaysPerMonth: 40 })).rejects.toThrow();
  await expect(setCustos(A, { depreciationFactorCenti: 150 })).rejects.toThrow();
  await expect(setCustos(A, { fuelPriceCents: -1 })).rejects.toThrow();
});

test("apagar o usuário leva a configuração junto", async () => {
  const T = "xcusto-user-temp";
  await db.delete(user).where(inArray(user.id, [T]));
  await db
    .insert(user)
    .values({ id: T, name: "T", email: "xcusto-t@fox.test", emailVerified: true });
  await setCustos(T, { fuelPriceCents: 777 });
  expect((await getCustos(T)).fuelPriceCents).toBe(777);

  await db.delete(user).where(inArray(user.id, [T]));
  // sem linha, volta ao default — a cascata apagou a configuração
  expect((await getCustos(T)).fuelPriceCents).toBe(600);
});
