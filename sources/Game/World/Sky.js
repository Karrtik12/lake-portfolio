import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Sky — creates a dome with a smooth atmospheric gradient.
 */
export class Sky
{
    constructor()
    {
        this.game = Game.getInstance()

        const geometry = new THREE.SphereGeometry(300, 32, 20)

        // Custom vertex/fragment shader for clean gradient sky dome
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `

        const fragmentShader = `
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition).y;
                vec3 topColor = vec3(0.08, 0.14, 0.28);    // Deep sapphire sky
                vec3 horizonColor = vec3(0.35, 0.52, 0.72); // Soft horizon blue
                vec3 groundColor = vec3(0.09, 0.13, 0.22);  // Fog-matched bottom
                
                vec3 sky = mix(horizonColor, topColor, max(pow(max(h, 0.0), 0.7), 0.0));
                sky = mix(sky, groundColor, max(-h * 2.0, 0.0));
                
                gl_FragColor = vec4(sky, 1.0);
            }
        `

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.BackSide,
            depthWrite: false
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.game.scene.add(this.mesh)
    }
}
