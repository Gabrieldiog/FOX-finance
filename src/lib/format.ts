// Centavos inteiros -> texto em Real. Usado no cliente (input) e no servidor (resumo).
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Data curta no fuso de São Paulo ("10 mai") — robusto mesmo se o servidor
// rodar em UTC. Usado pra agrupar os lançamentos por dia.
export function formatDiaSP(d: Date): string {
  return d
    .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" })
    .replace(".", "");
}
