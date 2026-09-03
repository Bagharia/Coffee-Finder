import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Le front appelle /api sur sa propre origine et Vite relaie vers l'API.
    // Sans ça, 5173 et 3000 sont deux origines distinctes et le navigateur
    // refuse d'envoyer le cookie de session sur les requêtes.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
