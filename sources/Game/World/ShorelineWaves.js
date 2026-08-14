import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Shoreline } from './Shoreline.js'

/**
 * ShorelineWaves — renders stylized, rhythmic animated shore foam ripples (Bruno Simon style)
 * that gently wash against the beaches of the 3 islands and the outer coastline.
 */
export class ShorelineWaves
{
    constructor()
    {
        this.game = Game.getInstance()
        this.group = new THREE.Group()

        this.waveRings = []

        // Shared foam material (semi-transparent soft white, additive blend, no depth write)
        this.foamMaterial = new THREE.MeshBasicNodeMaterial({
            color: '#f0f9ff',
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
            depthWrite: false
        })

        this.createIslandShoreWaves()
        this.createOuterCoastShoreWaves()

        this.game.scene.add(this.group)

        // Animate wave pulses
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    createIslandShoreWaves()
    {
        const islands = [
            { center: { x: -58, z: -38 }, rx: 24, rz: 20, seed: 1.4 },
            { center: { x:  58, z: -35 }, rx: 26, rz: 22, seed: 2.8 },
            { center: { x: -52, z:  44 }, rx: 22, rz: 22, seed: 4.2 }
        ]

        const segments = 64
        const ringLayers = 3 // 3 cascading wave rings per island

        for(const island of islands)
        {
            for(let layer = 0; layer < ringLayers; layer++)
            {
                const geometry = new THREE.BufferGeometry()
                const positions = new Float32Array((segments + 1) * 2 * 3)
                const uvs = new Float32Array((segments + 1) * 2 * 2)
                const indices = []

                for(let i = 0; i <= segments; i++)
                {
                    const angle = (i / segments) * Math.PI * 2
                    const cosA = Math.cos(angle)
                    const sinA = Math.sin(angle)

                    // Organic shoreline noise
                    const noise = Math.sin(angle * 3.0 + island.seed) * 0.05 + Math.cos(angle * 5.0 - island.seed) * 0.03
                    const factor = 1.0 - noise

                    const baseRx = island.rx * factor
                    const baseRz = island.rz * factor
                    const baseRadius = (baseRx * baseRz) / Math.sqrt((baseRz * cosA) ** 2 + (baseRx * sinA) ** 2)

                    // Inner edge (near beach) and outer edge (further into water)
                    const rInner = baseRadius * 0.94
                    const rOuter = baseRadius * 1.06

                    const xInner = island.center.x + cosA * rInner
                    const zInner = island.center.z + sinA * rInner
                    const xOuter = island.center.x + cosA * rOuter
                    const zOuter = island.center.z + sinA * rOuter

                    const vIdx = i * 2
                    // Inner vertex (Y = 0.05 right on water plane)
                    positions[vIdx * 3 + 0] = xInner
                    positions[vIdx * 3 + 1] = 0.05
                    positions[vIdx * 3 + 2] = zInner

                    // Outer vertex
                    positions[(vIdx + 1) * 3 + 0] = xOuter
                    positions[(vIdx + 1) * 3 + 1] = 0.05
                    positions[(vIdx + 1) * 3 + 2] = zOuter

                    uvs[vIdx * 2 + 0] = i / segments
                    uvs[vIdx * 2 + 1] = 0.0

                    uvs[(vIdx + 1) * 2 + 0] = i / segments
                    uvs[(vIdx + 1) * 2 + 1] = 1.0

                    if(i < segments)
                    {
                        const a = vIdx
                        const b = vIdx + 1
                        const c = vIdx + 2
                        const d = vIdx + 3

                        indices.push(a, b, c)
                        indices.push(b, d, c)
                    }
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
                geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
                geometry.setIndex(indices)

                const mat = new THREE.MeshBasicNodeMaterial({
                    color: '#e2f4ff',
                    transparent: true,
                    opacity: 0.45,
                    side: THREE.DoubleSide,
                    depthWrite: false
                })

                const mesh = new THREE.Mesh(geometry, mat)
                this.group.add(mesh)

                this.waveRings.push({
                    mesh,
                    mat,
                    island,
                    layerOffset: layer / ringLayers,
                    basePositions: positions.slice(),
                    segments
                })
            }
        }
    }

    createOuterCoastShoreWaves()
    {
        const segments = 96
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array((segments + 1) * 2 * 3)
        const indices = []

        for(let i = 0; i <= segments; i++)
        {
            const angle = (i / segments) * Math.PI * 2
            const coastR = Shoreline.getCoastRadius(angle)

            const rInner = coastR - 1.8
            const rOuter = coastR + 0.4

            const xInner = Math.cos(angle) * rInner
            const zInner = Math.sin(angle) * rInner
            const xOuter = Math.cos(angle) * rOuter
            const zOuter = Math.sin(angle) * rOuter

            const vIdx = i * 2
            positions[vIdx * 3 + 0] = xInner
            positions[vIdx * 3 + 1] = 0.05
            positions[vIdx * 3 + 2] = zInner

            positions[(vIdx + 1) * 3 + 0] = xOuter
            positions[(vIdx + 1) * 3 + 1] = 0.05
            positions[(vIdx + 1) * 3 + 2] = zOuter

            if(i < segments)
            {
                const a = vIdx
                const b = vIdx + 1
                const c = vIdx + 2
                const d = vIdx + 3

                indices.push(a, b, c)
                indices.push(b, d, c)
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setIndex(indices)

        this.outerCoastMat = new THREE.MeshBasicNodeMaterial({
            color: '#e0f2fe',
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        })

        const mesh = new THREE.Mesh(geometry, this.outerCoastMat)
        this.group.add(mesh)
    }

    update(delta)
    {
        const time = performance.now() * 0.001

        // Outer coast rhythmic breath
        if(this.outerCoastMat)
        {
            const coastPulse = Math.sin(time * 1.8) * 0.5 + 0.5
            this.outerCoastMat.opacity = 0.15 + coastPulse * 0.28
        }

        // Island shore wave expanding ripple animation
        for(const ring of this.waveRings)
        {
            // Progress from 0 to 1 over 3.2 seconds
            const progress = (time * 0.32 + ring.layerOffset) % 1.0
            
            // Expand towards shoreline
            const scaleFactor = 0.94 + progress * 0.12
            
            // Fade in as it forms, fade out as it reaches the sand
            const fade = Math.sin(progress * Math.PI)
            ring.mat.opacity = fade * 0.45

            const posAttr = ring.mesh.geometry.attributes.position
            const basePos = ring.basePositions
            const count = (ring.segments + 1) * 2

            for(let i = 0; i < count; i++)
            {
                const bx = basePos[i * 3 + 0]
                const bz = basePos[i * 3 + 2]
                
                const dx = bx - ring.island.center.x
                const dz = bz - ring.island.center.z

                posAttr.setX(i, ring.island.center.x + dx * scaleFactor)
                posAttr.setZ(i, ring.island.center.z + dz * scaleFactor)
            }

            posAttr.needsUpdate = true
        }
    }
}
