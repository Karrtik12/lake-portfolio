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

        // Spawn position near the southern dock, facing lake center (-Z)
        this.spawnPosition = new THREE.Vector3(0, 0.2, 36)
        this.spawnRotation = 0 // Facing -Z (north)

        this.position = new THREE.Vector3().copy(this.spawnPosition)
        this.rotation = this.spawnRotation // Yaw in radians
        this.velocity = new THREE.Vector3()
        this.angularVelocity = 0
        this.speed = 0

        // Physics parameters
        this.engineForce = 18.0
        this.reverseForce = 8.0
        this.turnSpeed = 2.4
        this.topSpeed = 16.0
        this.linearDamping = 1.8   // Water resistance
        this.angularDamping = 4.0  // Steering resistance
        this.lateralDamping = 0.88 // Keel grip (prevents sliding sideways)

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

        const axes = this.game.inputs.getAxes()

        // 1. Steering (Rotate boat around Y axis)
        // Turning is more effective when moving
        const speedFactor = clamp(Math.abs(this.speed) / 3.0, 0.35, 1.0)
        if(axes.right !== 0)
        {
            // Invert steering when reversing
            const reverseSign = this.speed < -0.5 ? -1 : 1
            this.angularVelocity = -axes.right * this.turnSpeed * speedFactor * reverseSign
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
            forceMagnitude = this.engineForce * axes.forward
        }
        else if(axes.forward < 0)
        {
            forceMagnitude = this.reverseForce * axes.forward
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
        if(adjustedLinvel.length() > this.topSpeed)
        {
            adjustedLinvel.normalize().multiplyScalar(this.topSpeed)
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
