import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Islands — manages the 3 organically sculpted island landmasses in the expanded lake.
 * Built using radial disc geometry to ensure 100% smooth, circular underwater shelves with zero rectangular edges.
 */
export class Islands
{
    constructor()
    {
        this.game = Game.getInstance()
        this.items = []

        // Expanded island definitions (positions, base radii, height profiles, organic shapes)
        this.definitions = [
            {
                id: 'socials',
                name: 'Socials Island',
                position: new THREE.Vector3(-58, 0, -38),
                radiusX: 24,
                radiusZ: 20,
                maxHeight: 5.2,
                seed: 1.4,
                colorSand: '#d4b483',
                colorGrass: '#3a7d44',
                colorHighland: '#2d6a4f',
                colorRock: '#525b63'
            },
            {
                id: 'lab',
                name: 'Lab Island',
                position: new THREE.Vector3(58, 0, -35),
                radiusX: 26,
                radiusZ: 22,
                maxHeight: 5.5,
                seed: 2.8,
                colorSand: '#d4b483',
                colorGrass: '#2f6b52',
                colorHighland: '#1b4332',
                colorRock: '#495057'
            },
            {
                id: 'about',
                name: 'About Island',
                position: new THREE.Vector3(-52, 0, 44),
                radiusX: 22,
                radiusZ: 22,
                maxHeight: 4.8,
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
        // 100% Radial Disc Geometry: 144 radial rays x 96 concentric rings
        const maxRadius = Math.max(def.radiusX, def.radiusZ) * 1.6
        const radialSegments = 144
        const ringSegments = 96

        const geometry = new THREE.RingGeometry(0.001, maxRadius, radialSegments, ringSegments)
        geometry.rotateX(-Math.PI * 0.5)

        const posAttr = geometry.attributes.position
        const count = posAttr.count
        const colors = new Float32Array(count * 3)

        const sandCol = new THREE.Color(def.colorSand)
        const grassCol = new THREE.Color(def.colorGrass)
        const highCol = new THREE.Color(def.colorHighland)
        const rockCol = new THREE.Color(def.colorRock)
        const abyssCol = new THREE.Color('#030b18') // Deep underwater abyss color

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
            const noise1 = Math.sin(angle * 3.0 + def.seed) * 0.18 + Math.cos(angle * 5.0 - def.seed) * 0.12
            const noise2 = Math.sin(angle * 8.0 + def.seed * 2.0) * 0.05
            const organicDist = baseDist + noise1 + noise2

            // Elevation profile
            let height = 0
            if(def.id === 'lab')
            {
                // Level flat plaza top for Lab Island
                if(organicDist < 0.72)
                {
                    height = 1.2
                }
                else if(organicDist < 1.0)
                {
                    // Beach slope down to water level
                    const t = (organicDist - 0.72) / 0.28
                    const smoothT = t * t * (3 - 2 * t)
                    height = 1.2 * (1.0 - smoothT) - 0.15
                }
                else if(organicDist < 1.35)
                {
                    // Smooth underwater circular shelf
                    const t = (organicDist - 1.0) / 0.35
                    const smoothT = t * t * (3 - 2 * t)
                    height = -0.15 - smoothT * 7.0
                }
                else
                {
                    // Deep abyss
                    const t = Math.min(1.0, (organicDist - 1.35) / 0.25)
                    height = -7.15 - t * 8.0
                }
            }
            else
            {
                // Organic hill shaping for Socials and About islands
                if(organicDist < 1.0)
                {
                    const plateauFactor = Math.cos(organicDist * Math.PI * 0.5)
                    const smoothNoise = Math.sin(x * 0.2 + def.seed) * Math.cos(z * 0.2 - def.seed) * 0.45
                    height = Math.pow(plateauFactor, 1.25) * def.maxHeight + (smoothNoise * plateauFactor)

                    if(organicDist > 0.72)
                    {
                        const t = (organicDist - 0.72) / 0.28
                        const smoothT = t * t * (3 - 2 * t)
                        height = height * (1.0 - smoothT * 0.85) - 0.15
                    }
                }
                else if(organicDist < 1.35)
                {
                    const t = (organicDist - 1.0) / 0.35
                    const smoothT = t * t * (3 - 2 * t)
                    height = -0.15 - smoothT * 7.0
                }
                else
                {
                    const t = Math.min(1.0, (organicDist - 1.35) / 0.25)
                    height = -7.15 - t * 8.0
                }
            }

            posAttr.setY(i, height)

            // Vertex coloring based on elevation & smooth slope transitions
            const vertexColor = new THREE.Color()
            if(height < -0.5)
            {
                // Deep underwater shelf: blend into dark abyss
                const t = Math.min(1.0, (-height - 0.5) / 3.5)
                vertexColor.lerpColors(sandCol, abyssCol, t)
            }
            else if(height < 0.7)
            {
                // Sandy beach
                vertexColor.copy(sandCol)
            }
            else if(height < 2.2)
            {
                // Smooth beach to grass transition
                const t = (height - 0.7) / 1.5
                const smoothT = t * t * (3 - 2 * t)
                vertexColor.lerpColors(sandCol, grassCol, smoothT)
            }
            else if(height < 3.8)
            {
                // Lush green plateau
                const t = (height - 2.2) / 1.6
                const smoothT = t * t * (3 - 2 * t)
                vertexColor.lerpColors(grassCol, highCol, smoothT)
            }
            else
            {
                // High ridge
                const t = Math.min(1.0, (height - 3.8) / 1.4)
                vertexColor.lerpColors(highCol, rockCol, t * 0.4)
            }

            colors[i * 3 + 0] = vertexColor.r
            colors[i * 3 + 1] = vertexColor.g
            colors[i * 3 + 2] = vertexColor.b
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.computeVertexNormals()

        const material = new THREE.MeshStandardNodeMaterial({
            vertexColors: true,
            roughness: 0.82,
            metalness: 0.05,
            flatShading: false
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
