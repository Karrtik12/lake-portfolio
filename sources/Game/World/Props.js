import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { clamp, lerp } from '../utilities/maths.js'

/**
 * Props — decorative elements: wooden piers, island docks, shore-embedded boulders,
 * and interactive bouncy navigation buoys that physically wobble, ring, and splash when bumped by the boat.
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
            roughness: 0.88,
            flatShading: true
        })

        this.metalMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#e64c3c', // Maritime red
            roughness: 0.4,
            metalness: 0.35,
            flatShading: true
        })

        this.createSpawnPier()
        this.createIslandDocks()
        this.createInteractiveBuoys()

        // Update loop for buoy physics & wave bobbing
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
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

    createInteractiveBuoys()
    {
        // 4 Key navigation buoys marking navigable water channels
        const buoyPositions = [
            new THREE.Vector3(-14, 0, 16),
            new THREE.Vector3(14, 0, 16),
            new THREE.Vector3(-16, 0, -12),
            new THREE.Vector3(16, 0, -12)
        ]

        const buoyGeo = new THREE.CylinderGeometry(0.45, 0.75, 1.6, 8)
        const stripeGeo = new THREE.CylinderGeometry(0.46, 0.65, 0.4, 8)
        const stripeMat = new THREE.MeshStandardNodeMaterial({ color: '#ffffff', roughness: 0.4 })

        const lanternGeo = new THREE.SphereGeometry(0.2, 8, 8)
        const lanternMat = new THREE.MeshBasicNodeMaterial({ color: '#ffea79' })

        for(const pos of buoyPositions)
        {
            const buoyGroup = new THREE.Group()

            // Buoy body
            const base = new THREE.Mesh(buoyGeo, this.metalMaterial)
            base.position.y = 0.55
            base.castShadow = true
            buoyGroup.add(base)

            // White reflective stripe
            const stripe = new THREE.Mesh(stripeGeo, stripeMat)
            stripe.position.y = 0.65
            buoyGroup.add(stripe)

            // Warning beacon light
            const light = new THREE.Mesh(lanternGeo, lanternMat)
            light.position.y = 1.45
            buoyGroup.add(light)

            buoyGroup.position.copy(pos)

            const buoyData = {
                group: buoyGroup,
                basePos: pos.clone(),
                radius: 1.2,
                wobbleTilt: new THREE.Vector2(0, 0),
                wobbleVelocity: new THREE.Vector2(0, 0),
                phase: Math.random() * Math.PI * 2,
                lastHitTime: 0
            }

            this.buoys.push(buoyData)
            this.game.scene.add(buoyGroup)
        }
    }

    update(delta)
    {
        const time = this.game.wind ? this.game.wind.time : performance.now() * 0.001
        const boat = this.game.boat

        for(const buoy of this.buoys)
        {
            // 1. Boat Collision & Interaction Check
            if(boat)
            {
                const boatDist = buoy.basePos.distanceTo(new THREE.Vector3(boat.position.x, 0, boat.position.z))
                if(boatDist < buoy.radius + 1.4)
                {
                    // Hit reaction!
                    const now = performance.now()
                    if(now - buoy.lastHitTime > 800)
                    {
                        buoy.lastHitTime = now

                        // Calculate impact direction from boat velocity
                        const speed = Math.max(Math.abs(boat.speed), 3.0)
                        const impactDir = new THREE.Vector2(
                            buoy.basePos.x - boat.position.x,
                            buoy.basePos.z - boat.position.z
                        ).normalize()

                        // Push buoy into strong wobble oscillation
                        buoy.wobbleVelocity.x += impactDir.x * speed * 0.4
                        buoy.wobbleVelocity.y += impactDir.y * speed * 0.4

                        // Play metallic chime/bell sound
                        if(this.game.audio)
                        {
                            this.game.audio.playChime()
                        }
                    }
                }
            }

            // 2. Spring-Damped Wobble Physics Simulation
            const springStiffness = 14.0
            const damping = 3.5

            // Spring force towards center (0, 0)
            const forceX = -buoy.wobbleTilt.x * springStiffness - buoy.wobbleVelocity.x * damping
            const forceY = -buoy.wobbleTilt.y * springStiffness - buoy.wobbleVelocity.y * damping

            buoy.wobbleVelocity.x += forceX * delta
            buoy.wobbleVelocity.y += forceY * delta

            buoy.wobbleTilt.x += buoy.wobbleVelocity.x * delta
            buoy.wobbleTilt.y += buoy.wobbleVelocity.y * delta

            // Clamp max tilt
            buoy.wobbleTilt.x = clamp(buoy.wobbleTilt.x, -0.8, 0.8)
            buoy.wobbleTilt.y = clamp(buoy.wobbleTilt.y, -0.8, 0.8)

            // 3. Gentle Ambient Wave Bobbing
            const waveBob = Math.sin(time * 2.2 + buoy.phase) * 0.12
            const waveRockX = Math.cos(time * 1.6 + buoy.phase) * 0.06
            const waveRockZ = Math.sin(time * 1.8 + buoy.phase) * 0.06

            buoy.group.position.y = buoy.basePos.y + waveBob
            buoy.group.rotation.set(0, 0, 0)
            buoy.group.rotation.x = buoy.wobbleTilt.y + waveRockX
            buoy.group.rotation.z = -buoy.wobbleTilt.x + waveRockZ
        }
    }
}
