import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Islands — manages the 3 organically sculpted high-resolution island landmasses in the lake.
 */
export class Islands
{
    constructor()
    {
        this.game = Game.getInstance()
        this.items = []

        // Island definitions (positions, base radii, height profiles, organic shapes)
        this.definitions = [
            {
                id: 'socials',
                name: 'Socials Island',
                position: new THREE.Vector3(-36, 0, -22),
                radiusX: 15,
                radiusZ: 12,
                maxHeight: 3.8,
                seed: 1.4,
                colorSand: '#d4b483',
                colorGrass: '#3a7d44',
                colorHighland: '#2d6a4f',
                colorRock: '#525b63'
            },
            {
                id: 'lab',
                name: 'Lab Island',
                position: new THREE.Vector3(36, 0, -20),
                radiusX: 17,
                radiusZ: 14,
                maxHeight: 4.4,
                seed: 2.8,
                colorSand: '#d4b483',
                colorGrass: '#2f6b52',
                colorHighland: '#1b4332',
                colorRock: '#495057'
            },
            {
                id: 'about',
                name: 'About Island',
                position: new THREE.Vector3(-30, 0, 24),
                radiusX: 13,
                radiusZ: 13,
                maxHeight: 3.4,
                seed: 4.2,
                colorSand: '#d4b483',
                colorGrass: '#447d3a',
                colorHighland: '#356e2c',
                colorRock: '#5a626a'
            }
        ]

        this.createIslands()
    }

    createIslands()
    {
        for(const def of this.definitions)
        {
            const island = this.createOrganicIsland(def)
            this.items.push(island)
        }
    }

    createOrganicIsland(def)
    {
        // High density radial geometry: 120 rings x 96 radial segments for perfectly smooth organic contours
        const meshSize = Math.max(def.radiusX, def.radiusZ) * 2.8
        const segments = 128
        const geometry = new THREE.PlaneGeometry(meshSize, meshSize, segments, segments)
        geometry.rotateX(-Math.PI * 0.5)

        const posAttr = geometry.attributes.position
        const count = posAttr.count
        const colors = new Float32Array(count * 3)

        const sandCol = new THREE.Color(def.colorSand)
        const grassCol = new THREE.Color(def.colorGrass)
        const highCol = new THREE.Color(def.colorHighland)
        const rockCol = new THREE.Color(def.colorRock)

        for(let i = 0; i < count; i++)
        {
            const x = posAttr.getX(i)
            const z = posAttr.getZ(i)

            // Normalized ellipse radius from center
            const nx = x / def.radiusX
            const nz = z / def.radiusZ
            const baseDist = Math.sqrt(nx * nx + nz * nz)
            const angle = Math.atan2(z, x)

            // Organic multi-octave boundary noise (natural bays, inlets, points)
            const noise1 = Math.sin(angle * 3.0 + def.seed) * 0.20 + Math.cos(angle * 5.0 - def.seed) * 0.14
            const noise2 = Math.sin(angle * 9.0 + def.seed * 2.0) * 0.06
            const organicDist = baseDist + noise1 + noise2

            // Elevation profile: smooth bell curve with flat plateau and gentle beach slope
            let height = 0
            if(def.id === 'lab')
            {
                // Level flat plaza top for Lab Island (no bumps or terrain blocking the workstation)
                if(organicDist < 0.75)
                {
                    height = 1.2
                }
                else if(organicDist < 1.0)
                {
                    const t = (organicDist - 0.75) / 0.25
                    const smoothT = t * t * (3 - 2 * t)
                    height = 1.2 * (1.0 - smoothT) - 0.15
                }
                else if(organicDist < 1.25)
                {
                    const t = (organicDist - 1.0) / 0.25
                    const smoothT = t * t * (3 - 2 * t)
                    height = -0.15 - smoothT * 3.0
                }
                else
                {
                    height = -4.0
                }
            }
            else if(organicDist < 1.0)
            {
                // Smooth plateau shaping
                const plateauFactor = Math.cos(organicDist * Math.PI * 0.5)
                const smoothNoise = Math.sin(x * 0.3 + def.seed) * Math.cos(z * 0.3 - def.seed) * 0.35
                height = Math.pow(plateauFactor, 1.25) * def.maxHeight + (smoothNoise * plateauFactor)

                // Shore slope down to water level
                if(organicDist > 0.72)
                {
                    const t = (organicDist - 0.72) / 0.28
                    const smoothT = t * t * (3 - 2 * t) // smoothstep
                    height = height * (1.0 - smoothT * 0.85) - 0.15
                }
            }
            else if(organicDist < 1.25)
            {
                // Underwater shelf slope
                const t = (organicDist - 1.0) / 0.25
                const smoothT = t * t * (3 - 2 * t)
                height = -0.15 - smoothT * 3.0
            }
            else
            {
                height = -4.0 // Deep underwater
            }

            posAttr.setY(i, height)

            // Vertex coloring based on elevation & smooth slope transitions
            const vertexColor = new THREE.Color()
            if(height < 0.6)
            {
                // Sandy beach
                vertexColor.copy(sandCol)
            }
            else if(height < 1.8)
            {
                // Smooth beach to grass transition
                const t = (height - 0.6) / 1.2
                const smoothT = t * t * (3 - 2 * t)
                vertexColor.lerpColors(sandCol, grassCol, smoothT)
            }
            else if(height < 3.0)
            {
                // Lush green plateau
                const t = (height - 1.8) / 1.2
                const smoothT = t * t * (3 - 2 * t)
                vertexColor.lerpColors(grassCol, highCol, smoothT)
            }
            else
            {
                // High ridge
                const t = Math.min(1.0, (height - 3.0) / 1.2)
                vertexColor.lerpColors(highCol, rockCol, t * 0.4)
            }

            colors[i * 3 + 0] = vertexColor.r
            colors[i * 3 + 1] = vertexColor.g
            colors[i * 3 + 2] = vertexColor.b
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.computeVertexNormals()

        // High-quality smooth terrain material without faceted rectangular lines
        const material = new THREE.MeshStandardNodeMaterial({
            vertexColors: true,
            roughness: 0.82,
            metalness: 0.05,
            flatShading: false // Smooth shaded normals
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(def.position)
        mesh.receiveShadow = true
        mesh.castShadow = true
        this.game.scene.add(mesh)

        return {
            ...def,
            mesh
        }
    }
}
