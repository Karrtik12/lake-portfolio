import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

/**
 * Rendering — sets up the WebGPU renderer (with WebGL fallback), handles resize and render loop.
 */
export class Rendering
{
    constructor()
    {
        this.game = Game.getInstance()
        this.renderer = null
    }

    async setRenderer()
    {
        const canvas = this.game.canvasElement

        this.renderer = new THREE.WebGPURenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        })

        await this.renderer.init()

        this.renderer.setPixelRatio(this.game.viewport.pixelRatio)
        this.renderer.setSize(this.game.viewport.width, this.game.viewport.height)
        this.renderer.setClearColor(0x0a0e17, 1)
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1.0

        // Resize handler
        this.game.viewport.events.on('resize', () =>
        {
            this.renderer.setPixelRatio(this.game.viewport.pixelRatio)
            this.renderer.setSize(this.game.viewport.width, this.game.viewport.height)
        })
    }

    start()
    {
        this.game.ticker.events.on('tick', () =>
        {
            this.render()
        })

        this.game.ticker.start()
    }

    render()
    {
        if(!this.renderer || !this.game.view?.camera)
            return

        this.renderer.render(this.game.scene, this.game.view.camera)
    }
}
