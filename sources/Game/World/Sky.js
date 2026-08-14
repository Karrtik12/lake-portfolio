import * as THREE from 'three/webgpu'
import { color, float, Fn, max, mix, normalize, positionWorld, pow, uniform } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Sky — dynamic atmospheric dome gradient with WebGPU TSL NodeMaterial,
 * animated across the 24-hour sun and day-night cycle.
 */
export class Sky
{
    constructor()
    {
        this.game = Game.getInstance()

        const geometry = new THREE.SphereGeometry(320, 32, 24)

        this.topColorUniform = uniform(color('#0369a1'))     // Deep sky
        this.horizonColorUniform = uniform(color('#38bdf8')) // Soft horizon
        this.groundColorUniform = uniform(color('#0c4a6e'))  // Lower boundary

        const colorNode = Fn(() =>
        {
            const normPos = normalize(positionWorld)
            const h = normPos.y

            const skyMix = mix(this.horizonColorUniform, this.topColorUniform, max(pow(max(h, float(0.0)), float(0.7)), float(0.0)))
            const finalColor = mix(skyMix, this.groundColorUniform, max(h.mul(-2.0), float(0.0)))

            return finalColor
        })

        const material = new THREE.MeshBasicNodeMaterial({
            side: THREE.BackSide,
            depthWrite: false
        })
        material.colorNode = colorNode()

        this.mesh = new THREE.Mesh(geometry, material)
        this.game.scene.add(this.mesh)
    }
}
