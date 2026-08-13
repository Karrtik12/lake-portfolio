import RAPIER from '@dimforge/rapier3d'
import { Game } from '../Game.js'

/**
 * Physics — sets up Rapier3D world and registers boundary/obstacle colliders.
 */
export class Physics
{
    constructor()
    {
        this.game = Game.getInstance()

        // Initialize Rapier World with downward gravity (for rigid bodies)
        const gravity = { x: 0.0, y: -9.81, z: 0.0 }
        this.world = new RAPIER.World(gravity)

        this.setShorelineColliders()
        this.setIslandColliders()

        // Step physics in game loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    setShorelineColliders()
    {
        // Segmented polygon barrier enclosing the lake (radius ~68)
        const radius = 68
        const segments = 32
        const angleStep = (Math.PI * 2) / segments

        for(let i = 0; i < segments; i++)
        {
            const angle1 = i * angleStep
            const angle2 = (i + 1) * angleStep

            const x1 = Math.cos(angle1) * radius
            const z1 = Math.sin(angle1) * radius
            const x2 = Math.cos(angle2) * radius
            const z2 = Math.sin(angle2) * radius

            const midX = (x1 + x2) * 0.5
            const midZ = (z1 + z2) * 0.5
            const segLength = Math.hypot(x2 - x1, z2 - z1)
            const segAngle = Math.atan2(z2 - z1, x2 - x1)

            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(midX, 1.0, midZ)
                .setRotation({ x: 0, y: Math.sin(segAngle * 0.5), z: 0, w: Math.cos(segAngle * 0.5) })

            const body = this.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cuboid(segLength * 0.5, 3.0, 1.5)
                .setRestitution(0.3)
                .setFriction(0.2)

            this.world.createCollider(colliderDesc, body)
        }
    }

    setIslandColliders()
    {
        // Cylinder colliders around each island
        const islandColliders = [
            { x: -36, z: -22, radius: 10.5 }, // Socials
            { x:  36, z: -20, radius: 12.0 }, // Lab
            { x: -30, z:  24, radius:  9.5 }, // About
            { x:   0, z:  48, radius:   5.0 }  // Dock pylon cluster
        ]

        for(const island of islandColliders)
        {
            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(island.x, 1.0, island.z)

            const body = this.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cylinder(3.0, island.radius)
                .setRestitution(0.4)
                .setFriction(0.2)

            this.world.createCollider(colliderDesc, body)
        }
    }

    update()
    {
        this.world.step()
    }
}
