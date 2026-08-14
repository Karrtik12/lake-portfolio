import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import socialLinks from '../../data/social.js'

/**
 * SocialsIsland — places interactive markers for social channels around Socials Island,
 * each with its own wooden landing pier extending into the water with solid physics.
 */
export class SocialsIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.center = new THREE.Vector3(-36, 0, -22)

        this.setupSocialLinks()
    }

    setupSocialLinks()
    {
        const count = socialLinks.length
        const pierRadius = 8.5
        const markerRadius = 12.5

        for(let i = 0; i < count; i++)
        {
            const item = socialLinks[i]
            // Fan out in a semicircle facing the lake center
            const angle = (i / (count - 1 || 1)) * Math.PI * 0.65 - Math.PI * 0.08

            const dirX = Math.cos(angle)
            const dirZ = Math.sin(angle)

            // Pier center position (spanning from island shore to deep water)
            const pierPos = new THREE.Vector3(
                this.center.x + dirX * pierRadius,
                0,
                this.center.z + dirZ * pierRadius
            )

            // Pier orientation: local +Z points outwards towards water
            const pierAngle = Math.atan2(dirX, dirZ)

            // Create individual landing pier with colliders
            if(this.game.world?.props?.createShortPier)
            {
                this.game.world.props.createShortPier(pierPos, pierAngle, 10, 2.8)
            }

            // Place diamond marker hovering right over the pier head
            const markerPos = new THREE.Vector3(
                this.center.x + dirX * markerRadius,
                0.8,
                this.center.z + dirZ * markerRadius
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
