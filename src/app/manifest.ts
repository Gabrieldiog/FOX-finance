import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fox Finance",
    short_name: "Fox Finance",
    description: "Anote gastos e ganhos num toque e veja o resumo da semana e do mês.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0fdf4",
    theme_color: "#15803d",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
