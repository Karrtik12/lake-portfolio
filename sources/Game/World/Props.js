import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Props — decorative elements: wooden beach pier and landing docks on islands.
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
            color: '#422814',
            roughness: 0.9,
            flatShading: true
        })

        this.createSpawnPier()
        this.createIslandDocks()
    }

    createSpawnPier()
    {
        const pierGroup = new THREE.Group()

        // Main boardwalk planks extending from boundary beach into lake water
        const dockLength = 18
        const dockWidth = 4.6
        const plankCount = 22

        for(let i = 0; i < plankCount; i++)
        {
            const plankGeo = new THREE.BoxGeometry(dockWidth, 0.25, 0.72)
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            plank.position.set(0, 0.75, (i - plankCount * 0.5) * 0.82)
            plank.rotation.y = (Math.random() - 0.5) * 0.04
            plank.castShadow = true
            plank.receiveShadow = true
            pierGroup.add(plank)
        }

        // Support pilings (wooden logs into water)
        const pylonPositions = [
            [-dockWidth * 0.45, -2, -8],
            [ dockWidth * 0.45, -2, -8],
            [-dockWidth * 0.45, -2, -3],
            [ dockWidth * 0.45, -2, -3],
            [-dockWidth * 0.45, -2,  2],
            [ dockWidth * 0.45, -2,  2],
            [-dockWidth * 0.45, -2,  7],
            [ dockWidth * 0.45, -2,  7]
        ]

        const pylonGeo = new THREE.CylinderGeometry(0.28, 0.32, 5, 8)
        for(const pos of pylonPositions)
        {
            const pylon = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylon.position.set(pos[0], pos[1] + 2.5, pos[2])
            pylon.castShadow = true
            pierGroup.add(pylon)
        }

        // Wooden Welcome Signpost at beach entrance of dock
        const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 3.2, 8)
        const post = new THREE.Mesh(postGeo, this.darkWoodMaterial)
        post.position.set(-dockWidth * 0.5 - 0.6, 1.8, 8.0)
        post.castShadow = true
        pierGroup.add(post)

        const signGeo = new THREE.BoxGeometry(2.6, 0.9, 0.15)
        const sign = new THREE.Mesh(signGeo, this.woodMaterial)
        sign.position.set(-dockWidth * 0.5 - 0.6, 3.0, 8.0)
        sign.rotation.y = -0.2
        sign.castShadow = true
        pierGroup.add(sign)

        // Dock firmly anchored on southern boundary beach (z = 66.5, reaches from beach z=74 to water z=58)
        pierGroup.position.set(0, 0, 66.5)
        this.game.scene.add(pierGroup)
    }

    createIslandDocks()
    {
        // Small landing docks on each island facing the center
        const dockConfigs = [
            { pos: new THREE.Vector3(-25, 0, -16), rot: 0.7 },  // Socials dock
            { pos: new THREE.Vector3(25, 0, -14),  rot: -0.7 }, // Lab dock
            { pos: new THREE.Vector3(-22, 0, 18),  rot: 2.3 }   // About dock
        ]

        for(const config of dockConfigs)
        {
            const miniDock = new THREE.Group()
            for(let i = 0; i < 8; i++)
            {
                const plankGeo = new THREE.BoxGeometry(3.2, 0.2, 0.65)
                const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
                plank.position.set(0, 0.6, (i - 4) * 0.75)
                plank.castShadow = true
                miniDock.add(plank)
            }
            miniDock.position.copy(config.pos)
            miniDock.rotation.y = config.rot
            this.game.scene.add(miniDock)
        }
    }
}
