import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import aboutData from '../../data/about.js'

/**
 * AboutIsland — displays personal biography, role, and background information,
 * with its own dedicated wooden landing pier equipped with solid physics.
 */
export class AboutIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.center = new THREE.Vector3(-30, 0, 24)

        this.setupInteractiveMarker()
    }

    setupInteractiveMarker()
    {
        // Direction from island center towards lake
        const dirX = 0.8
        const dirZ = -0.6
        const pierAngle = Math.atan2(dirX, dirZ)

        // Pier center position (spanning from island shore to deep water)
        const pierPos = new THREE.Vector3(
            this.center.x + dirX * 8.5,
            0,
            this.center.z + dirZ * 8.5
        )

        // Create landing pier with colliders
        if(this.game.world?.props?.createShortPier)
        {
            this.game.world.props.createShortPier(pierPos, pierAngle, 10, 2.8)
        }

        // Diamond marker at the pier head
        const markerPos = new THREE.Vector3(
            this.center.x + dirX * 12.5,
            0.8,
            this.center.z + dirZ * 12.5
        )

        this.game.interactivePoints.create(
            markerPos,
            '👤 About Me',
            () =>
            {
                this.openAboutModal()
            }
        )
    }

    openAboutModal()
    {
        const content = `
            <div style="font-family: 'Space Grotesk', sans-serif;">
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
                    Introduction
                </div>

                <h2 style="font-size: 1.8rem; font-weight: 700; color: #ffffff; margin-bottom: 0.25rem;">
                    ${aboutData.name}
                </h2>

                <div style="font-size: 1rem; color: #60a5fa; font-weight: 500; margin-bottom: 1.5rem;">
                    ${aboutData.role} • 📍 ${aboutData.location}
                </div>

                <p style="font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.7; color: rgba(255,255,255,0.8); margin-bottom: 1.5rem;">
                    ${aboutData.bio}
                </p>

                <div style="padding: 1rem; background: rgba(255,255,255,0.04); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.4rem;">
                        💡 Navigation Tip
                    </div>
                    <div style="font-family: 'Inter', sans-serif; font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.4;">
                        Sail across the lake to visit <strong>Lab Island</strong> for projects and <strong>Socials Island</strong> for contact channels.
                    </div>
                </div>
            </div>
        `

        this.game.modals.open(content)
    }
}
