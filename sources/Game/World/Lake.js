import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, positionGeometry, positionLocal, positionWorld, sin, cos, smoothstep, uniform, vec3, vec4 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Lake — the primary navigable body of water with animated waves and stylized TSL node shading.
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // High-density plane geometry for fluid vertex wave displacement
        this.size = 180
        this.segments = 100
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // Uniforms
        this.time = uniform(float(0))
        this.deepColor = uniform(color('#0a2e50'))
        this.surfaceColor = uniform(color('#1b6598'))
        this.foamColor = uniform(color('#93d5fb'))
        this.waveElevation = uniform(float(0.24))
        this.waveFrequency = uniform(float(0.12))
        this.waveSpeed = uniform(float(1.1))

        // Position Node for wave vertex displacement
        const positionNode = Fn(() =>
        {
            const pos = positionGeometry.toVar()
            const worldX = pos.x
            const worldZ = pos.z

            // Multi-frequency directional waves
            const w1 = sin(worldX.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed)))
                .mul(cos(worldZ.mul(this.waveFrequency.mul(0.8)).add(this.time.mul(this.waveSpeed.mul(0.6)))))
            const w2 = sin(worldX.mul(this.waveFrequency.mul(2.2)).sub(this.time.mul(this.waveSpeed.mul(1.3)))).mul(0.35)
            const w3 = cos(worldZ.mul(this.waveFrequency.mul(1.8)).add(this.time.mul(this.waveSpeed.mul(0.9)))).mul(0.25)

            const elev = w1.add(w2).add(w3).mul(this.waveElevation)
            pos.y.addAssign(elev)

            return pos
        })

        // Color Node for deep-to-surface color gradient and foam highlights
        const colorNode = Fn(() =>
        {
            const pos = positionGeometry
            const worldX = pos.x
            const worldZ = pos.z

            const w1 = sin(worldX.mul(this.waveFrequency).add(this.time.mul(this.waveSpeed)))
                .mul(cos(worldZ.mul(this.waveFrequency.mul(0.8)).add(this.time.mul(this.waveSpeed.mul(0.6)))))
            const w2 = sin(worldX.mul(this.waveFrequency.mul(2.2)).sub(this.time.mul(this.waveSpeed.mul(1.3)))).mul(0.35)
            const w3 = cos(worldZ.mul(this.waveFrequency.mul(1.8)).add(this.time.mul(this.waveSpeed.mul(0.9)))).mul(0.25)
            const elev = w1.add(w2).add(w3).mul(this.waveElevation)

            const normElev = elev.div(this.waveElevation.mul(2.0)).add(0.5)
            const baseWater = mix(this.deepColor, this.surfaceColor, normElev)

            const foamFactor = smoothstep(this.waveElevation.mul(0.6), this.waveElevation.mul(0.95), elev)
            const finalColor = mix(baseWater, this.foamColor, foamFactor.mul(0.7))

            return finalColor
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
