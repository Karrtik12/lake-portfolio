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

/**
 * World — orchestrates and initializes all environment and terrain elements.
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
    }
}
