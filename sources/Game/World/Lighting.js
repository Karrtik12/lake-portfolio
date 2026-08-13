import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Lighting — sun, hemisphere ambient, and shadow maps.
 */
export class Lighting
{
    constructor()
    {
        this.game = Game.getInstance()

        // Hemisphere Light (sky / ground ambient)
        this.hemisphereLight = new THREE.HemisphereLight(
            0x88c0ff, // Sky blue
            0x2d4332, // Ground earth
            1.2
        )
        this.game.scene.add(this.hemisphereLight)

        // Directional Sun Light
        this.sunLight = new THREE.DirectionalLight(0xffeedd, 2.2)
        this.sunLight.position.set(60, 80, 50)
        this.sunLight.castShadow = true

        // Shadow configuration
        this.sunLight.shadow.mapSize.width = 2048
        this.sunLight.shadow.mapSize.height = 2048
        this.sunLight.shadow.camera.near = 10
        this.sunLight.shadow.camera.far = 300

        const d = 90
        this.sunLight.shadow.camera.left = -d
        this.sunLight.shadow.camera.right = d
        this.sunLight.shadow.camera.top = d
        this.sunLight.shadow.camera.bottom = -d
        this.sunLight.shadow.bias = -0.0005
        this.sunLight.shadow.radius = 2

        this.game.scene.add(this.sunLight)

        // Soft Warm Fill Light from opposite direction
        this.fillLight = new THREE.DirectionalLight(0x7395b8, 0.6)
        this.fillLight.position.set(-50, 30, -50)
        this.game.scene.add(this.fillLight)
    }
}
