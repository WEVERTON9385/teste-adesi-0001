import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Importante para o Electron achar os arquivos
  server: {
    host: true, // Habilita acesso via IP na rede local (Ex: 192.168.x.x)
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});