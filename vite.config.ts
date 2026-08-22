import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    optimizeDeps: {
      include: ['@react-three/fiber', '@react-three/drei', 'three', 'gsap', 'lucide-react', 'clsx', 'tailwind-merge'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] // Exclude problematic binary libs if any
    },
    build: {
      chunkSizeWarningLimit: 2000
    }
  };
});
