import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import aboutData from '../../data/about.js'

/**
 * AboutIsland — displays personal biography, storytelling narrative, and journey,
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
        const chaptersHtml = aboutData.chapters.map(c => `
            <div style="margin-bottom: 1.4rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.45rem;">
                    <span style="font-size: 0.72rem; font-weight: 600; color: #93c5fd; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.2rem 0.55rem; border-radius: 6px; letter-spacing: 0.04em;">
                        ${c.badge}
                    </span>
                    <h3 style="font-size: 1.05rem; font-weight: 700; color: #ffffff; margin: 0;">
                        ${c.title}
                    </h3>
                </div>
                <p style="font-family: 'Inter', sans-serif; font-size: 0.9rem; line-height: 1.7; color: rgba(226, 232, 240, 0.88); margin: 0;">
                    ${c.text}
                </p>
            </div>
        `).join('')

        const content = `
            <div style="font-family: 'Space Grotesk', sans-serif; color: #e2e8f0;">
                <!-- Header Greeting -->
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.15rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #ffffff; flex-shrink: 0; box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);">
                        KC
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: #60a5fa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
                            Hello & Welcome 👋
                        </div>
                        <h2 style="font-size: 1.6rem; font-weight: 700; color: #ffffff; line-height: 1.2; margin: 0.1rem 0;">
                            ${aboutData.name}
                        </h2>
                        <div style="font-size: 0.82rem; color: rgba(255, 255, 255, 0.55);">
                            ${aboutData.tagline}
                        </div>
                    </div>
                </div>

                <!-- Story Narrative Chapters -->
                <div style="padding-right: 0.25rem;">
                    ${chaptersHtml}
                </div>

                <!-- Closing Note & Links -->
                <div style="margin-top: 1.5rem; padding: 1.1rem; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08)); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;">
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.88rem; line-height: 1.6; color: #f1f5f9; margin: 0 0 0.85rem 0;">
                        ${aboutData.closing}
                    </p>
                    <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                        <a href="mailto:${aboutData.email}" style="padding: 0.5rem 0.85rem; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px; color: #ffffff; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
                            ✉️ Email Me
                        </a>
                        <a href="${aboutData.github}" target="_blank" rel="noopener noreferrer" style="padding: 0.5rem 0.85rem; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 8px; color: #93c5fd; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
                            🐙 GitHub
                        </a>
                        <a href="${aboutData.linkedin}" target="_blank" rel="noopener noreferrer" style="padding: 0.5rem 0.85rem; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 8px; color: #c4b5fd; text-decoration: none; font-size: 0.8rem; font-weight: 500;">
                            💼 LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        `

        this.game.modals.open(content)
    }
}
