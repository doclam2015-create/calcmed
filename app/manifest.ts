import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CalcMed",
    short_name: "CalcMed",
    description: "Calculadoras, scores y referencias clínicas en español.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f2",
    theme_color: "#0b5f63",
    orientation: "any",
    categories: ["medical", "health", "education"],
    shortcuts: [
      { name: "Calculadoras", short_name: "Calcular", url: "/" },
      { name: "Scores clínicos", short_name: "Scores", url: "/" },
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
