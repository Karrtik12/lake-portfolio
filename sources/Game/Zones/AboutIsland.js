import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import aboutData from '../../data/about.js'

/**
 * AboutIsland — displays personal biography and story in natural, conversational prose,
 * situated on the expanded About Island with a wooden landing pier extending from dry beach into deep water.
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
        // Direction from island center towards lake center (0, 0)
        // dx = +52, dz = -44 -> normalized vector ~ (0.763, -0.646)
        const dirX = 0.763
        const dirZ = -0.646

        // Start on dry beach sand
        const startPos = new THREE.Vector3(
            this.center.x + dirX * 14.0,
            0.68,
            this.center.z + dirZ * 14.0
        )

        // End in deep water
        const endPos = new THREE.Vector3(
            this.center.x + dirX * 24.5,
            0.68,
            this.center.z + dirZ * 24.5
        )

        // Create landing pier with colliders
        if(this.game.world?.props?.createPierBetween)
        {
            this.game.world.props.createPierBetween(startPos, endPos, 3.0)
        }

        // Diamond marker hovering right over the pier head in deep water
        const markerPos = new THREE.Vector3(
            endPos.x,
            1.0,
            endPos.z
        )

        this.game.interactivePoints.create(
            markerPos,
            'About Me',
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
