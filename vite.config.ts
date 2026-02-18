import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
      },
      manifest: {
        name: "TesfaPay — Global Bank Ethiopia",
        short_name: "TesfaPay",
        description: "Ethiopia's premier mobile e-wallet by Global Bank Ethiopia",
        theme_color: "#1a6645",
        background_color: "#0d1520",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
          { src: "/favicon.ico", sizes: "192x192", type: "image/png" },
          { src: "/favicon.ico", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
