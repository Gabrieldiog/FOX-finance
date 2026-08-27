"use client";

import Link from "next/link";

// Rede de segurança de toda página do app. Sem este arquivo, qualquer falha no
// servidor (banco fora, por exemplo) caía na tela padrão do Next: fundo branco
// e um "Application error: a client-side exception has occurred" em inglês, que
// não diz nada a quem só queria anotar um gasto — e ainda parece que o app
// perdeu os dados da pessoa.
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 bg-feltro px-6 text-center font-grotesk text-creme">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold">Deu problema aqui do nosso lado</h1>
        <p className="text-sm text-sage">
          Não foi culpa sua e nada do que você anotou se perdeu. Tente de novo em instantes.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-13 rounded-xl bg-brilho font-serif text-lg font-semibold text-feltro transition active:scale-[.98]"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-full border border-pauta font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
