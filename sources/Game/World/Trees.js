import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Trees — high-quality stylized low-poly trees and bushes with multi-cluster volumetric foliage and branching trunks.
 */
export class Trees
{
    constructor()
    {
        this.game = Game.getInstance()

        this.positions = []
        this.generatePositions()
        this.createInstancedTrees()
    }

    generatePositions()
    {
        // 1. Shoreline perimeter forest (radius 76 to 115)
        const shorelineTreeCount = 130
        for(let i = 0; i < shorelineTreeCount; i++)
        {
            const angle = Math.random() * Math.PI * 2
            const r = 75 + Math.random() * 36
            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r

            // Shoreline slope height
            const ringFactor = (r - 70) / (140 - 70)
            const y = Math.pow(ringFactor, 1.4) * 22.0 + (Math.sin(angle * 7.0) * 2.0)
            const scale = 0.85 + Math.random() * 0.65
            const variant = Math.floor(Math.random() * 3) // 0: Pine, 1: Oak, 2: Birch

            this.positions.push({ x, y: Math.max(0.6, y), z, scale, variant })
        }

        // 2. Island trees (clustered naturally on plateaus)
        const islandConfigs = [
            { center: [-36, -22], count: 8, radius: 8 },  // Socials
            { center: [36, -20], count: 9, radius: 9 },   // Lab
            { center: [-30, 24], count: 7, radius: 7 }    // About
        ]

        for(const island of islandConfigs)
        {
            for(let i = 0; i < island.count; i++)
            {
                const angle = Math.random() * Math.PI * 2
                const r = 2.0 + Math.random() * (island.radius - 2.5)
                const x = island.center[0] + Math.cos(angle) * r
                const z = island.center[1] + Math.sin(angle) * r

                // Keep clear sightline in front of Lab billboard (x: 36, z: -20)
                if(island.center[0] === 36 && z > -20.5 && Math.abs(x - 36) < 6.0)
                {
                    continue
                }

                const y = 2.0 + Math.random() * 0.8
                const scale = 0.75 + Math.random() * 0.5
                const variant = Math.floor(Math.random() * 3)

                this.positions.push({ x, y, z, scale, variant })
            }
        }
    }

    createInstancedTrees()
    {
        const totalCount = this.positions.length

        // 1. Organic Branching Trunk Geometry
        const trunkGeo = new THREE.CylinderGeometry(0.18, 0.45, 2.6, 7)
        trunkGeo.translate(0, 1.3, 0)

        // 2. Multi-cluster Volumetric Foliage (Stylized Dodecahedron Clumps)
        const foliageMainGeo = new THREE.DodecahedronGeometry(1.6, 1)
        foliageMainGeo.translate(0, 3.2, 0)

        const foliageTopGeo = new THREE.DodecahedronGeometry(1.1, 1)
        foliageTopGeo.translate(0.3, 4.4, 0.2)

        const foliageSideGeo = new THREE.DodecahedronGeometry(1.0, 1)
        foliageSideGeo.translate(-0.6, 2.8, -0.4)

        // Materials with varied rich natural tones
        const trunkMat = new THREE.MeshStandardNodeMaterial({
            color: '#4a2f1b',
            roughness: 0.88,
            flatShading: true
        })

        const foliageMainMat = new THREE.MeshStandardNodeMaterial({
            color: '#2d6a4f',
            roughness: 0.75,
            flatShading: true
        })

        const foliageTopMat = new THREE.MeshStandardNodeMaterial({
            color: '#40916c',
            roughness: 0.75,
            flatShading: true
        })

        const foliageSideMat = new THREE.MeshStandardNodeMaterial({
            color: '#1b4332',
            roughness: 0.75,
            flatShading: true
        })

        // Instanced Meshes
        this.trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, totalCount)
        this.foliageMainMesh = new THREE.InstancedMesh(foliageMainGeo, foliageMainMat, totalCount)
        this.foliageTopMesh = new THREE.InstancedMesh(foliageTopGeo, foliageTopMat, totalCount)
        this.foliageSideMesh = new THREE.InstancedMesh(foliageSideGeo, foliageSideMat, totalCount)

        const dummy = new THREE.Object3D()

        for(let i = 0; i < totalCount; i++)
        {
            const p = this.positions[i]
            dummy.position.set(p.x, p.y, p.z)
            dummy.rotation.y = Math.random() * Math.PI * 2
            dummy.rotation.x = (Math.random() - 0.5) * 0.08
            dummy.rotation.z = (Math.random() - 0.5) * 0.08
            dummy.scale.setScalar(p.scale)
            dummy.updateMatrix()

            this.trunkMesh.setMatrixAt(i, dummy.matrix)
            this.foliageMainMesh.setMatrixAt(i, dummy.matrix)
            this.foliageTopMesh.setMatrixAt(i, dummy.matrix)
            this.foliageSideMesh.setMatrixAt(i, dummy.matrix)
        }

        this.trunkMesh.instanceMatrix.needsUpdate = true
        this.foliageMainMesh.instanceMatrix.needsUpdate = true
        this.foliageTopMesh.instanceMatrix.needsUpdate = true
        this.foliageSideMesh.instanceMatrix.needsUpdate = true

        this.trunkMesh.castShadow = true
        this.foliageMainMesh.castShadow = true
        this.foliageTopMesh.castShadow = true
        this.foliageSideMesh.castShadow = true

        this.foliageMainMesh.receiveShadow = true
        this.foliageTopMesh.receiveShadow = true

        const group = new THREE.Group()
        group.add(this.trunkMesh)
        group.add(this.foliageMainMesh)
        group.add(this.foliageTopMesh)
        group.add(this.foliageSideMesh)

        this.game.scene.add(group)
    }
}
