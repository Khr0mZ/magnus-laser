# 3D Assets for Combat Simulator

This directory contains 3D models and assets for the cyberpunk-themed 3D combat simulator.

## Directory Structure

-   `tokens/` - Character/miniature models for tokens
-   `blasts/` - Blast effect models (explosions, energy blasts, etc.)
-   `walls/` - Wall texture maps and materials
-   `ui/` - UI element models (labels, indicators)
-   `materials/` - Shared material textures

## Bundled Assets (CC0/procedural)

-   Tokens: `token_enforcer.glb`, `token_runner.glb`, `token_drone.glb`, `token_hacker.glb`, `token_ghost.glb`
-   Blasts: `blast_grenade.glb`, `blast_circle.glb`, `blast_cone30.glb`, `blast_rectangle.glb`
-   Walls: `wall_metal_grid.png`, `wall_concrete_noise.png`, `wall_neon_stripes.png`
-   Generation scripts: `scripts/generate-3d-assets.mjs` (models) and `scripts/generate-wall-textures.ps1` (textures)

## Asset Requirements

### Tokens

-   Format: GLB (preferred) or GLTF
-   Style: Cyberpunk, sci-fi, futuristic
-   Size: Simple/low-poly models (< 500KB each)
-   License: CC0 or compatible

### Blasts

-   Format: GLB or GLTF
-   Types needed:
    -   Grenade explosion
    -   Circle energy blast
    -   Square area effect
    -   Cone flame/energy

### Walls

-   Format: PNG/JPG texture maps
-   Types: Metal, concrete, neon edges
-   Resolution: 512x512 or 1024x1024

## Recommended Sources

1. **Poly Haven** (https://polyhaven.com/models)

    - Search: "character", "robot", "cyberpunk"
    - All assets are CC0

2. **Sketchfab** (https://sketchfab.com)

    - Filter by CC0 license
    - Search: "cyberpunk", "character", "miniature"

3. **Kenney.nl**

    - Free game assets
    - Simple, clean models

4. **OpenGameArt.org**
    - Search: "cyberpunk", "sci-fi"
    - Various licenses, check compatibility

## Usage

Assets are loaded automatically by the ModelLoader system. Place GLB/GLTF files in the appropriate directories and they will be available for use.

Fallback procedural models are used if assets fail to load or are not available.
