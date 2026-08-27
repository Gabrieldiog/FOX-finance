import { formatBRL } from "@/lib/format";
import { IconeCategoria } from "./icone-categoria";

export type LinhaCategoria = {
  name: string;
  icon: string;
  color: string;
  total: number;
};

// A lista de "para onde foi o dinheiro", usada no início e em Estatísticas.
//
// Antes as linhas ficavam soltas no fundo da página, sem nada em volta — cada
// categoria parecia boiar por conta própria. Agora vivem dentro de um card com
// divisórias, como todo o resto do app, e cada uma mostra quanto representa do
// total: sem isso, a barra é uma proporção sem número, e a pessoa não sabe se
// aquele gasto é a metade ou um décimo do mês.
export function ListaCategorias({
  titulo,
  itens,
  vazio = "Nada neste período.",
}: {
  titulo: string;
  itens: LinhaCategoria[];
  vazio?: string;
}) {
  const total = itens.reduce((s, c) => s + c.total, 0);
  const maior = Math.max(1, ...itens.map((c) => c.total));

  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">{titulo}</p>

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-pauta bg-feltro-alto px-5 py-6 text-center text-sm text-sage">
          {vazio}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pauta bg-feltro-alto">
          {itens.map((c, i) => {
            const fatia = total > 0 ? Math.round((c.total / total) * 100) : 0;
            return (
              <div
                key={`${c.name}-${i}`}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i > 0 ? "border-t border-pauta/60" : ""
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${c.color}1f`, color: c.color }}
                >
                  <IconeCategoria nome={c.icon} className="h-[18px] w-[18px]" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-creme">{c.name}</span>
                    <span className="shrink-0 font-serif text-sm tnum text-creme">
                      {formatBRL(c.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pauta">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.total / maior) * 100}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                    {/* Largura fixa pra a coluna de porcentagem não dançar
                        quando um valor tem dois dígitos e o outro tem três. */}
                    <span className="w-9 shrink-0 text-right font-mono text-[0.62rem] tnum text-sage">
                      {fatia}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
