import { Events } from './Events.js'

/**
 * Game loop ticker — drives the update cycle via requestAnimationFrame.
 * Listeners register with a priority (lower = earlier in the frame).
 */
export class Ticker
{
    constructor()
    {
        this.events = new Events()
        this.delta = 1 / 60
        this.deltaScaled = 1
        this.elapsed = 0
        this.running = false
    }

    start()
    {
        if(this.running) return

        this.running = true
        this.previousTime = performance.now()
        this.tick()
    }

    stop()
    {
        this.running = false
    }

    tick()
    {
        if(!this.running) return

        const currentTime = performance.now()
        this.delta = Math.min((currentTime - this.previousTime) / 1000, 0.1) // Cap at 100ms
        this.deltaScaled = this.delta * 60 // Normalized to 60fps
        this.elapsed += this.delta
        this.previousTime = currentTime

        this.events.trigger('tick', [this.delta, this.elapsed])

        requestAnimationFrame(() => this.tick())
    }

    /**
     * Wait for a number of seconds, then call the callback.
     */
    wait(seconds, callback)
    {
        const target = this.elapsed + seconds
        const check = () =>
        {
            if(this.elapsed >= target)
            {
                callback()
                this.events.off('tick', check)
            }
        }
        this.events.on('tick', check)
    }
}
