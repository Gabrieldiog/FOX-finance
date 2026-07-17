// Fundo vivo compartilhado pela landing e pelo criar-conta. Aurora de blobs
// verdes que respiram e derivam devagar + grão sutil. CSS puro (roda sem JS,
// leve, GPU) e respeita prefers-reduced-motion (ver .aurora no globals.css).

const GRAO =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

export function FundoVivo({ variante = "claro" }: { variante?: "claro" | "verde" }) {
  const verde = variante === "verde";
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: verde ? "linear-gradient(135deg, var(--verde), var(--verde-vivo))" : "var(--breu)" }}
    >
      <div
        className="aurora absolute -inset-[30%]"
        style={{
          filter: "blur(64px)",
          background: verde
            ? `radial-gradient(38% 44% at 22% 26%, rgba(255,255,255,0.28), transparent 60%),
               radial-gradient(34% 40% at 80% 18%, rgba(255,255,255,0.16), transparent 62%),
               radial-gradient(46% 50% at 62% 86%, rgba(5,46,22,0.28), transparent 60%)`
            : `radial-gradient(38% 44% at 20% 25%, rgba(34,197,94,0.30), transparent 60%),
               radial-gradient(34% 40% at 80% 20%, rgba(21,128,61,0.22), transparent 62%),
               radial-gradient(46% 50% at 60% 85%, rgba(134,239,172,0.34), transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ opacity: verde ? 0.05 : 0.045, mixBlendMode: "multiply", backgroundImage: GRAO }}
      />
    </div>
  );
}
