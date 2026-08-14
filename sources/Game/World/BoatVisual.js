import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Lake } from './Lake.js'
import { lerp } from '../utilities/maths.js'

/**
 * BoatVisual — renders a stylized, fully solid 3D speed boat with deep sculpted hull,
 * teak-trimmed cockpit, dual bucket seats, steering console, tinted sport windshield,
 * and high-performance outboard engine.
 */
export class BoatVisual
{
    constructor()
    {
        this.game = Game.getInstance()

        this.group = new THREE.Group()
        this.meshGroup = this.group
        this.currentRoll = 0
        this.currentPitch = 0

        this.createBoatModel()
        this.game.scene.add(this.group)

        // Animate
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    createBoatModel()
    {
        // ----------------------------------------------------
        // Materials
        // ----------------------------------------------------
        const hullBlueMat = new THREE.MeshStandardNodeMaterial({
            color: '#1d4ed8', // Deep royal navy blue
            roughness: 0.35,
            metalness: 0.15,
            flatShading: true
        })

        const deckWhiteMat = new THREE.MeshStandardNodeMaterial({
            color: '#f8fafc', // Glossy crisp nautical white
            roughness: 0.25,
            metalness: 0.1,
            flatShading: true
        })

        const teakWoodMat = new THREE.MeshStandardNodeMaterial({
            color: '#854d0e', // Warm golden teak wood
            roughness: 0.85,
            flatShading: true
        })

        const darkWoodMat = new THREE.MeshStandardNodeMaterial({
            color: '#451a03', // Dark mahogany trim
            roughness: 0.9,
            flatShading: true
        })

        const seatLeatherMat = new THREE.MeshStandardNodeMaterial({
            color: '#e2e8f0', // Crisp marine leather
            roughness: 0.6,
            metalness: 0.05,
            flatShading: true
        })

        const seatAccentMat = new THREE.MeshStandardNodeMaterial({
            color: '#2563eb', // Royal blue seat cushions
            roughness: 0.55,
            metalness: 0.1,
            flatShading: true
        })

        const darkMetalMat = new THREE.MeshStandardNodeMaterial({
            color: '#0f172a', // Slate graphite dark metal
            roughness: 0.45,
            metalness: 0.65,
            flatShading: true
        })

        const chromeMat = new THREE.MeshStandardNodeMaterial({
            color: '#f1f5f9', // Polished stainless chrome
            roughness: 0.1,
            metalness: 0.95,
            flatShading: true
        })

        const windshieldGlassMat = new THREE.MeshStandardNodeMaterial({
            color: '#93c5fd', // Crystal ice tinted glass
            transparent: true,
            opacity: 0.65,
            roughness: 0.05,
            metalness: 0.85,
            depthWrite: false
        })

        const navLightGreenMat = new THREE.MeshBasicNodeMaterial({ color: '#22c55e' })
        const navLightRedMat = new THREE.MeshBasicNodeMaterial({ color: '#ef4444' })

        // ----------------------------------------------------
        // 1. Solid Outer Hull (Deep V-Hull with tapered prow)
        // ----------------------------------------------------
        const hullLength = 4.8
        const hullWidth = 2.2
        const hullDepth = 0.95

        const hullGeo = new THREE.BoxGeometry(hullWidth, hullDepth, hullLength, 6, 2, 8)
        const pos = hullGeo.attributes.position
        for(let i = 0; i < pos.count; i++)
        {
            const x = pos.getX(i)
            const y = pos.getY(i)
            const z = pos.getZ(i)

            // V-shaped bottom keel: push bottom center down, bottom sides up
            if(y < 0)
            {
                const keelFactor = 1.0 - Math.abs(x) / (hullWidth * 0.5)
                pos.setY(i, y - keelFactor * 0.25)
            }

            // Taper bow (z < 0) to a sleek hydrodynamic point
            if(z < 0.2)
            {
                const t = (0.2 - z) / (hullLength * 0.5 + 0.2) // 0 at midship to 1 at prow
                const taperX = 1.0 - Math.pow(t, 1.4) * 0.78
                pos.setX(i, x * taperX)

                // Bow flare and sheer line rise
                if(y >= 0)
                {
                    pos.setY(i, y + Math.pow(t, 1.6) * 0.38)
                }
            }
            else
            {
                // Slight taper at transom stern
                const tStern = (z - 0.2) / (hullLength * 0.5 - 0.2)
                const taperX = 1.0 - tStern * 0.1
                pos.setX(i, x * taperX)
            }
        }
        hullGeo.computeVertexNormals()

        const hull = new THREE.Mesh(hullGeo, hullBlueMat)
        hull.position.y = 0.45
        hull.castShadow = true
        hull.receiveShadow = true
        this.group.add(hull)

        // ----------------------------------------------------
        // 2. Solid Upper Gunwales & White Deck Perimeter
        // ----------------------------------------------------
        const gunwaleGeo = new THREE.BoxGeometry(hullWidth + 0.08, 0.22, hullLength + 0.08, 6, 1, 8)
        const gPos = gunwaleGeo.attributes.position
        for(let i = 0; i < gPos.count; i++)
        {
            const x = gPos.getX(i)
            const y = gPos.getY(i)
            const z = gPos.getZ(i)

            if(z < 0.2)
            {
                const t = (0.2 - z) / (hullLength * 0.5 + 0.2)
                gPos.setX(i, x * (1.0 - Math.pow(t, 1.4) * 0.78))
                gPos.setY(i, y + Math.pow(t, 1.6) * 0.38)
            }
            else
            {
                const tStern = (z - 0.2) / (hullLength * 0.5 - 0.2)
                gPos.setX(i, x * (1.0 - tStern * 0.1))
            }
        }
        gunwaleGeo.computeVertexNormals()

        const gunwale = new THREE.Mesh(gunwaleGeo, deckWhiteMat)
        gunwale.position.y = 0.88
        gunwale.castShadow = true
        this.group.add(gunwale)

        // ----------------------------------------------------
        // 3. Solid Closed Foredeck (Bow Top Cover)
        // ----------------------------------------------------
        const foredeckLength = 2.0
        const foredeckGeo = new THREE.BoxGeometry(hullWidth * 0.95, 0.16, foredeckLength, 4, 1, 6)
        const fPos = foredeckGeo.attributes.position
        for(let i = 0; i < fPos.count; i++)
        {
            const x = fPos.getX(i)
            const y = fPos.getY(i)
            const z = fPos.getZ(i)

            // Local z goes from -1.0 to 1.0; in boat space z goes from -2.3 to -0.3
            const worldZ = z - 1.3
            const t = (-worldZ) / (hullLength * 0.5)
            const taperX = 1.0 - Math.pow(Math.max(0, t), 1.4) * 0.78
            fPos.setX(i, x * taperX)
            fPos.setY(i, y + Math.pow(Math.max(0, t), 1.6) * 0.36)
        }
        foredeckGeo.computeVertexNormals()

        const foredeck = new THREE.Mesh(foredeckGeo, deckWhiteMat)
        foredeck.position.set(0, 0.96, -1.3)
        foredeck.castShadow = true
        this.group.add(foredeck)

        // Teak Center Stripe on Foredeck
        const foredeckStripeGeo = new THREE.BoxGeometry(0.35, 0.18, foredeckLength * 0.9)
        const foredeckStripe = new THREE.Mesh(foredeckStripeGeo, teakWoodMat)
        foredeckStripe.position.set(0, 1.05, -1.35)
        foredeckStripe.rotation.x = -0.14
        this.group.add(foredeckStripe)

        // Bow Cleat in Chrome
        const cleatBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.4), chromeMat)
        cleatBase.position.set(0, 1.38, -2.15)
        this.group.add(cleatBase)

