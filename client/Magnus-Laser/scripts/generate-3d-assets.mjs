// Script to generate small GLB assets for the 3D board (tokens and blasts)
// Assets are procedurally created and intended to be CC0/public domain.

import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Minimal FileReader polyfill so GLTFExporter works in Node
global.FileReader = class {
    constructor() {
        this.onload = null
        this.onloadend = null
        this.onerror = null
        this.result = null
    }

    readAsArrayBuffer(blob) {
        blob.arrayBuffer()
            .then((buf) => {
                this.result = buf
                if (this.onload) this.onload({ target: this })
                if (this.onloadend) this.onloadend({ target: this })
            })
            .catch((err) => this.onerror && this.onerror(err))
    }

    readAsDataURL(blob) {
        blob.arrayBuffer()
            .then((buf) => {
                const base64 = Buffer.from(buf).toString('base64')
                this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`
                if (this.onload) this.onload({ target: this })
                if (this.onloadend) this.onloadend({ target: this })
            })
            .catch((err) => this.onerror && this.onerror(err))
    }
}

const exporter = new GLTFExporter()
const rootDir = path.resolve('public', 'models3d')
const tokensDir = path.join(rootDir, 'tokens')
const blastsDir = path.join(rootDir, 'blasts')

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true })
ensureDir(tokensDir)
ensureDir(blastsDir)

const neonMaterial = (color, { alpha = 0.9, metalness = 0.3, roughness = 0.35 } = {}) =>
    new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color).multiplyScalar(0.8),
        metalness,
        roughness,
        transparent: alpha < 1,
        opacity: alpha,
    })

const metalMaterial = (color) =>
    new THREE.MeshStandardMaterial({
        color,
        metalness: 0.7,
        roughness: 0.25,
    })

const groundToZero = (group) => {
    const box = new THREE.Box3().setFromObject(group)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const offset = new THREE.Vector3(center.x, box.min.y, center.z)
    group.position.sub(offset)
}

const exportGlb = async (object, outPath) =>
    new Promise((resolve, reject) => {
        groundToZero(object)
        exporter.parse(
            object,
            (gltf) => {
                let buffer
                if (gltf instanceof ArrayBuffer) {
                    buffer = Buffer.from(gltf)
                } else if (ArrayBuffer.isView(gltf)) {
                    buffer = Buffer.from(gltf.buffer)
                } else {
                    buffer = Buffer.from(JSON.stringify(gltf, null, 2))
                }
                fs.writeFileSync(outPath, buffer)
                resolve()
            },
            (error) => reject(error),
            { binary: true }
        )
    })

// Token builders -------------------------------------------------------------

const buildEnforcer = () => {
    const group = new THREE.Group()

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16), metalMaterial(0x3a3a42))
    group.add(base)

    const core = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.9), neonMaterial(0x4ad0ff))
    core.position.y = 0.7
    group.add(core)

    const visor = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 32), neonMaterial(0xff3bd4, { alpha: 0.8 }))
    visor.rotation.x = Math.PI / 2
    visor.position.y = 1.3
    group.add(visor)

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), neonMaterial(0xffed5f))
    antenna.position.y = 1.8
    group.add(antenna)

    return group
}

const buildRunner = () => {
    const group = new THREE.Group()

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.15, 14), metalMaterial(0x2f2f35))
    group.add(base)

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 12), neonMaterial(0x6cf38f))
    body.position.y = 0.8
    group.add(body)

    const fins = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 4), neonMaterial(0x25c7ff, { alpha: 0.85 }))
    fins.position.y = 1.4
    fins.rotation.y = Math.PI / 4
    group.add(fins)

    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 10), neonMaterial(0xff8c37))
    thruster.position.y = 0.3
    group.add(thruster)

    return group
}

const buildDrone = () => {
    const group = new THREE.Group()

    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.2, 0.25, 20), neonMaterial(0x00f0ff, { alpha: 0.8 }))
    dish.rotation.x = Math.PI
    dish.position.y = 0.35
    group.add(dish)

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), neonMaterial(0xff66f0))
    core.position.y = 0.65
    group.add(core)

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 8, 28), neonMaterial(0x6cffb5, { alpha: 0.7 }))
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.55
    group.add(ring)

    const sensor = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), metalMaterial(0x44444a))
    sensor.position.y = 1.05
    group.add(sensor)

    return group
}

const buildHacker = () => {
    const group = new THREE.Group()

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.4, 14), neonMaterial(0x68a7ff))
    pillar.position.y = 0.8
    group.add(pillar)

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 24), neonMaterial(0x9c7bff, { alpha: 0.75 }))
    halo.rotation.x = Math.PI / 2
    halo.position.y = 1.35
    group.add(halo)

    const shards = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), neonMaterial(0x00ffd1, { alpha: 0.8 }))
    shards.position.set(0, 1.55, 0)
    group.add(shards)

    return group
}

const buildGhost = () => {
    const group = new THREE.Group()

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 12), metalMaterial(0x24242a))
    group.add(base)

    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 12), neonMaterial(0x7fffff, { alpha: 0.78 }))
    cloak.position.y = 0.75
    group.add(cloak)

    const eyes = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), neonMaterial(0xff3377, { alpha: 0.9 }))
    eyes.position.y = 1
    group.add(eyes)

    return group
}

// Blast builders -------------------------------------------------------------

const buildCircleBlast = () => {
    const group = new THREE.Group()
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), neonMaterial(0xff8233, { alpha: 0.7 }))
    group.add(core)
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14), neonMaterial(0xffd166, { alpha: 0.35 }))
    group.add(shell)
    return group
}

const buildConeBlast = () => {
    const group = new THREE.Group()
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2, 18), neonMaterial(0xff4da3, { alpha: 0.75 }))
    cone.position.y = 1
    group.add(cone)

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 12), neonMaterial(0x7cf2ff))
    core.position.y = 0.3
    group.add(core)
    return group
}

const buildRectBlast = () => {
    const group = new THREE.Group()
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1), neonMaterial(0xff5e5e, { alpha: 0.55 }))
    plate.position.y = 0.1
    group.add(plate)

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.05, 1.1), neonMaterial(0x2affff, { alpha: 0.35 }))
    frame.position.y = 0.15
    group.add(frame)
    return group
}

const buildGrenadeBlast = () => {
    const group = new THREE.Group()
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), neonMaterial(0xff5f5f, { alpha: 0.85 }))
    core.position.y = 0.55
    group.add(core)

    const shards = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), neonMaterial(0xffe08a, { alpha: 0.4 }))
    shards.position.y = 0.55
    group.add(shards)

    const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 6, 20), neonMaterial(0x9cf8ff, { alpha: 0.35 }))
    pulse.rotation.x = Math.PI / 2
    pulse.position.y = 0.25
    group.add(pulse)

    return group
}

async function main() {
    const tasks = [
        { name: path.join(tokensDir, 'token_enforcer.glb'), builder: buildEnforcer },
        { name: path.join(tokensDir, 'token_runner.glb'), builder: buildRunner },
        { name: path.join(tokensDir, 'token_drone.glb'), builder: buildDrone },
        { name: path.join(tokensDir, 'token_hacker.glb'), builder: buildHacker },
        { name: path.join(tokensDir, 'token_ghost.glb'), builder: buildGhost },
        { name: path.join(blastsDir, 'blast_grenade.glb'), builder: buildGrenadeBlast },
        { name: path.join(blastsDir, 'blast_circle.glb'), builder: buildCircleBlast },
        { name: path.join(blastsDir, 'blast_cone30.glb'), builder: buildConeBlast },
        { name: path.join(blastsDir, 'blast_rectangle.glb'), builder: buildRectBlast },
    ]

    for (const task of tasks) {
        const mesh = task.builder()
        await exportGlb(mesh, task.name)
        console.log(`Generated ${task.name}`)
    }
}

main().catch((err) => {
    console.error('Failed to generate assets', err)
    process.exit(1)
})
