"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { criarLancamento, editarLancamento, excluirLancamento } from "@/lib/actions";

type Cat = { id: string; name: string; type: string; color: string };
type Inicial = {
  id: string;
  type: "expense" | "income";
  amountCents: number;
  categoryId: string | null;
  description: string;
};

export function FormaLancamento({ categorias, inicial }: { categorias: Cat[]; inicial?: Inicial }) {
  const router = useRouter();
  const editando = inicial != null;

  const [type, setType] = useState<"expense" | "income">(inicial?.type ?? "expense");
  const [cents, setCents] = useState(inicial?.amountCents ?? 0);
  const [categoryId, setCategoryId] = useState<string | null>(inicial?.categoryId ?? null);
  const [descricao, setDescricao] = useState(inicial?.description ?? "");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
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
    const dados = { type, amountCents: cents, categoryId, description: descricao };
    const res = editando
      ? await editarLancamento({ id: inicial!.id, ...dados })
      : await criarLancamento(dados);
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function excluir() {
    if (!inicial) return;
    setErro(null);
    setExcluindo(true);
    const res = await excluirLancamento(inicial.id);
    setExcluindo(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-nevoa-fraca transition hover:text-nevoa">
          Cancelar
        </Link>
        <div className="flex rounded-full border border-linha p-1 text-sm">
          <button
            type="button"
            onClick={() => trocarTipo("expense")}
            className={`rounded-full px-4 py-1 transition ${type === "expense" ? "bg-nevoa text-breu" : "text-nevoa-fraca"}`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => trocarTipo("income")}
            className={`rounded-full px-4 py-1 transition ${type === "income" ? "bg-nevoa text-breu" : "text-nevoa-fraca"}`}
          >
            Ganho
          </button>
        </div>
      </div>

      <div className="py-8">
        <input
          autoFocus
          inputMode="numeric"
          aria-label="Valor"
          value={formatBRL(cents)}
          onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "") || "0"))}
          className={`tnum w-full bg-transparent text-center font-display text-6xl font-semibold outline-none transition-colors ${type === "income" ? "text-entrou" : "text-saiu"} ${cents === 0 ? "opacity-40" : ""}`}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${categoryId === c.id ? "border-nevoa" : "border-linha text-nevoa-fraca"}`}
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
        className="h-12 rounded-xl border border-linha bg-carvao px-4 text-sm outline-none placeholder:text-nevoa-fraca"
      />

      {erro && <p className="text-sm text-saiu">{erro}</p>}

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || excluindo}
          className="flex h-12 items-center justify-center rounded-full bg-ambar font-medium text-tinta transition active:scale-[.98] disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={excluir}
            disabled={salvando || excluindo}
            className="h-11 rounded-full text-sm font-medium text-saiu transition active:scale-[.98] disabled:opacity-60"
          >
            {excluindo ? "Excluindo…" : "Excluir lançamento"}
          </button>
        )}
      </div>
    </main>
  );
}
