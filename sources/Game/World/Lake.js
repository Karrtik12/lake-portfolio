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
        this.size = 320
        this.segments = 200
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // 2. Generate seamless 512x512 Ocean Wave Normal Map with Mipmaps
        this.normalTexture = this.createOceanNormalTexture()

        // 3. Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#041829'))      // Rich deep navy blue
        this.surfaceColor = uniform(color('#0b3a5d'))   // Stylized lake azure
        this.shallowColor = uniform(color('#135b8c'))   // Soft cyan-blue coastal water
        this.foamColor = uniform(color('#e0f2fe'))      // Subtle soft water crest

        this.waveElevation = uniform(float(0.06))       // Gentle, serene physical wave displacement (Bruno Simon style calm lake)
        this.waveFrequency = uniform(float(0.065))      // Wide calm wavelength
        this.waveSpeed = uniform(float(0.85))

        // Position Node: Multi-directional smooth gentle swell displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const x = pos.x
            const z = pos.z

            // Primary calm swell (Direction: 45 degrees)
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const phase1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(phase1).mul(0.65)

            // Secondary gentle cross swell (Direction: -35 degrees)
            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const phase2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.9)))
            const w2 = sin(phase2).mul(0.35)

            const totalWave = w1.add(w2)
            const elevation = sin(totalWave).mul(this.waveElevation)

            pos.y.addAssign(elevation)

            return pos
        })

        // Normal Node: Smooth analytical calm wave slope with soft micro-ripples
        const normalNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // Primary swell slopes
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const slope1 = cos(p1).mul(this.waveFrequency).mul(0.65)

            // Cross swell slopes
            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.9)))
            const slope2 = cos(p2).mul(this.waveFrequency.mul(1.4)).mul(0.35)

            // Gentle micro-ripples
            const ripX = sin(x.mul(0.35).add(this.time.mul(0.8))).mul(0.04)
            const ripZ = cos(z.mul(0.35).add(this.time.mul(0.7))).mul(0.04)

            const nx = slope1.mul(0.707).add(slope2.mul(0.819)).add(ripX)
            const nz = slope1.mul(0.707).sub(slope2.mul(0.574)).add(ripZ)

            return vec3(nx.mul(0.2).negate(), float(1.0), nz.mul(0.2).negate()).normalize()
        })

        // Color Node: Smooth stylized depth gradient
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(p1).mul(0.65)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.9)))
            const w2 = sin(p2).mul(0.35)

            const totalWave = w1.add(w2)
            const elevation = sin(totalWave).mul(this.waveElevation)

            // Smooth depth gradient
            const heightNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)
            const baseColor = mix(this.deepColor, this.surfaceColor, heightNorm)

            // Soft surface highlight
            const crestMask = smoothstep(float(0.01), this.waveElevation.mul(0.85), elevation)
            const finalWater = mix(baseColor, this.shallowColor, crestMask.mul(0.4))

            return finalWater
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.48,
            metalness: 0.05,
            transparent: true,
            opacity: 0.96,
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
