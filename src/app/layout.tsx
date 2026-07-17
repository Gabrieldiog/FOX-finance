import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { RegistrarSW } from "@/components/registrar-sw";

const display = Fraunces({
  variable: "--fonte-display",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sans = Hanken_Grotesk({
  variable: "--fonte-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fox — gestão financeira",
  description: "Anote gastos e ganhos e veja o resumo da semana e do mês.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Fox", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#17130d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
