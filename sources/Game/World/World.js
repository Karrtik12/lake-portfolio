import { Game } from '../Game.js'
import { Wind } from './Wind.js'
import { Fog } from './Fog.js'
import { Sky } from './Sky.js'
import { Lighting } from './Lighting.js'
import { Lake } from './Lake.js'
import { Shoreline } from './Shoreline.js'
import { Islands } from './Islands.js'
import { Trees } from './Trees.js'
import { Props } from './Props.js'
import { BoatVisual } from './BoatVisual.js'
import { Wake } from './Wake.js'
import { BoostEffect } from './BoostEffect.js'

/**
 * World — orchestrates and initializes all environment, boat visual, and terrain elements.
 */
export class World
{
    constructor()
    {
        this.game = Game.getInstance()

        this.wind = new Wind()
        this.game.wind = this.wind

        this.fog = new Fog()
        this.sky = new Sky()
        this.lighting = new Lighting()
        this.lake = new Lake()
        this.shoreline = new Shoreline()
        this.islands = new Islands()
        this.trees = new Trees()
        this.props = new Props()
        this.wake = new Wake()
        this.boatVisual = new BoatVisual()
        this.boostEffect = new BoostEffect()
    }
}
