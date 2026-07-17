import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTransaction } from "@/lib/data/transactions";
import { listCategories } from "@/lib/data/categories";
import { FormaLancamento } from "../../novo/forma-lancamento";

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const { id } = await params;
  const tx = await getTransaction(session.user.id, id);
  if (!tx) notFound();

  const categorias = await listCategories(session.user.id);
  return (
    <FormaLancamento
      categorias={categorias.map((c) => ({ id: c.id, name: c.name, type: c.type, color: c.color }))}
      inicial={{
        id: tx.id,
        type: tx.type === "income" ? "income" : "expense",
        amountCents: tx.amountCents,
        categoryId: tx.categoryId,
        description: tx.description ?? "",
      }}
    />
  );
}
