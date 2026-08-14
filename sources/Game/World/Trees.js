import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Trees — instanced clusters of low-poly deciduous trees and pine conifers
 * placed across the expanded outer shoreline perimeter and the 3 spacious islands.
 * Specifically avoids the Lab Island billboard viewing corridor so all project cards stay 100% visible.
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
        const group = new THREE.Group()

        // 1. Socials Island tree cluster (on high plateau)
        for(let i = 0; i < 14; i++)
        {
            const angle = Math.random() * Math.PI * 2
            const r = 3.0 + Math.random() * 11.0
            const x = -58 + Math.cos(angle) * r
            const z = -38 + Math.sin(angle) * r
            const y = 1.8 + Math.random() * 2.2

            const tree = this.createRandomTree(0.9 + Math.random() * 0.5)
            tree.position.set(x, y, z)
            group.add(tree)
        }

        // 2. About Island tree cluster (on high plateau)
        for(let i = 0; i < 14; i++)
        {
            const angle = Math.random() * Math.PI * 2
            const r = 3.0 + Math.random() * 11.0
            const x = -52 + Math.cos(angle) * r
            const z = 44 + Math.sin(angle) * r
            const y = 1.8 + Math.random() * 2.2

            const tree = this.createRandomTree(0.9 + Math.random() * 0.5)
            tree.position.set(x, y, z)
            group.add(tree)
        }

        // 3. Lab Island trees — strictly placed BEHIND the billboard (z < -36.5) or far on outer flanks
        // to guarantee 100% unobstructed view of the showcase billboard and cards!
        const labTrees = [
            // Background backdrop trees behind billboard
            { x: 58,  z: -44, scale: 1.3 },
            { x: 52,  z: -43, scale: 1.1 },
            { x: 64,  z: -43, scale: 1.1 },
            { x: 47,  z: -41, scale: 1.0 },
            { x: 69,  z: -41, scale: 1.0 },
            { x: 55,  z: -47, scale: 1.4 },
            { x: 61,  z: -47, scale: 1.4 },
            // Far west flank (safe clearance from billboard width)
            { x: 40,  z: -34, scale: 1.0 },
            { x: 38,  z: -28, scale: 0.9 },
            // Far east flank (safe clearance from billboard width)
            { x: 76,  z: -34, scale: 1.0 },
            { x: 78,  z: -28, scale: 0.9 }
        ]

        for(const t of labTrees)
        {
            const tree = this.createRandomTree(t.scale)
            tree.position.set(t.x, 1.3, t.z)
            group.add(tree)
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
