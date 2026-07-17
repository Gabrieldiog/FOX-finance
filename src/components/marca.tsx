// A marca do Fox: o raposo (o mesmo do ícone) + o nome em serifa.
export function FoxGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g transform="translate(256,262)">
        <path d="M-150,-40 L-92,-150 L-40,-66 Z" fill="#e8913f" />
        <path d="M150,-40 L92,-150 L40,-66 Z" fill="#e8913f" />
        <path d="M-150,-40 L-92,-150 L-108,-92 Z" fill="#b5652a" />
        <path d="M150,-40 L92,-150 L108,-92 Z" fill="#b5652a" />
        <path
          d="M-150,-46 C-70,-92 70,-92 150,-46 C150,60 70,150 0,178 C-70,150 -150,60 -150,-46 Z"
          fill="#e8913f"
        />
        <path
          d="M0,178 C-52,150 -96,84 -96,20 C-60,44 -30,52 0,52 C30,52 60,44 96,20 C96,84 52,150 0,178 Z"
          fill="#f5d6b0"
        />
        <path d="M-80,-10 L-40,6 L-72,28 Z" fill="#241a0d" />
        <path d="M80,-10 L40,6 L72,28 Z" fill="#241a0d" />
        <path d="M0,88 L-17,68 L17,68 Z" fill="#241a0d" />
      </g>
    </svg>
  );
}

export function Marca({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <FoxGlyph className="h-6 w-6" />
      <span className="font-display text-xl font-semibold tracking-tight">Fox</span>
    </span>
  );
}
