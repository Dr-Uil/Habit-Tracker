import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` gera um site estático (PWA) em dist/.
// `npm run build:single` gera um único index.html autocontido em dist-single/.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    copyPublicDir: mode !== 'single',
  },
  server: { port: 3001, host: '0.0.0.0' },
}));
