import RAPIER from '@dimforge/rapier3d'
import { Game } from '../Game.js'
import { Shoreline } from '../World/Shoreline.js'

/**
 * Physics — sets up Rapier3D world and registers boundary/obstacle colliders
 * matching exact expanded terrain contours and islands.
 */
export class Physics
{
    constructor()
    {
        this.game = Game.getInstance()

        // Initialize Rapier World with downward gravity
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
        // 96-segment high-resolution polygon barrier matching the exact coastline curve
        const segments = 96
        const angleStep = (Math.PI * 2) / segments

        for(let i = 0; i < segments; i++)
        {
            const angle1 = i * angleStep
            const angle2 = (i + 1) * angleStep

            // Position barrier on the dry beach (coastRadius + 1.0m)
            const r1 = Shoreline.getCoastRadius(angle1) + 1.0
            const r2 = Shoreline.getCoastRadius(angle2) + 1.0

            const x1 = Math.cos(angle1) * r1
            const z1 = Math.sin(angle1) * r1
            const x2 = Math.cos(angle2) * r2
            const z2 = Math.sin(angle2) * r2

            const midX = (x1 + x2) * 0.5
            const midZ = (z1 + z2) * 0.5
            const segLength = Math.hypot(x2 - x1, z2 - z1)
            const segAngle = Math.atan2(z2 - z1, x2 - x1)

            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(midX, 1.0, midZ)
                .setRotation({ x: 0, y: Math.sin(segAngle * 0.5), z: 0, w: Math.cos(segAngle * 0.5) })

            const body = this.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cuboid(segLength * 0.5, 3.0, 1.5)
                .setRestitution(0.2)
                .setFriction(0.2)

            this.world.createCollider(colliderDesc, body)
        }
    }

    setIslandColliders()
    {
        // Expanded island landmass colliders
        const islandColliders = [
            { x: -58, z: -38, radius: 17.5 }, // Socials Island
            { x:  58, z: -35, radius: 19.5 }, // Lab Island
            { x: -52, z:  44, radius: 16.5 }  // About Island
        ]

        for(const island of islandColliders)
        {
            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(island.x, 1.0, island.z)

            const body = this.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cylinder(3.0, island.radius)
                .setRestitution(0.3)
                .setFriction(0.2)

            this.world.createCollider(colliderDesc, body)
        }
    }

    update()
    {
        // Step physics simulation by fixed delta
        this.world.step()
    }
}
