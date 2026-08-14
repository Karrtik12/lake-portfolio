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
        const plankCount = 28

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

        // Support pilings
        const pylonZOffsets = [-10, -6, -2, 2, 6, 10]
        const pylonGeo = new THREE.CylinderGeometry(0.3, 0.34, 6, 8)

        for(const z of pylonZOffsets)
        {
            const pylonL = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonL.position.set(-dockWidth * 0.45, 0.5, z)
            pylonL.castShadow = true
            pierGroup.add(pylonL)

            const pylonR = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonR.position.set(dockWidth * 0.45, 0.5, z)
            pylonR.castShadow = true
            pierGroup.add(pylonR)
        }

        // Wooden Welcome Signpost at beach entrance of dock
        const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 3.4, 8)
        const post = new THREE.Mesh(postGeo, this.darkWoodMaterial)
        post.position.set(-dockWidth * 0.5 - 0.7, 2.0, 10.5)
        post.castShadow = true
        pierGroup.add(post)

        const signGeo = new THREE.BoxGeometry(2.8, 1.0, 0.16)
        const sign = new THREE.Mesh(signGeo, this.woodMaterial)
        sign.position.set(-dockWidth * 0.5 - 0.7, 3.2, 10.5)
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
     * Helper to create a wooden landing pier for a diamond marker,
     * equipped with solid Rapier physics colliders.
     */
    createShortPier(centerPos, angle, plankCount = 10, width = 2.8)
    {
        const pier = new THREE.Group()
        const plankGeo = new THREE.BoxGeometry(width, 0.22, 0.68)
        const pylonGeo = new THREE.CylinderGeometry(0.2, 0.24, 4.8, 6)
        const crossBeamGeo = new THREE.BoxGeometry(width + 0.2, 0.2, 0.25)

        for(let i = 0; i < plankCount; i++)
        {
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            const zOffset = (i - plankCount * 0.5 + 0.5) * 0.76
            plank.position.set(0, 0.68, zOffset)
            plank.rotation.y = (Math.sin(i * 2.3) * 0.02)
            plank.castShadow = true
            plank.receiveShadow = true
            pier.add(plank)
        }

        // Support pilings along pier length
        const pylonOffsets = [
            (plankCount * 0.5 - 1.2) * 0.76, // Water end
            0.0,                              // Mid pier
            (-plankCount * 0.5 + 1.2) * 0.76  // Beach end
        ]

        for(const pZ of pylonOffsets)
        {
            const pylonL = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonL.position.set(-width * 0.44, 0.2, pZ)
            pylonL.castShadow = true
            pier.add(pylonL)

            const pylonR = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylonR.position.set(width * 0.44, 0.2, pZ)
            pylonR.castShadow = true
            pier.add(pylonR)

            const cross = new THREE.Mesh(crossBeamGeo, this.darkWoodMaterial)
            cross.position.set(0, 0.1, pZ)
            cross.castShadow = true
            pier.add(cross)
        }

        pier.position.copy(centerPos)
        pier.rotation.y = angle
        this.game.scene.add(pier)

        // Solid Rapier physics collider for this pier
        if(this.game.physics?.world)
        {
            const halfW = width * 0.5
            const halfL = (plankCount * 0.76) * 0.5
            const halfH = 1.2

            const bodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(centerPos.x, 0.68, centerPos.z)
                .setRotation({
                    x: 0,
                    y: Math.sin(angle * 0.5),
                    z: 0,
                    w: Math.cos(angle * 0.5)
                })

            const body = this.game.physics.world.createRigidBody(bodyDesc)
            const colliderDesc = RAPIER.ColliderDesc.cuboid(halfW, halfH, halfL)
                .setRestitution(0.25)
                .setFriction(0.3)

            this.game.physics.world.createCollider(colliderDesc, body)
        }

        return pier
    }
}
