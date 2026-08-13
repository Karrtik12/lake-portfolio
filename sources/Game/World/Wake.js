import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — unified, continuous V-shaped motorboat foam wash.
 * Spreads continuous overlapping frothy foam particles across the full expanding V-span
 * to form a single cohesive, natural wake wash (no separate 3-line artifacts).
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.totalParticles = 180
        this.particles = []
        this.currentIndex = 0
        this.emitInterval = 0.02
        this.emitTimer = 0

        // Create soft, bubbly, organic foam sprite texture
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')

        // Multi-layered soft Gaussian foam puff
        const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 58)
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        grad.addColorStop(0.35, 'rgba(240, 249, 255, 0.75)')
        grad.addColorStop(0.7, 'rgba(224, 242, 254, 0.35)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)')

        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 128, 128)

        // Add fine bubble clusters
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        for(let i = 0; i < 30; i++)
        {
            const bx = 64 + (Math.random() - 0.5) * 60
            const by = 64 + (Math.random() - 0.5) * 60
            const br = Math.random() * 6 + 2
            ctx.beginPath()
            ctx.arc(bx, by, br, 0, Math.PI * 2)
            ctx.fill()
        }

        const foamTex = new THREE.CanvasTexture(canvas)

        // Instanced mesh
        this.geometry = new THREE.PlaneGeometry(1.0, 1.0)
        this.geometry.rotateX(-Math.PI * 0.5)

        this.material = new THREE.MeshBasicNodeMaterial({
            map: foamTex,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        })

        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.totalParticles)
        this.instancedMesh.position.y = 0.10
        this.instancedMesh.frustumCulled = false
        this.game.scene.add(this.instancedMesh)

        // Initialize particle pool
        const dummy = new THREE.Object3D()
        dummy.position.set(0, -999, 0)
        dummy.scale.set(0, 0, 0)
        dummy.updateMatrix()

        for(let i = 0; i < this.totalParticles; i++)
        {
            this.instancedMesh.setMatrixAt(i, dummy.matrix)
            this.particles.push({
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                scale: 0.1,
                maxScale: 2.0,
                life: 0,
                maxLife: 1.8
            })
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    emit(boat, speed)
    {
        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.3))

        const speedRatio = Math.min(speed / 16.0, 1.0)
        const isBoost = this.game.inputs?.getAxes()?.boost

        // Emit a cluster of 3-4 connected foam puffs across the expanding V-wash
        const emitCount = isBoost ? 4 : 3
        for(let j = 0; j < emitCount; j++)
        {
            const p = this.particles[this.currentIndex]
            p.active = true

            // Continuous distribution across V-hull span: from left edge to right edge
            // Distribute across span: -1 to +1
            const spanFactor = (j / (emitCount - 1 || 1)) * 2.0 - 1.0 + (Math.random() - 0.5) * 0.3
            const lateralOffset = spanFactor * (0.8 + speedRatio * 0.4)

            p.position.copy(sternPos)
                .add(rightDir.clone().multiplyScalar(lateralOffset))
                .add(forwardDir.clone().multiplyScalar((Math.random() - 0.5) * 0.4))
            p.position.y = 0.10

            // Outward lateral expansion velocity creating the natural expanding V-wash
            const expandSpeed = spanFactor * (1.8 + speedRatio * 1.5)
            p.velocity.copy(rightDir).multiplyScalar(expandSpeed)
                .add(forwardDir.clone().multiplyScalar(-0.4 - speedRatio * 0.6))

            p.scale = 0.6 + speedRatio * 0.4
            p.maxScale = (1.8 + Math.abs(spanFactor) * 1.2) * (isBoost ? 1.4 : 1.0)
            p.life = 0
            p.maxLife = 1.6 + speedRatio * 1.0 + (Math.random() - 0.5) * 0.4

            this.currentIndex = (this.currentIndex + 1) % this.totalParticles
        }
    }

    update(delta)
    {
        const boat = this.game.boat
        if(boat && Math.abs(boat.speed) > 0.5)
        {
            this.emitTimer += delta
            if(this.emitTimer >= this.emitInterval)
            {
                this.emitTimer = 0
                this.emit(boat, Math.abs(boat.speed))
            }
        }

        const dummy = new THREE.Object3D()
        let needsUpdate = false

        for(let i = 0; i < this.totalParticles; i++)
        {
            const p = this.particles[i]
            if(!p.active) continue

            p.life += delta
            const progress = p.life / p.maxLife

            if(progress >= 1.0)
            {
                p.active = false
                dummy.position.set(0, -999, 0)
                dummy.scale.set(0, 0, 0)
                dummy.updateMatrix()
                this.instancedMesh.setMatrixAt(i, dummy.matrix)
                needsUpdate = true
                continue
            }

            p.position.addScaledVector(p.velocity, delta)

            // Smooth bell curve growth: expands quickly then fades out
            const growth = Math.sin(progress * Math.PI * 0.5)
            const currentScale = p.scale + (p.maxScale - p.scale) * growth

            dummy.position.copy(p.position)
            dummy.scale.set(currentScale, 1.0, currentScale)
            dummy.updateMatrix()

            this.instancedMesh.setMatrixAt(i, dummy.matrix)
            needsUpdate = true
        }

        if(needsUpdate)
        {
            this.instancedMesh.instanceMatrix.needsUpdate = true
        }
    }
}
