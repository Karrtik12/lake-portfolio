import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Trees — instanced stylized low-poly trees scattered across shoreline hills and islands.
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
        // 1. Shoreline perimeter trees (radius 75 to 110)
        const shorelineTreeCount = 140
        for(let i = 0; i < shorelineTreeCount; i++)
        {
            const angle = Math.random() * Math.PI * 2
            const r = 74 + Math.random() * 38
            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r

            // Approximate shoreline height
            const ringFactor = (r - 70) / (140 - 70)
            const y = Math.pow(ringFactor, 1.4) * 22.0 + (Math.sin(angle * 7.0) * 2.0)
            const scale = 0.8 + Math.random() * 0.7

            this.positions.push({ x, y: Math.max(0.5, y), z, scale })
        }

        // 2. Island trees
        const islandConfigs = [
            { center: [-36, -22], count: 7, radius: 8 },  // Socials
            { center: [36, -20], count: 8, radius: 9 },   // Lab
            { center: [-30, 24], count: 6, radius: 7 }    // About
        ]

        for(const island of islandConfigs)
        {
            for(let i = 0; i < island.count; i++)
            {
                const angle = Math.random() * Math.PI * 2
                const r = 2.0 + Math.random() * (island.radius - 2.5)
                const x = island.center[0] + Math.cos(angle) * r
                const z = island.center[1] + Math.sin(angle) * r
                const y = 1.8 + Math.random() * 0.8
                const scale = 0.65 + Math.random() * 0.5

                this.positions.push({ x, y, z, scale })
            }
        }
    }

    createInstancedTrees()
    {
        const totalCount = this.positions.length

        // Tree geometry: single combined mesh or multi-tier pine
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.0, 6)
        trunkGeo.translate(0, 1.0, 0)

        const foliage1Geo = new THREE.ConeGeometry(1.6, 2.2, 7)
        foliage1Geo.translate(0, 2.5, 0)

        const foliage2Geo = new THREE.ConeGeometry(1.2, 1.8, 7)
        foliage2Geo.translate(0, 3.7, 0)

        const foliage3Geo = new THREE.ConeGeometry(0.8, 1.4, 7)
        foliage3Geo.translate(0, 4.7, 0)

        // Materials
        const trunkMat = new THREE.MeshStandardNodeMaterial({
            color: '#4d3019',
            roughness: 0.9,
            flatShading: true
        })

        const foliageMat = new THREE.MeshStandardNodeMaterial({
            color: '#285834',
            roughness: 0.8,
            flatShading: true
        })

        // Instanced meshes
        this.trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, totalCount)
        this.foliage1Mesh = new THREE.InstancedMesh(foliage1Geo, foliageMat, totalCount)
        this.foliage2Mesh = new THREE.InstancedMesh(foliage2Geo, foliageMat, totalCount)
        this.foliage3Mesh = new THREE.InstancedMesh(foliage3Geo, foliageMat, totalCount)

        const dummy = new THREE.Object3D()

        for(let i = 0; i < totalCount; i++)
        {
            const p = this.positions[i]
            dummy.position.set(p.x, p.y, p.z)
            dummy.rotation.y = Math.random() * Math.PI * 2
            dummy.scale.setScalar(p.scale)
            dummy.updateMatrix()

            this.trunkMesh.setMatrixAt(i, dummy.matrix)
            this.foliage1Mesh.setMatrixAt(i, dummy.matrix)
            this.foliage2Mesh.setMatrixAt(i, dummy.matrix)
            this.foliage3Mesh.setMatrixAt(i, dummy.matrix)
        }

        this.trunkMesh.instanceMatrix.needsUpdate = true
        this.foliage1Mesh.instanceMatrix.needsUpdate = true
        this.foliage2Mesh.instanceMatrix.needsUpdate = true
        this.foliage3Mesh.instanceMatrix.needsUpdate = true

        this.trunkMesh.castShadow = true
        this.foliage1Mesh.castShadow = true
        this.foliage2Mesh.castShadow = true
        this.foliage3Mesh.castShadow = true

        this.foliage1Mesh.receiveShadow = true
        this.foliage2Mesh.receiveShadow = true

        const group = new THREE.Group()
        group.add(this.trunkMesh)
        group.add(this.foliage1Mesh)
        group.add(this.foliage2Mesh)
        group.add(this.foliage3Mesh)

        this.game.scene.add(group)
    }
}
