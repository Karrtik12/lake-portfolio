import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import socialLinks from '../../data/social.js'

/**
 * SocialsIsland — places interactive markers for social channels around Socials Island.
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
        const radius = 8.5
        const count = socialLinks.length

        for(let i = 0; i < count; i++)
        {
            const item = socialLinks[i]
            // Spread in a semicircle facing the lake center
            const angle = (i / (count - 1 || 1)) * Math.PI * 0.7 - Math.PI * 0.1
            const pos = new THREE.Vector3(
                this.center.x + Math.cos(angle) * radius,
                0.8,
                this.center.z + Math.sin(angle) * radius
            )

            this.game.interactivePoints.create(
                pos,
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
