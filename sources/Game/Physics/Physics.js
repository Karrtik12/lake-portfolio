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
        // Island definitions matching exact Islands.js geometries
        const islandDefs = [
            {
                id: 'socials',
                center: { x: -58, z: -38 },
                radiusX: 24,
                radiusZ: 20,
                seed: 1.4
            },
            {
                id: 'lab',
                center: { x: 58, z: -35 },
                radiusX: 26,
                radiusZ: 22,
                seed: 2.8
            },
            {
                id: 'about',
                center: { x: -52, z: 44 },
                radiusX: 22,
                radiusZ: 22,
                seed: 4.2
            }
        ]

        const segments = 48
        const angleStep = (Math.PI * 2) / segments

        for(const island of islandDefs)
        {
            // 1. High-resolution perimeter polygon barrier around dry beach waterline
            for(let i = 0; i < segments; i++)
            {
                const angle1 = i * angleStep
                const angle2 = (i + 1) * angleStep

                const r1 = this.getIslandWaterlineRadius(island, angle1)
                const r2 = this.getIslandWaterlineRadius(island, angle2)

                const x1 = island.center.x + Math.cos(angle1) * r1
                const z1 = island.center.z + Math.sin(angle1) * r1
                const x2 = island.center.x + Math.cos(angle2) * r2
                const z2 = island.center.z + Math.sin(angle2) * r2

                const midX = (x1 + x2) * 0.5
                const midZ = (z1 + z2) * 0.5
                const segLength = Math.hypot(x2 - x1, z2 - z1)
                const segAngle = Math.atan2(z2 - z1, x2 - x1)

                const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                    .setTranslation(midX, 1.5, midZ)
                    .setRotation({ x: 0, y: Math.sin(segAngle * 0.5), z: 0, w: Math.cos(segAngle * 0.5) })

                const body = this.world.createRigidBody(bodyDesc)
                const colliderDesc = RAPIER.ColliderDesc.cuboid(segLength * 0.5 + 0.2, 3.0, 1.5)
                    .setRestitution(0.3)
                    .setFriction(0.4)

                this.world.createCollider(colliderDesc, body)
            }

            // 2. Solid interior core cylinder
            const coreRadius = Math.min(island.radiusX, island.radiusZ) * 0.7
            const coreBodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(island.center.x, 1.5, island.center.z)

            const coreBody = this.world.createRigidBody(coreBodyDesc)
            const coreColliderDesc = RAPIER.ColliderDesc.cylinder(3.0, coreRadius)
                .setRestitution(0.3)
                .setFriction(0.4)

            this.world.createCollider(coreColliderDesc, coreBody)
        }
    }

    getIslandWaterlineRadius(island, angle)
    {
        const noise1 = Math.sin(angle * 3.0 + island.seed) * 0.05 + Math.cos(angle * 5.0 - island.seed) * 0.03
        const noise2 = Math.sin(angle * 7.0 + island.seed * 2.0) * 0.02
        const organicFactor = 0.98 - (noise1 + noise2)

        const cosA = Math.cos(angle)
        const sinA = Math.sin(angle)
        const rx = island.radiusX * organicFactor
        const rz = island.radiusZ * organicFactor

        return (rx * rz) / Math.sqrt((rz * cosA) ** 2 + (rx * sinA) ** 2)
    }

    update()
    {
        // Step physics simulation by fixed delta
        this.world.step()
    }
}
