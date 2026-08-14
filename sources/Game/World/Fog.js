import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Fog — atmospheric distance fog for depth and horizon blending across the expanded lake.
 */
export class Fog
{
    constructor()
    {
        this.game = Game.getInstance()

        // Atmosphere colors
        this.color = new THREE.Color('#162238')
        this.game.scene.fog = new THREE.Fog(this.color, 80, 340)
    }
}
