#!/usr/bin/env node
/**
 * Generate public/models3d/tokens/index.json from the contents of that folder.
 * This runs before dev/start to keep the dropdown in sync with available models.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const TOKENS_DIR = path.join(ROOT, 'public', 'models3d', 'tokens')
const INDEX_FILE = path.join(TOKENS_DIR, 'index.json')

try {
    if (!fs.existsSync(TOKENS_DIR)) {
        console.warn(`[generate-token-model-index] Directory not found: ${TOKENS_DIR}`)
        process.exit(0)
    }

    const files = fs
        .readdirSync(TOKENS_DIR)
        .filter((f) => /\.(glb|gltf)$/i.test(f))
        .map((f) => `/models3d/tokens/${f}`)
        .sort()

    fs.writeFileSync(INDEX_FILE, JSON.stringify(files, null, 2))
} catch (err) {
    console.error('[generate-token-model-index] Failed to generate index:', err)
    process.exit(1)
}
