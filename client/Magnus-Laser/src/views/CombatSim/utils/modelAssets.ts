// Try to resolve models bundled under /models3d/tokens at build time (Vite glob)
const globbed = (() => {
    try {
        const found = import.meta.glob('/models3d/tokens/*.{glb,gltf}', { eager: true, import: 'default' })
        return Object.values(found) as string[]
    } catch {
        return []
    }
})()

const STATIC_TOKEN_MODEL_PATHS: string[] = globbed.sort()

export const loadTokenModelPaths = async (): Promise<string[]> => {
    // Always read from index.json to reflect runtime updates, but keep glob as fast path
    if (STATIC_TOKEN_MODEL_PATHS.length > 0) return STATIC_TOKEN_MODEL_PATHS
    const res = await fetch('/models3d/tokens/index.json')
    if (!res.ok) {
        throw new Error(`modelAssets: index.json missing or fetch failed (status ${res.status})`)
    }
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0 && data.every((x) => typeof x === 'string')) {
        return (data as string[]).sort()
    }
    throw new Error('modelAssets: index.json empty or invalid')
}
