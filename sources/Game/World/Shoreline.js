import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Shoreline — the ring of land / rolling hills completely enclosing the lake.
 */
export class Shoreline
{
    constructor()
    {
        this.game = Game.getInstance()

        this.innerRadius = 70  // Lake boundary
        this.outerRadius = 140 // Mountain ring extent
        this.segmentsRadial = 96
        this.segmentsRing = 32

        this.geometry = new THREE.RingGeometry(
            this.innerRadius,
            this.outerRadius,
            this.segmentsRadial,
            this.segmentsRing
        )
        this.geometry.rotateX(-Math.PI * 0.5)

        // Sculpt terrain ring with height & vertex colors
        const posAttr = this.geometry.attributes.position
        const count = posAttr.count
        const colors = new Float32Array(count * 3)

        const sandColor = new THREE.Color('#d4b886')   // Beach sand
        const grassColor = new THREE.Color('#386b3f')  // Lush grass
        const darkGrass = new THREE.Color('#254d2b')   // Deep hill grass
        const rockColor = new THREE.Color('#545e68')   // Cliff rock

        for(let i = 0; i < count; i++)
        {
            const x = posAttr.getX(i)
            const z = posAttr.getZ(i)
            const dist = Math.sqrt(x * x + z * z)
            const angle = Math.atan2(z, x)

            // Normalized distance between inner shore (0) and outer mountain (1)
            const ringFactor = (dist - this.innerRadius) / (this.outerRadius - this.innerRadius)

            // Natural organic coastline variation
            const coastWobble = Math.sin(angle * 6.0) * 3.5 + Math.cos(angle * 11.0) * 2.0
            const actualRingFactor = Math.max(0, (dist - (this.innerRadius + coastWobble)) / (this.outerRadius - this.innerRadius))

            // Hill elevation function
            let height = 0
            if(actualRingFactor > 0.05)
            {
                const hillWave1 = Math.sin(angle * 7.0 + dist * 0.08) * 4.0
                const hillWave2 = Math.cos(angle * 13.0 + dist * 0.05) * 3.0
                const baseRise = Math.pow(actualRingFactor, 1.4) * 26.0
                height = Math.max(0, baseRise + hillWave1 + hillWave2)
            }
            else
            {
                // Gentle sloping sand edge into water
                height = actualRingFactor * 0.8 - 0.2
            }

            posAttr.setY(i, height)

            // Compute vertex color based on height and slope
            const vertexColor = new THREE.Color()
            if(height < 1.0)
            {
                // Sand beach
                vertexColor.copy(sandColor)
            }
            else if(height < 12.0)
            {
                // Grass slope
                const t = (height - 1.0) / 11.0
                vertexColor.lerpColors(grassColor, darkGrass, t)
            }
            else
            {
                // Mountain tops / rock
                const t = Math.min(1.0, (height - 12.0) / 14.0)
                vertexColor.lerpColors(darkGrass, rockColor, t)
            }

            colors[i * 3 + 0] = vertexColor.r
            colors[i * 3 + 1] = vertexColor.g
            colors[i * 3 + 2] = vertexColor.b
        }

        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        this.geometry.computeVertexNormals()

        // Material with flat shading for stylized low-poly look
        this.material = new THREE.MeshStandardNodeMaterial({
            vertexColors: true,
            roughness: 0.85,
            metalness: 0.05,
            flatShading: true
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.receiveShadow = true
        this.mesh.castShadow = true
        this.game.scene.add(this.mesh)
    }
}
