import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { labelFormaPagamento } from "@/lib/categorias";
import type { LancamentoLista } from "@/lib/data/transactions";
import { IconeCategoria } from "./icone-categoria";

// Uma linha de lançamento clicável (leva pra edição). Mesma peça no dashboard e
// no histórico, pra não divergirem.
export function ItemLancamento({ t }: { t: LancamentoLista }) {
  const entrou = t.type === "income";
  return (
    <Link
      href={`/editar/${t.id}`}
      className="flex items-center gap-3 border-b border-pauta/60 py-3 transition last:border-b-0 active:opacity-70"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${t.categoryColor ?? "#64748b"}1f`,
          color: t.categoryColor ?? "#9db4a8",
        }}
      >
        <IconeCategoria nome={t.categoryIcon ?? "dots"} className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-creme">
          {t.description || t.categoryName || "Sem categoria"}
        </span>
        {t.paymentMethod && (
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-sage">
            {labelFormaPagamento(t.paymentMethod)}
          </span>
        )}
      </span>
      <span
        className={`font-serif text-[0.95rem] tnum ${entrou ? "text-brilho" : "text-alerta"}`}
      >
        {entrou ? "+" : "−"}
        {formatBRL(t.amountCents)}
      </span>
    </Link>
  );
}
