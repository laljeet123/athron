import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Allow slightly larger chunks without warning; this is non-functional
    // and only reduces noisy build warnings during the audit.
    chunkSizeWarningLimit: 700,
  },
})
