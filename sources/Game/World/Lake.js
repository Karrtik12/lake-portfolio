import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, sin, cos, smoothstep, uniform, vec3, abs, atan } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — Bruno Simon style stylized water shader matching folio-2025:
 * Features organic island contour-hugging animated shore wave ripples,
 * seamless depth gradient, and calm surface displacement.
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
        this.deepColor = uniform(color('#061c32'))      // Deep stylized navy
        this.surfaceColor = uniform(color('#0e4c7a'))   // Cerulean lake water
        this.shallowColor = uniform(color('#1c73a8'))   // Light turquoise shore water
        this.foamColor = uniform(color('#ffffff'))      // Crisp white foam ripple lines

        this.waveElevation = uniform(float(0.045))      // Calm, still lake displacement
        this.waveFrequency = uniform(float(0.08))
        this.waveSpeed = uniform(float(0.85))

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

            return vec3(nx.mul(0.15).negate(), float(1.0), nz.mul(0.15).negate()).normalize()
        })

        // Color Node: Bruno Simon depth gradient + organic island-shaped ripple lines
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const x = pos.x
            const z = pos.z

            // 1. Subtle calm surface depth modulation
            const dir1 = x.mul(0.707).add(z.mul(0.707))
            const p1 = dir1.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed))
            const w1 = sin(p1).mul(0.65)

            const dir2 = x.mul(0.819).sub(z.mul(0.574))
            const p2 = dir2.mul(this.waveFrequency.mul(1.4)).sub(this.time.mul(this.waveSpeed.mul(0.85)))
            const w2 = sin(p2).mul(0.35)

            const elevation = sin(w1.add(w2)).mul(this.waveElevation)
            const heightNorm = elevation.div(this.waveElevation.mul(2.0)).add(0.5)

            let waterCol = mix(this.deepColor, this.surfaceColor, heightNorm)

            // 2. Organic Island Shoreline Waves (Conforming to exact island geometry and noise)
            
            // Island 1: Socials Island (-58, -38) | rx=24, rz=20, seed=1.4
            const dxSocials = x.add(58.0)
            const dzSocials = z.add(38.0)
            const angleSocials = atan(dzSocials, dxSocials)
            const nxSocials = dxSocials.div(24.0)
            const nzSocials = dzSocials.div(20.0)
            const baseDistSocials = nxSocials.mul(nxSocials).add(nzSocials.mul(nzSocials)).sqrt()
            const noiseSocials = sin(angleSocials.mul(3.0).add(1.4)).mul(0.05)
                .add(cos(angleSocials.mul(5.0).sub(1.4)).mul(0.03))
                .add(sin(angleSocials.mul(7.0).add(2.8)).mul(0.02))
            const organicDistSocials = baseDistSocials.add(noiseSocials)
            const relSocials = organicDistSocials.sub(1.0).mul(24.0)
            const rippleSocials = relSocials.mul(0.42).sub(this.time.mul(0.65)).mod(1.0)
            const maskSocials = smoothstep(float(5.0), float(0.0), abs(relSocials))
            const lineSocials = smoothstep(float(0.80), float(0.96), rippleSocials).mul(maskSocials)

            // Island 2: Lab Island (58, -35) | rx=26, rz=22, seed=2.8
            const dxLab = x.sub(58.0)
            const dzLab = z.add(35.0)
            const angleLab = atan(dzLab, dxLab)
            const nxLab = dxLab.div(26.0)
            const nzLab = dzLab.div(22.0)
            const baseDistLab = nxLab.mul(nxLab).add(nzLab.mul(nzLab)).sqrt()
            const noiseLab = sin(angleLab.mul(3.0).add(2.8)).mul(0.05)
                .add(cos(angleLab.mul(5.0).sub(2.8)).mul(0.03))
                .add(sin(angleLab.mul(7.0).add(5.6)).mul(0.02))
            const organicDistLab = baseDistLab.add(noiseLab)
            const relLab = organicDistLab.sub(1.0).mul(26.0)
            const rippleLab = relLab.mul(0.42).sub(this.time.mul(0.65)).mod(1.0)
            const maskLab = smoothstep(float(5.0), float(0.0), abs(relLab))
            const lineLab = smoothstep(float(0.80), float(0.96), rippleLab).mul(maskLab)

            // Island 3: About Island (-52, 44) | rx=22, rz=22, seed=4.2
            const dxAbout = x.add(52.0)
            const dzAbout = z.sub(44.0)
            const angleAbout = atan(dzAbout, dxAbout)
            const nxAbout = dxAbout.div(22.0)
            const nzAbout = dzAbout.div(22.0)
            const baseDistAbout = nxAbout.mul(nxAbout).add(nzAbout.mul(nzAbout)).sqrt()
            const noiseAbout = sin(angleAbout.mul(3.0).add(4.2)).mul(0.05)
                .add(cos(angleAbout.mul(5.0).sub(4.2)).mul(0.03))
                .add(sin(angleAbout.mul(7.0).add(8.4)).mul(0.02))
            const organicDistAbout = baseDistAbout.add(noiseAbout)
            const relAbout = organicDistAbout.sub(1.0).mul(22.0)
            const rippleAbout = relAbout.mul(0.42).sub(this.time.mul(0.65)).mod(1.0)
            const maskAbout = smoothstep(float(5.0), float(0.0), abs(relAbout))
            const lineAbout = smoothstep(float(0.80), float(0.96), rippleAbout).mul(maskAbout)

            // Outer Coastline (Harmonic coastline boundary matching Shoreline.js)
            const angleCoast = atan(z, x)
            const distCoast = x.mul(x).add(z.mul(z)).sqrt()
            const coastRadius = float(104.0)
                .add(sin(angleCoast.mul(4.0)).mul(5.0))
                .add(cos(angleCoast.mul(7.0)).mul(3.5))
                .add(sin(angleCoast.mul(11.0)).mul(2.0))
            const relCoast = coastRadius.sub(distCoast)
            const rippleCoast = relCoast.mul(0.38).sub(this.time.mul(0.6)).mod(1.0)
            const maskCoast = smoothstep(float(5.5), float(0.0), abs(relCoast))
            const lineCoast = smoothstep(float(0.80), float(0.96), rippleCoast).mul(maskCoast)

            // Shoreline edge contact foam (where water meets the beach)
            const shoreContact = smoothstep(float(0.6), float(0.0), abs(relSocials))
                .add(smoothstep(float(0.6), float(0.0), abs(relLab)))
                .add(smoothstep(float(0.6), float(0.0), abs(relAbout)))
                .add(smoothstep(float(0.8), float(0.0), abs(relCoast)))
                .clamp(0.0, 1.0)

            // Combine all organic shore ripple wave lines
            const totalRipples = lineSocials.add(lineLab).add(lineAbout).add(lineCoast).add(shoreContact.mul(0.75)).clamp(0.0, 1.0)

            // Shallow turquoise transition near shorelines
            const totalNearShore = maskSocials.add(maskLab).add(maskAbout).add(maskCoast).clamp(0.0, 1.0)
            waterCol = mix(waterCol, this.shallowColor, totalNearShore.mul(0.4))

            // Blend crisp white ripple lines
            const finalColor = mix(waterCol, this.foamColor, totalRipples.mul(0.85))

            return finalColor
        })

        this.material = new THREE.MeshStandardNodeMaterial({
            roughness: 0.7,
            metalness: 0.0,
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
