// Centavos inteiros -> texto em Real. Usado no cliente (input) e no servidor (resumo).
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
