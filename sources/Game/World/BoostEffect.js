import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from '../Game.js'

/**
 * BoostEffect — high-energy nitro flame exhaust plumes, glowing wake light,
 * and high-speed trailing sparks when Shift boost is activated.
 * Attached directly to the boat visual so flames stay locked to the motor exhaust.
 */
export class BoostEffect
{
    constructor()
    {
        this.game = Game.getInstance()
        this.isAttached = false

        this.group = new THREE.Group()

        // 1. Dual Nitro Jet Exhaust Flames
        const flameGeo = new THREE.ConeGeometry(0.16, 1.2, 8)
        flameGeo.rotateX(Math.PI * 0.5) // Point straight backwards (+Z in boat local space)

        this.flameCoreMat = new THREE.MeshBasicNodeMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.0
        })

        this.flameOuterMat = new THREE.MeshBasicNodeMaterial({
            color: '#38bdf8', // Electric cyan plasma
            transparent: true,
            opacity: 0.0
        })

        // Port & Starboard flame cones attached to outboard motor exhaust (z = 2.85, y = 0.5)
        this.flameLeftCore = new THREE.Mesh(flameGeo, this.flameCoreMat)
        this.flameLeftCore.position.set(-0.22, 0.5, 2.85)
        this.flameLeftCore.scale.set(0.6, 0.6, 0.8)
        this.group.add(this.flameLeftCore)

        this.flameLeftOuter = new THREE.Mesh(flameGeo, this.flameOuterMat)
        this.flameLeftOuter.position.set(-0.22, 0.5, 3.0)
        this.flameLeftOuter.scale.set(1.1, 1.1, 1.4)
        this.group.add(this.flameLeftOuter)

        this.flameRightCore = new THREE.Mesh(flameGeo, this.flameCoreMat)
        this.flameRightCore.position.set(0.22, 0.5, 2.85)
        this.flameRightCore.scale.set(0.6, 0.6, 0.8)
        this.group.add(this.flameRightCore)

        this.flameRightOuter = new THREE.Mesh(flameGeo, this.flameOuterMat)
        this.flameRightOuter.position.set(0.22, 0.5, 3.0)
        this.flameRightOuter.scale.set(1.1, 1.1, 1.4)
        this.group.add(this.flameRightOuter)

        // 2. Glowing Stern Point Light illuminating water
        this.boostLight = new THREE.PointLight('#38bdf8', 0, 8.0, 1.8)
        this.boostLight.position.set(0, 0.6, 2.8)
        this.group.add(this.boostLight)

        // 3. Trailing Spark Particles in world space
        this.sparkCount = 30
        this.sparks = []
        const sparkGeo = new THREE.BufferGeometry()
        const sparkPositions = new Float32Array(this.sparkCount * 3)
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))

        const sparkMat = new THREE.PointsMaterial({
            color: '#67e8f9',
            size: 0.28,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        })

        this.sparkMesh = new THREE.Points(sparkGeo, sparkMat)
        this.game.scene.add(this.sparkMesh)

        for(let i = 0; i < this.sparkCount; i++)
        {
            this.sparks.push({
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 0.45
            })
        }

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    attachToBoat()
    {
        if(this.isAttached) return

        const boatVisualGroup = this.game.world?.boatVisual?.group
        if(boatVisualGroup)
        {
            boatVisualGroup.add(this.group)
            this.isAttached = true
        }
    }

    update(delta)
    {
        if(!this.isAttached)
        {
            this.attachToBoat()
        }

        const axes = this.game.inputs.getAxes()
        const isBoostActive = axes.boost && axes.forward > 0 && Math.abs(this.game.boat?.speed || 0) > 1.5
        const time = performance.now() * 0.001

        if(isBoostActive)
        {
            // Rapid flame flicker & stretch
            const flicker = 1.0 + Math.sin(time * 35.0) * 0.2 + (Math.random() - 0.5) * 0.3
            const stretch = 1.4 + Math.sin(time * 28.0) * 0.3

            this.flameCoreMat.opacity = 0.95
            this.flameOuterMat.opacity = 0.85

            this.flameLeftCore.scale.set(0.6 * flicker, 0.6 * flicker, 0.9 * stretch)
            this.flameLeftOuter.scale.set(1.1 * flicker, 1.1 * flicker, 1.5 * stretch)
            this.flameRightCore.scale.set(0.6 * flicker, 0.6 * flicker, 0.9 * stretch)
            this.flameRightOuter.scale.set(1.1 * flicker, 1.1 * flicker, 1.5 * stretch)

            this.boostLight.intensity = THREE.MathUtils.lerp(this.boostLight.intensity, 3.5, 0.2)

            // Emit trailing sparks
            this.emitSparks()
        }
        else
        {
            // Smoothly fade out
            this.flameCoreMat.opacity = THREE.MathUtils.lerp(this.flameCoreMat.opacity, 0.0, 0.25)
            this.flameOuterMat.opacity = THREE.MathUtils.lerp(this.flameOuterMat.opacity, 0.0, 0.25)
            this.boostLight.intensity = THREE.MathUtils.lerp(this.boostLight.intensity, 0.0, 0.25)
        }

        // Animate spark particles
        this.updateSparks(delta)
    }

    emitSparks()
    {
        if(!this.game.boat) return
        const boat = this.game.boat
        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-2.4))

        for(let i = 0; i < 2; i++)
        {
            const s = this.sparks.find(sp => !sp.active)
            if(!s) break

            s.active = true
            s.life = 0
            const side = (Math.random() - 0.5) * 0.6
            s.position.copy(sternPos).add(rightDir.clone().multiplyScalar(side))
            s.position.y = 0.35 + (Math.random() - 0.5) * 0.15

            // Shoot backwards fast
            s.velocity.copy(forwardDir).multiplyScalar(-14.0 - Math.random() * 8.0)
                .add(new THREE.Vector3((Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2.0))
        }
    }

    updateSparks(delta)
    {
        const posAttr = this.sparkMesh.geometry.attributes.position
        let hasActive = false

        for(let i = 0; i < this.sparkCount; i++)
        {
            const s = this.sparks[i]
            if(!s.active)
            {
                posAttr.setXYZ(i, 0, -999, 0)
                continue
            }

            s.life += delta
            if(s.life >= s.maxLife)
            {
                s.active = false
                posAttr.setXYZ(i, 0, -999, 0)
                continue
            }

            hasActive = true
            s.position.addScaledVector(s.velocity, delta)
            posAttr.setXYZ(i, s.position.x, s.position.y, s.position.z)
        }

        posAttr.needsUpdate = true
        this.sparkMesh.material.opacity = hasActive ? 0.9 : 0.0
    }
}
