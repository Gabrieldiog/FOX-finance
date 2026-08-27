"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { excluirConta } from "@/lib/actions";

export function ExcluirConta() {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir() {
    setExcluindo(true);
    setErro(null);
    const res = await excluirConta();
    if (!res.ok) {
      setExcluindo(false);
      // Antes daqui saía um return mudo: a pessoa pedia para apagar a conta,
      // o botão voltava ao normal e nada dizia se apagou ou não.
      setErro(res.erro);
      return;
    }
    // A ORDEM IMPORTA: excluirConta lê a sessão pelo cookie da requisição.
    // Sair antes deixaria a action sem sessão e a conta nunca seria apagada.
    await authClient.signOut().catch(() => {});
    router.push("/");
    router.refresh();
  }

  if (!confirmar) {
    return (
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        className="h-11 rounded-full text-sm font-medium text-alerta transition active:scale-[.98]"
      >
        Excluir minha conta
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-alerta/40 bg-feltro-alto p-4 text-creme">
      <p className="text-sm">
        Isso apaga sua conta e <strong>todos os seus lançamentos</strong>, pra sempre. Tem certeza?
      </p>
      {erro && <p className="text-sm font-medium text-alerta">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="h-11 flex-1 rounded-full border border-pauta text-sm text-sage transition active:scale-[.98]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="h-11 flex-1 rounded-full bg-alerta text-sm font-medium text-feltro transition active:scale-[.98] disabled:opacity-60"
        >
          {excluindo ? "Excluindo…" : "Sim, excluir tudo"}
        </button>
      </div>
    </div>
  );
}
