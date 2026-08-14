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
        const eduHtml = aboutData.education.map(e => `
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 0.65rem;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.4rem;">
                    <div style="font-weight: 600; color: #ffffff; font-size: 0.95rem;">${e.institution}</div>
                    <div style="font-size: 0.8rem; color: #93c5fd; font-weight: 500;">${e.grade}</div>
                </div>
                <div style="font-size: 0.85rem; color: #a5b4fc; margin-top: 0.2rem;">${e.degree}</div>
                <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.15rem;">${e.duration}</div>
            </div>
        `).join('')

        const skillsHtml = aboutData.technicalFocus.map(s => `
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #e2e8f0; margin-bottom: 0.45rem;">
                <span style="color: #60a5fa; font-size: 0.9rem;">▹</span>
                <span>${s}</span>
            </div>
        `).join('')

        const interestsHtml = aboutData.interests.map(item => `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 10px; padding: 0.75rem; display: flex; gap: 0.65rem; align-items: flex-start;">
                <span style="font-size: 1.35rem; line-height: 1;">${item.icon}</span>
                <div>
                    <div style="font-weight: 600; font-size: 0.85rem; color: #f1f5f9; margin-bottom: 0.2rem;">${item.title}</div>
                    <div style="font-size: 0.78rem; color: rgba(255, 255, 255, 0.6); line-height: 1.35;">${item.desc}</div>
                </div>
            </div>
        `).join('')

        const content = `
            <div style="font-family: 'Space Grotesk', sans-serif; color: #e2e8f0;">
                <!-- Header Profile -->
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #ffffff; flex-shrink: 0; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);">
                        KC
                    </div>
                    <div>
                        <h2 style="font-size: 1.55rem; font-weight: 700; color: #ffffff; line-height: 1.15; margin: 0;">
                            ${aboutData.name}
                        </h2>
                        <div style="font-size: 0.9rem; color: #60a5fa; font-weight: 500; margin-top: 0.25rem;">
                            ${aboutData.role}
                        </div>
                        <div style="font-size: 0.78rem; color: rgba(255, 255, 255, 0.45); margin-top: 0.15rem;">
                            📍 ${aboutData.location} • ✉️ <a href="mailto:${aboutData.email}" style="color: #93c5fd; text-decoration: none;">${aboutData.email}</a>
                        </div>
                    </div>
                </div>

                <!-- Story & Background -->
                <div style="margin-bottom: 1.25rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 0.4rem;">
                        Story & Background
                    </div>
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.88rem; line-height: 1.6; color: rgba(255, 255, 255, 0.82); margin: 0;">
                        ${aboutData.story}
                    </p>
                </div>

                <!-- Academic Background -->
                <div style="margin-bottom: 1.25rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 0.4rem;">
                        🎓 Education
                    </div>
                    ${eduHtml}
                </div>

                <!-- Core Technical Areas -->
                <div style="margin-bottom: 1.25rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 0.4rem;">
                        ⚡ Technical Focus
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 0.85rem 1rem;">
                        ${skillsHtml}
                    </div>
                </div>

                <!-- Interests & Passions -->
                <div style="margin-bottom: 1.25rem;">
                    <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; margin-bottom: 0.5rem;">
                        ✨ Beyond The Code / Passions
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.55rem;">
                        ${interestsHtml}
                    </div>
                </div>

                <!-- Links & Footer -->
                <div style="display: flex; gap: 0.65rem; padding-top: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap;">
                    <a href="${aboutData.github}" target="_blank" rel="noopener noreferrer" style="flex: 1; min-width: 120px; text-align: center; padding: 0.6rem 0.8rem; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 8px; color: #93c5fd; text-decoration: none; font-size: 0.82rem; font-weight: 600;">
                        GitHub Profile ↗
                    </a>
                    <a href="${aboutData.linkedin}" target="_blank" rel="noopener noreferrer" style="flex: 1; min-width: 120px; text-align: center; padding: 0.6rem 0.8rem; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 8px; color: #c4b5fd; text-decoration: none; font-size: 0.82rem; font-weight: 600;">
                        LinkedIn Profile ↗
                    </a>
                </div>
            </div>
        `

        this.game.modals.open(content)
    }
}
