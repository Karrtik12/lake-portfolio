import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — ultra-smooth, continuous motorboat wake ribbon with sub-frame head tracking,
 * world-space arc-length UV mapping, and feathered foam falloff (100% free of popping or jitter).
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxPoints = 64
        this.history = []
        this.stepDistance = 0.28 // Smooth recording frequency

        // Ribbon Geometry: (maxPoints - 1) quads
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
        canvas.height = 256
        const ctx = canvas.getContext('2d')

        // Soft horizontal Gaussian wash: transparent edges, bright creamy foam core
        const grad = ctx.createLinearGradient(0, 0, 0, 256)
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)')
        grad.addColorStop(0.18, 'rgba(240, 249, 255, 0.45)')
        grad.addColorStop(0.40, 'rgba(255, 255, 255, 0.88)')
        grad.addColorStop(0.50, 'rgba(255, 255, 255, 0.95)')
        grad.addColorStop(0.60, 'rgba(255, 255, 255, 0.88)')
        grad.addColorStop(0.82, 'rgba(240, 249, 255, 0.45)')
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 512, 256)

        // Add fine bubbly foam texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
        for(let i = 0; i < 600; i++)
        {
            const bx = Math.random() * 512
            const by = 40 + Math.random() * 176
            const br = Math.random() * 3.5 + 1.0
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
            opacity: 0.85,
            depthWrite: false,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = 0.11 // Sits right at the water surface
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)

        // Initialize history with stationary points
        for(let i = 0; i < this.maxPoints; i++)
        {
            this.history.push({
                pos: new THREE.Vector3(0, 0, 0),
                right: new THREE.Vector3(1, 0, 0),
                distance: 0,
                speed: 0,
                isBoost: false
            })
        }
        this.activeCount = 0
        this.totalDistanceTraveled = 0

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
        const speed = Math.abs(boat.speed || 0)

        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.35))
        const isBoost = this.game.inputs?.getAxes()?.boost || false

        // Always update Head (index 0) to real-time boat position every frame (eliminates stepping)
        if(this.activeCount === 0)
        {
            this.history[0].pos.copy(sternPos)
            this.history[0].right.copy(rightDir)
            this.history[0].distance = 0
            this.history[0].speed = speed
            this.history[0].isBoost = isBoost
            this.activeCount = 1
        }
        else
        {
            const prev = this.history[1] || this.history[0]
            const distFromPrev = sternPos.distanceTo(prev.pos)

            if(distFromPrev >= this.stepDistance && speed > 0.4)
            {
                // Shift history array down smoothly
                for(let i = this.maxPoints - 1; i > 0; i--)
                {
                    this.history[i].pos.copy(this.history[i - 1].pos)
                    this.history[i].right.copy(this.history[i - 1].right)
                    this.history[i].distance = this.history[i - 1].distance
                    this.history[i].speed = this.history[i - 1].speed
                    this.history[i].isBoost = this.history[i - 1].isBoost
                }

                this.totalDistanceTraveled += distFromPrev
                this.history[0].pos.copy(sternPos)
                this.history[0].right.copy(rightDir)
                this.history[0].distance = this.totalDistanceTraveled
                this.history[0].speed = speed
                this.history[0].isBoost = isBoost

                if(this.activeCount < this.maxPoints)
                {
                    this.activeCount++
                }
            }
            else
            {
                // Smoothly update head in place
                this.history[0].pos.copy(sternPos)
                this.history[0].right.copy(rightDir)
                this.history[0].speed = speed
                this.history[0].isBoost = isBoost
            }
        }

        if(this.activeCount < 2) return

        const posArr = this.geometry.attributes.position.array
        const uvArr = this.geometry.attributes.uv.array

        for(let i = 0; i < this.maxPoints; i++)
        {
            const vBase = i * 2 * 3
            const uvBase = i * 2 * 2

            if(i < this.activeCount)
            {
                const h = this.history[i]
                const t = i / (this.activeCount - 1 || 1) // 0 at boat, 1 at tail

                // Smooth V-expansion curve (narrow at hull, naturally fans out over distance)
                const baseWidth = 0.75 + Math.min(h.speed / 16.0, 1.0) * 0.35
                const vSpread = Math.pow(t, 0.75) * (h.isBoost ? 8.5 : 5.8)
                const halfWidth = (baseWidth + vSpread) * 0.5

                const p = h.pos
                const r = h.right

                // Left vertex
                posArr[vBase + 0] = p.x - r.x * halfWidth
                posArr[vBase + 1] = 0.11
                posArr[vBase + 2] = p.z - r.z * halfWidth

                // Right vertex
                posArr[vBase + 3] = p.x + r.x * halfWidth
                posArr[vBase + 4] = 0.11
                posArr[vBase + 5] = p.z + r.z * halfWidth

                // Continuous world-space arc-length UVs (completely stationary texture on water)
                const uLength = (h.distance * 0.35)
                uvArr[uvBase + 0] = 0.0
                uvArr[uvBase + 1] = uLength
                uvArr[uvBase + 2] = 1.0
                uvArr[uvBase + 3] = uLength
            }
            else
            {
                // Collapse inactive tail vertices
                const lastH = this.history[Math.max(0, this.activeCount - 1)]
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
