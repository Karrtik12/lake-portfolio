import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import socialLinks from '../../data/social.js'

/**
 * SocialsIsland — places interactive markers for all channels around Socials Island,
 * with individual wooden landing piers extending into deep water so the pier heads
 * always remain immersed in water across all wave cycles.
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
        const pierRadius = 17.5
        const markerRadius = 23.0

        for(let i = 0; i < count; i++)
        {
            const item = socialLinks[i]
            // Wide fan-out arc across southeastern shore facing lake center
            const angle = (i / (count - 1 || 1)) * Math.PI * 0.78 - Math.PI * 0.1

            const dirX = Math.cos(angle)
            const dirZ = Math.sin(angle)

            // Pier center position (spanning from dry beach into deep water)
            const pierPos = new THREE.Vector3(
                this.center.x + dirX * pierRadius,
                0,
                this.center.z + dirZ * pierRadius
            )

            // Pier orientation: local +Z points outwards towards deep water
            const pierAngle = Math.atan2(dirX, dirZ)

            // Create 13-plank landing pier with colliders
            if(this.game.world?.props?.createShortPier)
            {
                this.game.world.props.createShortPier(pierPos, pierAngle, 13, 2.8)
            }

            // Place diamond marker hovering right over the deep water pier head
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
