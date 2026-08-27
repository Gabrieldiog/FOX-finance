"use client";

import { useEffect, useMemo, useState } from "react";

// Calendário do Fox.
//
// O <input type="date"> abre o calendário do sistema operacional: cor de outro
// app, tipografia de outro app, e — o pior — posicionado pelo navegador, então
// no celular ele saía pela borda da tela. Este aqui vive dentro de uma folha
// que sobe de baixo, ocupa a largura toda e não tem como escapar do viewport.
//
// Não aceita data futura: um lançamento é algo que já aconteceu.

const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Data local (não UTC) zerada na meia-noite: é assim que o usuário pensa em
// "dia", e evita o clássico de o dia 1 virar dia 31 do mês anterior.
function diaLocal(ano: number, mes: number, dia: number) {
  return new Date(ano, mes, dia, 12, 0, 0, 0);
}
const mesmoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function Calendario({
  valor,
  onEscolher,
  onFechar,
}: {
  valor: Date | null;
  onEscolher: (d: Date) => void;
  onFechar: () => void;
}) {
  const hoje = useMemo(() => new Date(), []);
  const base = valor ?? hoje;
  const [ano, setAno] = useState(base.getFullYear());
  const [mes, setMes] = useState(base.getMonth());

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  // Mês seguinte só é alcançável se ainda não passou de hoje.
  const podeAvancar = new Date(ano, mes + 1, 1) <= new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  function irPara(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }

  const celulas: (number | null)[] = [
    ...Array<null>(primeiroDiaDaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* O véu fecha ao toque, que é como todo mundo espera fechar uma folha. */}
      <button
        type="button"
        aria-label="Fechar calendário"
        onClick={onFechar}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative w-full rounded-t-3xl border-t border-pauta bg-feltro-topo px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* Puxador: diz que isto é uma folha, sem precisar escrever nada. */}
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-pauta" />

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => irPara(-1)}
            aria-label="Mês anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-pauta text-sage transition hover:text-creme active:scale-95"
          >
            ‹
          </button>
          {/* first-letter em vez de capitalize: o capitalize do CSS
              maiusculiza CADA palavra e produzia "Agosto De 2026". */}
          <p className="font-serif text-lg font-semibold text-creme first-letter:uppercase">
            {MESES[mes]} de {ano}
          </p>
          <button
            type="button"
            onClick={() => irPara(1)}
            disabled={!podeAvancar}
            aria-label="Próximo mês"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-pauta text-sage transition hover:text-creme active:scale-95 disabled:opacity-25"
          >
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {DIAS_DA_SEMANA.map((d, i) => (
            <span
              key={i}
              className="py-1 text-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-sage"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            if (dia === null) return <span key={`v${i}`} />;
            const data = diaLocal(ano, mes, dia);
            const futuro = data > hoje && !mesmoDia(data, hoje);
            const ehHoje = mesmoDia(data, hoje);
            const escolhido = valor != null && mesmoDia(data, valor);

            return (
              <button
                key={dia}
                type="button"
                disabled={futuro}
                onClick={() => onEscolher(data)}
                aria-label={`${dia} de ${MESES[mes]} de ${ano}`}
                aria-current={ehHoje ? "date" : undefined}
                className={`flex h-11 items-center justify-center rounded-xl font-serif text-base tnum transition active:scale-95 ${
                  escolhido
                    ? "bg-brilho font-semibold text-feltro"
                    : ehHoje
                      ? "border border-brilho/50 text-creme"
                      : "text-creme hover:bg-feltro-alto"
                } ${futuro ? "cursor-not-allowed opacity-20 hover:bg-transparent" : ""}`}
              >
                {dia}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-pauta font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
