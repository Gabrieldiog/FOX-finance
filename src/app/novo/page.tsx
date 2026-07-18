import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { FormaLancamento } from "./forma-lancamento";

export default async function Novo() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const categorias = await listCategories(session.user.id);
  return (
    <FormaLancamento
      categorias={categorias.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
      }))}
    />
  );
}
