import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import aboutData from '../../data/about.js'

/**
 * AboutIsland — displays personal biography and story in natural, conversational prose,
 * situated on the expanded About Island with its own wooden landing pier.
 */
export class AboutIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.center = new THREE.Vector3(-52, 0, 44)

        this.setupInteractiveMarker()
    }

    setupInteractiveMarker()
    {
        // Direction from island center towards lake center
        const dirX = 0.78
        const dirZ = -0.62
        const pierAngle = Math.atan2(dirX, dirZ)

        // Pier center position (spanning from island shore to deep water)
        const pierPos = new THREE.Vector3(
            this.center.x + dirX * 14.0,
            0,
            this.center.z + dirZ * 14.0
        )

        // Create landing pier with colliders
        if(this.game.world?.props?.createShortPier)
        {
            this.game.world.props.createShortPier(pierPos, pierAngle, 10, 3.0)
        }

        // Diamond marker at the pier head in water
        const markerPos = new THREE.Vector3(
            this.center.x + dirX * 19.0,
            0.8,
            this.center.z + dirZ * 19.0
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
        const paragraphsHtml = aboutData.paragraphs.map(p => `
            <p style="font-family: 'Inter', sans-serif; font-size: 0.93rem; line-height: 1.75; color: rgba(226, 232, 240, 0.9); margin: 0 0 1.25rem 0;">
                ${p}
            </p>
        `).join('')

        const content = `
            <div style="font-family: 'Space Grotesk', sans-serif; color: #e2e8f0;">
                <!-- Header Greeting -->
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.15rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="width: 54px; height: 54px; border-radius: 16px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.45rem; font-weight: 700; color: #ffffff; flex-shrink: 0; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);">
                        KC
                    </div>
                    <div>
                        <h2 style="font-size: 1.55rem; font-weight: 700; color: #ffffff; line-height: 1.2; margin: 0;">
                            ${aboutData.name}
                        </h2>
                        <div style="font-size: 0.85rem; color: #60a5fa; font-weight: 500; margin-top: 0.2rem;">
                            ${aboutData.subtitle}
                        </div>
                    </div>
                </div>

                <!-- Conversational Story Paragraphs -->
                <div style="padding: 0 0.1rem;">
                    ${paragraphsHtml}
                </div>
            </div>
        `

        this.game.modals.open(content)
    }
}
