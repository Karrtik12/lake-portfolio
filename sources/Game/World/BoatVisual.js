import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { lerp } from '../utilities/maths.js'

/**
 * BoatVisual — renders the stylized low-poly motorboat with dynamic wave bobbing, turn-lean, and acceleration pitch.
 */
export class BoatVisual
{
    constructor()
    {
        this.game = Game.getInstance()

        this.group = new THREE.Group()
        this.currentRoll = 0
        this.currentPitch = 0

        this.createBoatModel()
        this.game.scene.add(this.group)

        // Animate
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    createBoatModel()
    {
        // Materials
        const hullMat = new THREE.MeshStandardNodeMaterial({
            color: '#f0f4f8', // Clean white deck/hull
            roughness: 0.3,
            metalness: 0.1,
            flatShading: true
        })

        const trimMat = new THREE.MeshStandardNodeMaterial({
            color: '#2563eb', // Royal blue racing stripe
            roughness: 0.4,
            metalness: 0.2,
            flatShading: true
        })

        const woodMat = new THREE.MeshStandardNodeMaterial({
            color: '#92400e', // Warm teak wood floor & benches
            roughness: 0.8,
            flatShading: true
        })

        const darkMetalMat = new THREE.MeshStandardNodeMaterial({
            color: '#1e293b', // Outboard motor dark metal
            roughness: 0.5,
            metalness: 0.6,
            flatShading: true
        })

        const glassMat = new THREE.MeshStandardNodeMaterial({
            color: '#93c5fd',
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.8
        })

        // 1. Hull Base (pointed prow, flat transom)
        const hullGeo = new THREE.BoxGeometry(2.0, 0.9, 4.4)
        // Shape prow by tapering front vertices
        const pos = hullGeo.attributes.position
        for(let i = 0; i < pos.count; i++)
        {
            const z = pos.getZ(i)
            if(z < -0.5) // Front half
            {
                const taper = (z - (-0.5)) / (-2.2 - (-0.5)) // 0 to 1
                pos.setX(i, pos.getX(i) * (1.0 - taper * 0.75))
                pos.setY(i, pos.getY(i) + taper * 0.35) // Bow rises slightly
            }
        }
        hullGeo.computeVertexNormals()

        const hull = new THREE.Mesh(hullGeo, hullMat)
        hull.position.y = 0.45
        hull.castShadow = true
        hull.receiveShadow = true
        this.group.add(hull)

        // 2. Blue Trim Band around upper hull
        const trimGeo = new THREE.BoxGeometry(2.08, 0.22, 4.48)
        const trim = new THREE.Mesh(trimGeo, trimMat)
        trim.position.y = 0.72
        this.group.add(trim)

        // 3. Wooden Deck / Cockpit Interior
        const deckGeo = new THREE.BoxGeometry(1.6, 0.15, 2.8)
        const deck = new THREE.Mesh(deckGeo, woodMat)
        deck.position.set(0, 0.65, 0.3)
        deck.receiveShadow = true
        this.group.add(deck)

        // 4. Wooden Benches
        const benchGeo = new THREE.BoxGeometry(1.5, 0.3, 0.6)
        const frontBench = new THREE.Mesh(benchGeo, woodMat)
        frontBench.position.set(0, 0.8, -0.4)
        frontBench.castShadow = true
        this.group.add(frontBench)

        const backBench = new THREE.Mesh(benchGeo, woodMat)
        backBench.position.set(0, 0.8, 1.1)
        backBench.castShadow = true
        this.group.add(backBench)

        // 5. Windshield
        const windshieldGeo = new THREE.BoxGeometry(1.6, 0.45, 0.1)
        windshieldGeo.rotateX(-0.4)
        const windshield = new THREE.Mesh(windshieldGeo, glassMat)
        windshield.position.set(0, 1.15, -0.85)
        windshield.castShadow = true
        this.group.add(windshield)

        // 6. Outboard Motor at Stern
        const motorGroup = new THREE.Group()
        const motorBodyGeo = new THREE.BoxGeometry(0.5, 0.85, 0.5)
        const motorBody = new THREE.Mesh(motorBodyGeo, darkMetalMat)
        motorBody.position.set(0, 0.65, 2.3)
        motorBody.castShadow = true
        motorGroup.add(motorBody)

        const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6)
        const shaft = new THREE.Mesh(shaftGeo, darkMetalMat)
        shaft.position.set(0, 0.0, 2.3)
        motorGroup.add(shaft)

        this.group.add(motorGroup)

        // 7. Bow Navigation Light
        const bowLightGeo = new THREE.SphereGeometry(0.12, 8, 8)
        const bowLightMat = new THREE.MeshBasicNodeMaterial({ color: '#22c55e' }) // Emerald green nav light
        const bowLight = new THREE.Mesh(bowLightGeo, bowLightMat)
        bowLight.position.set(0, 0.95, -2.1)
        this.group.add(bowLight)
    }

    update(delta)
    {
        if(!this.game.boat) return

        const boat = this.game.boat

        // 1. Position from physics
        this.group.position.copy(boat.position)

        // 2. Wave Bobbing Animation on Water
        const time = this.game.wind ? this.game.wind.time : performance.now() * 0.001
        const waveBobY = Math.sin(time * 2.2 + boat.position.x * 0.1) * 0.08
        const waveRock = Math.cos(time * 1.8 + boat.position.z * 0.1) * 0.03
        this.group.position.y = boat.position.y + waveBobY

        // 3. Dynamic Roll (Leaning into turns)
        // Turning left (angularVelocity > 0) rolls boat left, and vice versa
        const targetRoll = -boat.angularVelocity * 0.12 + waveRock
        this.currentRoll = lerp(this.currentRoll, targetRoll, 6.0 * delta)

        // 4. Dynamic Pitch (Bow lifts up on acceleration)
        const speedNorm = boat.speed / 16.0 // Normalized speed
        const targetPitch = speedNorm * 0.08 + Math.sin(time * 1.5) * 0.02
        this.currentPitch = lerp(this.currentPitch, targetPitch, 4.0 * delta)

        // 5. Apply Combined Rotations
        this.group.rotation.set(0, 0, 0)
        this.group.rotateY(boat.rotation)
        this.group.rotateZ(this.currentRoll)
        this.group.rotateX(-this.currentPitch)
    }
}
