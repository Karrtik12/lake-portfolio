import { Events } from '../Events.js'
import { Keyboard } from './Keyboard.js'

/**
 * Inputs — aggregates all input sources (keyboard, pointer, touch).
 */
export class Inputs
{
    constructor()
    {
        this.events = new Events()
        this.keyboard = new Keyboard()

        // Forward keyboard events
        this.keyboard.events.on('interact', () => this.events.trigger('interact'))
        this.keyboard.events.on('reset', () => this.events.trigger('reset'))
        this.keyboard.events.on('escape', () => this.events.trigger('escape'))

        // Track first move for controls overlay
        this.hasMoved = false
        this.keyboard.events.on('firstMove', () =>
        {
            if(!this.hasMoved)
            {
                this.hasMoved = true
                this.events.trigger('firstMove')
            }
        })
    }

    /**
     * Returns normalized input axes.
     */
    getAxes()
    {
        let forward = 0
        let right = 0

        if(this.keyboard.keys.forward) forward += 1
        if(this.keyboard.keys.backward) forward -= 1
        if(this.keyboard.keys.left) right -= 1
        if(this.keyboard.keys.right) right += 1

        return { forward, right }
    }
}
