import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, sin, cos, smoothstep, uniform, vec3, abs } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — Bruno Simon style stylized water shader featuring rich depth gradients,
 * calm surface swells, and procedural shoreline wave foam seamlessly integrated into the water material.
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // 1. High-density water plane geometry
        this.size = 320
        this.segments = 160
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // 2. Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#082038'))      // Deep lake navy
        this.surfaceColor = uniform(color('#135b8c'))   // Stylized lake azure
        this.shallowColor = uniform(color('#2a87b8'))   // Light turquoise shore water
        this.foamColor = uniform(color('#ffffff'))      // Crisp shoreline foam

        this.waveElevation = uniform(float(0.06))       // Calm, serene physical displacement
        this.waveFrequency = uniform(float(0.08))
        this.waveSpeed = uniform(float(0.95))

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

        // Normal Node: Smooth surface normals for stylized matte shading
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

            return vec3(nx.mul(0.2).negate(), float(1.0), nz.mul(0.2).negate()).normalize()
        })

        // Color Node: Bruno Simon depth color + procedural animated shore foam rings
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // 1. Subtle surface depth modulation
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(p1).mul(0.65)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.85)))
            const w2 = sin(p2).mul(0.35)

            const elevation = sin(w1.add(w2)).mul(this.waveElevation)
            const heightNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)

            let waterCol = mix(this.deepColor, this.surfaceColor, heightNorm)

            // 2. Procedural Shoreline Wave Foam (Bruno Simon animated shore rings)
            // Distance to Socials Island (-58, -38)
            const dxSocials = x.add(58.0)
            const dzSocials = z.add(38.0)
            const distSocials = dxSocials.mul(dxSocials).add(dzSocials.mul(dzSocials)).sqrt()
            const shoreSocialsDist = abs(distSocials.sub(21.5))
            const shoreSocialsMask = smoothstep(float(3.2), float(0.0), shoreSocialsDist)
            const rippleSocials = sin(distSocials.mul(1.8).sub(this.time.mul(2.2))).mul(0.5).add(0.5)
            const foamSocials = shoreSocialsMask.mul(rippleSocials).mul(0.65)

            // Distance to Lab Island (58, -35)
            const dxLab = x.sub(58.0)
            const dzLab = z.add(35.0)
            const distLab = dxLab.mul(dxLab).add(dzLab.mul(dzLab)).sqrt()
            const shoreLabDist = abs(distLab.sub(23.5))
            const shoreLabMask = smoothstep(float(3.5), float(0.0), shoreLabDist)
            const rippleLab = sin(distLab.mul(1.8).sub(this.time.mul(2.2))).mul(0.5).add(0.5)
            const foamLab = shoreLabMask.mul(rippleLab).mul(0.65)

            // Distance to About Island (-52, 44)
            const dxAbout = x.add(52.0)
            const dzAbout = z.sub(44.0)
            const distAbout = dxAbout.mul(dxAbout).add(dzAbout.mul(dzAbout)).sqrt()
            const shoreAboutDist = abs(distAbout.sub(21.0))
            const shoreAboutMask = smoothstep(float(3.2), float(0.0), shoreAboutDist)
            const rippleAbout = sin(distAbout.mul(1.8).sub(this.time.mul(2.2))).mul(0.5).add(0.5)
            const foamAbout = shoreAboutMask.mul(rippleAbout).mul(0.65)

            // Distance to Outer Coast (R ~ 106)
            const distCenter = x.mul(x).add(z.mul(z)).sqrt()
            const shoreCoastDist = abs(distCenter.sub(105.0))
            const shoreCoastMask = smoothstep(float(4.0), float(0.0), shoreCoastDist)
            const rippleCoast = sin(distCenter.mul(1.5).add(this.time.mul(2.0))).mul(0.5).add(0.5)
            const foamCoast = shoreCoastMask.mul(rippleCoast).mul(0.5)

            // Combine all shore foam
            const totalFoam = foamSocials.add(foamLab).add(foamAbout).add(foamCoast).clamp(0.0, 1.0)

            // Near-shore shallow water transition
            const totalNearShore = shoreSocialsMask.add(shoreLabMask).add(shoreAboutMask).add(shoreCoastMask).clamp(0.0, 1.0)
            waterCol = mix(waterCol, this.shallowColor, totalNearShore.mul(0.5))

            // Blend crisp foam crests on top of shorelines
            const finalColor = mix(waterCol, this.foamColor, totalFoam.mul(0.75))

            return finalColor
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.65,
            metalness: 0.02,
            transparent: true,
            opacity: 0.98,
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

    update()
    {
        const time = performance.now() * 0.001
        this.time.value = time
    }
}
