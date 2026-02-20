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
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                        three: ['three'],
                        pixi: ['pixi.js', 'pixi-viewport', '@pixi/layout'],
                        mui: ['@mui/material', '@mui/icons-material', '@mui/lab', '@emotion/react', '@emotion/styled'],
                        leaflet: ['leaflet', 'react-leaflet'],
                        tiptap: ['@tiptap/react', '@tiptap/starter-kit'],
                        i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                        markdown: ['react-markdown', 'remark-gfm', 'rehype-sanitize', '@uiw/react-md-editor', 'marked', 'dompurify'],
                        dnd: ['@hello-pangea/dnd'],
                        utils: ['lodash', 'date-fns', 'uuid', 'dexie'],
                        scrollbar: ['smooth-scrollbar'],
                        'google-ai': ['@google/generative-ai'],
                        'color-picker': ['@uiw/react-color'],
                        infra: ['zustand', 'notistack', 'graphql', 'buffer'],
                    },
                },
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['vitest.setup.ts'],
        },
    }
})
