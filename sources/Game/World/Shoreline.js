import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Shoreline — high-resolution outer mountain ring and coastal boundary enclosing the lake.
 * Built with dense radial geometry and crisp, clear beach contours to eliminate jagged facets.
 */
export class Shoreline
{
    constructor()
    {
        this.game = Game.getInstance()

        this.innerRadius = 66  // Deep underwater lake shelf
        this.outerRadius = 150 // Mountain ring extent
        this.segmentsRadial = 192 // High resolution for silky smooth coastline curves
        this.segmentsRing = 64

        this.geometry = new THREE.RingGeometry(
            this.innerRadius,
            this.outerRadius,
            this.segmentsRadial,
            this.segmentsRing
        )
        this.geometry.rotateX(-Math.PI * 0.5)

        // Sculpt terrain ring with smooth height profile & rich vertex colors
        const posAttr = this.geometry.attributes.position
        const count = posAttr.count
        const colors = new Float32Array(count * 3)

        const sandColor = new THREE.Color('#d8b888')   // Warm beach sand
        const wetSand = new THREE.Color('#b59363')     // Wet shore sand
        const grassColor = new THREE.Color('#387342')  // Lush vibrant grass
        const darkGrass = new THREE.Color('#22542a')   // Deep forest green
        const rockColor = new THREE.Color('#505c66')   // Mountain granite
        const snowColor = new THREE.Color('#e2e8f0')   // Mountain peaks

        for(let i = 0; i < count; i++)
        {
            const x = posAttr.getX(i)
            const z = posAttr.getZ(i)
            const dist = Math.sqrt(x * x + z * z)
            const angle = Math.atan2(z, x)

            // Exact mathematical coastline boundary
            const coastRadius = 72.0 + Math.sin(angle * 4.0) * 2.5 + Math.cos(angle * 8.0) * 1.5

            let height = 0
            if(dist < coastRadius)
            {
                // Underwater shelf dropping steeply to deep lake floor (prevents boat grounding)
                const t = Math.max(0, (coastRadius - dist) / (coastRadius - this.innerRadius))
                height = -t * 6.5
            }
            else
            {
                // Land topography rising from beach into rolling hills & distant peaks
                const landDist = dist - coastRadius
                const normalizedLand = landDist / (this.outerRadius - coastRadius)

                const hill1 = Math.sin(angle * 6.0 + landDist * 0.08) * 3.5
                const hill2 = Math.cos(angle * 12.0 + landDist * 0.05) * 2.5
                const baseRise = Math.pow(normalizedLand, 1.35) * 32.0

                // Smooth beach apron (elevation 0 to 1.2m near water)
                if(landDist < 4.0)
                {
                    const beachT = landDist / 4.0
                    height = beachT * 1.2
                }
                else
                {
                    height = 1.2 + Math.max(0, (baseRise + hill1 + hill2) * (landDist - 4.0) / (this.outerRadius - coastRadius - 4.0))
                }
            }

            posAttr.setY(i, height)

            // Vertex coloring based on elevation & terrain zones
            const vertexColor = new THREE.Color()
            if(height < -0.2)
            {
                // Underwater wet sand
                vertexColor.copy(wetSand)
            }
            else if(height < 1.4)
            {
                // Dry beach sand
                vertexColor.copy(sandColor)
            }
            else if(height < 3.2)
            {
                // Smooth transition from sand to grass
                const t = (height - 1.4) / 1.8
                vertexColor.lerpColors(sandColor, grassColor, t)
            }
            else if(height < 15.0)
            {
                // Rich lush grass slopes
                const t = (height - 3.2) / 11.8
                vertexColor.lerpColors(grassColor, darkGrass, t)
            }
            else if(height < 26.0)
            {
                // Rocky highlands
                const t = (height - 15.0) / 11.0
                vertexColor.lerpColors(darkGrass, rockColor, t)
            }
            else
            {
                // Mountain peak snow caps
                const t = Math.min(1.0, (height - 26.0) / 6.0)
                vertexColor.lerpColors(rockColor, snowColor, t)
            }

            colors[i * 3 + 0] = vertexColor.r
            colors[i * 3 + 1] = vertexColor.g
            colors[i * 3 + 2] = vertexColor.b
        }

        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        this.geometry.computeVertexNormals()

        this.material = new THREE.MeshStandardNodeMaterial({
            vertexColors: true,
            roughness: 0.82,
            metalness: 0.05,
            flatShading: false
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.receiveShadow = true
        this.mesh.castShadow = true
        this.game.scene.add(this.mesh)
    }

    /**
     * Static helper to compute exact coastline radius at any angle
     */
    static getCoastRadius(angle)
    {
        return 72.0 + Math.sin(angle * 4.0) * 2.5 + Math.cos(angle * 8.0) * 1.5
    }
}
