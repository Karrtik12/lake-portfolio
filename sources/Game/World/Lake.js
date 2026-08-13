import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionWorld, sin, cos, smoothstep, uniform, vec3, vec4 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — clean, stylized low-poly water surface with multi-directional Gerstner wave displacement,
 * dynamic sunlight shimmer, and natural depth gradient (free of blotches or splotches).
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
        this.deepColor = uniform(color('#0e2a47'))      // Rich deep lake blue
        this.surfaceColor = uniform(color('#1d6fa5'))   // Clean vibrant azure
        this.shallowColor = uniform(color('#38bdf8'))   // Light turquoise
        this.foamColor = uniform(color('#ffffff'))      // Clean white foam crests
        this.waveElevation = uniform(float(0.35))       // Wave height
        this.waveFrequency = uniform(float(0.12))
        this.waveSpeed = uniform(float(1.2))

        // Position Node for multi-directional Gerstner wave displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const worldX = pos.x
            const worldZ = pos.z

            // 1. Primary wind wave (moving at 45 degrees)
            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const w1 = sin(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.6)

            // 2. Secondary cross wave (moving at -30 degrees)
            const dir2 = worldX.mul(0.866).sub(worldZ.mul(0.5))
            const w2 = sin(dir2.mul(this.waveFrequency.mul(1.5)).sub(this.time.mul(this.waveSpeed.mul(1.1)))).mul(0.28)

            // 3. High-frequency ripple
            const dir3 = worldX.mul(-0.5).add(worldZ.mul(0.866))
            const w3 = cos(dir3.mul(this.waveFrequency.mul(2.6)).add(this.time.mul(this.waveSpeed.mul(1.5)))).mul(0.15)

            // Steepened wave elevation
            const totalWave = w1.add(w2).add(w3)
            const elevation = sin(totalWave.mul(1.2)).mul(this.waveElevation)

            pos.y.addAssign(elevation)

            // Slight lateral mass shift
            pos.x.addAssign(cos(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.1))
            pos.z.addAssign(cos(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.1))

            return pos
        })

        // Color Node for clean, natural water gradient without blotches
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const worldX = pos.x
            const worldZ = pos.z

            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const w1 = sin(dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))).mul(0.6)
            const dir2 = worldX.mul(0.866).sub(worldZ.mul(0.5))
            const w2 = sin(dir2.mul(this.waveFrequency.mul(1.5)).sub(this.time.mul(this.waveSpeed.mul(1.1)))).mul(0.28)
            const dir3 = worldX.mul(-0.5).add(worldZ.mul(0.866))
            const w3 = cos(dir3.mul(this.waveFrequency.mul(2.6)).add(this.time.mul(this.waveSpeed.mul(1.5)))).mul(0.15)

            const totalWave = w1.add(w2).add(w3)
            const elevation = sin(totalWave.mul(1.2)).mul(this.waveElevation)

            // Smooth elevation-based depth gradient
            const heightNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)
            const waterColor = mix(this.deepColor, this.surfaceColor, heightNorm)

            // Crisp foam on sharp wave peaks
            const foamMask = smoothstep(this.waveElevation.mul(0.55), this.waveElevation.mul(0.92), elevation)
            const finalColor = mix(waterColor, this.foamColor, foamMask.mul(0.8))

            return finalColor
        })

        // Normal perturbation node for clean sun reflection shimmer
        const normalNode = Fn(() =>
        {
            const pos = positionGeometry
            const worldX = pos.x
            const worldZ = pos.z

            const dir1 = worldX.mul(0.707).add(worldZ.mul(0.707))
            const nX = cos(dir1.mul(0.25).add(this.time.mul(1.2))).mul(0.12)
            const nZ = sin(dir1.mul(0.25).add(this.time.mul(1.2))).mul(0.12)

            return vec3(nX, float(1.0), nZ).normalize()
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.15,
            metalness: 0.25,
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
