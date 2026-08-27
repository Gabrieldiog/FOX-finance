"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { salvarCustos } from "@/lib/actions";
import { custoVariavelPorKm, type Custos } from "@/lib/custo-por-km";

// Campo de dinheiro no padrão que o Fox já usa em /novo e /metas: o valor é
// sempre exibido formatado e o teclado só digita centavos, da direita para a
// esquerda. Ninguém precisa digitar vírgula nem ponto — e por isso ninguém
// erra o separador.
function CampoDinheiro({
  rotulo,
  ajuda,
  cents,
  onChange,
}: {
  rotulo: string;
  ajuda?: string;
  cents: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-sage">
        {rotulo}
      </span>
      <input
        inputMode="numeric"
        value={formatBRL(cents)}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "") || "0"))}
        className="h-13 w-full rounded-xl border border-pauta bg-feltro-alto px-4 font-serif text-lg tnum text-creme outline-none transition focus:border-brilho"
      />
      {ajuda && <span className="text-xs text-sage">{ajuda}</span>}
    </label>
  );
}

// Número puro (km, dias, porcentagem). Mesma disciplina: só dígitos entram.
function CampoNumero({
  rotulo,
  ajuda,
  valor,
  sufixo,
  onChange,
}: {
  rotulo: string;
  ajuda?: string;
  valor: string;
  sufixo?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-sage">
        {rotulo}
      </span>
      <div className="flex h-13 items-center gap-2 rounded-xl border border-pauta bg-feltro-alto px-4 transition focus-within:border-brilho">
        <input
          inputMode="numeric"
          value={valor}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          className="min-w-0 flex-1 bg-transparent font-serif text-lg tnum text-creme outline-none"
        />
        {sufixo && <span className="shrink-0 font-mono text-xs text-sage">{sufixo}</span>}
      </div>
      {ajuda && <span className="text-xs text-sage">{ajuda}</span>}
    </label>
  );
}

export function FormaCustos({ inicial }: { inicial: Custos }) {
  const router = useRouter();
  const [c, setC] = useState<Custos>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  function mudar<K extends keyof Custos>(campo: K, valor: Custos[K]) {
    setC((atual) => ({ ...atual, [campo]: valor }));
    setSalvo(false);
  }

  // O número que dá sentido a todos os campos acima. Recalcula a cada tecla,
  // porque custoVariavelPorKm é puro e não custa nada.
  const porKm = custoVariavelPorKm(c);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const res = await salvarCustos(c);
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setSalvo(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-7">
      {/* O resultado primeiro: é por ele que a pessoa veio. */}
      <section className="rounded-2xl border border-pauta bg-feltro-alto p-6">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
          Cada km te custa
        </p>
        <p className="mt-2 font-serif text-[2.5rem] font-semibold leading-none tnum text-brasa">
          {formatBRL(Math.round(porKm))}
        </p>
        <p className="mt-3 text-sm text-sage">
          É esse número que a calculadora usa para dizer se uma corrida vale a pena.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">Combustível</p>
        <CampoDinheiro
          rotulo="Preço do litro"
          cents={c.fuelPriceCents}
          onChange={(v) => mudar("fuelPriceCents", v)}
        />
        <CampoNumero
          rotulo="Quantos km por litro"
          ajuda="Se não souber, deixe o padrão — dá para acertar depois."
          sufixo="km/l"
          valor={String(Math.round(c.kmPerLiterCenti / 100))}
          onChange={(v) => mudar("kmPerLiterCenti", Number(v || "0") * 100)}
        />
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
          Desgaste da moto
        </p>
        <CampoDinheiro
          rotulo="Manutenção por km"
          ajuda="Óleo, corrente, pneu, revisão — diluídos por quilômetro."
          cents={c.maintenanceCentsPerKm}
          onChange={(v) => mudar("maintenanceCentsPerKm", v)}
        />
        <CampoDinheiro
          rotulo="Quanto vale sua moto"
          ajuda="Deixe em zero se não quiser contar a desvalorização."
          cents={c.vehicleValueCents}
          onChange={(v) => mudar("vehicleValueCents", v)}
        />
        <CampoNumero
          rotulo="Quantos km ela ainda roda"
          sufixo="km"
          valor={String(c.vehicleLifetimeKm)}
          onChange={(v) => mudar("vehicleLifetimeKm", Math.max(1, Number(v || "1")))}
        />
        <CampoNumero
          rotulo="Quanto dela vira desgaste"
          ajuda="Quanto do valor da moto some com o uso, em porcentagem."
          sufixo="%"
          valor={String(c.depreciationFactorCenti)}
          onChange={(v) => mudar("depreciationFactorCenti", Math.min(100, Number(v || "0")))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
          Custo fixo do mês
        </p>
        <CampoDinheiro
          rotulo="Quanto sai todo mês, rodando ou não"
          ajuda="Seguro, IPVA parcelado, MEI. Confira o valor do MEI no Portal do Empreendedor — ele muda por lei."
          cents={c.fixedCostCentsPerMonth}
          onChange={(v) => mudar("fixedCostCentsPerMonth", v)}
        />
        <CampoNumero
          rotulo="Quantos dias você roda por mês"
          sufixo="dias"
          valor={String(c.workedDaysPerMonth)}
          onChange={(v) => mudar("workedDaysPerMonth", Math.min(31, Math.max(1, Number(v || "1"))))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">Sua meta</p>
        <CampoDinheiro
          rotulo="Quanto você quer ganhar por hora"
          ajuda="É contra isso que cada corrida é medida."
          cents={c.targetCentsPerHour}
          onChange={(v) => mudar("targetCentsPerHour", v)}
        />

        <button
          type="button"
          onClick={() => mudar("includeReturnTrip", !c.includeReturnTrip)}
          aria-pressed={c.includeReturnTrip}
          className="flex min-h-13 items-center justify-between gap-4 rounded-xl border border-pauta bg-feltro-alto px-4 py-3 text-left transition active:scale-[.99]"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-creme">Contar o caminho de volta</span>
            <span className="text-xs text-sage">
              Uma corrida que termina longe custa o dobro. Deixe ligado.
            </span>
          </span>
          <span
            className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
              c.includeReturnTrip ? "bg-brasa" : "bg-pauta"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-feltro transition ${
                c.includeReturnTrip ? "translate-x-5" : ""
              }`}
            />
          </span>
        </button>
      </section>

      {erro && <p className="text-sm font-medium text-alerta">{erro}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="flex h-13 items-center justify-center rounded-xl bg-brasa font-serif text-lg font-semibold text-feltro transition active:scale-[.98] disabled:opacity-60"
      >
        {salvando ? "Salvando…" : salvo ? "Salvo!" : "Salvar"}
      </button>
    </div>
  );
}
