// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  // Server secrets are read at runtime (process.env in production, .env in dev)
  // rather than inlined at build time, since CI builds without them.
  env: {
    schema: Object.fromEntries(
      [
        "ISSUER_BASE_URL", "KC_CLIENT_ID", "KC_CLIENT_SECRET", "KC_API_URL",
        "IPA_HOST", "IPA_USER", "IPA_PASSWORD",
        "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD",
      ].map((name) => [name, envField.string({ context: "server", access: "secret", optional: true })]),
    ),
  },

  security: {
    allowedDomains: [{ hostname: "dabney.caltech.edu" }],
  },

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