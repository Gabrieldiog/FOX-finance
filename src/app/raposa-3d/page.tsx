import { RaposaCanvas } from "@/components/raposa-3d/raposa-canvas";

// Rota isolada de experimento — não linkada do app. A raposa 3D + a marca.
export default function Raposa3D() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-breu p-8">
      <RaposaCanvas size={400} />

      {/* A marca, bem bonita, embaixo da raposa */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">
          Fox <span className="bg-gradient-to-r from-verde to-verde-vivo bg-clip-text text-transparent">Finance</span>
        </h1>
        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-nevoa-fraca">
          sua grana, do seu jeito
        </p>
      </div>
    </main>
  );
}
