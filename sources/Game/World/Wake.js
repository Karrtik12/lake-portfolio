import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — motorboat wake trail with feathered foam wash and dynamic speed-proportional fading.
 * Automatically fades and disappears instantly as soon as the boat stops.
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxPoints = 48
        this.history = []
        this.stepDistance = 0.32

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

        // Create feathered foam wash texture
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 256
        const ctx = canvas.getContext('2d')

        const grad = ctx.createLinearGradient(0, 0, 0, 256)
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)')
        grad.addColorStop(0.22, 'rgba(240, 249, 255, 0.35)')
        grad.addColorStop(0.50, 'rgba(255, 255, 255, 0.85)')
        grad.addColorStop(0.78, 'rgba(240, 249, 255, 0.35)')
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 512, 256)

        // Add fine bubbly foam
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        for(let i = 0; i < 400; i++)
        {
            const bx = Math.random() * 512
            const by = 40 + Math.random() * 176
            const br = Math.random() * 3.0 + 1.0
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
            opacity: 0.0,
            depthWrite: false,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = 0.08
        this.mesh.frustumCulled = false
        this.mesh.visible = false
        this.game.scene.add(this.mesh)

        // Initialize history
        for(let i = 0; i < this.maxPoints; i++)
        {
            this.history.push({
                pos: new THREE.Vector3(0, 0, 0),
                right: new THREE.Vector3(1, 0, 0),
                distance: 0,
                speed: 0,
                isBoost: false,
                age: 0
            })
        }
        this.activeCount = 0
        this.totalDistanceTraveled = 0

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    update(delta = 0.016)
    {
        if(!this.game.boat) return

        const boat = this.game.boat
        const speed = Math.abs(boat.speed || 0)
        const isMoving = speed > 0.65

        // If stopped, rapidly fade out opacity and disappear instantly
        if(!isMoving)
        {
            if(this.material.opacity > 0.005)
            {
                this.material.opacity = Math.max(0.0, this.material.opacity - delta * 4.2)
            }
            else
            {
                this.material.opacity = 0.0
                this.mesh.visible = false
                this.activeCount = 0
                return
            }
        }
        else
        {
            // Smoothly ramp up opacity when moving
            this.mesh.visible = true
            const targetOpacity = Math.min(speed / 4.0, 1.0) * (this.game.inputs?.getAxes()?.boost ? 0.85 : 0.65)
            this.material.opacity = THREE.MathUtils.lerp(this.material.opacity, targetOpacity, delta * 5.0)
        }

        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.4))
        const isBoost = this.game.inputs?.getAxes()?.boost || false

        if(this.activeCount === 0)
        {
            this.history[0].pos.copy(sternPos)
            this.history[0].right.copy(rightDir)
            this.history[0].distance = 0
            this.history[0].speed = speed
            this.history[0].isBoost = isBoost
            this.history[0].age = 0
            this.activeCount = 1
        }
        else
        {
            const prev = this.history[1] || this.history[0]
            const distFromPrev = sternPos.distanceTo(prev.pos)

            if(distFromPrev >= this.stepDistance && isMoving)
            {
                // Shift history array down
                for(let i = this.maxPoints - 1; i > 0; i--)
                {
                    this.history[i].pos.copy(this.history[i - 1].pos)
                    this.history[i].right.copy(this.history[i - 1].right)
                    this.history[i].distance = this.history[i - 1].distance
                    this.history[i].speed = this.history[i - 1].speed
                    this.history[i].isBoost = this.history[i - 1].isBoost
                    this.history[i].age = this.history[i - 1].age + delta
                }

                this.totalDistanceTraveled += distFromPrev
                this.history[0].pos.copy(sternPos)
                this.history[0].right.copy(rightDir)
                this.history[0].distance = this.totalDistanceTraveled
                this.history[0].speed = speed
                this.history[0].isBoost = isBoost
                this.history[0].age = 0

                if(this.activeCount < this.maxPoints)
                {
                    this.activeCount++
                }
            }
            else
            {
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

                // Smooth V-expansion curve
                const baseWidth = 0.65 + Math.min(h.speed / 16.0, 1.0) * 0.35
                const vSpread = Math.pow(t, 0.75) * (h.isBoost ? 6.5 : 4.5)
                const halfWidth = (baseWidth + vSpread) * 0.5

                const p = h.pos
                const r = h.right

                // Left vertex
                posArr[vBase + 0] = p.x - r.x * halfWidth
                posArr[vBase + 1] = 0.08
                posArr[vBase + 2] = p.z - r.z * halfWidth

                // Right vertex
                posArr[vBase + 3] = p.x + r.x * halfWidth
                posArr[vBase + 4] = 0.08
                posArr[vBase + 5] = p.z + r.z * halfWidth

                // UVs
                const uLength = (h.distance * 0.3)
                uvArr[uvBase + 0] = 0.0
                uvArr[uvBase + 1] = uLength
                uvArr[uvBase + 2] = 1.0
                uvArr[uvBase + 3] = uLength
            }
            else
            {
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
