import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionWorld, sin, cos, smoothstep, uniform, vec3, vec4 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — high-fidelity water surface matching photographic sea currents and ripples:
 * multi-scale Gerstner wave displacement, analytical surface normals, directional wind ripples,
 * golden sunlight specular crest glints, and deep ocean Fresnel coloring.
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // Ultra-dense mesh for crisp physical wave displacement
        this.size = 200
        this.segments = 200
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#061f30'))      // Deep ocean indigo
        this.midColor = uniform(color('#0a4d68'))       // Rich sea teal
        this.crestColor = uniform(color('#157299'))     // Sunlit wave crest cyan
        this.sunGlintColor = uniform(color('#fff7ed'))  // Golden sunlight glint
        this.foamColor = uniform(color('#f0f9ff'))      // Pure seafoam white

        this.waveElevation = uniform(float(0.40))       // Wave height
        this.waveFrequency = uniform(float(0.16))       // Main frequency
        this.waveSpeed = uniform(float(1.25))

        // Position Node for multi-frequency Gerstner wave displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const x = pos.x
            const z = pos.z

            // 1. Primary Wind Swell (Direction: 55 degrees)
            const dir1 = x.mul(0.819).add(z.mul(0.574))
            const phase1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(phase1).mul(0.52)

            // 2. Secondary Cross Wave (Direction: -40 degrees)
            const dir2 = x.mul(0.766).sub(z.mul(0.643))
            const phase2 = dir2.mul(this.waveFrequency.mul(1.85)).sub(this.time.mul(this.waveSpeed.mul(1.15)))
            const w2 = sin(phase2).mul(0.28)

            // 3. Medium Wind Chop (Direction: 10 degrees)
            const dir3 = x.mul(0.985).add(z.mul(0.174))
            const phase3 = dir3.mul(this.waveFrequency.mul(3.4)).add(this.time.mul(this.waveSpeed.mul(1.6)))
            const w3 = cos(phase3).mul(0.14)

            // 4. Fine Surface Ripple (Direction: 70 degrees)
            const dir4 = x.mul(0.342).add(z.mul(0.940))
            const phase4 = dir4.mul(this.waveFrequency.mul(6.8)).sub(this.time.mul(this.waveSpeed.mul(2.2)))
            const w4 = sin(phase4).mul(0.06)

            // Combine and apply Gerstner crest steepening
            const totalWave = w1.add(w2).add(w3).add(w4)
            const steepened = sin(totalWave.mul(1.4)).mul(this.waveElevation)

            pos.y.addAssign(steepened)

            // Lateral Gerstner horizontal displacement
            pos.x.addAssign(cos(phase1).mul(0.12).add(cos(phase2).mul(0.06)))
            pos.z.addAssign(cos(phase1).mul(0.08).sub(sin(phase2).mul(0.05)))

            return pos
        })

        // Normal Node with analytical wave slopes + high frequency capillary ripples
        const normalNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // Slopes from Primary Swell
            const dir1 = x.mul(0.819).add(z.mul(0.574))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const slope1 = cos(p1).mul(this.waveFrequency).mul(0.52)
            const n1x = slope1.mul(0.819)
            const n1z = slope1.mul(0.574)

            // Slopes from Cross Swell
            const dir2 = x.mul(0.766).sub(z.mul(0.643))
            const p2 = dir2.mul(this.waveFrequency.mul(1.85)).sub(this.time.mul(this.waveSpeed.mul(1.15)))
            const slope2 = cos(p2).mul(this.waveFrequency.mul(1.85)).mul(0.28)
            const n2x = slope2.mul(0.766)
            const n2z = slope2.mul(-0.643)

            // Slopes from Medium Wind Chop
            const dir3 = x.mul(0.985).add(z.mul(0.174))
            const p3 = dir3.mul(this.waveFrequency.mul(3.4)).add(this.time.mul(this.waveSpeed.mul(1.6)))
            const slope3 = sin(p3).negate().mul(this.waveFrequency.mul(3.4)).mul(0.14)
            const n3x = slope3.mul(0.985)
            const n3z = slope3.mul(0.174)

            // Micro-Capillary Ripples (creates the photographic sea texture shimmer)
            const rip1 = sin(x.mul(2.2).add(z.mul(1.4)).add(this.time.mul(2.8))).mul(0.18)
            const rip2 = cos(x.mul(3.6).sub(z.mul(2.8)).sub(this.time.mul(3.4))).mul(0.12)
            const rip3 = sin(x.mul(6.5).add(z.mul(5.2)).add(this.time.mul(4.6))).mul(0.08)

            const totalNx = n1x.add(n2x).add(n3x).add(rip1).add(rip2)
            const totalNz = n1z.add(n2z).add(n3z).add(rip2).add(rip3)

            // Output normalized perturbed surface normal
            return vec3(totalNx.negate(), float(1.0), totalNz.negate()).normalize()
        })

        // Color Node: Deep ocean gradient + sunlight specular glints matching Image 2
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // Wave height
            const dir1 = x.mul(0.819).add(z.mul(0.574))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(p1).mul(0.52)

            const dir2 = x.mul(0.766).sub(z.mul(0.643))
            const p2 = dir2.mul(this.waveFrequency.mul(1.85)).sub(this.time.mul(this.waveSpeed.mul(1.15)))
            const w2 = sin(p2).mul(0.28)

            const totalWave = w1.add(w2)
            const elevation = sin(totalWave.mul(1.4)).mul(this.waveElevation)

            // Height-based depth color: deep navy in troughs, vibrant sea teal on mid-slopes
            const hNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)
            const baseWater = mix(this.deepColor, this.midColor, hNorm)

            // Crest highlight
            const crestMask = smoothstep(float(0.05), this.waveElevation.mul(0.85), elevation)
            const oceanWater = mix(baseWater, this.crestColor, crestMask.mul(0.65))

            // Directional sun specular shimmer on ripple slopes (matches the golden sun glint in Image 2)
            const sunSlope = cos(p1.add(float(0.3))).mul(cos(p2.sub(float(0.2))))
            const microShimmer = sin(x.mul(3.2).add(z.mul(2.0)).add(this.time.mul(3.0)))
            const glintIntensity = smoothstep(float(0.4), float(0.85), sunSlope.add(microShimmer.mul(0.35)))
            const glintedWater = mix(oceanWater, this.sunGlintColor, glintIntensity.mul(0.45))

            // White seafoam on sharpest wave peaks
            const foamMask = smoothstep(this.waveElevation.mul(0.65), this.waveElevation.mul(0.95), elevation)
            const finalWater = mix(glintedWater, this.foamColor, foamMask.mul(0.85))

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
        this.material.normalNode = normalNode()
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
