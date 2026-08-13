import * as THREE from 'three/webgpu'
import { color, float, Fn, max, mix, normalize, positionWorld, pow, vec3 } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Sky — creates a dome with a smooth atmospheric gradient using WebGPU TSL NodeMaterial.
 */
export class Sky
{
    constructor()
    {
        this.game = Game.getInstance()

        const geometry = new THREE.SphereGeometry(300, 32, 20)

        const topColor = color('#142340')     // Deep sapphire sky
        const horizonColor = color('#5b8bb8') // Soft horizon blue
        const groundColor = color('#162238')  // Fog-matched bottom

        const colorNode = Fn(() =>
        {
            const normPos = normalize(positionWorld)
            const h = normPos.y

            const skyMix = mix(horizonColor, topColor, max(pow(max(h, float(0.0)), float(0.7)), float(0.0)))
            const finalColor = mix(skyMix, groundColor, max(h.mul(-2.0), float(0.0)))

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
