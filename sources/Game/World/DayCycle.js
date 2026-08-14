import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * DayCycle — manages a 24-hour celestial sun and ambient day-night cycle:
 * Smoothly animates Sun trajectory, Moon, Directional Light, Hemisphere Ambient,
 * Dynamic Atmospheric Sky Dome, and Water reflections across:
 * - Dawn (Golden Pink Sunrise)
 * - Morning (Crisp Clean Daylight)
 * - High Noon (Brilliant Turquoise Sun)
 * - Golden Hour / Afternoon
 * - Dusk (Vibrant Crimson-Magenta Sunset)
 * - Twilight
 * - Midnight (Mystical Moonlight & Deep Starry Sky)
 */
export class DayCycle
{
    constructor()
    {
        this.game = Game.getInstance()

        // Full cycle duration in seconds (480s = 8 minutes per full natural 24h cycle)
        this.cycleDuration = 480.0
        this.timeOfDay = 0.32 // Starts at bright vibrant morning/noon
        this.isPaused = false

        // Celestial trajectory configuration
        this.sunOrbitRadius = 190.0
        this.sunHeight = 150.0

        // Keyframe Presets
        this.keyframes = [
            {
                time: 0.00, // Dawn / Sunrise (East)
                name: 'Dawn',
                sunColor: new THREE.Color('#ff8c5a'),
                sunIntensity: 1.5,
                fillColor: new THREE.Color('#93c5fd'),
                fillIntensity: 0.5,
                hemiSky: new THREE.Color('#fda4af'),
                hemiGround: new THREE.Color('#431407'),
                hemiIntensity: 1.1,
                skyTop: new THREE.Color('#1e1b4b'),
                skyHorizon: new THREE.Color('#fb923c'),
                skyGround: new THREE.Color('#451a03'),
                waterDeep: new THREE.Color('#041d3d'),
                waterSurface: new THREE.Color('#0d598a')
            },
            {
                time: 0.18, // Morning
                name: 'Morning',
                sunColor: new THREE.Color('#fff2db'),
                sunIntensity: 2.3,
                fillColor: new THREE.Color('#67e8f9'),
                fillIntensity: 0.6,
                hemiSky: new THREE.Color('#bae6fd'),
                hemiGround: new THREE.Color('#134e4a'),
                hemiIntensity: 1.3,
                skyTop: new THREE.Color('#0284c7'),
                skyHorizon: new THREE.Color('#7dd3fc'),
                skyGround: new THREE.Color('#082f49'),
                waterDeep: new THREE.Color('#0369a1'),
                waterSurface: new THREE.Color('#06b6d4')
            },
            {
                time: 0.35, // High Noon (Overhead Sun)
                name: 'Noon',
                sunColor: new THREE.Color('#ffffff'),
                sunIntensity: 2.7,
                fillColor: new THREE.Color('#7dd3fc'),
                fillIntensity: 0.7,
                hemiSky: new THREE.Color('#e0f2fe'),
                hemiGround: new THREE.Color('#0f766e'),
                hemiIntensity: 1.4,
                skyTop: new THREE.Color('#0369a1'),
                skyHorizon: new THREE.Color('#38bdf8'),
                skyGround: new THREE.Color('#0c4a6e'),
                waterDeep: new THREE.Color('#0369a1'),
                waterSurface: new THREE.Color('#06b6d4')
            },
            {
                time: 0.55, // Golden Hour / Afternoon
                name: 'Golden Hour',
                sunColor: new THREE.Color('#f59e0b'),
                sunIntensity: 2.2,
                fillColor: new THREE.Color('#f472b6'),
                fillIntensity: 0.6,
                hemiSky: new THREE.Color('#fed7aa'),
                hemiGround: new THREE.Color('#7c2d12'),
                hemiIntensity: 1.2,
                skyTop: new THREE.Color('#312e81'),
                skyHorizon: new THREE.Color('#f97316'),
                skyGround: new THREE.Color('#431407'),
                waterDeep: new THREE.Color('#062447'),
                waterSurface: new THREE.Color('#0284c7')
            },
            {
                time: 0.68, // Dusk / Sunset (West)
                name: 'Sunset',
                sunColor: new THREE.Color('#e11d48'),
                sunIntensity: 1.4,
                fillColor: new THREE.Color('#a855f7'),
                fillIntensity: 0.5,
                hemiSky: new THREE.Color('#f472b6'),
                hemiGround: new THREE.Color('#3b0764'),
                hemiIntensity: 0.95,
                skyTop: new THREE.Color('#1e1b4b'),
                skyHorizon: new THREE.Color('#c026d3'),
                skyGround: new THREE.Color('#2e1065'),
                waterDeep: new THREE.Color('#081a38'),
                waterSurface: new THREE.Color('#0369a1')
            },
            {
                time: 0.82, // Night / Midnight Moon
                name: 'Night',
                sunColor: new THREE.Color('#7dd3fc'), // Pale cool moonlight
                sunIntensity: 0.85,
                fillColor: new THREE.Color('#38bdf8'),
                fillIntensity: 0.35,
                hemiSky: new THREE.Color('#1e293b'),
                hemiGround: new THREE.Color('#020617'),
                hemiIntensity: 0.6,
                skyTop: new THREE.Color('#020617'),
                skyHorizon: new THREE.Color('#0f172a'),
                skyGround: new THREE.Color('#020617'),
                waterDeep: new THREE.Color('#020b18'),
                waterSurface: new THREE.Color('#03284c')
            }
        ]

        // Current interpolated values
        this.currentSunColor = new THREE.Color()
        this.currentFillColor = new THREE.Color()
        this.currentHemiSky = new THREE.Color()
        this.currentHemiGround = new THREE.Color()
        this.currentSkyTop = new THREE.Color()
        this.currentSkyHorizon = new THREE.Color()
        this.currentSkyGround = new THREE.Color()
        this.currentWaterDeep = new THREE.Color()
        this.currentWaterSurface = new THREE.Color()

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    update(delta = 0.016)
    {
        if(!this.isPaused)
        {
            this.timeOfDay = (this.timeOfDay + (delta / this.cycleDuration)) % 1.0
        }

        // 1. Calculate Sun Trajectory across 360 degree sky dome
        const sunAngle = this.timeOfDay * Math.PI * 2 - Math.PI * 0.5
        const sunX = Math.cos(sunAngle) * this.sunOrbitRadius
        const sunY = Math.sin(sunAngle) * this.sunHeight
        const sunZ = Math.sin(sunAngle * 0.5) * 60.0 + 30.0

        // Moon is 180 degrees opposite to Sun
        const isDaytime = sunY > -10.0
        const activeSunX = isDaytime ? sunX : -sunX
        const activeSunY = isDaytime ? Math.max(sunY, 15.0) : Math.max(-sunY, 20.0)
        const activeSunZ = isDaytime ? sunZ : -sunZ

        // 2. Interpolate Keyframe Presets based on Time of Day
        let prevFrame = this.keyframes[this.keyframes.length - 1]
        let nextFrame = this.keyframes[0]

        for(let i = 0; i < this.keyframes.length; i++)
        {
            if(this.timeOfDay >= this.keyframes[i].time)
            {
                prevFrame = this.keyframes[i]
                nextFrame = this.keyframes[(i + 1) % this.keyframes.length]
            }
        }

        let span = nextFrame.time - prevFrame.time
        if(span < 0) span += 1.0
        let progress = (this.timeOfDay - prevFrame.time)
        if(progress < 0) progress += 1.0
        const factor = THREE.MathUtils.smoothstep(progress / (span || 1.0), 0.0, 1.0)

        // Interpolate colors and intensities
        this.currentSunColor.lerpColors(prevFrame.sunColor, nextFrame.sunColor, factor)
        this.currentFillColor.lerpColors(prevFrame.fillColor, nextFrame.fillColor, factor)
        this.currentHemiSky.lerpColors(prevFrame.hemiSky, nextFrame.hemiSky, factor)
        this.currentHemiGround.lerpColors(prevFrame.hemiGround, nextFrame.hemiGround, factor)
        this.currentSkyTop.lerpColors(prevFrame.skyTop, nextFrame.skyTop, factor)
        this.currentSkyHorizon.lerpColors(prevFrame.skyHorizon, nextFrame.skyHorizon, factor)
        this.currentSkyGround.lerpColors(prevFrame.skyGround, nextFrame.skyGround, factor)
        this.currentWaterDeep.lerpColors(prevFrame.waterDeep, nextFrame.waterDeep, factor)
        this.currentWaterSurface.lerpColors(prevFrame.waterSurface, nextFrame.waterSurface, factor)

        const currentSunIntensity = THREE.MathUtils.lerp(prevFrame.sunIntensity, nextFrame.sunIntensity, factor)
        const currentFillIntensity = THREE.MathUtils.lerp(prevFrame.fillIntensity, nextFrame.fillIntensity, factor)
        const currentHemiIntensity = THREE.MathUtils.lerp(prevFrame.hemiIntensity, nextFrame.hemiIntensity, factor)

        // 3. Apply to Lighting
        const lighting = this.game.world?.lighting
        if(lighting)
        {
            if(lighting.sunLight)
            {
                lighting.sunLight.position.set(activeSunX, activeSunY, activeSunZ)
                lighting.sunLight.color.copy(this.currentSunColor)
                lighting.sunLight.intensity = currentSunIntensity
            }

            if(lighting.fillLight)
            {
                lighting.fillLight.position.set(-activeSunX * 0.7, Math.max(activeSunY * 0.5, 20.0), -activeSunZ * 0.7)
                lighting.fillLight.color.copy(this.currentFillColor)
                lighting.fillLight.intensity = currentFillIntensity
            }

            if(lighting.hemisphereLight)
            {
                lighting.hemisphereLight.color.copy(this.currentHemiSky)
                lighting.hemisphereLight.groundColor.copy(this.currentHemiGround)
                lighting.hemisphereLight.intensity = currentHemiIntensity
            }
        }

        // 4. Apply to Sky Dome
        const sky = this.game.world?.sky
        if(sky)
        {
            if(sky.topColorUniform) sky.topColorUniform.value.copy(this.currentSkyTop)
            if(sky.horizonColorUniform) sky.horizonColorUniform.value.copy(this.currentSkyHorizon)
            if(sky.groundColorUniform) sky.groundColorUniform.value.copy(this.currentSkyGround)
        }

        // 5. Apply to Lake Water Depth Colors
        const lake = this.game.world?.lake
        if(lake)
        {
            if(lake.deepColor) lake.deepColor.value.copy(this.currentWaterDeep)
            if(lake.surfaceColor) lake.surfaceColor.value.copy(this.currentWaterSurface)
        }
    }
}
