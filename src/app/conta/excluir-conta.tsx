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
        className="h-11 rounded-full text-sm font-medium text-red-600"
      >
        Excluir minha conta
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 p-4 dark:border-red-900/50">
      <p className="text-sm">
        Isso apaga sua conta e <strong>todos os seus lançamentos</strong>, pra sempre. Tem certeza?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="h-11 flex-1 rounded-full border border-zinc-300 text-sm dark:border-zinc-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={excluir}
          disabled={excluindo}
          className="h-11 flex-1 rounded-full bg-red-600 text-sm font-medium text-white disabled:opacity-60"
        >
          {excluindo ? "Excluindo…" : "Sim, excluir tudo"}
        </button>
      </div>
    </div>
  );
}
