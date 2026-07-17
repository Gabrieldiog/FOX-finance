"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { criarLancamento } from "@/lib/actions";

type Cat = { id: string; name: string; type: string; color: string };

export function FormaLancamento({ categorias }: { categorias: Cat[] }) {
  const router = useRouter();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [cents, setCents] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const cats = categorias.filter((c) => c.type === type);

  function trocarTipo(t: "expense" | "income") {
    setType(t);
    setCategoryId(null);
  }

  async function salvar() {
    if (cents <= 0) {
      setErro("Digite um valor.");
      return;
    }
    setErro(null);
    setSalvando(true);
    const res = await criarLancamento({ type, amountCents: cents, categoryId, description: descricao });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500">
          Cancelar
        </Link>
        <div className="flex rounded-full border border-zinc-300 p-0.5 text-sm dark:border-zinc-700">
          <button
            type="button"
            onClick={() => trocarTipo("expense")}
            className={`rounded-full px-3 py-1 ${type === "expense" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : ""}`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => trocarTipo("income")}
            className={`rounded-full px-3 py-1 ${type === "income" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : ""}`}
          >
            Ganho
          </button>
        </div>
      </div>

      <div className="py-6">
        <input
          autoFocus
          inputMode="numeric"
          aria-label="Valor"
          value={formatBRL(cents)}
          onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "") || "0"))}
          className="w-full bg-transparent text-center text-5xl font-semibold tabular-nums outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${categoryId === c.id ? "border-zinc-900 dark:border-white" : "border-zinc-200 dark:border-zinc-800"}`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      <input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição (opcional)"
        className="h-11 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-transparent"
      />

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="mt-auto h-12 rounded-full bg-zinc-900 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {salvando ? "Salvando…" : "Salvar"}
      </button>
    </main>
  );
}
