import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Wake — generates dynamic foam spray particles and expanding V-shaped wake behind the boat.
 */
export class Wake
{
    constructor()
    {
        this.game = Game.getInstance()

        this.maxParticles = 60
        this.particles = []
        this.currentIndex = 0
        this.emitInterval = 0.06
        this.emitTimer = 0

        // Shared foam particle geometry & material
        this.geometry = new THREE.PlaneGeometry(1.2, 1.2)
        this.geometry.rotateX(-Math.PI * 0.5)

        this.material = new THREE.MeshBasicNodeMaterial({
            color: '#bde0fe',
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        })

        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxParticles)
        this.instancedMesh.position.y = 0.02 // Sit right above water
        this.game.scene.add(this.instancedMesh)

        // Initialize particle pool
        const dummy = new THREE.Object3D()
        dummy.position.set(0, -999, 0)
        dummy.scale.set(0, 0, 0)
        dummy.updateMatrix()

        for(let i = 0; i < this.maxParticles; i++)
        {
            this.instancedMesh.setMatrixAt(i, dummy.matrix)
            this.particles.push({
                active: false,
                position: new THREE.Vector3(),
                scale: 0.1,
                maxScale: 2.5,
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

    emitParticle(sternPos, speed)
    {
        const p = this.particles[this.currentIndex]
        p.active = true
        p.position.copy(sternPos)
        p.scale = 0.4
        p.maxScale = 1.2 + (speed / 16.0) * 2.2
        p.life = 0
        p.maxLife = 1.2 + (speed / 16.0) * 0.8

        this.currentIndex = (this.currentIndex + 1) % this.maxParticles
    }

    update(delta)
    {
        const boat = this.game.boat
        if(boat && Math.abs(boat.speed) > 0.8)
        {
            this.emitTimer += delta
            if(this.emitTimer >= this.emitInterval)
            {
                this.emitTimer = 0

                // Stern position behind boat
                const sternOffset = new THREE.Vector3(
                    Math.sin(boat.rotation) * 2.2,
                    0,
                    Math.cos(boat.rotation) * 2.2
                )
                const sternPos = boat.position.clone().add(sternOffset)

                // Emit left and right wake trails
                this.emitParticle(sternPos, Math.abs(boat.speed))
            }
        }

        // Animate all active wake particles
        const dummy = new THREE.Object3D()
        let needsUpdate = false

        for(let i = 0; i < this.maxParticles; i++)
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

            // Expand and flatten
            p.scale = p.scale + (p.maxScale - p.scale) * delta * 2.5

            dummy.position.copy(p.position)
            dummy.scale.set(p.scale, 1.0, p.scale)
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
