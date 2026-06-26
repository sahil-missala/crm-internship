// Frontend dev server: port 5175 (chosen after checking ss -tulnp)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    host: '0.0.0.0' // Allows access from outside the docker container
  }
});
