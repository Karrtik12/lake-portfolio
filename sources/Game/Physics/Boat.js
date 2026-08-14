import RAPIER from '@dimforge/rapier3d'
import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { clamp, lerp } from '../utilities/maths.js'

/**
 * Boat — physics controller simulating watercraft propulsion, rudder steering, and hydrodynamic drag.
 */
export class Boat
{
    constructor()
    {
        this.game = Game.getInstance()

        // Spawn position docked at the southern beach pier, facing north (-Z) towards the lake islands
        this.spawnPosition = new THREE.Vector3(0, 0.2, 54.0)
        this.spawnRotation = 0 // Facing -Z (north)

        this.position = new THREE.Vector3().copy(this.spawnPosition)
        this.rotation = this.spawnRotation // Yaw in radians
        this.velocity = new THREE.Vector3()
        this.angularVelocity = 0
        this.speed = 0

        // Base Physics parameters (relaxed cruising with realistic wide rudder turning radius)
        this.baseEngineForce = 9.5
        this.baseReverseForce = 5.5
        this.baseTurnSpeed = 1.05  // Wider turning radius
        this.baseTopSpeed = 9.0

        // Boost parameters (holding Shift)
        this.boostEngineForce = 18.5
        this.boostTopSpeed = 17.0
        this.boostTurnSpeed = 1.35

        this.linearDamping = 1.6   // Water resistance
        this.angularDamping = 4.5  // Steering resistance
        this.lateralDamping = 0.94 // Keel grip (prevents sliding sideways)

        // Create dynamic rigid body in Rapier
        this.initPhysicsBody()

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })

        // Listen for reset input
        this.game.inputs.events.on('reset', () =>
        {
            this.reset()
        })
    }

    initPhysicsBody()
    {
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(this.position.x, this.position.y, this.position.z)
            .setLinearDamping(this.linearDamping)
            .setAngularDamping(this.angularDamping)
            .lockRotations() // We handle yaw & pitch/roll visuals smoothly

        this.body = this.game.physics.world.createRigidBody(bodyDesc)

        // Boat hull collider (capsule or cuboid)
        const colliderDesc = RAPIER.ColliderDesc.cuboid(1.2, 0.8, 2.2)
            .setRestitution(0.4)
            .setFriction(0.3)
            .setDensity(1.0)

        this.collider = this.game.physics.world.createCollider(colliderDesc, this.body)
    }

    update(delta)
    {
        if(!this.body) return

        let axes = this.game.inputs.getAxes()

        // If camera is in cinematic mode (e.g. Lab billboard focused), ignore movement & steering inputs
        const isCinematic = this.game.view && this.game.view.mode === 3
        const isLabFocused = this.game.areaManager?.lab?.isFocused
        if(isCinematic || isLabFocused)
        {
            axes = { forward: 0, right: 0, boost: false }
            this.angularVelocity = lerp(this.angularVelocity, 0, this.angularDamping * delta)
        }

        // Determine current speed & turn parameters based on Shift boost
        const currentEngineForce = axes.boost ? this.boostEngineForce : this.baseEngineForce
        const currentTopSpeed = axes.boost ? this.boostTopSpeed : this.baseTopSpeed
        const currentTurnSpeed = axes.boost ? this.boostTurnSpeed : this.baseTurnSpeed

        // 1. Rudder Steering (Rotate boat around Y axis)
        // Realistic rudder physics: turning requires water flow/momentum past the rudder
        const speedFactor = clamp(Math.abs(this.speed) / 3.5, 0.08, 1.0)
        if(axes.right !== 0 && !isCinematic && !isLabFocused)
        {
            // Invert steering when reversing
            const reverseSign = this.speed < -0.5 ? -1 : 1
            this.angularVelocity = -axes.right * currentTurnSpeed * speedFactor * reverseSign
        }
        else
        {
            this.angularVelocity = lerp(this.angularVelocity, 0, this.angularDamping * delta)
        }

        this.rotation += this.angularVelocity * delta

        // 2. Engine Propulsion (Forward / Reverse)
        const forwardDir = new THREE.Vector3(
            -Math.sin(this.rotation),
            0,
            -Math.cos(this.rotation)
        )

        const rightDir = new THREE.Vector3(
            forwardDir.z,
            0,
            -forwardDir.x
        )

        let forceMagnitude = 0
        if(axes.forward > 0)
        {
            forceMagnitude = currentEngineForce * axes.forward
        }
        else if(axes.forward < 0)
        {
            forceMagnitude = this.baseReverseForce * axes.forward
        }

        const force = {
            x: forwardDir.x * forceMagnitude,
            y: 0,
            z: forwardDir.z * forceMagnitude
        }

        this.body.applyImpulse(force, true)

        // 3. Hydrodynamic Lateral Resistance (Keel Effect)
        const currentLinvel = this.body.linvel()
        const linvelVec = new THREE.Vector3(currentLinvel.x, 0, currentLinvel.z)

        // Project velocity onto forward and lateral directions
        const forwardSpeed = linvelVec.dot(forwardDir)
        const lateralSpeed = linvelVec.dot(rightDir)

        // Cancel lateral drift (water resistance against boat sides)
        const adjustedLinvel = forwardDir.clone().multiplyScalar(forwardSpeed)
            .add(rightDir.clone().multiplyScalar(lateralSpeed * this.lateralDamping))

        // Cap maximum speed
        if(adjustedLinvel.length() > currentTopSpeed)
        {
            adjustedLinvel.normalize().multiplyScalar(currentTopSpeed)
        }

        // Lock Y translation to water plane (y = 0.2)
        this.body.setLinvel({ x: adjustedLinvel.x, y: 0, z: adjustedLinvel.z }, true)
        const t = this.body.translation()
        this.body.setTranslation({ x: t.x, y: 0.2, z: t.z }, true)

        // Update public state
        this.position.set(t.x, t.y, t.z)
        this.velocity.set(adjustedLinvel.x, 0, adjustedLinvel.z)
        this.speed = forwardSpeed
    }

    reset()
    {
        if(!this.body) return

        this.position.copy(this.spawnPosition)
        this.rotation = this.spawnRotation
        this.angularVelocity = 0
        this.speed = 0

        this.body.setTranslation({
            x: this.spawnPosition.x,
            y: this.spawnPosition.y,
            z: this.spawnPosition.z
        }, true)

        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
}
