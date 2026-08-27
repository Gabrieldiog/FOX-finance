"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SairBotao() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      className="-m-2 inline-flex min-h-11 items-center p-2 transition-opacity hover:opacity-60"
    >
      Sair
    </button>
  );
}
