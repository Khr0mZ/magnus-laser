import * as THREE from 'three'

/**
 * Create cyberpunk-style materials
 */

export function createCyberpunkWallMaterial(
    color: number,
    alpha: number,
    texture?: THREE.Texture,
    width?: number,
    height?: number,
    gridSize?: number
): THREE.MeshStandardMaterial {
    // Clone texture if provided to avoid modifying the original
    let finalTexture = texture
    if (texture && width !== undefined && height !== undefined) {
        // Clone texture to set custom repeat
        finalTexture = texture.clone()
        // Texture is 512x512 pixels
        // Use gridSize as reference: if gridSize is provided, use it as the scale
        // Otherwise, assume 1 unit = 1 texture repetition (512px)
        const textureScale = gridSize ?? 512
        // Calculate repeat: how many times the texture should tile across the wall
        // For a 512x512 texture, if we want it to tile once per gridSize units:
        finalTexture.repeat.set(width / textureScale, height / textureScale)
        finalTexture.wrapS = THREE.RepeatWrapping
        finalTexture.wrapT = THREE.RepeatWrapping
    }

    // When texture is present, use white color to preserve original texture colors
    // Otherwise, use the provided color
    const materialColor = finalTexture ? 0xffffff : color

    const materialConfig: THREE.MeshStandardMaterialParameters = {
        color: materialColor,
        metalness: 0.8,
        roughness: 0.2,
        emissive: finalTexture ? new THREE.Color(0x000000) : new THREE.Color(color).multiplyScalar(0.05),
        transparent: alpha < 1,
        opacity: alpha,
        side: THREE.DoubleSide,
    }

    // Only include map if texture exists (avoid undefined warning)
    if (finalTexture) {
        materialConfig.map = finalTexture
    }

    return new THREE.MeshStandardMaterial(materialConfig)
}

export function createCyberpunkTokenMaterial(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.4,
        emissive: new THREE.Color(color).multiplyScalar(0.2),
    })
}

export function createCyberpunkBlastMaterial(alpha: number = 0.7, texture?: THREE.Texture): THREE.MeshStandardMaterial {
    // All blasts use the same color
    const color = 0xff4400

    // Create a clipping plane to clip everything below Y=0 (below the map)
    // Plane normal points upward (0, 1, 0) and passes through origin
    const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    // Clone texture if provided to avoid modifying the original
    let finalTexture = texture
    if (texture) {
        finalTexture = texture.clone()
        finalTexture.wrapS = THREE.RepeatWrapping
        finalTexture.wrapT = THREE.RepeatWrapping
    }

    // When texture is present, use white color to preserve original texture colors
    // Otherwise, use the provided color
    const materialColor = finalTexture ? 0xffffff : color

    // Orange glow color for soft light emission
    const orangeGlow = new THREE.Color(0xff6600) // Orange color

    const materialConfig: THREE.MeshStandardMaterialParameters = {
        color: materialColor,
        emissive: finalTexture 
            ? orangeGlow.multiplyScalar(0.3) // Soft orange glow when texture is present
            : new THREE.Color(color).multiplyScalar(0.6),
        transparent: true,
        opacity: alpha,
        side: THREE.DoubleSide,
        clippingPlanes: [clippingPlane],
        metalness: finalTexture ? 0.3 : 0.0,
        roughness: finalTexture ? 0.7 : 0.5,
    }

    // Only include map if texture exists
    if (finalTexture) {
        materialConfig.map = finalTexture
    }

    return new THREE.MeshStandardMaterial(materialConfig)
}

export function createCyberpunkGridMaterial(color: number, alpha: number): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: alpha,
    })
}

export function createNeonGlowMaterial(color: number, intensity: number = 1.0): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: new THREE.Color(color).multiplyScalar(intensity),
        transparent: true,
        opacity: 0.8,
    })
}

export function createActiveTokenMaterial(baseColor: number): THREE.MeshStandardMaterial {
    const highlight = new THREE.Color(baseColor).lerp(new THREE.Color(0xffff00), 0.6)
    return new THREE.MeshStandardMaterial({
        color: highlight,
        emissive: highlight.clone().multiplyScalar(0.5),
        metalness: 0.7,
        roughness: 0.3,
    })
}

export function createPendingTokenMaterial(baseColor: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: new THREE.Color(baseColor).multiplyScalar(0.1),
        transparent: true,
        opacity: 0.5,
        metalness: 0.5,
        roughness: 0.5,
    })
}
