import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from '../Game.js'
import projectsData from '../../data/projects.js'

/**
 * LabIsland — in-world 3D interactive project billboard with smooth cinematic camera focus
 * and direct 3D project pagination without popup modals.
 */
export class LabIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.position = new THREE.Vector3(36, 4.5, -20)
        this.currentIndex = 0
        this.isFocused = false

        // HUD elements
        this.focusBarEl = document.querySelector('.js-lab-focus-bar')
        this.prevBtn = document.querySelector('.js-lab-nav-prev')
        this.nextBtn = document.querySelector('.js-lab-nav-next')
        this.exitBtn = document.querySelector('.js-lab-exit-btn')

        this.createBillboard3D()
        this.setupKeyboardControls()
    }

    createBillboard3D()
    {
        this.group = new THREE.Group()
        this.group.position.copy(this.position)

        // 1. High-Resolution Display Canvas Texture
        this.canvas = document.createElement('canvas')
        this.canvas.width = 1024
        this.canvas.height = 640
        this.ctx = this.canvas.getContext('2d')

        this.displayTexture = new THREE.CanvasTexture(this.canvas)
        this.displayTexture.minFilter = THREE.LinearFilter
        this.displayTexture.magFilter = THREE.LinearFilter

        this.renderBillboardCanvas()

        // 2. Display Screen Mesh
        const screenGeo = new THREE.PlaneGeometry(8.8, 5.5)
        const screenMat = new THREE.MeshBasicNodeMaterial({
            map: this.displayTexture
        })
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat)
        this.screenMesh.position.set(0, 0, 0.22)
        this.group.add(this.screenMesh)

        // 3. Wooden / Metal Frame
        const frameGeo = new THREE.BoxGeometry(9.4, 6.0, 0.4)
        const frameMat = new THREE.MeshStandardNodeMaterial({
            color: '#1e293b',
            roughness: 0.6,
            metalness: 0.4,
            flatShading: true
        })
        const frame = new THREE.Mesh(frameGeo, frameMat)
        frame.castShadow = true
        this.group.add(frame)

        // 4. Heavy Wooden Support Beams
        const legGeo = new THREE.CylinderGeometry(0.3, 0.35, 6.5, 8)
        const woodMat = new THREE.MeshStandardNodeMaterial({ color: '#4a2f1b', roughness: 0.9 })

        const legL = new THREE.Mesh(legGeo, woodMat)
        legL.position.set(-3.8, -3.2, 0)
        legL.castShadow = true
        this.group.add(legL)

        const legR = new THREE.Mesh(legGeo, woodMat)
        legR.position.set(3.8, -3.2, 0)
        legR.castShadow = true
        this.group.add(legR)

        this.game.scene.add(this.group)

        // 5. Interactive Point Marker for approaching the Lab
        this.marker = this.game.interactivePoints.create(
            new THREE.Vector3(36, 0.8, -13),
            '🔬 View Lab Projects (Enter)',
            () =>
            {
                this.focus()
            }
        )

        // RayCursor click directly on billboard screen
        this.game.rayCursor.addIntersect({
            mesh: this.screenMesh,
            active: true,
            onClick: () => this.focus(),
            onEnter: () => {},
            onLeave: () => {}
        })
    }

    renderBillboardCanvas()
    {
        const ctx = this.ctx
        const p = projectsData[this.currentIndex]
        const total = projectsData.length

        // Background
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(0, 0, 1024, 640)

        // Tech grid pattern overlay
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)'
        ctx.lineWidth = 1
        for(let x = 0; x < 1024; x += 40)
        {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, 640)
            ctx.stroke()
        }
        for(let y = 0; y < 640; y += 40)
        {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(1024, y)
            ctx.stroke()
        }

        // Glowing outer border
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 6
        ctx.strokeRect(12, 12, 1000, 616)

        // Header bar: Project Counter + Lab Title
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'
        ctx.fillRect(24, 24, 976, 60)

        ctx.font = 'bold 22px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#38bdf8'
        ctx.textAlign = 'left'
        ctx.fillText('LAB // SYSTEMS & AI PROJECTS', 48, 62)

        ctx.textAlign = 'right'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText(`[ ${this.currentIndex + 1} OF ${total} ]`, 976, 62)

        // Project Title
        ctx.font = 'bold 44px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.fillText(p.title, 48, 160)

        // Project Description (Multi-line text wrapping)
        ctx.font = '24px "Inter", sans-serif'
        ctx.fillStyle = '#cbd5e1'
        this.wrapText(ctx, p.description, 48, 230, 928, 38)

        // Tech Stack Badges
        ctx.font = 'bold 18px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#64748b'
        ctx.fillText('TECHNOLOGIES & STACK', 48, 415)

        let badgeX = 48
        for(const tech of p.stack || [])
        {
            ctx.font = 'bold 20px "Space Grotesk", sans-serif'
            const textWidth = ctx.measureText(tech).width
            const badgeWidth = textWidth + 32

            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)'
            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(badgeX, 435, badgeWidth, 42, 10)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = '#e0f2fe'
            ctx.textAlign = 'center'
            ctx.fillText(tech, badgeX + badgeWidth * 0.5, 463)

            badgeX += badgeWidth + 16
        }

        // Navigation Footer Bar
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
        ctx.fillRect(24, 530, 976, 80)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'
        ctx.lineWidth = 2
        ctx.strokeRect(24, 530, 976, 80)

        ctx.font = 'bold 20px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#38bdf8'
        ctx.textAlign = 'left'
        ctx.fillText('◄ [A] PREV PROJECT', 48, 578)

        ctx.textAlign = 'center'
        ctx.fillStyle = '#f8fafc'
        ctx.fillText('PRESS [ESC] TO RETURN TO BOAT', 512, 578)

        ctx.textAlign = 'right'
        ctx.fillStyle = '#38bdf8'
        ctx.fillText('NEXT PROJECT [D] ►', 976, 578)

        this.displayTexture.needsUpdate = true
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight)
    {
        const words = text.split(' ')
        let line = ''

        for(let n = 0; n < words.length; n++)
        {
            const testLine = line + words[n] + ' '
            const metrics = ctx.measureText(testLine)
            if(metrics.width > maxWidth && n > 0)
            {
                ctx.fillText(line, x, y)
                line = words[n] + ' '
                y += lineHeight
            }
            else
            {
                line = testLine
            }
        }
        ctx.fillText(line, x, y)
    }

    next()
    {
        this.currentIndex = (this.currentIndex + 1) % projectsData.length
        this.renderBillboardCanvas()
        if(this.game.audio) this.game.audio.playChime()
    }

    prev()
    {
        this.currentIndex = (this.currentIndex - 1 + projectsData.length) % projectsData.length
        this.renderBillboardCanvas()
        if(this.game.audio) this.game.audio.playChime()
    }

    focus()
    {
        if(this.isFocused) return
        this.isFocused = true

        // Smoothly position camera in front of 3D display billboard
        const targetCamPos = new THREE.Vector3(36, 5.0, -11.5)
        const targetLookAt = new THREE.Vector3(36, 4.6, -20)
        this.game.view.setCinematic(targetCamPos, targetLookAt, 1.2)

        // Show HUD bar
        if(this.focusBarEl)
        {
            this.focusBarEl.style.display = 'flex'
            gsap.killTweensOf(this.focusBarEl)
            gsap.fromTo(this.focusBarEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
        }

        if(this.game.audio)
        {
            this.game.audio.playChime()
        }
    }

    exitFocus()
    {
        if(!this.isFocused) return
        this.isFocused = false

        // Hide HUD bar
        if(this.focusBarEl)
        {
            gsap.killTweensOf(this.focusBarEl)
            gsap.to(this.focusBarEl, {
                opacity: 0,
                y: 15,
                duration: 0.25,
                onComplete: () =>
                {
                    this.focusBarEl.style.display = 'none'
                }
            })
        }

        // Return camera smoothly to follow mode behind boat
        this.game.view.exitCinematic(0.8)
    }

    setupKeyboardControls()
    {
        // HUD buttons
        if(this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev())
        if(this.nextBtn) this.nextBtn.addEventListener('click', () => this.next())
        if(this.exitBtn) this.exitBtn.addEventListener('click', () => this.exitFocus())

        // Escape event from inputs system
        this.game.inputs.events.on('escape', () =>
        {
            if(this.isFocused)
            {
                this.exitFocus()
            }
        })

        // Keyboard listener
        window.addEventListener('keydown', (e) =>
        {
            if(!this.isFocused) return

            if(e.code === 'KeyA' || e.code === 'ArrowLeft')
            {
                this.prev()
            }
            else if(e.code === 'KeyD' || e.code === 'ArrowRight')
            {
                this.next()
            }
            else if(e.code === 'Escape' || e.code === 'KeyS' || e.code === 'ArrowDown')
            {
                this.exitFocus()
            }
        })
    }
}
