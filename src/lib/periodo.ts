export const PERIODOS = ["semana", "mes", "total"] as const;
export type Periodo = (typeof PERIODOS)[number];
export const COOKIE_PERIODO = "periodo";

export function lerPeriodo(url?: string, cookie?: string): Periodo {
  return [url, cookie].find((v): v is Periodo => PERIODOS.includes(v as Periodo)) ?? "mes";
}