        const cleatBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), chromeMat)
        cleatBar.rotation.z = Math.PI * 0.5
        cleatBar.position.set(0, 1.44, -2.15)
        this.group.add(cleatBar)

        // Bow Safety Railing (Stainless Steel)
        const bowRailGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6)
        const bowRailL = new THREE.Mesh(bowRailGeo, chromeMat)
        bowRailL.position.set(-0.55, 1.25, -1.3)
        bowRailL.rotation.set(-0.16, 0.28, 0)
        this.group.add(bowRailL)

        const bowRailR = new THREE.Mesh(bowRailGeo, chromeMat)
        bowRailR.position.set(0.55, 1.25, -1.3)
        bowRailR.rotation.set(-0.16, -0.28, 0)
        this.group.add(bowRailR)

        // Dual Navigation Lights (Starboard Green / Port Red)
        const navLightGeo = new THREE.SphereGeometry(0.07, 8, 8)

        const navGreen = new THREE.Mesh(navLightGeo, navLightGreenMat)
        navGreen.position.set(0.35, 1.32, -2.0)
        this.group.add(navGreen)

        const navRed = new THREE.Mesh(navLightGeo, navLightRedMat)
        navRed.position.set(-0.35, 1.32, -2.0)
        this.group.add(navRed)

        // ----------------------------------------------------
        // 4. Solid Cockpit Interior Floor (Teak Wood Planks)
        // ----------------------------------------------------
        const cockpitLength = 2.4
        const cockpitWidth = 1.7
        const floorGeo = new THREE.BoxGeometry(cockpitWidth, 0.16, cockpitLength)
        const floor = new THREE.Mesh(floorGeo, teakWoodMat)
        floor.position.set(0, 0.58, 0.8)
        floor.receiveShadow = true
        this.group.add(floor)

        // Cockpit Inner Sidewall Liners (Solid, no see-through)
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, cockpitLength), deckWhiteMat)
        wallLeft.position.set(-cockpitWidth * 0.5 - 0.05, 0.76, 0.8)
        this.group.add(wallLeft)

        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, cockpitLength), deckWhiteMat)
        wallRight.position.set(cockpitWidth * 0.5 + 0.05, 0.76, 0.8)
        this.group.add(wallRight)

        // ----------------------------------------------------
        // 5. Driver Helm Console & Steering Wheel
        // ----------------------------------------------------
        const consoleGeo = new THREE.BoxGeometry(0.75, 0.48, 0.45)
        const consoleMesh = new THREE.Mesh(consoleGeo, darkMetalMat)
        consoleMesh.position.set(0.42, 0.96, -0.15)
        consoleMesh.rotation.x = -0.2
        this.group.add(consoleMesh)

        // Steering wheel
        const wheelRingGeo = new THREE.TorusGeometry(0.18, 0.03, 6, 16)
        const wheelRing = new THREE.Mesh(wheelRingGeo, darkMetalMat)
        wheelRing.position.set(0.42, 1.12, 0.06)
        wheelRing.rotation.x = 0.4
        this.group.add(wheelRing)

        const wheelCap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8), chromeMat)
        wheelCap.position.set(0.42, 1.12, 0.06)
        wheelCap.rotation.x = 0.4
        this.group.add(wheelCap)

        // Dashboard instrument dials (Speedometer & RPM)
        const dialGeo = new THREE.CircleGeometry(0.045, 12)
        const dialMat = new THREE.MeshBasicNodeMaterial({ color: '#38bdf8' })
        const dial1 = new THREE.Mesh(dialGeo, dialMat)
        dial1.position.set(0.32, 1.18, 0.02)
        dial1.rotation.x = -0.2
        this.group.add(dial1)

        const dial2 = new THREE.Mesh(dialGeo, dialMat)
        dial2.position.set(0.52, 1.18, 0.02)
        dial2.rotation.x = -0.2
        this.group.add(dial2)

        // Throttle lever
        const throttleBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.12), chromeMat)
        throttleBase.position.set(0.76, 0.98, 0.15)
        this.group.add(throttleBase)

        const throttleHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), darkMetalMat)
        throttleHandle.position.set(0.76, 1.08, 0.12)
        throttleHandle.rotation.x = -0.4
        this.group.add(throttleHandle)

        // ----------------------------------------------------
        // 6. Captain Bucket Seats & Rear Bench Seat
        // ----------------------------------------------------
        const createSeat = (x, z) =>
        {
            const seatGroup = new THREE.Group()

            // Seat base pedestal
            const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8), chromeMat)
            pedestal.position.set(0, 0.11, 0)
            seatGroup.add(pedestal)

            // Cushion
            const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.52), seatAccentMat)
            cushion.position.set(0, 0.26, 0)
            cushion.castShadow = true
            seatGroup.add(cushion)

            // Curved backrest
            const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.12), seatLeatherMat)
            backrest.position.set(0, 0.48, 0.22)
            backrest.rotation.x = -0.12
            backrest.castShadow = true
            seatGroup.add(backrest)

            // Side bolsters
            const bolsterL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.35), seatAccentMat)
            bolsterL.position.set(-0.24, 0.36, 0.06)
            seatGroup.add(bolsterL)

            const bolsterR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.35), seatAccentMat)
            bolsterR.position.set(0.24, 0.36, 0.06)
            seatGroup.add(bolsterR)

            seatGroup.position.set(x, 0.62, z)
            return seatGroup
        }

        // Driver seat (Right) & Passenger seat (Left)
        this.group.add(createSeat( 0.42, 0.5))
        this.group.add(createSeat(-0.42, 0.5))

        // Rear Aft Bench Seat across full beam
        const rearBenchBase = new THREE.Mesh(new THREE.BoxGeometry(cockpitWidth * 0.94, 0.24, 0.55), teakWoodMat)
        rearBenchBase.position.set(0, 0.74, 1.65)
        rearBenchBase.castShadow = true
        this.group.add(rearBenchBase)

        const rearCushion = new THREE.Mesh(new THREE.BoxGeometry(cockpitWidth * 0.92, 0.1, 0.52), seatAccentMat)
        rearCushion.position.set(0, 0.88, 1.65)
        this.group.add(rearCushion)

        const rearBackrest = new THREE.Mesh(new THREE.BoxGeometry(cockpitWidth * 0.92, 0.35, 0.12), seatLeatherMat)
        rearBackrest.position.set(0, 1.08, 1.9)
        rearBackrest.rotation.x = -0.1
        this.group.add(rearBackrest)

        // ----------------------------------------------------
        // 7. Aerodynamic Sport Windshield
        // ----------------------------------------------------
        const windshieldGroup = new THREE.Group()

        // Center glass pane
        const centerGlassGeo = new THREE.PlaneGeometry(1.4, 0.52)
        const centerGlass = new THREE.Mesh(centerGlassGeo, windshieldGlassMat)
        centerGlass.position.set(0, 1.25, -0.32)
        centerGlass.rotation.x = -0.45
        windshieldGroup.add(centerGlass)

        // Left wing glass
        const wingGlassGeo = new THREE.PlaneGeometry(0.72, 0.5)
        const leftWingGlass = new THREE.Mesh(wingGlassGeo, windshieldGlassMat)
        leftWingGlass.position.set(-0.82, 1.2, -0.05)
        leftWingGlass.rotation.set(-0.4, 0.75, -0.28)
        windshieldGroup.add(leftWingGlass)

        // Right wing glass
        const rightWingGlass = new THREE.Mesh(wingGlassGeo, windshieldGlassMat)
        rightWingGlass.position.set(0.82, 1.2, -0.05)
        rightWingGlass.rotation.set(-0.4, -0.75, 0.28)
        windshieldGroup.add(rightWingGlass)

        // Frame Top Rim (Dark Metal)
        const frameTopGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.45, 6)
        const frameTop = new THREE.Mesh(frameTopGeo, darkMetalMat)
        frameTop.rotation.z = Math.PI * 0.5
        frameTop.position.set(0, 1.46, -0.22)
        windshieldGroup.add(frameTop)

        this.group.add(windshieldGroup)

        // ----------------------------------------------------
        // 8. Solid Transom & Outboard Engine at Stern
        // ----------------------------------------------------
        // Transom solid rear wall
        const transomWall = new THREE.Mesh(new THREE.BoxGeometry(hullWidth * 0.88, 0.5, 0.2), deckWhiteMat)
        transomWall.position.set(0, 0.85, 2.1)
        this.group.add(transomWall)

        // Dual Stern Cleats
        const cleatSternL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.3), chromeMat)
        cleatSternL.position.set(-0.85, 1.02, 2.15)
        this.group.add(cleatSternL)

        const cleatSternR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.3), chromeMat)
        cleatSternR.position.set(0.85, 1.02, 2.15)
        this.group.add(cleatSternR)

        // Ski-tow pylon
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.45, 8), chromeMat)
        pylon.position.set(0, 1.22, 2.1)
        this.group.add(pylon)

        // Outboard Motor Assembly
        const motorGroup = new THREE.Group()
        motorGroup.position.set(0, 0.55, 2.5)

        // Engine Top Cowling (Aerodynamic sculpted cover)
        const cowlingGeo = new THREE.BoxGeometry(0.55, 0.65, 0.72)
        const cPos = cowlingGeo.attributes.position
        for(let i = 0; i < cPos.count; i++)
        {
            const y = cPos.getY(i)
            const z = cPos.getZ(i)
            if(y > 0)
            {
                cPos.setZ(i, z * 0.85)
            }
        }
        cowlingGeo.computeVertexNormals()

        const motorCowling = new THREE.Mesh(cowlingGeo, darkMetalMat)
        motorCowling.position.set(0, 0.45, 0)
        motorCowling.castShadow = true
        motorGroup.add(motorCowling)

        // Cowling Racing Stripe
        const motorStripe = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.12, 0.74), hullBlueMat)
        motorStripe.position.set(0, 0.45, 0)
        motorGroup.add(motorStripe)

        // Driveshaft Leg / Midsection
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.35), darkMetalMat)
        leg.position.set(0, -0.15, 0)
        motorGroup.add(leg)

        // Lower Torpedo Gearcase & Propeller Bullet
        const torpedo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 8), darkMetalMat)
        torpedo.rotation.x = Math.PI * 0.5
        torpedo.position.set(0, -0.55, 0.05)
        motorGroup.add(torpedo)

        // Skeg (bottom fin)
        const skegGeo = new THREE.BoxGeometry(0.04, 0.28, 0.35)
        const skeg = new THREE.Mesh(skegGeo, darkMetalMat)
        skeg.position.set(0, -0.72, -0.05)
        motorGroup.add(skeg)

        // Propeller Blades (Chrome)
        const propHub = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 6), chromeMat)
        propHub.rotation.x = -Math.PI * 0.5
        propHub.position.set(0, -0.55, 0.38)
        motorGroup.add(propHub)

        const bladeGeo = new THREE.BoxGeometry(0.35, 0.08, 0.02)
        const blade1 = new THREE.Mesh(bladeGeo, chromeMat)
        blade1.position.set(0, -0.55, 0.32)
        blade1.rotation.z = 0.5
        motorGroup.add(blade1)

        const blade2 = new THREE.Mesh(bladeGeo, chromeMat)
        blade2.position.set(0, -0.55, 0.32)
        blade2.rotation.z = 0.5 + Math.PI * 0.66
        motorGroup.add(blade2)

        const blade3 = new THREE.Mesh(bladeGeo, chromeMat)
        blade3.position.set(0, -0.55, 0.32)
        blade3.rotation.z = 0.5 + Math.PI * 1.33
        motorGroup.add(blade3)

        this.group.add(motorGroup)
        this.motorGroup = motorGroup
    }

    update(delta)
    {
        if(!this.game.boat) return

        const boat = this.game.boat

        // 1. Base position from physics body
        this.group.position.copy(boat.position)

        const time = performance.now() * 0.001
        const forwardDir = new THREE.Vector3(-Math.sin(boat.rotation), 0, -Math.cos(boat.rotation))
        const rightDir = new THREE.Vector3(forwardDir.z, 0, -forwardDir.x)

        // 2. Hydrodynamic Wave Sampling across 4 hull points
        const bowPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(1.5))
        const sternPos = boat.position.clone().add(forwardDir.clone().multiplyScalar(-1.5))
        const portPos = boat.position.clone().add(rightDir.clone().multiplyScalar(-0.65))
        const starboardPos = boat.position.clone().add(rightDir.clone().multiplyScalar(0.65))

        const waveBow = Lake.getWaveElevation(bowPos.x, bowPos.z, time)
        const waveStern = Lake.getWaveElevation(sternPos.x, sternPos.z, time)
        const wavePort = Lake.getWaveElevation(portPos.x, portPos.z, time)
        const waveStarboard = Lake.getWaveElevation(starboardPos.x, starboardPos.z, time)

        // Physical wave pitch and roll
        const wavePitch = (waveStern - waveBow) / 3.0
        const waveRoll = (wavePort - waveStarboard) / 1.3
        const waveHeave = (waveBow + waveStern + wavePort + waveStarboard) * 0.25

        // Vertical buoyant bobbing
        this.group.position.y = boat.position.y + waveHeave

        // 3. Dynamic Roll (Leaning into turns + wave slope)
        const targetRoll = -boat.angularVelocity * 0.14 + waveRoll
        this.currentRoll = lerp(this.currentRoll, targetRoll, 7.0 * delta)

        // 4. Dynamic Pitch (Bow lifts up on acceleration + riding oncoming wave crests)
        const speedNorm = (boat.speed || 0) / 16.0
        const targetPitch = speedNorm * 0.08 + wavePitch
        this.currentPitch = lerp(this.currentPitch, targetPitch, 5.0 * delta)

        // 5. Apply Combined Rotations
        this.group.rotation.set(0, 0, 0)
        this.group.rotateY(boat.rotation)
        this.group.rotateZ(this.currentRoll)
        this.group.rotateX(-this.currentPitch)

        // 6. Outboard Motor Steering Angle
        if(this.motorGroup)
        {
            const steerAngle = THREE.MathUtils.clamp(-boat.angularVelocity * 0.35, -0.6, 0.6)
            this.motorGroup.rotation.y = THREE.MathUtils.lerp(this.motorGroup.rotation.y, steerAngle, 8.0 * delta)
        }
    }
}
