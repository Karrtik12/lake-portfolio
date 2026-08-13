/**
 * Simple event emitter used throughout the game.
 */
export class Events
{
    constructor()
    {
        this.listeners = new Map()
    }

    on(event, callback)
    {
        if(!this.listeners.has(event))
            this.listeners.set(event, [])

        this.listeners.get(event).push(callback)

        return this
    }

    off(event, callback)
    {
        if(!this.listeners.has(event))
            return this

        const callbacks = this.listeners.get(event)
        const index = callbacks.indexOf(callback)
        if(index !== -1)
            callbacks.splice(index, 1)

        return this
    }

    trigger(event, args = [])
    {
        if(!this.listeners.has(event))
            return this

        for(const callback of this.listeners.get(event))
            callback(...args)

        return this
    }
}
