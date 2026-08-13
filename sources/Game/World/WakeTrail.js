import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, texture, uniform, uv, vec4 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * WakeTrail — generates dynamic, expanding V-shaped white foam wake ribbons
 * and engine propeller froth behind the boat as it navigates the lake.
 */
export class WakeTrail
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxPoints = 80
        this.history = []
        this.minDistance = 0.35

        // Create ribbon geometry for V-shaped wake:
        // 3 strips: Left wake wing, Center propeller wash, Right wake wing
        // Each segment has 5 vertices across: [Far Left, Mid Left, Center, Mid Right, Far Right]
        const segments = this.maxPoints - 1
        const vertexCount = this.maxPoints * 5
        const indexCount = segments * 24

        this.positions = new Float32Array(vertexCount * 3)
        this.uvs = new Float32Array(vertexCount * 2)
        this.alphas = new Float32Array(vertexCount)

        const indices = new Uint16Array(indexCount)
        let idx = 0
        for(let i = 0; i < segments; i++)
        {
            const row1 = i * 5
            const row2 = (i + 1) * 5

            for(let j = 0; j < 4; j++)
            {
                const a = row1 + j
                const b = row1 + j + 1
                const c = row2 + j
                const d = row2 + j + 1

                indices[idx++] = a
                indices[idx++] = c
                indices[idx++] = b

                indices[idx++] = b
                indices[idx++] = c
                indices[idx++] = d
            }
        }

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2))
        this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))
        this.geometry.setIndex(new THREE.BufferAttribute(indices, 1))

        // Create procedural foam texture
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 256, 256)

        // Add bubbly foam noise
        ctx.fillStyle = 'rgba(230, 245, 255, 0.85)'
        for(let i = 0; i < 400; i++)
        {
            const rx = Math.random() * 256
            const ry = Math.random() * 256
            const rrad = Math.random() * 8 + 2
            ctx.beginPath()
            ctx.arc(rx, ry, rrad, 0, Math.PI * 2)
            ctx.fill()
        }

        const foamTex = new THREE.CanvasTexture(canvas)
        foamTex.wrapS = THREE.RepeatWrapping
        foamTex.wrapT = THREE.RepeatWrapping

        // High-contrast foam material for sharp V-wake visibility
        this.material = new THREE.MeshBasicNodeMaterial({
            color: '#ffffff',
            map: foamTex,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = 0.18 // Sits cleanly above water waves
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)

        // Update loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    update()
    {
        if(!this.game.boat) return

        const boat = this.game.boat
        const speed = Math.abs(boat.speed)

        // Stern point (rear of boat)
        const forwardDir = new THREE.Vector3(
            -Math.sin(boat.rotation),
            0,
            -Math.cos(boat.rotation)
        )
        const rightDir = new THREE.Vector3(
            forwardDir.z,
            0,
            -forwardDir.x
        )

        // Emit wake from stern
        const sternPos = new THREE.Vector3(
            boat.position.x - forwardDir.x * 1.5,
            0.05,
            boat.position.z - forwardDir.z * 1.5
        )

        // Record point if moved far enough
        const last = this.history[0]
        if(!last || sternPos.distanceTo(last.pos) > this.minDistance)
        {
            this.history.unshift({
                pos: sternPos.clone(),
                forward: forwardDir.clone(),
                right: rightDir.clone(),
                speed: speed,
                time: performance.now()
            })

            if(this.history.length > this.maxPoints)
            {
                this.history.pop()
            }
        }

        if(this.history.length < 2) return

        // Update ribbon vertices
        const count = this.history.length
        const posArr = this.geometry.attributes.position.array
        const uvArr = this.geometry.attributes.uv.array

        for(let i = 0; i < this.maxPoints; i++)
        {
            const vBase = i * 5 * 3
            const uvBase = i * 5 * 2

            if(i < count)
            {
                const h = this.history[i]
                const t = i / (count - 1 || 1) // 0 at boat stern, 1 at wake tail

                // Expanding V-shape angle: width grows from 0.8m at motor to 9.5m at tail
                const baseWidth = 0.6 + h.speed * 0.15
                const vSpread = Math.pow(t, 0.75) * 8.5
                const totalHalfWidth = baseWidth + vSpread

                // Fade alpha with distance: strong white near boat, soft fade at tail
                const speedAlpha = Math.min(1.0, h.speed / 2.0)
                const distanceAlpha = (1.0 - t) * (1.0 - t)
                const currentAlpha = speedAlpha * distanceAlpha * 0.85

                // 5 vertices across: FarLeft, MidLeft, Center, MidRight, FarRight
                const p = h.pos
                const r = h.right

                // Far Left (V-wing outer tip)
                posArr[vBase + 0]  = p.x - r.x * totalHalfWidth
                posArr[vBase + 1]  = 0.06 + Math.sin(t * 8.0) * 0.02
                posArr[vBase + 2]  = p.z - r.z * totalHalfWidth

                // Mid Left (V-wing inner crest)
                posArr[vBase + 3]  = p.x - r.x * (totalHalfWidth * 0.45)
                posArr[vBase + 4]  = 0.07
                posArr[vBase + 5]  = p.z - r.z * (totalHalfWidth * 0.45)

                // Center (Propeller froth wash)
                posArr[vBase + 6]  = p.x
                posArr[vBase + 7]  = 0.08
                posArr[vBase + 8]  = p.z

                // Mid Right (V-wing inner crest)
                posArr[vBase + 9]  = p.x + r.x * (totalHalfWidth * 0.45)
                posArr[vBase + 10] = 0.07
                posArr[vBase + 11] = p.z + r.z * (totalHalfWidth * 0.45)

                // Far Right (V-wing outer tip)
                posArr[vBase + 12] = p.x + r.x * totalHalfWidth
                posArr[vBase + 13] = 0.06 + Math.sin(t * 8.0) * 0.02
                posArr[vBase + 14] = p.z + r.z * totalHalfWidth

                // UVs
                uvArr[uvBase + 0] = 0.0; uvArr[uvBase + 1] = t * 6.0
                uvArr[uvBase + 2] = 0.3; uvArr[uvBase + 3] = t * 6.0
                uvArr[uvBase + 4] = 0.5; uvArr[uvBase + 5] = t * 6.0
                uvArr[uvBase + 6] = 0.7; uvArr[uvBase + 7] = t * 6.0
                uvArr[uvBase + 8] = 1.0; uvArr[uvBase + 9] = t * 6.0
            }
            else
            {
                // Collapse unused vertices at last known position
                const last = this.history[count - 1]
                for(let j = 0; j < 5; j++)
                {
                    posArr[vBase + j * 3 + 0] = last.pos.x
                    posArr[vBase + j * 3 + 1] = -10
                    posArr[vBase + j * 3 + 2] = last.pos.z
                }
            }
        }

        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.uv.needsUpdate = true
    }
}
