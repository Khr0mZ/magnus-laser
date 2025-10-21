import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(() => {
    const root = dirname(fileURLToPath(import.meta.url))
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(root, 'src'),
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['vitest.setup.ts'],
        },
    }
})
