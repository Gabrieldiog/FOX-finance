// A marca do Fox Finance: a raposa (versão estática, leve, do mascote) + o nome.
// Pro header e outros cantos onde não precisa animar.
export function FoxGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      {/* Orelhas */}
      <path d="M 26 8 L 51 36 L 33 46 Z" fill="#fb923c" stroke="#fb923c" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 31 18 L 45 35 L 34 40 Z" fill="#fdba74" strokeLinejoin="round" />
      <path d="M 94 8 L 69 36 L 87 46 Z" fill="#fb923c" stroke="#fb923c" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 89 18 L 75 35 L 86 40 Z" fill="#fdba74" strokeLinejoin="round" />
      {/* Rosto */}
      <path
        d="M 30 32 C 18 42 18 66 34 80 C 44 90 76 90 86 80 C 102 66 102 42 90 32 C 76 24 44 24 30 32 Z"
        fill="#fb923c"
        stroke="#fb923c"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M 30 62 L 19 66 L 30 74 Z" fill="#fff7ed" stroke="#fff7ed" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 90 62 L 101 66 L 90 74 Z" fill="#fff7ed" stroke="#fff7ed" strokeWidth="3" strokeLinejoin="round" />
      <path
        d="M 60 48 C 42 48 33 62 37 74 C 41 86 52 90 60 90 C 68 90 79 86 83 74 C 87 62 78 48 60 48 Z"
        fill="#fff7ed"
      />
      <circle cx="47" cy="54" r="5" fill="#241a12" />
      <circle cx="45.4" cy="52" r="1.6" fill="#ffffff" />
      <circle cx="73" cy="54" r="5" fill="#241a12" />
      <circle cx="71.4" cy="52" r="1.6" fill="#ffffff" />
      <path d="M 54 63 Q 60 61 66 63 Q 63 72 60 72 Q 57 72 54 63 Z" fill="#431407" />
    </svg>
  );
}

export function Marca({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ""}`}>
      <FoxGlyph className="h-7 w-7" />
      <span className="font-display text-xl font-bold tracking-tight text-nevoa">
        Fox <span className="text-verde-texto">Finance</span>
      </span>
    </span>
  );
}
