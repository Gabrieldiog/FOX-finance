import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fox — gestão financeira",
    short_name: "Fox",
    description: "Anote gastos e ganhos e veja o resumo da semana e do mês.",
    start_url: "/",
    display: "standalone",
    background_color: "#17140f",
    theme_color: "#17140f",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
