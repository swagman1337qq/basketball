import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { offlinePlugin } from './pwa/offlinePlugin.mjs';

// `base: './'` keeps asset paths relative so the build works on GitHub Pages
// (served from /<repo>/) as well as from any other static host. offlinePlugin writes the
// service worker that lets the game open and play with no connection.
export default defineConfig({
  base: './',
  plugins: [react(), offlinePlugin()],
  build: { chunkSizeWarningLimit: 800 },
});
