"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SairBotao() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      className="h-11 rounded-full border border-zinc-300 px-5 font-medium dark:border-zinc-700"
    >
      Sair
    </button>
  );
}
