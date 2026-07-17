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
  const ganho = type === "income";

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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 pt-safe pb-[calc(1.5rem+env(safe-area-inset-bottom))] [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-nevoa-fraca transition hover:text-nevoa">
          Cancelar
        </Link>
        <div className="flex rounded-full border border-linha bg-carvao p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => trocarTipo("expense")}
            className={`rounded-full px-4 py-1.5 transition ${!ganho ? "bg-saiu text-white" : "text-nevoa-fraca"}`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => trocarTipo("income")}
            className={`rounded-full px-4 py-1.5 transition ${ganho ? "bg-entrou text-white" : "text-nevoa-fraca"}`}
          >
            Ganho
          </button>
        </div>
      </div>

      <div className="py-6 text-center">
        <p className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-nevoa-fraca">
          {ganho ? "Quanto entrou?" : "Quanto saiu?"}
        </p>
        <input
          autoFocus
          inputMode="numeric"
          aria-label="Valor"
          value={formatBRL(cents)}
          onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "") || "0"))}
          className={`dinheiro w-full bg-transparent text-center text-6xl font-extrabold outline-none transition-colors ${ganho ? "text-entrou" : "text-saiu"} ${cents === 0 ? "opacity-40" : ""}`}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {cats.map((c) => {
          const ativa = categoryId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(ativa ? null : c.id)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${ativa ? "border-verde bg-menta text-nevoa" : "border-linha bg-carvao text-nevoa-fraca"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          );
        })}
      </div>

      <input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição (opcional)"
        className="h-13 rounded-lg border border-linha bg-carvao px-4 outline-none transition placeholder:text-nevoa-fraca focus:border-verde focus:ring-4 focus:ring-verde/20"
      />

      {erro && <p className="text-sm font-semibold text-saiu">{erro}</p>}

      <div className="mt-auto flex flex-col gap-3" style={{ transform: "translateY(calc(-1 * var(--kb, 0px)))" }}>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || excluindo}
          className="flex h-13 items-center justify-center rounded-lg bg-verde font-display font-bold text-tinta shadow-[0_8px_22px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98] disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={excluir}
            disabled={salvando || excluindo}
            className="h-11 rounded-full text-sm font-bold text-saiu transition active:scale-[.98] disabled:opacity-60"
          >
            {excluindo ? "Excluindo…" : "Excluir lançamento"}
          </button>
        )}
      </div>
    </main>
  );
}
