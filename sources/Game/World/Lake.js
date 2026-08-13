import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Lake — the primary navigable body of water with animated waves and stylized shading.
 */
export class Lake
{
    constructor()
    {
        this.game = Game.getInstance()

        // High-density plane geometry for fluid vertex wave displacement
        this.size = 180
        this.segments = 120
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
        this.geometry.rotateX(-Math.PI * 0.5)

        // Shader uniforms
        this.uniforms = {
            uTime: { value: 0 },
            uDeepColor: { value: new THREE.Color('#0c2b48') },
            uSurfaceColor: { value: new THREE.Color('#1e6896') },
            uFoamColor: { value: new THREE.Color('#78c0e0') },
            uWaveElevation: { value: 0.22 },
            uWaveFrequency: { value: 0.12 },
            uWaveSpeed: { value: 1.1 }
        }

        const vertexShader = `
            uniform float uTime;
            uniform float uWaveElevation;
            uniform float uWaveFrequency;
            uniform float uWaveSpeed;

            varying vec2 vUv;
            varying float vElevation;
            varying vec3 vNormalWorld;
            varying vec3 vWorldPosition;

            void main() {
                vUv = uv;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);

                // Multi-frequency directional waves
                float wave1 = sin(worldPosition.x * uWaveFrequency + uTime * uWaveSpeed) * cos(worldPosition.z * uWaveFrequency * 0.8 + uTime * uWaveSpeed * 0.6);
                float wave2 = sin(worldPosition.x * uWaveFrequency * 2.2 - uTime * uWaveSpeed * 1.3) * 0.35;
                float wave3 = cos(worldPosition.z * uWaveFrequency * 1.8 + uTime * uWaveSpeed * 0.9) * 0.25;

                float elevation = (wave1 + wave2 + wave3) * uWaveElevation;
                worldPosition.y += elevation;
                vElevation = elevation;

                // Approximate normal via finite differences
                float d = 0.3;
                float waveX = (sin((worldPosition.x + d) * uWaveFrequency + uTime * uWaveSpeed) - sin((worldPosition.x - d) * uWaveFrequency + uTime * uWaveSpeed)) * uWaveElevation;
                float waveZ = (cos((worldPosition.z + d) * uWaveFrequency * 0.8 + uTime * uWaveSpeed * 0.6) - cos((worldPosition.z - d) * uWaveFrequency * 0.8 + uTime * uWaveSpeed * 0.6)) * uWaveElevation;
                vec3 normalApprox = normalize(vec3(-waveX, 1.0, -waveZ));
                vNormalWorld = normalApprox;

                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `

        const fragmentShader = `
            uniform vec3 uDeepColor;
            uniform vec3 uSurfaceColor;
            uniform vec3 uFoamColor;
            uniform float uWaveElevation;

            varying vec2 vUv;
            varying float vElevation;
            varying vec3 vNormalWorld;
            varying vec3 vWorldPosition;

            void main() {
                // Base water color mix based on wave height
                float colorMix = (vElevation + uWaveElevation) / (uWaveElevation * 2.0);
                colorMix = clamp(colorMix, 0.0, 1.0);
                vec3 waterColor = mix(uDeepColor, uSurfaceColor, colorMix);

                // Subtle foam at peak crests
                float foam = smoothstep(uWaveElevation * 0.55, uWaveElevation * 0.9, vElevation);
                waterColor = mix(waterColor, uFoamColor, foam * 0.65);

                // Sun specular highlight
                vec3 sunDir = normalize(vec3(0.5, 0.8, 0.4));
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 halfVector = normalize(sunDir + viewDir);
                float spec = pow(max(dot(vNormalWorld, halfVector), 0.0), 32.0);
                waterColor += vec3(1.0, 0.95, 0.85) * spec * 0.5;

                gl_FragColor = vec4(waterColor, 0.94);
            }
        `

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: true
        })

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
            this.uniforms.uTime.value = this.game.wind.time
        }
        else
        {
            this.uniforms.uTime.value += 0.016
        }
    }
}
