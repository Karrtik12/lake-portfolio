import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — single unified, continuous expanding V-shaped motorboat wake ribbon.
 * Formed as a connected dynamic quad strip with feathered white foam texture
 * (guaranteed single cohesive wake, zero separate lines).
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxPoints = 55
        this.history = []
        this.minDistance = 0.4

        // Connected Quad-Strip Ribbon Geometry: (maxPoints - 1) quads = 2 triangles per segment
        const segments = this.maxPoints - 1
        const vertexCount = this.maxPoints * 2
        const indexCount = segments * 6

        this.positions = new Float32Array(vertexCount * 3)
        this.uvs = new Float32Array(vertexCount * 2)

        const indices = new Uint16Array(indexCount)
        let idx = 0
        for(let i = 0; i < segments; i++)
        {
            const a = i * 2 + 0
            const b = i * 2 + 1
            const c = (i + 1) * 2 + 0
            const d = (i + 1) * 2 + 1

            indices[idx++] = a
            indices[idx++] = c
            indices[idx++] = b

            indices[idx++] = b
            indices[idx++] = c
            indices[idx++] = d
        }

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2))
        this.geometry.setIndex(new THREE.BufferAttribute(indices, 1))

        // Create high-resolution feathered foam wash texture
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 128
        const ctx = canvas.getContext('2d')

        // Soft horizontal Gaussian wash (white center, soft feathered transparent edges)
        const grad = ctx.createLinearGradient(0, 0, 0, 128)
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.0)')
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.75)')
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)')
        grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.75)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 512, 128)

        // Add fine bubbly spray pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        for(let i = 0; i < 400; i++)
        {
            const bx = Math.random() * 512
            const by = 20 + Math.random() * 88
            const br = Math.random() * 4 + 1
            ctx.beginPath()
            ctx.arc(bx, by, br, 0, Math.PI * 2)
            ctx.fill()
        }

        const foamTexture = new THREE.CanvasTexture(canvas)
        foamTexture.wrapS = THREE.RepeatWrapping
        foamTexture.wrapT = THREE.ClampToEdgeWrapping

        this.material = new THREE.MeshBasicNodeMaterial({
            map: foamTexture,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = 0.12 // Sits cleanly above water waves
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

        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.4))

        // Record boat movement history point
        const last = this.history[0]
        if(!last || sternPos.distanceTo(last.pos) > this.minDistance)
        {
            this.history.unshift({
                pos: sternPos.clone(),
                right: rightDir.clone(),
                speed: speed,
                isBoost: this.game.inputs?.getAxes()?.boost || false
            })

            if(this.history.length > this.maxPoints)
            {
                this.history.pop()
            }
        }

        if(this.history.length < 2) return

        const count = this.history.length
        const posArr = this.geometry.attributes.position.array
        const uvArr = this.geometry.attributes.uv.array

        for(let i = 0; i < this.maxPoints; i++)
        {
            const vBase = i * 2 * 3
            const uvBase = i * 2 * 2

            if(i < count)
            {
                const h = this.history[i]
                const t = i / (count - 1 || 1) // 0 at stern, 1 at tail

                // Smooth natural V-expansion: starts at 0.9m at motor, expands to 7.5m (or 10.5m during boost)
                const baseWidth = 0.8 + Math.min(h.speed / 16.0, 1.0) * 0.4
                const vSpread = Math.pow(t, 0.8) * (h.isBoost ? 9.5 : 6.8)
                const halfWidth = (baseWidth + vSpread) * 0.5

                const p = h.pos
                const r = h.right

                // Left vertex of the single wake ribbon
                posArr[vBase + 0] = p.x - r.x * halfWidth
                posArr[vBase + 1] = 0.12
                posArr[vBase + 2] = p.z - r.z * halfWidth

                // Right vertex of the single wake ribbon
                posArr[vBase + 3] = p.x + r.x * halfWidth
                posArr[vBase + 4] = 0.12
                posArr[vBase + 5] = p.z + r.z * halfWidth

                // UVs: U spans 0 to 1 across the ribbon width, V scrolls along length
                uvArr[uvBase + 0] = 0.0
                uvArr[uvBase + 1] = t * 4.0
                uvArr[uvBase + 2] = 1.0
                uvArr[uvBase + 3] = t * 4.0
            }
            else
            {
                // Collapse remaining unused vertices
                const lastH = this.history[count - 1]
                posArr[vBase + 0] = lastH.pos.x
                posArr[vBase + 1] = -10
                posArr[vBase + 2] = lastH.pos.z

                posArr[vBase + 3] = lastH.pos.x
                posArr[vBase + 4] = -10
                posArr[vBase + 5] = lastH.pos.z
            }
        }

        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.uv.needsUpdate = true
    }
}
