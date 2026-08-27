"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { avaliarRota, type Custos, type NomeVeredito } from "@/lib/custo-por-km";

// Aparência de cada veredito. São TRÊS camadas de redundância, de propósito:
//
//  1. a cor, com luminosidades separadas (ver globals.css e DECISOES.md);
//  2. o preenchimento — sólido, listrado, vazado — que sobrevive a escala de
//     cinza, a daltonismo e a sol batendo na tela;
//  3. a palavra, grande, que é o que salva o componente quando tudo o mais falha.
//
// Uma camada só nunca basta: cerca de 8% dos homens têm daltonismo
// vermelho-verde, e esse é o público deste módulo.
const APARENCIA: Record<
  NomeVeredito,
  { faixa: string; texto: string; frase: string; barra: string }
> = {
  RECUSA: {
    faixa: "bg-veredito-recusa",
    texto: "text-veredito-recusa",
    frase: "Essa corrida te paga menos do que seu tempo vale.",
    barra: "bg-veredito-recusa",
  },
  LIMITE: {
    // Listrado: o padrão é a informação que sobra quando a cor some.
    faixa:
      "bg-[repeating-linear-gradient(45deg,var(--color-veredito-limite)_0_8px,color-mix(in_oklch,var(--color-veredito-limite),black_22%)_8px_16px)]",
    texto: "text-veredito-limite",
    frase: "Dá pra pegar, mas não é o que você quer o dia todo.",
    barra: "bg-veredito-limite",
  },
  ACEITA: {
    // Vazado com contorno grosso.
    faixa: "bg-feltro ring-4 ring-inset ring-veredito-aceita",
    texto: "text-veredito-aceita",
    frase: "Vale a pena. Essa paga o seu tempo.",
    barra: "bg-veredito-aceita",
  },
};

function Campo({
  rotulo,
  sufixo,
  valor,
  onChange,
  formatar,
}: {
  rotulo: string;
  sufixo?: string;
  valor: number;
  onChange: (v: number) => void;
  formatar?: (v: number) => string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">
        {rotulo}
      </span>
      <div className="flex h-13 items-center gap-1.5 rounded-xl border border-pauta bg-feltro-alto px-3 transition focus-within:border-brasa">
        <input
          inputMode="numeric"
          aria-label={rotulo}
          value={formatar ? formatar(valor) : String(valor)}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "") || "0"))}
          className="min-w-0 flex-1 bg-transparent font-serif text-lg tnum text-creme outline-none"
        />
        {sufixo && <span className="shrink-0 font-mono text-xs text-sage">{sufixo}</span>}
      </div>
    </label>
  );
}

export function Calculadora({ custos }: { custos: Custos }) {
  const [ofertaCents, setOferta] = useState(0);
  const [kmDaRota, setKm] = useState(0);
  const [minutos, setMinutos] = useState(0);

  const preenchido = ofertaCents > 0 && kmDaRota > 0;
  const v = avaliarRota(custos, { kmAtePartida: 0, kmDaRota, minutos, ofertaCents });
  const ap = APARENCIA[v.veredito];

  // Acima de 200% a barra satura — daí para cima o número já não informa mais
  // nada de útil, e o valor exato continua na linha de resumo.
  const pct = Math.round(v.razaoNoIndicador * 100);
  const razaoTexto = v.razao > 2 ? "200%+" : `${Math.round(v.razao * 100)}%`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <Campo
          rotulo="Quanto pagam"
          valor={ofertaCents}
          onChange={setOferta}
          formatar={formatBRL}
        />
      </div>
      <div className="flex gap-3">
        <Campo rotulo="Distância" sufixo="km" valor={kmDaRota} onChange={setKm} />
        <Campo rotulo="Tempo" sufixo="min" valor={minutos} onChange={setMinutos} />
      </div>

      {!preenchido ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-pauta bg-feltro-topo px-6 py-12 text-center">
          <p className="font-serif text-lg font-semibold">Digite a oferta e a distância</p>
          <p className="text-sm text-sage">O veredito aparece enquanto você digita.</p>
        </section>
      ) : (
        <>
          {/* Camada 2 e 3: preenchimento e palavra, juntos. */}
          <section
            className={`flex flex-col items-center gap-1 rounded-2xl px-6 py-8 text-center ${ap.faixa}`}
          >
            <p
              className={`font-serif text-[2.75rem] font-extrabold leading-none tracking-tight ${
                v.veredito === "LIMITE" ? "text-feltro" : v.veredito === "ACEITA" ? ap.texto : "text-creme"
              }`}
            >
              {v.veredito}
            </p>
            <p
              className={`text-sm ${
                v.veredito === "LIMITE" ? "text-feltro/80" : v.veredito === "ACEITA" ? "text-sage" : "text-creme/85"
              }`}
            >
              {ap.frase}
            </p>
          </section>

          {/* A escala, com a meta marcada em 100%. */}
          <div className="flex flex-col gap-2">
            <div className="relative h-3 overflow-hidden rounded-full bg-pauta">
              <div
                className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${ap.barra}`}
                style={{ width: `${(pct / 200) * 100}%` }}
              />
              {/* marca da meta: 100% da escala de 0 a 200 */}
              <span className="absolute inset-y-0 left-1/2 w-px bg-creme" aria-hidden />
            </div>
            <div className="flex justify-between font-mono text-[0.6rem] uppercase tracking-[0.1em] text-sage">
              <span>0</span>
              <span className="text-creme">meta</span>
              <span>{razaoTexto}</span>
            </div>
          </div>

          {/* Duas linhas fixas: não quebram em tela estreita. */}
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-mono text-[0.78rem] text-sage">
              sobra <span className="tnum text-creme">{formatBRL(v.sobraCents)}</span>
              {"  ·  "}
              <span className="tnum text-creme">{formatBRL(v.porHoraCents)}</span> por hora
            </p>
            <p className="font-mono text-[0.78rem] text-sage">
              custo <span className="tnum text-creme">{formatBRL(v.custoCents)}</span>
              {"  ·  "}
              <span className="tnum text-creme">{razaoTexto}</span> da meta
            </p>
          </div>
        </>
      )}

      {/* A regra do §3 do brief: operacional nunca se confunde com caixa. */}
      <p className="border-t border-pauta pt-4 text-center text-xs leading-relaxed text-sage">
        Estimativa por km rodado, contando {custos.includeReturnTrip ? "a volta" : "só a ida"}.
        Não é o seu saldo — o abastecimento entra no saldo no dia em que você paga.
      </p>

      <Link
        href="/ganhos/ajustes"
        className="flex h-12 items-center justify-center rounded-xl border border-pauta font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:border-brasa hover:text-brasa"
      >
        Ajustar meus custos
      </Link>
    </div>
  );
}
