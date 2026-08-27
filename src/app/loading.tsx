import { FoxGlyph } from "@/components/marca";

// Enquanto o servidor busca os dados, isto aparece no lugar da tela congelada.
// Sem um loading boundary, o Next segura a página inteira e o app parece travado
// — a sensação de lentidão vinha metade daí.
export default function Carregando() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-feltro text-sage">
      <FoxGlyph className="h-10 w-10 animate-pulse" />
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em]">Somando sua grana…</p>
    </main>
  );
}
