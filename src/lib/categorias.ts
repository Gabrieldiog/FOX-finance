// Fonte única de verdade das categorias criáveis pelo usuário.
// Backend valida contra estas listas; o cliente escolhe de um catálogo fechado,
// nunca manda um SVG ou uma cor arbitrária. Os mesmos nomes de ícone alimentam
// o <IconeCategoria> e as categorias-semente (scripts/seed.ts).

export const ICONES_CATEGORIA = [
  "cart",
  "home",
  "car",
  "health",
  "book",
  "smile",
  "food",
  "receipt",
  "coffee",
  "gift",
  "heart",
  "plane",
  "phone",
  "shirt",
  "tools",
  "wallet",
  "bill",
  "dumbbell",
  "pet",
  "salary",
  "plus",
  "pix",
  "dots",
] as const;

export type IconeNome = (typeof ICONES_CATEGORIA)[number];

// Paleta fechada: as cores das categorias-semente + variações. O picker só
// oferece estas, e a validação recusa qualquer hex fora da lista.
export const CORES_CATEGORIA = [
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
  "#0ea5e9",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#64748b",
] as const;

// Teto por usuário: evita que alguém crie categorias em massa (abuso/DoS de linha).
export const MAX_CATEGORIAS_USUARIO = 40;

export function iconeValido(v: string): v is IconeNome {
  return (ICONES_CATEGORIA as readonly string[]).includes(v);
}

export function corValida(v: string): boolean {
  return (CORES_CATEGORIA as readonly string[]).includes(v);
}
