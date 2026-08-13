import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionWorld, sin, cos, smoothstep, uniform, vec3, vec4, uv } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — high-fidelity water surface with multi-directional Gerstner wave displacement, visible surface currents, and foam crests.
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // High-density plane geometry for fluid vertex wave displacement
        this.size = 180
        this.segments = 140
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#08203e'))      // Deep sapphire abyss
        this.surfaceColor = uniform(color('#1c648f'))   // Vibrant azure water
        this.shallowColor = uniform(color('#38a3a5'))   // Turquoise shallow shore
        this.foamColor = uniform(color('#c7f9cc'))      // Crisp foam crests
        this.waveElevation = uniform(float(0.32))       // More pronounced, visible waves
        this.waveFrequency = uniform(float(0.14))
        this.waveSpeed = uniform(float(1.3))

        // Position Node for multi-directional Gerstner wave displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const worldX = pos.x
            const worldZ = pos.z

            // Primary wind wave (moving at 45 degrees)
            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const w1 = sin(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.55)

            // Cross swell waves
            const dir2 = worldX.mul(-0.5).add(worldZ.mul(0.866))
            const w2 = sin(dir2.mul(this.waveFrequency.mul(1.8)).sub(this.time.mul(this.waveSpeed.mul(1.1)))).mul(0.28)

            // High frequency surface ripples
            const w3 = cos(worldX.mul(this.waveFrequency.mul(3.2)).add(this.time.mul(this.waveSpeed.mul(1.6))))
                .mul(sin(worldZ.mul(this.waveFrequency.mul(2.8)).sub(this.time.mul(this.waveSpeed.mul(1.4)))))
                .mul(0.17)

            // Sharp Gerstner crest steepening
            const totalWave = w1.add(w2).add(w3)
            const steepened = sin(totalWave.mul(1.5)).mul(this.waveElevation)

            pos.y.addAssign(steepened)

            // Slight horizontal drift simulating water mass displacement
            pos.x.addAssign(cos(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.12))
            pos.z.addAssign(cos(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.12))

            return pos
        })

        // Color Node for deep-to-surface gradient, moving currents, and foam streaks
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const worldX = pos.x
            const worldZ = pos.z

            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const w1 = sin(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.55)
            const dir2 = worldX.mul(-0.5).add(worldZ.mul(0.866))
            const w2 = sin(dir2.mul(this.waveFrequency.mul(1.8)).sub(this.time.mul(this.waveSpeed.mul(1.1)))).mul(0.28)
            const w3 = cos(worldX.mul(this.waveFrequency.mul(3.2)).add(this.time.mul(this.waveSpeed.mul(1.6))))
                .mul(sin(worldZ.mul(this.waveFrequency.mul(2.8)).sub(this.time.mul(this.waveSpeed.mul(1.4)))))
                .mul(0.17)

            const totalWave = w1.add(w2).add(w3)
            const steepened = sin(totalWave.mul(1.5)).mul(this.waveElevation)

            // Base depth color blend
            const waveHeightNorm = steepened.div(this.waveElevation.mul(2.0)).add(0.5)
            const baseWater = mix(this.deepColor, this.surfaceColor, waveHeightNorm)

            // Visible surface current streaks (wind flow lines across water)
            const currentPattern = sin(worldX.mul(0.25).add(worldZ.mul(0.15)).add(this.time.mul(0.8)))
                .mul(cos(worldX.mul(0.15).sub(worldZ.mul(0.3)).add(this.time.mul(0.5))))
            const currentIntensity = smoothstep(float(0.3), float(0.85), currentPattern)
            const currentWater = mix(baseWater, this.shallowColor, currentIntensity.mul(0.45))

            // Crest foam at the wave peaks
            const foamThreshold = smoothstep(this.waveElevation.mul(0.45), this.waveElevation.mul(0.92), steepened)
            const finalWater = mix(currentWater, this.foamColor, foamThreshold.mul(0.85))

            return finalWater
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.12,
            metalness: 0.35,
            transparent: true,
            opacity: 0.95,
            flatShading: false
        })

        this.material.positionNode = positionNode()
        this.material.colorNode = colorNode()

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.receiveShadow = true
        this.game.scene.add(this.mesh)

        // Animate waves
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
