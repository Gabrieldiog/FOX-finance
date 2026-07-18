import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito, Inter, Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { RegistrarSW } from "@/components/registrar-sw";
import { EfeitosMobile } from "@/components/efeitos-mobile";

// Baloo 2: títulos, saldo-herói, logo. Redonda, com "cara de raposa".
const display = Baloo_2({
  variable: "--fonte-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Nunito: corpo e UI. Arredondada, mas séria e muito legível.
const sans = Nunito({
  variable: "--fonte-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Inter: todo número de dinheiro, com algarismos que alinham em coluna.
const num = Inter({
  variable: "--fonte-num",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Redesign "Caderneta Verde": Fraunces (serifa editorial), Hanken Grotesk (corpo),
// Spline Sans Mono (rótulos de razão / metadados).
const serif = Fraunces({
  variable: "--fonte-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const grotesk = Hanken_Grotesk({
  variable: "--fonte-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const mono = Spline_Sans_Mono({
  variable: "--fonte-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Fox Finance — sua grana, do seu jeito",
  description: "Anote gastos e ganhos num toque e veja o resumo da semana e do mês.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Fox Finance", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Libera os env(safe-area-inset-*) do notch e da Dynamic Island.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0fdf4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a120d" },
  ],
};

// Aplica o tema salvo antes da pintura, sem piscar (FOUC).
const scriptTema = `try{var t=localStorage.getItem('fox-tema');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${num.variable} ${serif.variable} ${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <RegistrarSW />
        <EfeitosMobile />
      </body>
    </html>
  );
}
