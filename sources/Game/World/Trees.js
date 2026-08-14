import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Trees — instanced clusters of low-poly deciduous trees and pine conifers
 * placed across the expanded outer shoreline perimeter and the 3 spacious islands.
 */
export class Trees
{
    constructor()
    {
        this.game = Game.getInstance()

        this.pineMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#1e3a29',
            roughness: 0.85,
            flatShading: true
        })

        this.deciduousMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#2d6a4f',
            roughness: 0.85,
            flatShading: true
        })

        this.trunkMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#422814',
            roughness: 0.9,
            flatShading: true
        })

        this.createShorelineTrees()
        this.createIslandTrees()
    }

    createShorelineTrees()
    {
        // 1. Shoreline perimeter forest (radius 125 to 195)
        const treeCount = 90
        const group = new THREE.Group()

        for(let i = 0; i < treeCount; i++)
        {
            const angle = (i / treeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.08
            const radius = 126 + Math.random() * 55

            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius

            // Approximate terrain height on mountains
            const landDist = radius - 115.0
            const y = 2.0 + Math.pow(Math.max(0, landDist / 125.0), 1.35) * 40.0 + (Math.random() - 0.5) * 2.0

            const tree = this.createRandomTree(1.2 + Math.random() * 0.8)
            tree.position.set(x, y, z)
            group.add(tree)
        }

        this.game.scene.add(group)
    }

    createIslandTrees()
    {
        // Island tree clusters positioned around island high plateaus
        const islandClusters = [
            { center: [-58, -38], count: 14, radius: 14 }, // Socials
            { center: [58, -35],  count: 16, radius: 16 }, // Lab
            { center: [-52, 44],  count: 12, radius: 13 }  // About
        ]

        const group = new THREE.Group()

        for(const island of islandClusters)
        {
            for(let i = 0; i < island.count; i++)
            {
                const angle = Math.random() * Math.PI * 2
                const r = 3.0 + Math.random() * (island.radius - 3.5)

                const x = island.center[0] + Math.cos(angle) * r
                const z = island.center[1] + Math.sin(angle) * r
                const y = 1.8 + (Math.random() * 2.5)

                const tree = this.createRandomTree(0.9 + Math.random() * 0.6)
                tree.position.set(x, y, z)
                group.add(tree)
            }
        }

        this.game.scene.add(group)
    }

    createRandomTree(scale = 1.0)
    {
        const isPine = Math.random() > 0.4
        const group = new THREE.Group()

        // Trunk
        const trunkHeight = (isPine ? 1.4 : 1.1) * scale
        const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, trunkHeight, 6)
        const trunk = new THREE.Mesh(trunkGeo, this.trunkMaterial)
        trunk.position.y = trunkHeight * 0.5
        trunk.castShadow = true
        group.add(trunk)

        if(isPine)
        {
            // 3 Tiered Pine Cones
            const tiers = 3
            for(let t = 0; t < tiers; t++)
            {
                const coneRadius = (1.5 - t * 0.35) * scale
                const coneHeight = (1.6 - t * 0.25) * scale
                const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 6)
                const cone = new THREE.Mesh(coneGeo, this.pineMaterial)
                cone.position.y = trunkHeight + (t * 0.95 * scale)
                cone.castShadow = true
                group.add(cone)
            }
        }
        else
        {
            // Deciduous Foliage (faceted icosahedron)
            const foliageRadius = (1.4 + Math.random() * 0.3) * scale
            const foliageGeo = new THREE.IcosahedronGeometry(foliageRadius, 1)
            const foliage = new THREE.Mesh(foliageGeo, this.deciduousMaterial)
            foliage.position.y = trunkHeight + (1.1 * scale)
            foliage.castShadow = true
            group.add(foliage)
        }

        group.rotation.y = Math.random() * Math.PI * 2
        return group
    }
}
