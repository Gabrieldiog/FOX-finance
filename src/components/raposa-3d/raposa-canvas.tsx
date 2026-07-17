"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FoxMascote, type Emocao } from "@/components/fox-mascote";

// O <Canvas> usa WebGL/window — só no cliente, nunca no servidor.
const RaposaCena = dynamic(() => import("./raposa-cena"), { ssr: false });

function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export function RaposaCanvas({
  size = 320,
  emocao = "neutro",
  seguirMouse = true,
}: {
  size?: number;
  emocao?: Emocao;
  seguirMouse?: boolean;
}) {
  // Só renderiza o 3D depois de montar (evita mismatch de hidratação) e se houver WebGL.
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(temWebGL());
  }, []);

  if (!ok) {
    // Sem WebGL → cai pra raposa SVG (enriquecimento progressivo, nunca requisito).
    return <FoxMascote size={size} emocao={emocao} seguirMouse={seguirMouse} />;
  }

  return (
    <div style={{ width: size, height: size }}>
      <RaposaCena emocao={emocao} seguirMouse={seguirMouse} />
    </div>
  );
}
