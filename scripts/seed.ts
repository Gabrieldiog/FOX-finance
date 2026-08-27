import postgres from "postgres";

// Categorias globais (user_id nulo), disponíveis pra todo mundo.
//
// Idempotente POR NOME: rodar de novo não duplica nada, e uma categoria nova
// acrescentada a esta lista entra num banco que JÁ foi semeado. A versão
// anterior só semeava quando a tabela estava vazia ("if count === 0"), o que
// funcionou uma vez e depois virou uma porta trancada: acrescentar uma
// categoria aqui não tinha efeito nenhum em produção.
//
// Rodar com:  npm run db:seed
const CATEGORIAS = [
  { name: "Mercado", type: "expense", icon: "cart", color: "#f59e0b" },
  { name: "Moradia", type: "expense", icon: "home", color: "#6366f1" },
  { name: "Transporte", type: "expense", icon: "car", color: "#0ea5e9" },
  { name: "Saúde", type: "expense", icon: "health", color: "#ef4444" },
  { name: "Educação", type: "expense", icon: "book", color: "#8b5cf6" },
  { name: "Lazer", type: "expense", icon: "smile", color: "#ec4899" },
  { name: "Restaurante", type: "expense", icon: "food", color: "#f97316" },
  { name: "Contas & Assinaturas", type: "expense", icon: "receipt", color: "#14b8a6" },
  { name: "Pet", type: "expense", icon: "pet", color: "#84cc16" },
  { name: "Outros", type: "expense", icon: "dots", color: "#64748b" },
  { name: "Salário", type: "income", icon: "salary", color: "#22c55e" },
  { name: "Renda extra", type: "income", icon: "plus", color: "#10b981" },
  { name: "Pix recebido", type: "income", icon: "pix", color: "#06b6d4" },
  // Quem roda de carro pra ganhar dinheiro faz esses três lançamentos todo dia:
  // a corrida que entra, o combustível que sai, e o que o carro cobra pra
  // continuar rodando (revisão, óleo, pneu, seguro, IPVA).
  { name: "Combustível", type: "expense", icon: "fuel", color: "#f97316" },
  { name: "Carro", type: "expense", icon: "tools", color: "#64748b" },
  { name: "Corridas", type: "income", icon: "car", color: "#10b981" },
];

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

let criadas = 0;
for (const c of CATEGORIAS) {
  // Só as globais entram na comparação: uma categoria PRÓPRIA de alguém com o
  // mesmo nome não impede a global de existir, e nem é tocada aqui.
  const existente = await sql`
    select 1 from category where user_id is null and name = ${c.name} limit 1
  `;
  if (existente.length > 0) continue;
  await sql`
    insert into category (name, type, icon, color)
    values (${c.name}, ${c.type}, ${c.icon}, ${c.color})
  `;
  criadas++;
}

console.log(
  criadas === 0
    ? "nada a fazer: as " + CATEGORIAS.length + " categorias globais ja existem"
    : "criadas " + criadas + " categorias globais (" + CATEGORIAS.length + " no total)",
);
await sql.end();
