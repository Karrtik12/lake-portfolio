import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import { lerp } from './utilities/maths.js'

/**
 * View — camera system. Starts with a static overview, later switches to boat follow mode.
 */
export class View
{
    static MODE_OVERVIEW = 1
    static MODE_FOLLOW = 2

    constructor()
    {
        this.game = Game.getInstance()
        this.mode = View.MODE_OVERVIEW

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.game.viewport.ratio,
            0.1,
            500
        )

        // Default overview position — looking down at the lake
        this.camera.position.set(0, 40, 40)
        this.camera.lookAt(0, 0, 0)

        // Follow camera state
        this.followOffset = new THREE.Vector3(0, 12, 18)
        this.lookAtTarget = new THREE.Vector3()
        this.currentPosition = new THREE.Vector3().copy(this.camera.position)
        this.currentLookAt = new THREE.Vector3()

        // Resize
        this.game.viewport.events.on('resize', () =>
        {
            this.camera.aspect = this.game.viewport.ratio
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

    update()
    {
        if(this.mode === View.MODE_FOLLOW && this.game.boat)
        {
            const boat = this.game.boat
            const speed = this.game.ticker.deltaScaled

            // Calculate desired camera position behind the boat
            const behindDir = new THREE.Vector3(
                -Math.sin(boat.rotation),
                0,
                -Math.cos(boat.rotation)
            )

            const desiredPosition = new THREE.Vector3(
                boat.position.x + behindDir.x * this.followOffset.z,
                this.followOffset.y,
                boat.position.z + behindDir.z * this.followOffset.z
            )

            // Smooth follow
            const followSpeed = 3
            this.currentPosition.x = lerp(this.currentPosition.x, desiredPosition.x, followSpeed * this.game.ticker.delta)
            this.currentPosition.y = lerp(this.currentPosition.y, desiredPosition.y, followSpeed * this.game.ticker.delta)
            this.currentPosition.z = lerp(this.currentPosition.z, desiredPosition.z, followSpeed * this.game.ticker.delta)

            this.camera.position.copy(this.currentPosition)

            // Look at boat
            this.lookAtTarget.set(boat.position.x, boat.position.y + 1, boat.position.z)
            this.currentLookAt.lerp(this.lookAtTarget, followSpeed * this.game.ticker.delta)
            this.camera.lookAt(this.currentLookAt)
        }
    }
}
