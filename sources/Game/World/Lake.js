import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionWorld, sin, cos, smoothstep, uniform, vec2, vec3, vec4, uv } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — high-fidelity water with multi-directional Gerstner wave displacement,
 * visible flowing water current streaks, caustic ripple networks, dynamic surface normals, and foam crests.
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // High-density plane geometry for fluid vertex wave displacement
        this.size = 180
        this.segments = 160
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#0a2540'))      // Deep sapphire ocean blue
        this.surfaceColor = uniform(color('#1565c0'))   // Vibrant cobalt water
        this.shallowColor = uniform(color('#38bdf8'))   // Light electric cyan currents
        this.foamColor = uniform(color('#e0f2fe'))      // Pure seafoam white
        this.waveElevation = uniform(float(0.42))       // Pronounced wave displacement
        this.waveFrequency = uniform(float(0.12))
        this.waveSpeed = uniform(float(1.4))

        // Position Node for multi-directional Gerstner wave displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const worldX = pos.x
            const worldZ = pos.z

            // Primary wind wave (moving at 45 degrees)
            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const w1 = sin(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.55)

            // Cross swell waves (moving across)
            const dir2 = worldX.mul(-0.5).add(worldZ.mul(0.866))
            const w2 = sin(dir2.mul(this.waveFrequency.mul(1.7)).sub(this.time.mul(this.waveSpeed.mul(1.15)))).mul(0.32)

            // High frequency surface ripples
            const w3 = cos(worldX.mul(this.waveFrequency.mul(3.2)).add(this.time.mul(this.waveSpeed.mul(1.8))))
                .mul(sin(worldZ.mul(this.waveFrequency.mul(2.8)).sub(this.time.mul(this.waveSpeed.mul(1.5)))))
                .mul(0.18)

            // Sharp Gerstner wave crest steepening
            const totalWave = w1.add(w2).add(w3)
            const steepened = sin(totalWave.mul(1.4)).mul(this.waveElevation)

            pos.y.addAssign(steepened)

            // Horizontal water mass shift
            pos.x.addAssign(cos(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.15))
            pos.z.addAssign(cos(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.15))

            return pos
        })

        // Color Node with visible flowing current bands, cellular caustic network, and foam crests
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const worldX = pos.x
            const worldZ = pos.z

            // Wave height calculation for shading
            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const w1 = sin(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.55)
            const dir2 = worldX.mul(-0.5).add(worldZ.mul(0.866))
            const w2 = sin(dir2.mul(this.waveFrequency.mul(1.7)).sub(this.time.mul(this.waveSpeed.mul(1.15)))).mul(0.32)
            const w3 = cos(worldX.mul(this.waveFrequency.mul(3.2)).add(this.time.mul(this.waveSpeed.mul(1.8))))
                .mul(sin(worldZ.mul(this.waveFrequency.mul(2.8)).sub(this.time.mul(this.waveSpeed.mul(1.5)))))
                .mul(0.18)

            const totalWave = w1.add(w2).add(w3)
            const steepened = sin(totalWave.mul(1.4)).mul(this.waveElevation)

            // 1. Base depth gradient
            const waveHeightNorm = steepened.div(this.waveElevation.mul(2.0)).add(0.5)
            const baseWater = mix(this.deepColor, this.surfaceColor, waveHeightNorm)

            // 2. Visible Flowing Surface Current Lines (Streaks drifting across lake)
            const currentFlow1 = sin(worldX.mul(0.18).add(worldZ.mul(0.12)).add(this.time.mul(0.9)))
                .mul(cos(worldX.mul(0.12).sub(worldZ.mul(0.22)).add(this.time.mul(0.6))))
            const currentFlow2 = cos(worldX.mul(0.28).sub(worldZ.mul(0.18)).sub(this.time.mul(0.75)))
                .mul(sin(worldX.mul(0.15).add(worldZ.mul(0.25)).add(this.time.mul(0.85))))

            const currentPattern = currentFlow1.add(currentFlow2).mul(0.5)
            const currentMask = smoothstep(float(0.1), float(0.75), currentPattern)
            const currentWater = mix(baseWater, this.shallowColor, currentMask.mul(0.55))

            // 3. High-Frequency Caustic Water Ripple Network
            const ripple1 = sin(worldX.mul(0.8).add(this.time.mul(1.2)))
                .mul(cos(worldZ.mul(0.8).sub(this.time.mul(1.0))))
            const ripple2 = cos(worldX.mul(1.2).sub(worldZ.mul(0.6)).add(this.time.mul(1.5)))
                .mul(sin(worldZ.mul(1.2).add(worldX.mul(0.6)).sub(this.time.mul(1.3))))
            const causticPattern = ripple1.add(ripple2).mul(0.5)
            const causticMask = smoothstep(float(0.35), float(0.8), causticPattern)
            const causticWater = mix(currentWater, this.shallowColor, causticMask.mul(0.35))

            // 4. White Foam Crests at Wave Peaks & Wind Froth
            const foamThreshold = smoothstep(this.waveElevation.mul(0.35), this.waveElevation.mul(0.88), steepened)
            const finalWater = mix(causticWater, this.foamColor, foamThreshold.mul(0.85))

            return finalWater
        })

        // Normal perturbation node for dynamic light refraction & shimmering ripples
        const normalNode = Fn(() =>
        {
            const pos = positionGeometry
            const worldX = pos.x
            const worldZ = pos.z

            const rippleX = sin(worldX.mul(0.8).add(this.time.mul(1.4))).mul(0.15)
            const rippleZ = cos(worldZ.mul(0.8).add(this.time.mul(1.2))).mul(0.15)

            return vec3(rippleX, float(1.0), rippleZ).normalize()
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.18,
            metalness: 0.45,
            transparent: true,
            opacity: 0.94,
            flatShading: false
        })

        this.material.positionNode = positionNode()
        this.material.colorNode = colorNode()
        this.material.normalNode = normalNode()

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.receiveShadow = true
        this.game.scene.add(this.mesh)

        // Animate waves in game ticker loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    update()
    {
        if(this.game.wind)
        {
            this.time.value = this.game.wind.time
        }
        else
        {
            this.time.value += 0.016
        }
    }
}
