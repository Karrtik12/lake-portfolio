import { Game } from './Game.js'

/**
 * Quality — toggles graphic presets (pixel ratio, shadow mapping) for performance tuning.
 */
export class Quality
{
    constructor()
    {
        this.game = Game.getInstance()
        this.isHigh = true

        this.setupButton()
    }

    toggle()
    {
        this.isHigh = !this.isHigh

        const pixelRatio = this.isHigh ? Math.min(window.devicePixelRatio, 2) : 1.0
        if(this.game.rendering?.renderer)
        {
            this.game.rendering.renderer.setPixelRatio(pixelRatio)
        }

        if(this.game.world?.lighting?.sunLight)
        {
            this.game.world.lighting.sunLight.castShadow = this.isHigh
        }

        this.updateButton()
    }

    setupButton()
    {
        const btn = document.querySelector('.js-quality-toggle')
        if(btn)
        {
            btn.addEventListener('click', () => this.toggle())
            this.updateButton()
        }
    }

    updateButton()
    {
        const btn = document.querySelector('.js-quality-toggle')
        if(btn)
        {
            btn.textContent = this.isHigh ? '✨ Quality: High' : '⚡ Quality: Performance'
        }
    }
}
