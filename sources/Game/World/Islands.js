import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Islands — manages the 3 themed island landmasses in the lake + the spawn dock area.
 */
export class Islands
{
    constructor()
    {
        this.game = Game.getInstance()
        this.items = []

        // Island definitions (positions, dimensions, themes)
        this.definitions = [
            {
                id: 'socials',
                name: 'Socials Island',
                position: new THREE.Vector3(-36, 0, -22),
                radius: 12,
                height: 3.2,
                colorSand: '#d4b886',
                colorGrass: '#3a7d44'
            },
            {
                id: 'lab',
                name: 'Lab Island',
                position: new THREE.Vector3(36, 0, -20),
                radius: 14,
                height: 3.8,
                colorSand: '#d4b886',
                colorGrass: '#2f6b52'
            },
            {
                id: 'about',
                name: 'About Island',
                position: new THREE.Vector3(-30, 0, 24),
                radius: 11,
                height: 3.0,
                colorSand: '#d4b886',
                colorGrass: '#447d3a'
            }
        ]

        this.createIslands()
    }

    createIslands()
    {
        for(const def of this.definitions)
        {
            const island = this.createSingleIsland(def)
            this.items.push(island)
        }
    }

    createSingleIsland(def)
    {
        const segmentsR = 36
        const segmentsH = 12
        const geometry = new THREE.CylinderGeometry(
            def.radius * 0.75, // top plateau radius
            def.radius * 1.15, // bottom underwater radius
            def.height,
            segmentsR,
            segmentsH
        )

        const posAttr = geometry.attributes.position
        const count = posAttr.count
        const colors = new Float32Array(count * 3)

        const sandCol = new THREE.Color(def.colorSand)
        const grassCol = new THREE.Color(def.colorGrass)

        for(let i = 0; i < count; i++)
        {
            let x = posAttr.getX(i)
            let y = posAttr.getY(i)
            let z = posAttr.getZ(i)
            const angle = Math.atan2(z, x)
            const radius = Math.sqrt(x * x + z * z)

            // Organic perimeter wobble
            const noise = Math.sin(angle * 4.0) * 1.2 + Math.cos(angle * 7.0) * 0.8
            const scale = 1.0 + noise / def.radius
            x *= scale
            z *= scale

            // Top plateau slope shaping
            if(y > 0.5)
            {
                y += Math.sin(x * 0.2 + z * 0.2) * 0.4
            }

            posAttr.setXYZ(i, x, y, z)

            // Vertex color by elevation
            const vertexColor = new THREE.Color()
            if(y > def.height * 0.2)
            {
                vertexColor.copy(grassCol)
            }
            else
            {
                const t = Math.max(0, (y + def.height * 0.5) / (def.height * 0.7))
                vertexColor.lerpColors(sandCol, grassCol, t)
            }

            colors[i * 3 + 0] = vertexColor.r
            colors[i * 3 + 1] = vertexColor.g
            colors[i * 3 + 2] = vertexColor.b
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.computeVertexNormals()

        const material = new THREE.MeshStandardNodeMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.05,
            flatShading: true
        })

        const mesh = new THREE.Mesh(geometry, material)
        // Position island so top rises out of water (water y=0)
        mesh.position.copy(def.position)
        mesh.position.y = def.height * 0.2
        mesh.receiveShadow = true
        mesh.castShadow = true
        this.game.scene.add(mesh)

        return {
            ...def,
            mesh
        }
    }
}
