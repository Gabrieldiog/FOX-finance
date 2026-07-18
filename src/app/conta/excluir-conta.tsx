"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { excluirConta } from "@/lib/actions";

export function ExcluirConta() {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    setExcluindo(true);
    const res = await excluirConta();
    if (!res.ok) {
      setExcluindo(false);
      return;
    }
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
