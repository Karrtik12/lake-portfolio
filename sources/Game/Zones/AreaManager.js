import { Game } from '../Game.js'
import { SocialsIsland } from './SocialsIsland.js'
import { LabIsland } from './LabIsland.js'
import { AboutIsland } from './AboutIsland.js'

/**
 * AreaManager — instantiates and manages all interactive island areas.
 */
export class AreaManager
{
    constructor()
    {
        this.game = Game.getInstance()

        this.socials = new SocialsIsland()
        this.lab = new LabIsland()
        this.about = new AboutIsland()
    }
}
