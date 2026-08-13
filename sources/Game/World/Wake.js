import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — generates high-fidelity V-shaped wake trails expanding outward from the boat's port and starboard sides,
 * along with churning motor propeller foam.
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxPairs = 50 // 50 left + 50 right wake waves + 50 center foam
        this.totalParticles = this.maxPairs * 3
        this.particles = []
        this.currentIndex = 0
        this.emitInterval = 0.04
        this.emitTimer = 0

        // Wake ribbon geometry
        this.geometry = new THREE.PlaneGeometry(1.4, 0.9)
        this.geometry.rotateX(-Math.PI * 0.5)

        this.material = new THREE.MeshBasicNodeMaterial({
            color: '#e0f2fe',
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        })

        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.totalParticles)
        this.instancedMesh.position.y = 0.04 // Just above water surface
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
                scale: new THREE.Vector3(0.1, 1.0, 0.1),
                maxScale: new THREE.Vector3(3.0, 1.0, 1.8),
                rotation: 0,
                life: 0,
                maxLife: 2.2
            })
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    emitV(boat, speed)
    {
        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.8))

        const speedNorm = Math.min(speed / 16.0, 1.0)
        const vAngle = 0.55 // V-wake spread angle

        // 1. Port (Left) V-Wave
        const portIndex = this.currentIndex * 3 + 0
        const pPort = this.particles[portIndex]
        pPort.active = true
        pPort.position.copy(sternPos).add(rightDir.clone().multiplyScalar(-0.8))
        // Expand outward-left and back
        pPort.velocity.copy(rightDir).multiplyScalar(-1.8 - speedNorm * 1.5).add(forwardDir.clone().multiplyScalar(-0.5))
        pPort.scale.set(0.6, 1.0, 0.4)
        pPort.maxScale.set(2.4 + speedNorm * 2.8, 1.0, 1.2 + speedNorm * 1.5)
        pPort.rotation = boat.rotation - vAngle
        pPort.life = 0
        pPort.maxLife = 1.8 + speedNorm * 1.2

        // 2. Starboard (Right) V-Wave
        const starIndex = this.currentIndex * 3 + 1
        const pStar = this.particles[starIndex]
        pStar.active = true
        pStar.position.copy(sternPos).add(rightDir.clone().multiplyScalar(0.8))
        // Expand outward-right and back
        pStar.velocity.copy(rightDir).multiplyScalar(1.8 + speedNorm * 1.5).add(forwardDir.clone().multiplyScalar(-0.5))
        pStar.scale.set(0.6, 1.0, 0.4)
        pStar.maxScale.set(2.4 + speedNorm * 2.8, 1.0, 1.2 + speedNorm * 1.5)
        pStar.rotation = boat.rotation + vAngle
        pStar.life = 0
        pStar.maxLife = 1.8 + speedNorm * 1.2

        // 3. Center Propeller Churn Foam
        const centerIndex = this.currentIndex * 3 + 2
        const pCenter = this.particles[centerIndex]
        pCenter.active = true
        pCenter.position.copy(sternPos).add(forwardDir.clone().multiplyScalar(-0.4))
        pCenter.velocity.copy(forwardDir).multiplyScalar(-0.8)
        pCenter.scale.set(0.8, 1.0, 0.8)
        pCenter.maxScale.set(1.6 + speedNorm * 1.5, 1.0, 2.2 + speedNorm * 2.0)
        pCenter.rotation = boat.rotation
        pCenter.life = 0
        pCenter.maxLife = 1.2 + speedNorm * 0.8

        this.currentIndex = (this.currentIndex + 1) % this.maxPairs
    }

    update(delta)
    {
        const boat = this.game.boat
        if(boat && Math.abs(boat.speed) > 0.6)
        {
            this.emitTimer += delta
            if(this.emitTimer >= this.emitInterval)
            {
                this.emitTimer = 0
                this.emitV(boat, Math.abs(boat.speed))
            }
        }

        // Animate all active wake particles
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

            // Move particle outward along V-expansion
            p.position.addScaledVector(p.velocity, delta)

            // Grow scale
            const growth = progress
            const currentScaleX = p.scale.x + (p.maxScale.x - p.scale.x) * growth
            const currentScaleZ = p.scale.z + (p.maxScale.z - p.scale.z) * growth

            dummy.position.copy(p.position)
            dummy.rotation.set(0, 0, 0)
            dummy.rotateY(p.rotation)
            dummy.scale.set(currentScaleX, 1.0, currentScaleZ)
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
