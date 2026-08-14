import { Events } from '../Events.js'
import { Keyboard } from './Keyboard.js'
import { TouchControls } from './TouchControls.js'

/**
 * Inputs — aggregates all input sources (keyboard, pointer, virtual touch joystick).
 */
export class Inputs
{
    constructor()
    {
        this.events = new Events()
        this.keyboard = new Keyboard()
        this.touch = new TouchControls()

        // Forward keyboard events
        this.keyboard.events.on('interact', () => this.events.trigger('interact'))
        this.keyboard.events.on('reset', () => this.events.trigger('reset'))
        this.keyboard.events.on('escape', () => this.events.trigger('escape'))

        // Forward touch events
        this.touch.events.on('interact', () => this.events.trigger('interact'))
        this.touch.events.on('reset', () => this.events.trigger('reset'))
        this.touch.events.on('escape', () => this.events.trigger('escape'))

        // Track first move for controls overlay
        this.hasMoved = false
        const onFirstMove = () =>
        {
            if(!this.hasMoved)
            {
                this.hasMoved = true
                this.events.trigger('firstMove')
            }
        }

        this.keyboard.events.on('firstMove', onFirstMove)
        this.touch.events.on('firstMove', onFirstMove)
    }

    /**
     * Returns combined normalized input axes from keyboard and virtual joystick.
     */
    getAxes()
    {
        let forward = 0
        let right = 0
        let boost = false

        // Keyboard axes
        if(this.keyboard.keys.forward) forward += 1
        if(this.keyboard.keys.backward) forward -= 1
        if(this.keyboard.keys.left) right -= 1
        if(this.keyboard.keys.right) right += 1
        if(this.keyboard.keys.boost) boost = true

        // Touch joystick axes (analog blend)
        if(Math.abs(this.touch.axes.forward) > 0.05)
        {
            forward = this.touch.axes.forward
        }
        if(Math.abs(this.touch.axes.right) > 0.05)
        {
            right = this.touch.axes.right
        }
        if(this.touch.axes.boost)
        {
            boost = true
        }

        return { forward, right, boost }
    }
}
