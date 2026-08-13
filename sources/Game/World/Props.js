import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Props — decorative elements: wooden docks, rocks, billboards, and navigation buoys.
 */
export class Props
{
    constructor()
    {
        this.game = Game.getInstance()
        this.buoys = []

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

        this.rockMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#5a626a',
            roughness: 0.9,
            flatShading: true
        })

        this.metalMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#e64c3c',
            roughness: 0.4,
            metalness: 0.3,
            flatShading: true
        })

        this.createSpawnPier()
        this.createIslandDocks()
        this.createRocks()
        this.createBuoys()
        this.createStructures()

        // Bob buoys on water
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    createSpawnPier()
    {
        const pierGroup = new THREE.Group()

        // Main boardwalk planks
        const dockLength = 16
        const dockWidth = 4.5
        const plankCount = 18

        for(let i = 0; i < plankCount; i++)
        {
            const plankGeo = new THREE.BoxGeometry(dockWidth, 0.25, 0.7)
            const plank = new THREE.Mesh(plankGeo, this.woodMaterial)
            plank.position.set(0, 0.8, (i - plankCount * 0.5) * 0.85)
            plank.rotation.y = (Math.random() - 0.5) * 0.05
            plank.castShadow = true
            plank.receiveShadow = true
            pierGroup.add(plank)
        }

        // Support pilings (wooden logs into water)
        const pylonPositions = [
            [-dockWidth * 0.45, -2, -6],
            [ dockWidth * 0.45, -2, -6],
            [-dockWidth * 0.45, -2,  0],
            [ dockWidth * 0.45, -2,  0],
            [-dockWidth * 0.45, -2,  6],
            [ dockWidth * 0.45, -2,  6]
        ]

        const pylonGeo = new THREE.CylinderGeometry(0.28, 0.32, 5, 8)
        for(const pos of pylonPositions)
        {
            const pylon = new THREE.Mesh(pylonGeo, this.darkWoodMaterial)
            pylon.position.set(pos[0], pos[1] + 2.5, pos[2])
            pylon.castShadow = true
            pierGroup.add(pylon)
        }

        // Wooden Welcome Signpost at start of dock
        const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 3.2, 8)
        const post = new THREE.Mesh(postGeo, this.darkWoodMaterial)
        post.position.set(-dockWidth * 0.5 - 0.5, 1.8, 6.5)
        post.castShadow = true
        pierGroup.add(post)

        const signGeo = new THREE.BoxGeometry(2.4, 0.9, 0.15)
        const sign = new THREE.Mesh(signGeo, this.woodMaterial)
        sign.position.set(-dockWidth * 0.5 - 0.5, 3.0, 6.5)
        sign.rotation.y = -0.2
        sign.castShadow = true
        pierGroup.add(sign)

        pierGroup.position.set(0, 0, 48)
        this.game.scene.add(pierGroup)
    }

    createIslandDocks()
    {
        // Small landing docks on each island facing the center
        const dockConfigs = [
            { pos: new THREE.Vector3(-26, 0, -18), rot: 0.7 },  // Socials dock
            { pos: new THREE.Vector3(26, 0, -16),  rot: -0.7 }, // Lab dock
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

    createRocks()
    {
        // Instanced or individual stylized low-poly rocks
        const rockGeo = new THREE.DodecahedronGeometry(1.4, 1)

        const rockPositions = [
            [-50, 0.5, -45], [45, 0.8, -48], [15, 0.4, -60],
            [-60, 0.6, 10],  [55, 0.5, 25],  [-15, 0.4, 62],
            [12, 0.3, -25],  [-10, 0.5, -5], [5, 0.4, 18],
            [-42, 0.4, -8],  [40, 0.6, 0]
        ]

        for(const pos of rockPositions)
        {
            const scale = 0.8 + Math.random() * 1.4
            const rock = new THREE.Mesh(rockGeo, this.rockMaterial)
            rock.position.set(pos[0], pos[1], pos[2])
            rock.scale.set(scale, scale * (0.6 + Math.random() * 0.6), scale)
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
            rock.castShadow = true
            rock.receiveShadow = true
            this.game.scene.add(rock)
        }
    }

    createBuoys()
    {
        const buoyPositions = [
            new THREE.Vector3(-12, 0, 15),
            new THREE.Vector3(12, 0, 15),
            new THREE.Vector3(-15, 0, -10),
            new THREE.Vector3(15, 0, -10)
        ]

        const buoyGeo = new THREE.CylinderGeometry(0.4, 0.6, 1.4, 8)
        const lanternGeo = new THREE.SphereGeometry(0.18, 8, 8)
        const lanternMat = new THREE.MeshBasicNodeMaterial({ color: '#ffea79' })

        for(const pos of buoyPositions)
        {
            const buoyGroup = new THREE.Group()
            const base = new THREE.Mesh(buoyGeo, this.metalMaterial)
            base.position.y = 0.5
            base.castShadow = true
            buoyGroup.add(base)

            const light = new THREE.Mesh(lanternGeo, lanternMat)
            light.position.y = 1.3
            buoyGroup.add(light)

            buoyGroup.position.copy(pos)
            buoyGroup.userData = { initialY: pos.y, phase: Math.random() * Math.PI * 2 }
            this.buoys.push(buoyGroup)
            this.game.scene.add(buoyGroup)
        }
    }

    createStructures()
    {
        // Lab Island: Billboard / Research board structure
        const labBillboardGroup = new THREE.Group()
        const frameGeo = new THREE.BoxGeometry(6.5, 4.2, 0.3)
        const boardGeo = new THREE.PlaneGeometry(6.0, 3.8)
        const boardMat = new THREE.MeshStandardNodeMaterial({ color: '#1a2332', roughness: 0.7 })

        const frame = new THREE.Mesh(frameGeo, this.woodMaterial)
        const board = new THREE.Mesh(boardGeo, boardMat)
        board.position.z = 0.16

        labBillboardGroup.add(frame)
        labBillboardGroup.add(board)

        const legGeo = new THREE.CylinderGeometry(0.2, 0.22, 4.5, 8)
        const leg1 = new THREE.Mesh(legGeo, this.darkWoodMaterial)
        leg1.position.set(-2.6, -2.2, 0)
        const leg2 = new THREE.Mesh(legGeo, this.darkWoodMaterial)
        leg2.position.set(2.6, -2.2, 0)
        labBillboardGroup.add(leg1)
        labBillboardGroup.add(leg2)

        labBillboardGroup.position.set(36, 4.5, -20)
        labBillboardGroup.rotation.y = -0.5
        this.game.scene.add(labBillboardGroup)
    }

    update()
    {
        const time = this.game.wind ? this.game.wind.time : performance.now() * 0.001
        for(const buoy of this.buoys)
        {
            buoy.position.y = buoy.userData.initialY + Math.sin(time * 2.0 + buoy.userData.phase) * 0.12
            buoy.rotation.z = Math.sin(time * 1.5 + buoy.userData.phase) * 0.08
            buoy.rotation.x = Math.cos(time * 1.3 + buoy.userData.phase) * 0.06
        }
    }
}
