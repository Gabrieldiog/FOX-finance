"use client";

import { useEffect } from "react";

// Teclado do iOS: no Safari o layout viewport NÃO encolhe quando o teclado sobe,
// então barra de baixo e FAB fixos ficam escondidos atrás dele. A visualViewport
// API conta quanto a tela visível encolheu; expomos isso em --kb pra quem precisar
// subir junto (ver o FAB e os botões de salvar).
export function EfeitosMobile() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const raiz = document.documentElement;
    const atualizar = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      raiz.style.setProperty("--kb", `${kb}px`);
    };
    atualizar();
    vv.addEventListener("resize", atualizar);
    vv.addEventListener("scroll", atualizar);
    return () => {
      vv.removeEventListener("resize", atualizar);
      vv.removeEventListener("scroll", atualizar);
    };
  }, []);

  return null;
}
