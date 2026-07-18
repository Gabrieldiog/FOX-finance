"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL, formatDiaSP } from "@/lib/format";
import { criarLancamento, editarLancamento, excluirLancamento } from "@/lib/actions";
import { FORMAS_PAGAMENTO } from "@/lib/categorias";
import { IconeCategoria } from "@/components/icone-categoria";
import { NovaCategoria, type Categoria } from "@/components/nova-categoria";

type Cat = { id: string; name: string; type: string; icon: string; color: string };
type Inicial = {
  id: string;
  type: "expense" | "income";
  amountCents: number;
  categoryId: string | null;
  description: string;
  occurredAt: string; // ISO
  paymentMethod: string | null;
};

// yyyy-mm-dd no fuso local, pro <input type=date>.
function paraInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export function FormaLancamento({ categorias, inicial }: { categorias: Cat[]; inicial?: Inicial }) {
  const router = useRouter();
  const editando = inicial != null;

  const [type, setType] = useState<"expense" | "income">(inicial?.type ?? "expense");
  const [cents, setCents] = useState(inicial?.amountCents ?? 0);
  const [categoryId, setCategoryId] = useState<string | null>(inicial?.categoryId ?? null);
  const [descricao, setDescricao] = useState(inicial?.description ?? "");
  // Data via "modo" pra não ler o relógio durante o render (impuro): o horário
  // só é calculado no clique/no salvar. Ao editar, mostra a data exata guardada.
  const [modo, setModo] = useState<"hoje" | "ontem" | "outro">(inicial ? "outro" : "hoje");
  const [dataOutra, setDataOutra] = useState<Date | null>(
    inicial ? new Date(inicial.occurredAt) : null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string | null>(inicial?.paymentMethod ?? null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cats, setCats] = useState<Cat[]>(categorias);
  const [criandoCat, setCriandoCat] = useState(false);

  const catsDoTipo = cats.filter((c) => c.type === type);
  const ganho = type === "income";

  function trocarTipo(t: "expense" | "income") {
    setType(t);
    setCategoryId(null);
  }

  function aoCriarCategoria(nova: Categoria) {
    setCats((atuais) => [...atuais, nova]);
    setCategoryId(nova.id);
    setCriandoCat(false);
  }

  async function salvar() {
    if (cents <= 0) {
      setErro("Digite um valor.");
      return;
    }
    setErro(null);
    setSalvando(true);
    // Só aqui (num handler, fora do render) o relógio é lido.
    const quando =
      modo === "hoje"
        ? new Date()
        : modo === "ontem"
          ? new Date(Date.now() - 86_400_000)
          : (dataOutra ?? new Date());
    const dados = {
      type,
      amountCents: cents,
      categoryId,
      description: descricao,
      occurredAt: quando.toISOString(),
      paymentMethod,
    };
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

  const chipData = (on: boolean) =>
    `flex-1 rounded-xl border py-2.5 text-center text-sm font-medium transition ${
      on ? "border-brilho bg-brilho/10 text-creme" : "border-pauta text-sage"
    }`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 bg-feltro px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          Cancelar
        </Link>
        <div className="flex rounded-full border border-pauta bg-feltro-alto p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => trocarTipo("expense")}
            className={`rounded-full px-4 py-1.5 transition ${!ganho ? "bg-alerta text-feltro" : "text-sage"}`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => trocarTipo("income")}
            className={`rounded-full px-4 py-1.5 transition ${ganho ? "bg-brilho text-feltro" : "text-sage"}`}
          >
            Ganho
          </button>
        </div>
      </div>

      <div className="py-4 text-center">
        <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
          {ganho ? "Quanto entrou?" : "Quanto saiu?"}
        </p>
        <input
          autoFocus
          inputMode="numeric"
          aria-label="Valor"
          value={formatBRL(cents)}
          onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "") || "0"))}
          className={`w-full bg-transparent text-center font-serif text-6xl font-semibold outline-none tnum ${ganho ? "text-brilho" : "text-alerta"} ${cents === 0 ? "opacity-40" : ""}`}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {catsDoTipo.map((c) => {
          const ativa = categoryId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(ativa ? null : c.id)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${ativa ? "border-brilho bg-brilho/10 text-creme" : "border-pauta text-sage"}`}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: `${c.color}1f`, color: c.color }}
              >
                <IconeCategoria nome={c.icon} className="h-3.5 w-3.5" />
              </span>
              {c.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCriandoCat(true)}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-pauta px-3.5 py-2 text-sm font-medium text-sage transition hover:border-brilho hover:text-brilho"
        >
          <IconeCategoria nome="plus" className="h-4 w-4" />
          Nova
        </button>
      </div>

      <div>
        <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-sage">Quando</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setModo("hoje")} className={chipData(modo === "hoje")}>
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setModo("ontem")}
            className={chipData(modo === "ontem")}
          >
            Ontem
          </button>
          <label className={`${chipData(modo === "outro")} relative cursor-pointer`}>
            {modo === "outro" && dataOutra ? formatDiaSP(dataOutra) : "Outra"}
            <input
              type="date"
              aria-label="Escolher data"
              value={dataOutra ? paraInput(dataOutra) : ""}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split("-").map(Number);
                if (y && m && d) {
                  setDataOutra(new Date(y, m - 1, d, 12));
                  setModo("outro");
                }
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-sage">
          Forma de pagamento <span className="normal-case tracking-normal">(opcional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {FORMAS_PAGAMENTO.map((f) => {
            const on = paymentMethod === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setPaymentMethod(on ? null : f.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${on ? "border-brilho bg-brilho/10 text-creme" : "border-pauta text-sage"}`}
              >
                <IconeCategoria nome={f.icon} className="h-4 w-4" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição (opcional)"
        maxLength={200}
        className="h-13 rounded-xl border border-pauta bg-feltro-alto px-4 text-creme outline-none transition placeholder:text-sage focus:border-brilho"
      />

      {erro && <p className="text-sm font-medium text-alerta">{erro}</p>}

      <div
        className="mt-auto flex flex-col gap-3"
        style={{ transform: "translateY(calc(-1 * var(--kb, 0px)))" }}
      >
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || excluindo}
          className="flex h-13 items-center justify-center rounded-xl bg-brilho font-serif text-lg font-semibold text-feltro transition active:scale-[.98] disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={excluir}
            disabled={salvando || excluindo}
            className="h-11 rounded-full text-sm font-medium text-alerta transition active:scale-[.98] disabled:opacity-60"
          >
            {excluindo ? "Excluindo…" : "Excluir lançamento"}
          </button>
        )}
      </div>

      {criandoCat && (
        <NovaCategoria
          tipo={type}
          onCriada={aoCriarCategoria}
          onFechar={() => setCriandoCat(false)}
        />
      )}
    </main>
  );
}
