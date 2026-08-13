import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — realistic V-shaped motorboat wake spray ribbons & churning propeller foam.
 * Generates two distinct expanding white water spray wings (port & starboard) and central motor froth.
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxPairs = 60
        this.totalParticles = this.maxPairs * 3 // Port wing, Starboard wing, Center churn
        this.particles = []
        this.currentIndex = 0
        this.emitInterval = 0.035
        this.emitTimer = 0

        // Create soft circular foam sprite texture
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')

        const radGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60)
        radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        radGrad.addColorStop(0.4, 'rgba(240, 249, 255, 0.75)')
        radGrad.addColorStop(0.75, 'rgba(224, 242, 254, 0.35)')
        radGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)')

        ctx.fillStyle = radGrad
        ctx.fillRect(0, 0, 128, 128)

        const foamTex = new THREE.CanvasTexture(canvas)

        // Instanced mesh for high performance
        this.geometry = new THREE.PlaneGeometry(1.2, 1.2)
        this.geometry.rotateX(-Math.PI * 0.5)

        this.material = new THREE.MeshBasicNodeMaterial({
            map: foamTex,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        })

        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.totalParticles)
        this.instancedMesh.position.y = 0.10 // Sits right at water level
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
                maxScale: 2.2,
                life: 0,
                maxLife: 2.0
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
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.4))

        const speedRatio = Math.min(speed / 16.0, 1.0)
        const isBoost = this.game.inputs?.getAxes()?.boost

        // 1. Port (Left) V-Wing Spray
        const portIdx = this.currentIndex * 3 + 0
        const pPort = this.particles[portIdx]
        pPort.active = true
        pPort.position.copy(sternPos).add(rightDir.clone().multiplyScalar(-0.6))
        pPort.position.y = 0.10
        pPort.velocity.copy(rightDir).multiplyScalar(-2.2 - speedRatio * 1.8).add(forwardDir.clone().multiplyScalar(-0.4))
        pPort.scale = 0.5 + speedRatio * 0.3
        pPort.maxScale = 2.4 + speedRatio * (isBoost ? 3.5 : 2.0)
        pPort.life = 0
        pPort.maxLife = 1.8 + speedRatio * 1.0

        // 2. Starboard (Right) V-Wing Spray
        const starIdx = this.currentIndex * 3 + 1
        const pStar = this.particles[starIdx]
        pStar.active = true
        pStar.position.copy(sternPos).add(rightDir.clone().multiplyScalar(0.6))
        pStar.position.y = 0.10
        pStar.velocity.copy(rightDir).multiplyScalar(2.2 + speedRatio * 1.8).add(forwardDir.clone().multiplyScalar(-0.4))
        pStar.scale = 0.5 + speedRatio * 0.3
        pStar.maxScale = 2.4 + speedRatio * (isBoost ? 3.5 : 2.0)
        pStar.life = 0
        pStar.maxLife = 1.8 + speedRatio * 1.0

        // 3. Center Propeller Churn Foam
        const centerIdx = this.currentIndex * 3 + 2
        const pCenter = this.particles[centerIdx]
        pCenter.active = true
        pCenter.position.copy(sternPos).add(forwardDir.clone().multiplyScalar(-0.3))
        pCenter.position.y = 0.11
        pCenter.velocity.copy(forwardDir).multiplyScalar(-0.8 - speedRatio * 1.0)
        pCenter.scale = 0.7 + speedRatio * 0.4
        pCenter.maxScale = 1.6 + speedRatio * (isBoost ? 2.5 : 1.4)
        pCenter.life = 0
        pCenter.maxLife = 1.2 + speedRatio * 0.6

        this.currentIndex = (this.currentIndex + 1) % this.maxPairs
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

            // Grow outward then fade
            const currentScale = p.scale + (p.maxScale - p.scale) * Math.sin(progress * Math.PI * 0.5)

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
