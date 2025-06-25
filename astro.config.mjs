// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Lexend",
        cssVariable: "--font-lexend",
        weights: [400, 700]
      },
      {
        provider: fontProviders.google(),
        name: "Doto",
        cssVariable: "--font-doto",
        weights: [700, 900]
      },
      {
        provider: fontProviders.google(),
        name: "DM Sans",
        cssVariable: "--font-dmsans",
        weights: [700, 900]
      },
    ],
  },

  integrations: [react()],
});