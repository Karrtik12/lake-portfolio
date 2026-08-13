import { Events } from './Events.js'

/**
 * Viewport — tracks the window size and pixel ratio.
 */
export class Viewport
{
    constructor(domElement)
    {
        this.domElement = domElement
        this.events = new Events()

        this.width = window.innerWidth
        this.height = window.innerHeight
        this.ratio = this.width / this.height
        this.pixelRatio = Math.min(window.devicePixelRatio, 2)

        window.addEventListener('resize', () =>
        {
            this.width = window.innerWidth
            this.height = window.innerHeight
            this.ratio = this.width / this.height
            this.pixelRatio = Math.min(window.devicePixelRatio, 2)

            this.events.trigger('resize')
        })
    }
}
