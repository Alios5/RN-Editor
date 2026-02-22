import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'assets/**/*'],
      manifest: {
        name: 'Rhythmnator Editor',
        short_name: 'RN Editor',
        description: 'Éditeur de niveaux pour Rhythmnator',
        theme_color: '#1b1c23',
        background_color: '#1b1c23',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,ogg,json}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB to handle larger audio assets if needed
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
