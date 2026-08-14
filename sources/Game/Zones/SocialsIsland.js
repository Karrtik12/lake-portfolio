import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import socialLinks from '../../data/social.js'

/**
 * SocialsIsland — places interactive markers for all channels around Socials Island,
 * with wide, spacious separation between each pier across the lake-facing shoreline.
 */
export class SocialsIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.center = new THREE.Vector3(-58, 0, -38)

        this.setupSocialLinks()
    }

    setupSocialLinks()
    {
        const count = socialLinks.length

        // Fan out symmetrically across the southern and eastern coastline facing the lake
        // baseAngle = 0.60 rad (southeast), spread = 2.15 rad (123 degrees)
        // Yields ~13.5 meters of open water distance between adjacent pier heads!
        const baseAngle = 0.60
        const spread = 2.15

        for(let i = 0; i < count; i++)
        {
            const item = socialLinks[i]
            const angle = baseAngle + ((i - (count - 1) * 0.5) / ((count - 1) * 0.5 || 1)) * (spread * 0.5)

            const dirX = Math.cos(angle)
            const dirZ = Math.sin(angle)

            // Start of pier on dry beach sand
            const startPos = new THREE.Vector3(
                this.center.x + dirX * 14.5,
                0.68,
                this.center.z + dirZ * 14.5
            )

            // End of pier extending straight into deep water
            const endPos = new THREE.Vector3(
                this.center.x + dirX * 24.5,
                0.68,
                this.center.z + dirZ * 24.5
            )

            // Create pier spanning from beach to deep water
            if(this.game.world?.props?.createPierBetween)
            {
                this.game.world.props.createPierBetween(startPos, endPos, 2.8)
            }

            // Place diamond marker hovering right over the deep-water pier head
            const markerPos = new THREE.Vector3(
                endPos.x,
                1.0,
                endPos.z
            )

            this.game.interactivePoints.create(
                markerPos,
                item.name,
                () =>
                {
                    if(item.url)
                    {
                        window.open(item.url, '_blank', 'noopener,noreferrer')
                    }
                }
            )
        }
    }
}
