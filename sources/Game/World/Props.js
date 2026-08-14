import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Props — decorative elements: main spawn boardwalk pier and short wooden landing piers for each diamond marker.
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
        const dockLength = 18
        const dockWidth = 4.6
        const plankCount = 22

        for(let i = 0; i < plankCount; i++)
        {
            const plankGeo = new THREE.BoxGeometry(dockWidth, 0.25, 0.72)
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            plank.position.set(0, 0.75, (i - plankCount * 0.5) * 0.82)
            plank.rotation.y = (Math.sin(i * 1.7) * 0.02)
            plank.castShadow = true
            plank.receiveShadow = true
            pierGroup.add(plank)
        }

        // Support pilings
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

        // Dock firmly anchored on southern boundary beach
        pierGroup.position.set(0, 0, 66.5)
        this.game.scene.add(pierGroup)
    }

    /**
     * Helper to create a short wooden pier for a diamond marker.
     * Starts from shore and extends outwards to the marker.
     */
    createShortPier(centerPos, angle, plankCount = 6, width = 2.6)
    {
        const pier = new THREE.Group()
        const plankGeo = new THREE.BoxGeometry(width, 0.2, 0.65)
        const pylonGeo = new THREE.CylinderGeometry(0.18, 0.22, 4.5, 6)

        for(let i = 0; i < plankCount; i++)
        {
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            const zOffset = (i - plankCount * 0.5 + 0.5) * 0.75
            plank.position.set(0, 0.62, zOffset)
            plank.rotation.y = (Math.sin(i * 2.3) * 0.02)
            plank.castShadow = true
            plank.receiveShadow = true
            pier.add(plank)
        }

        // Support pilings at the water end (positive local Z)
        const endZ = (plankCount * 0.5 - 0.8) * 0.75
        const pylonL = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
        pylonL.position.set(-width * 0.42, 0.2, endZ)
        pylonL.castShadow = true
        pier.add(pylonL)

        const pylonR = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
        pylonR.position.set(width * 0.42, 0.2, endZ)
        pylonR.castShadow = true
        pier.add(pylonR)

        pier.position.copy(centerPos)
        pier.rotation.y = angle
        this.game.scene.add(pier)
        return pier
    }
}
