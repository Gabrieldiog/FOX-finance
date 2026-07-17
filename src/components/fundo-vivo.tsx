// Fundo vivo compartilhado pela landing e pelo criar-conta. Aurora de blobs que
// respiram e derivam devagar + grão sutil + moedas flutuando (opcional).
// CSS puro (leve, GPU) e respeita prefers-reduced-motion (ver globals.css).

const GRAO =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

// posições/tempos fixos (nada de random — SSR estável)
const MOEDAS = [
  { left: "12%", top: "70%", s: 16, d: "0s", t: "9s" },
  { left: "24%", top: "30%", s: 10, d: "-2s", t: "11s" },
  { left: "46%", top: "80%", s: 22, d: "-4s", t: "8s" },
  { left: "68%", top: "24%", s: 14, d: "-1s", t: "10s" },
  { left: "82%", top: "64%", s: 18, d: "-3s", t: "12s" },
  { left: "58%", top: "50%", s: 9, d: "-5s", t: "9.5s" },
  { left: "34%", top: "58%", s: 12, d: "-6s", t: "10.5s" },
];

export function FundoVivo({
  variante = "claro",
  fixo = true,
  moedas = false,
}: {
  variante?: "claro" | "verde";
  fixo?: boolean;
  moedas?: boolean;
}) {
  const verde = variante === "verde";
  return (
    <div
      aria-hidden
      className={`pointer-events-none overflow-hidden ${fixo ? "fixed inset-0 -z-10" : "absolute inset-0"}`}
      style={{ background: verde ? "linear-gradient(140deg, #16a34a, #22c55e 55%, #15803d)" : "var(--breu)" }}
    >
      <div
        className="aurora absolute -inset-[30%]"
        style={{
          filter: "blur(64px)",
          background: verde
            ? `radial-gradient(36% 42% at 24% 24%, rgba(255,255,255,0.42), transparent 60%),
               radial-gradient(32% 38% at 82% 16%, rgba(190,242,210,0.30), transparent 62%),
               radial-gradient(48% 52% at 60% 88%, rgba(5,46,22,0.42), transparent 60%)`
            : `radial-gradient(38% 44% at 20% 25%, rgba(34,197,94,0.30), transparent 60%),
               radial-gradient(34% 40% at 80% 20%, rgba(21,128,61,0.22), transparent 62%),
               radial-gradient(46% 50% at 60% 85%, rgba(134,239,172,0.34), transparent 60%)`,
        }}
      />
      {moedas &&
        MOEDAS.map((m, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: m.left,
              top: m.top,
              width: m.s,
              height: m.s,
              background: verde ? "rgba(255,255,255,0.22)" : "rgba(34,197,94,0.16)",
              boxShadow: verde ? "inset 0 0 0 1.5px rgba(255,255,255,0.3)" : "inset 0 0 0 1.5px rgba(34,197,94,0.25)",
              animation: `flutua ${m.t} ease-in-out ${m.d} infinite`,
            }}
          />
        ))}
      <div
        className="absolute inset-0"
        style={{ opacity: verde ? 0.05 : 0.045, mixBlendMode: "multiply", backgroundImage: GRAO }}
      />
    </div>
  );
}
