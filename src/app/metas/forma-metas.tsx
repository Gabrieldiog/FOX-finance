"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { salvarMetasDoMes } from "@/lib/actions";
import { avaliarMetas, type Metas, type MovimentoDoMes } from "@/lib/metas-do-mes";

// Campo de dinheiro no padrão do app: teclado de centavos, sem separador para
// digitar. Zero é um valor legítimo aqui — significa "não quero essa meta".
function CampoMeta({
  rotulo,
  ajuda,
  cents,
  onChange,
}: {
  rotulo: string;
  ajuda: string;
  cents: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-sage">
        {rotulo}
      </span>
      <input
        inputMode="numeric"
        aria-label={rotulo}
        value={formatBRL(cents)}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "") || "0"))}
        className={`h-14 w-full rounded-xl border border-pauta bg-feltro-alto px-4 font-serif text-2xl tnum outline-none transition focus:border-brilho ${
          cents === 0 ? "text-sage" : "text-creme"
        }`}
      />
      <span className="text-xs leading-relaxed text-sage">{ajuda}</span>
    </label>
  );
}

// Barra de progresso da meta. A cor sai do estado, nunca de um valor solto.
function Barra({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-pauta">
      <div
        className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${cor}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function FormaMetas({
  inicial,
  movimento,
}: {
  inicial: Metas;
  movimento: MovimentoDoMes;
}) {
  const router = useRouter();
  const [metas, setMetas] = useState<Metas>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Recalcula a cada tecla: avaliarMetas é pura e não custa nada. A pessoa vê
  // o efeito da meta enquanto digita, em vez de salvar e torcer.
  const av = avaliarMetas(metas, movimento);

  function mudar(campo: keyof Metas, valor: number) {
    setMetas((m) => ({ ...m, [campo]: valor }));
    setSalvo(false);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const res = await salvarMetasDoMes(metas);
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setSalvo(true);
    router.refresh();
  }

  const semMeta = metas.spendLimitCents === 0 && metas.saveTargetCents === 0;

  return (
    <div className="flex flex-col gap-7">
      {/* Como está indo, no topo: é a resposta, os campos são só o ajuste. */}
      {!semMeta && (
        <section className="flex flex-col gap-4 rounded-2xl border border-pauta bg-feltro-alto p-5">
          {av.gasto && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-sage">
                  Gasto do mês
                </span>
                <span className="font-serif text-sm tnum text-creme">
                  {formatBRL(av.gasto.gastoCents)}{" "}
                  <span className="text-sage">de {formatBRL(av.gasto.limiteCents)}</span>
                </span>
              </div>
              <Barra
                pct={av.gasto.usadoPct}
                cor={
                  av.gasto.estado === "estourou"
                    ? "bg-alerta"
                    : av.gasto.estado === "perto"
                      ? "bg-brasa"
                      : "bg-brilho"
                }
              />
              <p
                className={`text-sm ${
                  av.gasto.estado === "estourou"
                    ? "text-alerta"
                    : av.gasto.estado === "perto"
                      ? "text-brasa"
                      : "text-sage"
                }`}
              >
                {av.gasto.texto}
              </p>
            </div>
          )}

          {av.gasto && av.economia && <div className="h-px bg-pauta" />}

          {av.economia && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-sage">
                  Guardado no mês
                </span>
                <span className="font-serif text-sm tnum text-creme">
                  {formatBRL(av.economia.sobraCents)}{" "}
                  <span className="text-sage">de {formatBRL(av.economia.metaCents)}</span>
                </span>
              </div>
              <Barra
                pct={av.economia.progressoPct}
                cor={av.economia.estado === "negativo" ? "bg-alerta" : "bg-brilho"}
              />
              <p
                className={`text-sm ${
                  av.economia.estado === "negativo" ? "text-alerta" : "text-sage"
                }`}
              >
                {av.economia.texto}
              </p>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col gap-6">
        <CampoMeta
          rotulo="Quanto quero gastar por mês"
          ajuda="O teto que você não quer passar. Deixe em zero para não ter essa meta."
          cents={metas.spendLimitCents}
          onChange={(v) => mudar("spendLimitCents", v)}
        />
        <CampoMeta
          rotulo="Quanto quero guardar por mês"
          ajuda="O quanto você quer que sobre no fim do mês, depois de tudo pago."
          cents={metas.saveTargetCents}
          onChange={(v) => mudar("saveTargetCents", v)}
        />
      </div>

      {erro && <p className="text-sm font-medium text-alerta">{erro}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="flex h-13 items-center justify-center rounded-xl bg-brilho font-serif text-lg font-semibold text-feltro transition active:scale-[.98] disabled:opacity-60"
      >
        {salvando ? "Salvando…" : salvo ? "Salvo!" : "Salvar metas"}
      </button>

      {semMeta && (
        <p className="text-center text-sm leading-relaxed text-sage">
          Defina uma das duas e o Fox passa a te avisar no início do app — quando estiver perto
          de estourar, e quando bater a meta.
        </p>
      )}
    </div>
  );
}
