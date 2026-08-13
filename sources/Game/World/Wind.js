import { Game } from '../Game.js'

/**
 * Wind — provides global time and breeze vectors for water and foliage animations.
 */
export class Wind
{
    constructor()
    {
        this.game = Game.getInstance()
        this.speed = 0.8
        this.strength = 0.4
        this.direction = { x: 0.707, z: 0.707 } // 45 degree breeze
        this.time = 0

        this.game.ticker.events.on('tick', (delta) =>
        {
            this.time += delta * this.speed
        })
    }
}
