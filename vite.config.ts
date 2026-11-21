import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This repository is published at https://USERNAME.github.io/pokiee/
  base: '/pokiee/',
})