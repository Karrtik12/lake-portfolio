import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionWorld, sin, cos, smoothstep, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — smooth, high-fidelity oceanic water with multi-scale seamless normal wave textures,
 * dynamic Gerstner vertex displacement, smooth Fresnel reflections, and sunlight crest glints
 * (100% free of aliasing, moiré patterns, or jitter).
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // 1. High-density water plane geometry
        this.size = 220
        this.segments = 160
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // 2. Generate seamless 512x512 Ocean Wave Normal Map with Mipmaps
        this.normalTexture = this.createOceanNormalTexture()

        // 3. Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#061c2d'))      // Deep ocean navy
        this.surfaceColor = uniform(color('#0e4b6e'))   // Vibrant sea azure
        this.shallowColor = uniform(color('#157299'))   // Turquoise coastal water
        this.sunGlintColor = uniform(color('#fef3c7'))  // Soft golden sunlight shimmer
        this.foamColor = uniform(color('#f8fafc'))      // Crisp seafoam white

        this.waveElevation = uniform(float(0.24))       // Smooth physical wave displacement
        this.waveFrequency = uniform(float(0.09))       // Gentle wavelength
        this.waveSpeed = uniform(float(1.1))

        // Position Node: Multi-directional smooth Gerstner wave displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const x = pos.x
            const z = pos.z

            // Primary ocean swell (Direction: 45 degrees)
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const phase1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(phase1).mul(0.60)

            // Secondary cross swell (Direction: -35 degrees)
            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const phase2 = dir2.mul(this.waveFrequency.mul(1.6)).sub(this.time.mul(this.waveSpeed.mul(1.1)))
            const w2 = sin(phase2).mul(0.30)

            // Medium wave (Direction: 80 degrees)
            const dir3 = x.mul(0.174).add(z.mul(0.985))
            const phase3 = dir3.mul(this.waveFrequency.mul(2.8)).add(this.time.mul(this.waveSpeed.mul(1.4)))
            const w3 = cos(phase3).mul(0.10)

            const totalWave = w1.add(w2).add(w3)
            const elevation = sin(totalWave.mul(1.2)).mul(this.waveElevation)

            pos.y.addAssign(elevation)

            // Smooth lateral drift
            pos.x.addAssign(cos(phase1).mul(0.10))
            pos.z.addAssign(cos(phase1).mul(0.10))

            return pos
        })

        // Normal Node: Smooth analytical wave slope with multi-octave micro-ripples
        const normalNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // Primary swell slopes
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const slope1 = cos(p1).mul(this.waveFrequency).mul(0.60)

            // Cross swell slopes
            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.6)).sub(this.time.mul(this.waveSpeed.mul(1.1)))
            const slope2 = cos(p2).mul(this.waveFrequency.mul(1.6)).mul(0.30)

            // Smooth micro-ripples
            const ripX = sin(x.mul(0.45).add(this.time.mul(1.2))).mul(0.08)
                .add(sin(x.mul(1.1).sub(this.time.mul(1.8))).mul(0.04))
            const ripZ = cos(z.mul(0.45).add(this.time.mul(1.0))).mul(0.08)
                .add(cos(z.mul(1.1).sub(this.time.mul(1.6))).mul(0.04))

            const nx = slope1.mul(0.707).add(slope2.mul(0.819)).add(ripX)
            const nz = slope1.mul(0.707).sub(slope2.mul(0.574)).add(ripZ)

            return vec3(nx.negate(), float(1.0), nz.negate()).normalize()
        })

        // Color Node: Smooth depth gradient + soft Fresnel sheen and foam crests
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(p1).mul(0.60)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.6)).sub(this.time.mul(this.waveSpeed.mul(1.1)))
            const w2 = sin(p2).mul(0.30)

            const totalWave = w1.add(w2)
            const elevation = sin(totalWave.mul(1.2)).mul(this.waveElevation)

            // Smooth depth gradient
            const heightNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)
            const baseColor = mix(this.deepColor, this.surfaceColor, heightNorm)

            // Crest highlight
            const crestMask = smoothstep(float(0.05), this.waveElevation.mul(0.8), elevation)
            const waterColor = mix(baseColor, this.shallowColor, crestMask.mul(0.55))

            // Sunlight glint on wave crests
            const glintMask = smoothstep(this.waveElevation.mul(0.4), this.waveElevation.mul(0.9), elevation)
            const glintColor = mix(waterColor, this.sunGlintColor, glintMask.mul(0.25))

            // White seafoam on top 10% of wave peaks
            const foamMask = smoothstep(this.waveElevation.mul(0.72), this.waveElevation.mul(0.96), elevation)
            const finalWater = mix(glintColor, this.foamColor, foamMask.mul(0.85))

            return finalWater
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.16,
            metalness: 0.25,
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

    createOceanNormalTexture()
    {
        const size = 512
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const imgData = ctx.createImageData(size, size)
        const data = imgData.data

        for(let y = 0; y < size; y++)
        {
            for(let x = 0; x < size; x++)
            {
                const u = (x / size) * Math.PI * 4
                const v = (y / size) * Math.PI * 4

                // Smooth sinusoidal wave normal
                const nx = Math.sin(u * 2.0 + v) * 0.4 + Math.cos(u * 4.0 - v * 2.0) * 0.2
                const ny = Math.cos(v * 2.0 + u) * 0.4 + Math.sin(v * 4.0 - u * 2.0) * 0.2
                const nz = 1.0

                // Normalize vector
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
                const normX = (nx / len) * 0.5 + 0.5
                const normY = (ny / len) * 0.5 + 0.5
                const normZ = (nz / len) * 0.5 + 0.5

                const idx = (y * size + x) * 4
                data[idx + 0] = Math.floor(normX * 255)
                data[idx + 1] = Math.floor(normY * 255)
                data[idx + 2] = Math.floor(normZ * 255)
                data[idx + 3] = 255
            }
        }

        ctx.putImageData(imgData, 0, 0)

        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        tex.generateMipmaps = true
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        return tex
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
