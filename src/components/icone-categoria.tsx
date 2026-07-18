import type { ReactNode, SVGProps } from "react";

// Ícones de categoria em linha (24×24, stroke = currentColor). Herdam a cor de
// quem os envolve, então a mesma peça serve chip clara, círculo colorido, etc.
// As chaves batem com src/lib/categorias.ts e com o seed. Sem emoji, sem asset
// externo — tudo inline. Chave desconhecida cai no "dots".
const CAMINHOS: Record<string, ReactNode> = {
  cart: (
    <>
      <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <path d="M2.5 3.5h2.2l2 11a1.7 1.7 0 0 0 1.7 1.4h8.1a1.7 1.7 0 0 0 1.6-1.2L21 7.5H5.4" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.6V20h13V9.6" />
      <path d="M9.8 20v-5.2h4.4V20" />
    </>
  ),
  car: (
    <>
      <path d="M5 11.5l1.4-4A2 2 0 0 1 8.3 6.2h7.4a2 2 0 0 1 1.9 1.3l1.4 4" />
      <path d="M3.5 11.5h17a1 1 0 0 1 1 1v4.2h-2.4" />
      <path d="M5.9 16.7H3.5v-4.2a1 1 0 0 1 1-1" />
      <path d="M7.5 16.7h9" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
    </>
  ),
  health: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="M12 8.3v7.4" />
      <path d="M8.3 12h7.4" />
    </>
  ),
  book: (
    <>
      <path d="M6 4h8.5a2.5 2.5 0 0 1 2.5 2.5V20a1.4 1.4 0 0 0-1.4-1.4H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M9 4.2v14" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M8.4 13.8a4.2 4.2 0 0 0 7.2 0" />
      <path d="M9.2 9.6h.02" />
      <path d="M14.8 9.6h.02" />
    </>
  ),
  food: (
    <>
      <path d="M7 3.2v4.6a1.6 1.6 0 0 0 3.2 0V3.2" />
      <path d="M8.6 7.8V20.8" />
      <path d="M16.2 20.8V3.2c1.9 1 2.9 3.4 2.9 6.2 0 2-1.1 3.2-2.9 3.2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2Z" />
      <path d="M9 8h6" />
      <path d="M9 11.5h6" />
      <path d="M9 15h4" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 8.5h11v4.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
      <path d="M16 9.5h1.8a2.4 2.4 0 0 1 0 4.8H16" />
      <path d="M8 3.4c-.5.8-.5 1.6 0 2.4" />
      <path d="M11.5 3.4c-.5.8-.5 1.6 0 2.4" />
      <path d="M6.5 20.5h9" />
    </>
  ),
  gift: (
    <>
      <path d="M4.5 12v7.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V12" />
      <rect x="3.5" y="8.5" width="17" height="3.5" rx="1" />
      <path d="M12 8.5v12" />
      <path d="M12 8.5C10.6 5 7.5 5.2 7.5 7c0 1.5 2.5 1.5 4.5 1.5Z" />
      <path d="M12 8.5C13.4 5 16.5 5.2 16.5 7c0 1.5-2.5 1.5-4.5 1.5Z" />
    </>
  ),
  heart: <path d="M12 20s-6.8-4.3-9-8.6A4.5 4.5 0 0 1 12 6.7a4.5 4.5 0 0 1 9 4.7C18.8 15.7 12 20 12 20Z" />,
  plane: (
    <>
      <path d="M20.5 3.5 3.6 9.9a.6.6 0 0 0 0 1.1l6.7 2.6 2.6 6.7a.6.6 0 0 0 1.1 0Z" />
      <path d="M20.5 3.5 10.3 13.6" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.6" />
      <path d="M10.8 18h2.4" />
    </>
  ),
  shirt: (
    <path d="M8.6 3.2 4.4 6l2.1 2.9 2-1.3V20.5h7V7.6l2 1.3L19.6 6l-4.2-2.8a3.4 3.4 0 0 1-6.8 0Z" />
  ),
  tools: (
    <path d="M15.5 6.2a3.6 3.6 0 0 0-4.7 4.6l-6.4 6.4a1.7 1.7 0 0 0 2.4 2.4l6.4-6.4a3.6 3.6 0 0 0 4.6-4.7L15 10.9l-1.9-1.9Z" />
  ),
  wallet: (
    <>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H16" />
      <rect x="3.5" y="7" width="17" height="12" rx="2.6" />
      <path d="M20.5 11h-3.8a2 2 0 0 0 0 4h3.8" />
      <path d="M16.7 13h.02" />
    </>
  ),
  bill: (
    <>
      <path d="M7 3.5h6.5L18 8v12.5H7Z" />
      <path d="M13.3 3.5V8H18" />
      <path d="M10 12.5h5" />
      <path d="M10 16h5" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M4 9.5v5" />
      <path d="M6.5 7.5v9" />
      <path d="M17.5 7.5v9" />
      <path d="M20 9.5v5" />
      <path d="M6.5 12h11" />
    </>
  ),
  pet: (
    <>
      <circle cx="6.6" cy="12.2" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="12.2" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9.6" cy="8.4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="8.4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 13.2c-2.1 0-3.9 1.6-3.9 3.5 0 1.5 1.2 2.3 2.5 2.3.8 0 1-.3 1.4-.3s.6.3 1.4.3c1.3 0 2.5-.8 2.5-2.3 0-1.9-1.8-3.5-3.9-3.5Z" />
    </>
  ),
  salary: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="2.4" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M6 9.8h.02" />
      <path d="M18 14.2h.02" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 8.4v7.2" />
      <path d="M8.4 12h7.2" />
    </>
  ),
  pix: (
    <path d="M9.3 4.1a3.8 3.8 0 0 1 5.4 0l5.2 5.2a3.8 3.8 0 0 1 0 5.4l-5.2 5.2a3.8 3.8 0 0 1-5.4 0l-5.2-5.2a3.8 3.8 0 0 1 0-5.4Z" />
  ),
  dots: (
    <>
      <circle cx="5.5" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </>
  ),
};

export function IconeCategoria({ nome, ...props }: { nome: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {CAMINHOS[nome] ?? CAMINHOS.dots}
    </svg>
  );
}
