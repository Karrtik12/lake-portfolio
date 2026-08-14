import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from './Game.js'
import { lerp } from './utilities/maths.js'

/**
 * View — camera system. Starts with a static overview, later switches to boat follow mode.
 */
export class View
{
    static MODE_OVERVIEW = 1
    static MODE_FOLLOW = 2
    static MODE_CINEMATIC = 3

    constructor()
    {
        this.game = Game.getInstance()
        this.mode = View.MODE_OVERVIEW

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.game.viewport.ratio,
            0.1,
            800
        )

        // Default overview position — looking down at the lake
        this.camera.position.set(0, 55, 75)
        this.camera.lookAt(0, 0, 0)

        // Follow camera configuration
        this.followOffset = new THREE.Vector3(0, 7.5, 14)
        this.lookAtTarget = new THREE.Vector3()
        this.currentPosition = new THREE.Vector3().copy(this.camera.position)
        this.currentLookAt = new THREE.Vector3()

        // Cinematic focus target
        this.cinematicPosition = new THREE.Vector3()
        this.cinematicLookAt = new THREE.Vector3()

        // Resize
        this.game.viewport.events.on('resize', () =>
        {
            this.camera.aspect = this.game.viewport.ratio
            // Adaptive FOV for narrow mobile screens
            if(this.game.viewport.ratio < 1.0)
            {
                this.camera.fov = 45 / Math.max(0.65, this.game.viewport.ratio)
            }
            else
            {
                this.camera.fov = 45
            }
            this.camera.updateProjectionMatrix()
        })

        // Update
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    setMode(mode)
    {
        this.mode = mode
    }

    setCinematic(targetPos, targetLookAt, duration = 1.0)
    {
        this.mode = View.MODE_CINEMATIC
        this.cinematicPosition.copy(targetPos)
        this.cinematicLookAt.copy(targetLookAt)

        gsap.killTweensOf([this.currentPosition, this.currentLookAt])
        gsap.to(this.currentPosition, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration,
            ease: 'power2.inOut'
        })
        gsap.to(this.currentLookAt, {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z,
            duration,
            ease: 'power2.inOut'
        })
    }

    exitCinematic()
    {
        if(this.mode !== View.MODE_CINEMATIC) return

        this.mode = View.MODE_FOLLOW
        gsap.killTweensOf([this.currentPosition, this.currentLookAt])
    }

    update()
    {
        if(this.mode === View.MODE_FOLLOW && this.game.boat)
        {
            const boat = this.game.boat
            const delta = this.game.ticker.delta

            // Behind vector (opposite of forward heading)
            const behindDir = new THREE.Vector3(
                Math.sin(boat.rotation),
                0,
                Math.cos(boat.rotation)
            )

            // Dynamic follow distance increases slightly at higher speeds
            const speedRatio = Math.min(Math.abs(boat.speed) / 16.0, 1.0)
            const currentDistance = this.followOffset.z + speedRatio * 3.0
            const currentHeight = this.followOffset.y + speedRatio * 0.8

            const desiredPosition = new THREE.Vector3(
                boat.position.x + behindDir.x * currentDistance,
                boat.position.y + currentHeight,
                boat.position.z + behindDir.z * currentDistance
            )

            // Smooth camera follow interpolation
            const followSpeed = 4.5
            this.currentPosition.x = lerp(this.currentPosition.x, desiredPosition.x, followSpeed * delta)
            this.currentPosition.y = lerp(this.currentPosition.y, desiredPosition.y, followSpeed * delta)
            this.currentPosition.z = lerp(this.currentPosition.z, desiredPosition.z, followSpeed * delta)

            this.camera.position.copy(this.currentPosition)

            // Forward vector for look-ahead
            const forwardDir = new THREE.Vector3(
                -Math.sin(boat.rotation),
                0,
                -Math.cos(boat.rotation)
            )

            // Look slightly ahead of the boat for better visibility while navigating
            this.lookAtTarget.set(
                boat.position.x + forwardDir.x * 4.0,
                boat.position.y + 1.2,
                boat.position.z + forwardDir.z * 4.0
            )

            this.currentLookAt.lerp(this.lookAtTarget, followSpeed * delta)
            this.camera.lookAt(this.currentLookAt)
        }
        else if(this.mode === View.MODE_CINEMATIC)
        {
            this.camera.position.copy(this.currentPosition)
            this.camera.lookAt(this.currentLookAt)
        }
    }
}
