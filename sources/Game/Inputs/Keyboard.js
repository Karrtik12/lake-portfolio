import { Events } from '../Events.js'

/**
 * Keyboard — captures WASD / Arrow key state.
 */
export class Keyboard
{
    constructor()
    {
        this.events = new Events()
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            interact: false,
            reset: false
        }

        window.addEventListener('keydown', (e) => this.onKey(e, true))
        window.addEventListener('keyup', (e) => this.onKey(e, false))
    }

    onKey(event, pressed)
    {
        switch(event.code)
        {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = pressed
                break
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = pressed
                break
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = pressed
                break
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = pressed
                break
            case 'Enter':
            case 'Space':
                if(pressed) this.events.trigger('interact')
                this.keys.interact = pressed
                break
            case 'KeyR':
                if(pressed) this.events.trigger('reset')
                this.keys.reset = pressed
                break
            case 'Escape':
                if(pressed) this.events.trigger('escape')
                break
        }

        // Notify that any key was pressed (for controls overlay dismiss)
        if(pressed && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right))
        {
            this.events.trigger('firstMove')
        }
    }
}
