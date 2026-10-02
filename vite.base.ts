import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Shared by the client, SSR and Worker builds so prerendered markup and client assets agree.
export default defineConfig({
  plugins: [react()],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  build: {
    // No data: URIs, so the CSP can keep img-src 'self'.
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
  },
});
