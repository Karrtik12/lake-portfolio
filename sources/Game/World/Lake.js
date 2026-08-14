import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionWorld, sin, cos, smoothstep, uniform, vec3, abs, atan, texture, vec2 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — Authentic Bruno Simon stylized water shader matching folio-2025:
 * Features vibrant electric blue lake water, calm surface swells,
 * and noise-broken organic shoreline wave foam shards / dashes.
 */
export class Lake
{
    /**
     * Physical wave elevation at coordinate (X, Z) and time (t).
     */
    static getWaveElevation(x, z, time)
    {
        const freq = 0.075
        const speed = 0.8
        const elevation = 0.04

        const dir1 = x * 0.707 + z * 0.707
        const phase1 = dir1 * freq + time * speed
        const w1 = Math.sin(phase1) * 0.65

        const dir2 = x * 0.819 - z * 0.574
        const phase2 = dir2 * (freq * 1.4) - time * (speed * 0.85)
        const w2 = Math.sin(phase2) * 0.35

        return Math.sin(w1 + w2) * elevation
    }

    constructor()
    {
        this.game = Game.getInstance()

        // 1. Water plane geometry
        this.size = 320
        this.segments = 160
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // 2. Seamless Perlin noise texture for organic wave breaking
        this.noiseTexture = this.createPerlinNoiseTexture()

        // 3. Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#0369a1'))      // Rich tropical sapphire blue (deep ocean drop-off)
        this.surfaceColor = uniform(color('#06b6d4'))   // Radiant turquoise lagoon water
        this.shallowColor = uniform(color('#38bdf8'))   // Light crystalline aquamarine
        this.shoreWaterColor = uniform(color('#a5f3fc'))// Pale crystal aqua at the beach waterline
        this.foamColor = uniform(color('#ffffff'))      // Crisp white shoreline foam shards

        this.waveElevation = uniform(float(0.04))       // Serene, calm lake displacement
        this.waveFrequency = uniform(float(0.075))
        this.waveSpeed = uniform(float(0.8))

        // Position Node: Gentle calm surface swells
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const x = pos.x
            const z = pos.z

            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const phase1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(phase1).mul(0.65)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const phase2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.85)))
            const w2 = sin(phase2).mul(0.35)

            const totalWave = w1.add(w2)
            const elevation = sin(totalWave).mul(this.waveElevation)

            pos.y.addAssign(elevation)

            return pos
        })

        // Normal Node: Smooth surface normals
        const normalNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const slope1 = cos(p1).mul(this.waveFrequency).mul(0.65)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.85)))
            const slope2 = cos(p2).mul(this.waveFrequency.mul(1.4)).mul(0.35)

            const nx = slope1.mul(0.707).add(slope2.mul(0.819))
            const nz = slope1.mul(0.707).sub(slope2.mul(0.574))

            return vec3(nx.mul(0.12).negate(), float(1.0), nz.mul(0.12).negate()).normalize()
        })

        // Color Node: Bruno Simon vibrant electric water + organic noise-broken foam shards
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // 1. Base vibrant depth gradient
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(p1).mul(0.65)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.85)))
            const w2 = sin(p2).mul(0.35)

            const elevation = sin(w1.add(w2)).mul(this.waveElevation)
            const heightNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)

            let waterCol = mix(this.deepColor, this.surfaceColor, heightNorm)

            // 2. Shore Distance Calculations
            
            // Socials Island (-58, -38)
            const dxSocials = x.add(58.0)
            const dzSocials = z.add(38.0)
            const angleSocials = atan(dzSocials, dxSocials)
            const nxSocials = dxSocials.div(24.0)
            const nzSocials = dzSocials.div(20.0)
            const baseDistSocials = nxSocials.mul(nxSocials).add(nzSocials.mul(nzSocials)).sqrt()
            const noiseSocials = sin(angleSocials.mul(3.0).add(1.4)).mul(0.05)
                .add(cos(angleSocials.mul(5.0).sub(1.4)).mul(0.03))
            const dSocials = baseDistSocials.add(noiseSocials).sub(1.0).mul(24.0)

            // Lab Island (58, -35)
            const dxLab = x.sub(58.0)
            const dzLab = z.add(35.0)
            const angleLab = atan(dzLab, dxLab)
            const nxLab = dxLab.div(26.0)
            const nzLab = dzLab.div(22.0)
            const baseDistLab = nxLab.mul(nxLab).add(nzLab.mul(nzLab)).sqrt()
            const noiseLab = sin(angleLab.mul(3.0).add(2.8)).mul(0.05)
                .add(cos(angleLab.mul(5.0).sub(2.8)).mul(0.03))
            const dLab = baseDistLab.add(noiseLab).sub(1.0).mul(26.0)

            // About Island (-52, 44)
            const dxAbout = x.add(52.0)
            const dzAbout = z.sub(44.0)
            const angleAbout = atan(dzAbout, dxAbout)
            const nxAbout = dxAbout.div(22.0)
            const nzAbout = dzAbout.div(22.0)
            const baseDistAbout = nxAbout.mul(nxAbout).add(nzAbout.mul(nzAbout)).sqrt()
            const noiseAbout = sin(angleAbout.mul(3.0).add(4.2)).mul(0.05)
                .add(cos(angleAbout.mul(5.0).sub(4.2)).mul(0.03))
            const dAbout = baseDistAbout.add(noiseAbout).sub(1.0).mul(22.0)

            // Outer Coastline
            const angleCoast = atan(z, x)
            const distCoast = x.mul(x).add(z.mul(z)).sqrt()
            const coastRadius = float(104.0)
                .add(sin(angleCoast.mul(4.0)).mul(5.0))
                .add(cos(angleCoast.mul(7.0)).mul(3.5))
            const dCoast = coastRadius.sub(distCoast)

            // 3. Bruno Simon Foam Shards (Ripples broken by Perlin noise texture)
            const slopeFreq = float(0.35)
            const timeOffset = this.time.mul(0.55)

            // Noise lookup coordinates
            const noiseUv1 = vec2(x.mul(0.045), z.mul(0.045))
            const noiseUv2 = vec2(x.mul(0.08).add(0.35), z.mul(0.08).add(0.35))
            const perlin1 = texture(this.noiseTexture, noiseUv1).r
            const perlin2 = texture(this.noiseTexture, noiseUv2).r
            const combinedNoise = perlin1.mul(0.65).add(perlin2.mul(0.35))

            // Socials Island Foam Shards
            const baseRipSocials = dSocials.mul(slopeFreq).sub(timeOffset)
            const ripIdxSocials = baseRipSocials.floor()
            const ripNoiseSocials = texture(this.noiseTexture, noiseUv1.add(ripIdxSocials.mul(0.24))).r
            const modRipSocials = baseRipSocials.mod(1.0).add(ripNoiseSocials.mul(0.55)).sub(0.25)
            const maskSocials = smoothstep(float(7.5), float(0.0), abs(dSocials))
            const foamSocials = smoothstep(float(0.74), float(0.92), modRipSocials).mul(maskSocials)

            // Lab Island Foam Shards
            const baseRipLab = dLab.mul(slopeFreq).sub(timeOffset)
            const ripIdxLab = baseRipLab.floor()
            const ripNoiseLab = texture(this.noiseTexture, noiseUv1.add(ripIdxLab.mul(0.24))).r
            const modRipLab = baseRipLab.mod(1.0).add(ripNoiseLab.mul(0.55)).sub(0.25)
            const maskLab = smoothstep(float(7.5), float(0.0), abs(dLab))
            const foamLab = smoothstep(float(0.74), float(0.92), modRipLab).mul(maskLab)

            // About Island Foam Shards
            const baseRipAbout = dAbout.mul(slopeFreq).sub(timeOffset)
            const ripIdxAbout = baseRipAbout.floor()
            const ripNoiseAbout = texture(this.noiseTexture, noiseUv1.add(ripIdxAbout.mul(0.24))).r
            const modRipAbout = baseRipAbout.mod(1.0).add(ripNoiseAbout.mul(0.55)).sub(0.25)
            const maskAbout = smoothstep(float(7.5), float(0.0), abs(dAbout))
            const foamAbout = smoothstep(float(0.74), float(0.92), modRipAbout).mul(maskAbout)

            // Outer Coast Foam Shards
            const baseRipCoast = dCoast.mul(slopeFreq).sub(timeOffset)
            const ripIdxCoast = baseRipCoast.floor()
            const ripNoiseCoast = texture(this.noiseTexture, noiseUv1.add(ripIdxCoast.mul(0.24))).r
            const modRipCoast = baseRipCoast.mod(1.0).add(ripNoiseCoast.mul(0.55)).sub(0.25)
            const maskCoast = smoothstep(float(8.0), float(0.0), abs(dCoast))
            const foamCoast = smoothstep(float(0.74), float(0.92), modRipCoast).mul(maskCoast)

            // Thin beach contact foam edge right where water hits the sand
            const shoreContact = smoothstep(float(0.55), float(0.0), abs(dSocials))
                .add(smoothstep(float(0.55), float(0.0), abs(dLab)))
                .add(smoothstep(float(0.55), float(0.0), abs(dAbout)))
                .add(smoothstep(float(0.65), float(0.0), abs(dCoast)))
                .mul(combinedNoise.mul(0.5).add(0.5))
                .clamp(0.0, 1.0)

            // Combine all organic broken foam shards
            const totalFoam = foamSocials.add(foamLab).add(foamAbout).add(foamCoast).add(shoreContact.mul(0.6)).clamp(0.0, 1.0)

            // Multi-layered tropical lagoon shoreline transition
            const totalNearShore = maskSocials.add(maskLab).add(maskAbout).add(maskCoast).clamp(0.0, 1.0)
            const lagoonWater = mix(waterCol, this.shallowColor, totalNearShore.mul(0.65))
            const finalWater = mix(lagoonWater, this.shoreWaterColor, shoreContact.mul(0.75))

            // Blend crisp white foam shards on top
            const finalColor = mix(finalWater, this.foamColor, totalFoam.mul(0.92))

            return finalColor
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.35,
            metalness: 0.08,
            transparent: true,
            opacity: 0.94,
            flatShading: false
        })

        this.material.positionNode = positionNode()
        this.material.normalNode = normalNode()
        this.material.colorNode = colorNode()

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.receiveShadow = true
        this.game.scene.add(this.mesh)

        // Animate in game ticker loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    createPerlinNoiseTexture()
    {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        const imgData = ctx.createImageData(256, 256)
        const data = imgData.data

        // Generate smooth multi-octave 2D value noise
        const grid = []
        const size = 32
        for(let y = 0; y <= size; y++)
        {
            grid[y] = []
            for(let x = 0; x <= size; x++)
            {
                grid[y][x] = Math.random()
            }
        }
        // Make seamless
        for(let i = 0; i <= size; i++)
        {
            grid[size][i] = grid[0][i]
            grid[i][size] = grid[i][0]
        }

        const smooth = (t) => t * t * (3 - 2 * t)

        for(let py = 0; py < 256; py++)
        {
            for(let px = 0; px < 256; px++)
            {
                const gx = (px / 256) * size
                const gy = (py / 256) * size
                const x0 = Math.floor(gx)
                const y0 = Math.floor(gy)
                const x1 = (x0 + 1)
                const y1 = (y0 + 1)
                const sx = smooth(gx - x0)
                const sy = smooth(gy - y0)

                const n0 = grid[y0][x0] * (1 - sx) + grid[y0][x1] * sx
                const n1 = grid[y1][x0] * (1 - sx) + grid[y1][x1] * sx
                const val = n0 * (1 - sy) + n1 * sy

                const idx = (py * 256 + px) * 4
                const c = Math.floor(val * 255)
                data[idx + 0] = c
                data[idx + 1] = c
                data[idx + 2] = c
                data[idx + 3] = 255
            }
        }

        ctx.putImageData(imgData, 0, 0)
        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        tex.needsUpdate = true
        return tex
    }

    update()
    {
        const time = performance.now() * 0.001
        this.time.value = time
    }
}
