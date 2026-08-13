import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import projectsData from '../../data/projects.js'

/**
 * LabIsland — displays text-based project cards with blurb, tech stack, and links.
 */
export class LabIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.center = new THREE.Vector3(36, 0, -20)
        this.currentIndex = 0

        this.setupInteractiveBillboard()
    }

    setupInteractiveBillboard()
    {
        // Interactive point positioned in front of the Lab billboard
        const markerPos = new THREE.Vector3(32, 0.8, -17)

        this.game.interactivePoints.create(
            markerPos,
            '🔬 Open Lab Projects',
            () =>
            {
                this.openProjectsModal()
            }
        )
    }

    openProjectsModal()
    {
        const renderProject = () =>
        {
            const p = projectsData[this.currentIndex]
            const total = projectsData.length

            const stackBadges = (p.stack || [])
                .map(tech => `
                    <span style="
                        display: inline-block;
                        padding: 0.3rem 0.75rem;
                        background: rgba(96, 165, 250, 0.15);
                        border: 1px solid rgba(96, 165, 250, 0.3);
                        color: #93c5fd;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 500;
                    ">${tech}</span>
                `)
                .join(' ')

            const linkButton = p.link ? `
                <a href="${p.link}" target="_blank" rel="noopener noreferrer" style="
                    display: inline-block;
                    margin-top: 1.5rem;
                    padding: 0.6rem 1.4rem;
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    color: #0a0e17;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.85rem;
                ">View Repository ↗</a>
            ` : ''

            return `
                <div style="font-family: 'Space Grotesk', sans-serif;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <span style="font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em;">
                            Lab Project [${this.currentIndex + 1} / ${total}]
                        </span>
                    </div>

                    <h2 style="font-size: 1.6rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem;">
                        ${p.title}
                    </h2>

                    <p style="font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.6; color: rgba(255,255,255,0.75); margin-bottom: 1.5rem;">
                        ${p.description}
                    </p>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem;">
                            Tech Stack
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${stackBadges}
                        </div>
                    </div>

                    ${linkButton}

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08);">
                        <button class="js-lab-prev" style="
                            padding: 0.5rem 1rem;
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            color: #ffffff;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">← Previous</button>

                        <button class="js-lab-next" style="
                            padding: 0.5rem 1rem;
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            color: #ffffff;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">Next →</button>
                    </div>
                </div>
            `
        }

        const updateModalView = () =>
        {
            this.game.modals.open(renderProject())

            // Bind navigation buttons
            const prevBtn = document.querySelector('.js-lab-prev')
            const nextBtn = document.querySelector('.js-lab-next')

            if(prevBtn)
            {
                prevBtn.addEventListener('click', () =>
                {
                    this.currentIndex = (this.currentIndex - 1 + projectsData.length) % projectsData.length
                    updateModalView()
                })
            }

            if(nextBtn)
            {
                nextBtn.addEventListener('click', () =>
                {
                    this.currentIndex = (this.currentIndex + 1) % projectsData.length
                    updateModalView()
                })
            }
        }

        updateModalView()
    }
}
