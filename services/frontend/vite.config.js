import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const authUrl = env.VITE_AUTH_API_URL || 'http://127.0.0.1:8000'
  const backendUrl = env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api/auth': {
          target: authUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/auth/, '/auth'),
        },
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
