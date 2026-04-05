import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RQSheetWeb",
    short_name: "RQSheetWeb",
    description: "A local-first RuneQuest character sheet web app",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#1f1b16",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
