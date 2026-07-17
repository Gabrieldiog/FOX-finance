import postgres from "postgres";

// Categorias globais (user_id nulo), disponíveis pra todo mundo. Idempotente.
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
];

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const rows = await sql`select count(*)::int as count from category where user_id is null`;
if (rows[0].count === 0) {
  for (const c of CATEGORIAS) {
    await sql`insert into category (name, type, icon, color) values (${c.name}, ${c.type}, ${c.icon}, ${c.color})`;
  }
  console.log("semeadas " + CATEGORIAS.length + " categorias globais");
} else {
  console.log("ja existem " + rows[0].count + " categorias globais; nada a fazer");
}
await sql.end();
