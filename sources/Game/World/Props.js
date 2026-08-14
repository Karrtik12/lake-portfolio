import * as THREE from 'three/webgpu'
import RAPIER from '@dimforge/rapier3d'
import { Game } from '../Game.js'

/**
 * Props — decorative elements: main spawn boardwalk pier and wooden landing piers
 * for each diamond marker, equipped with solid Rapier physics colliders.
 */
export class Props
{
    constructor()
    {
        this.game = Game.getInstance()

        // Shared materials
        this.woodMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#704828',
            roughness: 0.85,
            flatShading: true
        })

        this.darkWoodMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#3d2412',
            roughness: 0.9,
            flatShading: true
        })

        this.lanternGlowMaterial = new THREE.MeshBasicNodeMaterial({
            color: '#fef08a'
        })

        this.createSpawnPier()
    }

    createSpawnPier()
    {
        const pierGroup = new THREE.Group()

        // Main boardwalk planks extending from boundary beach into lake water
        const dockWidth = 5.2
        const plankCount = 32

        for(let i = 0; i < plankCount; i++)
        {
            const plankGeo = new THREE.BoxGeometry(dockWidth, 0.26, 0.74)
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            plank.position.set(0, 0.75, (i - plankCount * 0.5) * 0.82)
            plank.rotation.y = (Math.sin(i * 1.7) * 0.02)
            plank.castShadow = true
            plank.receiveShadow = true
            pierGroup.add(plank)
        }

        // Support pilings along pier
        const pylonZOffsets = [-11, -7, -3, 1, 5, 9, 13]
        const pylonGeo = new THREE.CylinderGeometry(0.3, 0.34, 6.5, 8)

        for(const z of pylonZOffsets)
        {
            const pylonL = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonL.position.set(-dockWidth * 0.45, 0.3, z)
            pylonL.castShadow = true
            pierGroup.add(pylonL)

            const pylonR = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonR.position.set(dockWidth * 0.45, 0.3, z)
            pylonR.castShadow = true
            pierGroup.add(pylonR)
        }

        // Wooden Welcome Signpost at beach entrance of dock
        const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 3.4, 8)
        const post = new THREE.Mesh(postGeo, this.darkWoodMaterial)
        post.position.set(-dockWidth * 0.5 - 0.7, 2.0, 12.5)
        post.castShadow = true
        pierGroup.add(post)

        const signGeo = new THREE.BoxGeometry(2.8, 1.0, 0.16)
        const sign = new THREE.Mesh(signGeo, this.woodMaterial)
        sign.position.set(-dockWidth * 0.5 - 0.7, 3.2, 12.5)
        sign.rotation.y = -0.2
        sign.castShadow = true
        pierGroup.add(sign)

        // Dock firmly anchored on southern boundary beach at z=108.0
        pierGroup.position.set(0, 0, 108.0)
        this.game.scene.add(pierGroup)

        // Rapier physics collider for Spawn Pier
        if(this.game.physics?.world)
        {
            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(0, 0.75, 108.0)

            const body = this.game.physics.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cuboid(dockWidth * 0.5, 1.5, (plankCount * 0.82) * 0.5)
                .setRestitution(0.2)
                .setFriction(0.3)

            this.game.physics.world.createCollider(colliderDesc, body)
        }
    }

    /**
     * Create a wooden landing pier between startPos (on dry beach) and endPos (in deep water).
     * Automatically computes orientation, plank distribution, support pilings, and Rapier collider.
     */
    createPierBetween(startPos, endPos, width = 2.8)
    {
        const dx = endPos.x - startPos.x
        const dz = endPos.z - startPos.z
        const length = Math.hypot(dx, dz)
        const angle = Math.atan2(dx, dz) // Y-axis rotation

        const centerPos = new THREE.Vector3(
            (startPos.x + endPos.x) * 0.5,
            (startPos.y + endPos.y) * 0.5,
            (startPos.z + endPos.z) * 0.5
        )

        const plankSpacing = 0.76
        const plankCount = Math.max(8, Math.round(length / plankSpacing))
        const actualStep = length / plankCount

        const pier = new THREE.Group()
        const plankGeo = new THREE.BoxGeometry(width, 0.22, actualStep * 0.88)
        const pylonGeo = new THREE.CylinderGeometry(0.2, 0.24, 6.0, 6)
        const crossBeamGeo = new THREE.BoxGeometry(width + 0.2, 0.2, 0.25)

        for(let i = 0; i < plankCount; i++)
        {
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            const zOffset = (i - (plankCount - 1) * 0.5) * actualStep
            plank.position.set(0, 0, zOffset)
            plank.rotation.y = Math.sin(i * 2.3) * 0.015
            plank.castShadow = true
            plank.receiveShadow = true
            pier.add(plank)
        }

        // Support pilings along pier length (water end, mid-water, mid-beach, beach end)
        const pylonFactors = [-0.38, -0.12, 0.14, 0.38]
        for(const factor of pylonFactors)
        {
            const pZ = factor * length
            const pylonL = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonL.position.set(-width * 0.44, -2.5, pZ)
            pylonL.castShadow = true
            pier.add(pylonL)

            const pylonR = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonR.position.set(width * 0.44, -2.5, pZ)
            pylonR.castShadow = true
            pier.add(pylonR)

            const cross = new THREE.Mesh(crossBeamGeo, this.darkWoodMaterial)
            cross.position.set(0, -0.6, pZ)
            cross.castShadow = true
            pier.add(cross)
        }

        pier.position.copy(centerPos)
        pier.rotation.y = angle
        this.game.scene.add(pier)

        // Solid Rapier physics collider
        if(this.game.physics?.world)
        {
            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(centerPos.x, centerPos.y, centerPos.z)
                .setRotation({
                    x: 0,
                    y: Math.sin(angle * 0.5),
                    z: 0,
                    w: Math.cos(angle * 0.5)
                })

            const body = this.game.physics.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cuboid(width * 0.5, 1.4, length * 0.5)
                .setRestitution(0.25)
                .setFriction(0.3)

            this.game.physics.world.createCollider(colliderDesc, body)
        }

        return pier
    }

    /**
     * Backward-compatible helper to create a wooden landing pier centered at centerPos.
     */
    createShortPier(centerPos, angle, plankCount = 13, width = 2.8)
    {
        const length = plankCount * 0.76
        const halfL = length * 0.5
        const dirX = Math.sin(angle)
        const dirZ = Math.cos(angle)

        const startPos = new THREE.Vector3(
            centerPos.x - dirX * halfL,
            centerPos.y || 0.68,
            centerPos.z - dirZ * halfL
        )

        const endPos = new THREE.Vector3(
            centerPos.x + dirX * halfL,
            centerPos.y || 0.68,
            centerPos.z + dirZ * halfL
        )

        return this.createPierBetween(startPos, endPos, width)
    }
}
