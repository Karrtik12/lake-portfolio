import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from '../Game.js'
import projectsData from '../../data/projects.js'

/**
 * LabIsland — 3D interactive Lab workstation inspired by Bruno Simon's portfolio:
 * featuring a central wooden display screen with 3D purple arrow buttons, right-side project rack,
 * left-side chalk instruction easel, and foreground laboratory workbench props.
 */
export class LabIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.position = new THREE.Vector3(36, 0.2, -20)
        this.currentIndex = 0
        this.isFocused = false

        // HUD elements
        this.minimapEl = document.querySelector('.js-minimap')
        this.menuToggleEl = document.querySelector('.js-menu-toggle')
        this.toastEl = document.querySelector('.js-interact-toast')
        this.zoneTitleEl = document.querySelector('.js-zone-title')

        // Materials
        this.woodMat = new THREE.MeshStandardNodeMaterial({
            color: '#704828',
            roughness: 0.85,
            flatShading: true
        })

        this.darkWoodMat = new THREE.MeshStandardNodeMaterial({
            color: '#3d2516',
            roughness: 0.9,
            flatShading: true
        })

        this.purpleMat = new THREE.MeshStandardNodeMaterial({
            color: '#9333ea', // Bruno Simon purple
            roughness: 0.4,
            metalness: 0.2,
            flatShading: true
        })

        this.cauldronMat = new THREE.MeshStandardNodeMaterial({
            color: '#1e1b4b',
            roughness: 0.6,
            metalness: 0.5,
            flatShading: true
        })

        this.liquidMat = new THREE.MeshBasicNodeMaterial({
            color: '#c084fc'
        })

        this.chalkboardMat = new THREE.MeshBasicNodeMaterial()

        this.projectRackMeshes = []

        this.createWorkstation3D()
        this.setupKeyboardAndMouseControls()
    }

    createWorkstation3D()
    {
        this.group = new THREE.Group()
        this.group.position.copy(this.position)

        // 1. Central Screen Canvas & Mesh
        this.screenCanvas = document.createElement('canvas')
        this.screenCanvas.width = 1200
        this.screenCanvas.height = 750
        this.screenCtx = this.screenCanvas.getContext('2d')

        this.screenTexture = new THREE.CanvasTexture(this.screenCanvas)
        this.screenTexture.minFilter = THREE.LinearFilter
        this.screenTexture.magFilter = THREE.LinearFilter

        const screenGeo = new THREE.PlaneGeometry(7.2, 4.5)
        const screenMat = new THREE.MeshBasicNodeMaterial({ map: this.screenTexture })
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat)
        this.screenMesh.position.set(0, 3.4, 0.22)
        this.group.add(this.screenMesh)

        // Screen Frame Structure
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.5, 0.5), this.woodMat)
        frameTop.position.set(0, 5.85, 0.1)
        frameTop.castShadow = true
        this.group.add(frameTop)

        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 0.5), this.darkWoodMat)
        postL.position.set(-3.85, 3.1, 0.1)
        postL.castShadow = true
        this.group.add(postL)

        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 0.5), this.darkWoodMat)
        postR.position.set(3.85, 3.1, 0.1)
        postR.castShadow = true
        this.group.add(postR)

        // 2. 3D Purple Navigation Arrow Buttons on the Frame Sides
        const arrowGeo = new THREE.BoxGeometry(0.85, 0.85, 0.5)

        this.prevArrowMesh = new THREE.Mesh(arrowGeo, this.purpleMat)
        this.prevArrowMesh.position.set(-3.85, 3.4, 0.45)
        this.group.add(this.prevArrowMesh)

        this.nextArrowMesh = new THREE.Mesh(arrowGeo, this.purpleMat)
        this.nextArrowMesh.position.set(3.85, 3.4, 0.45)
        this.group.add(this.nextArrowMesh)

        // Add 3D arrow text labels onto the blocks
        this.addArrowLabel(this.prevArrowMesh, '◄')
        this.addArrowLabel(this.nextArrowMesh, '►')

        // 3. Right-Side Project Selector Rack
        this.createProjectRack()

        // 4. Left-Side Chalkboard Instructions Easel
        this.createInstructionsChalkboard()

        // 5. Foreground Laboratory Workbench & Props
        this.createWorkbenchProps()

        this.game.scene.add(this.group)

        // Render initial screen canvas
        this.renderScreenCanvas()

        // 6. Interactive Ground Diamond Marker for approaching Lab Island
        this.marker = this.game.interactivePoints.create(
            new THREE.Vector3(36, 0.8, -13.5),
            '🔬 Enter Lab Showcase (Enter)',
            () =>
            {
                this.focus()
            }
        )

        // RayCursor click hit targets
        this.game.rayCursor.addIntersect({
            mesh: this.screenMesh,
            active: true,
            onClick: () =>
            {
                if(!this.isFocused) this.focus()
                else this.openCurrentProject()
            },
            onEnter: () => {},
            onLeave: () => {}
        })

        this.game.rayCursor.addIntersect({
            mesh: this.prevArrowMesh,
            active: true,
            onClick: () => this.prev(),
            onEnter: () => gsap.to(this.prevArrowMesh.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2 }),
            onLeave: () => gsap.to(this.prevArrowMesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.2 })
        })

        this.game.rayCursor.addIntersect({
            mesh: this.nextArrowMesh,
            active: true,
            onClick: () => this.next(),
            onEnter: () => gsap.to(this.nextArrowMesh.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2 }),
            onLeave: () => gsap.to(this.nextArrowMesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.2 })
        })
    }

    addArrowLabel(parentMesh, text)
    {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#9333ea'
        ctx.fillRect(0, 0, 128, 128)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 76px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, 64, 64)

        const tex = new THREE.CanvasTexture(canvas)
        const labelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 0.7),
            new THREE.MeshBasicNodeMaterial({ map: tex })
        )
        labelMesh.position.set(0, 0, 0.26)
        parentMesh.add(labelMesh)
    }

    createProjectRack()
    {
        const rackGroup = new THREE.Group()
        rackGroup.position.set(5.5, 3.4, 0.1)

        // Vertical support posts
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.4, 0.3), this.woodMat)
        post.position.set(1.5, 0, 0)
        rackGroup.add(post)

        const total = projectsData.length
        const cardHeight = 1.35
        const cardSpacing = 1.55
        const startY = (total - 1) * 0.5 * cardSpacing

        for(let i = 0; i < total; i++)
        {
            const p = projectsData[i]

            // Canvas for card
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 200
            const ctx = canvas.getContext('2d')

            const texture = new THREE.CanvasTexture(canvas)
            const cardMat = new THREE.MeshBasicNodeMaterial({ map: texture })
            const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, cardHeight), cardMat)

            const yPos = startY - i * cardSpacing
            cardMesh.position.set(0, yPos, 0.1)

            // Wooden border backing
            const backMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, cardHeight + 0.1, 0.15), this.darkWoodMat)
            backMesh.position.set(0, yPos, 0)
            rackGroup.add(backMesh)

            rackGroup.add(cardMesh)

            const cardData = { mesh: cardMesh, canvas, ctx, texture, index: i, project: p }
            this.projectRackMeshes.push(cardData)

            this.renderRackCard(cardData, i === this.currentIndex)

            // Clickable on raycursor
            this.game.rayCursor.addIntersect({
                mesh: cardMesh,
                active: true,
                onClick: () =>
                {
                    this.currentIndex = i
                    this.updateAllViews()
                },
                onEnter: () => gsap.to(cardMesh.position, { z: 0.25, duration: 0.2 }),
                onLeave: () =>
                {
                    if(this.currentIndex !== i) gsap.to(cardMesh.position, { z: 0.1, duration: 0.2 })
                }
            })
        }

        this.group.add(rackGroup)
    }

    renderRackCard(cardData, isActive)
    {
        const { ctx, canvas, texture, project, index } = cardData
        ctx.clearRect(0, 0, 400, 200)

        // Background
        ctx.fillStyle = isActive ? '#1e1b4b' : '#0f172a'
        ctx.fillRect(0, 0, 400, 200)

        // Active border
        ctx.strokeStyle = isActive ? '#c084fc' : 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = isActive ? 8 : 3
        ctx.strokeRect(4, 4, 392, 192)

        // Mini preview box / gradient
        const grad = ctx.createLinearGradient(16, 16, 384, 184)
        if(index === 0) { grad.addColorStop(0, '#0284c7'); grad.addColorStop(1, '#0f172a') }
        else if(index === 1) { grad.addColorStop(0, '#7c3aed'); grad.addColorStop(1, '#0f172a') }
        else { grad.addColorStop(0, '#059669'); grad.addColorStop(1, '#0f172a') }

        ctx.fillStyle = grad
        ctx.fillRect(16, 16, 368, 110)

        // Title banner
        ctx.fillStyle = isActive ? '#fbbf24' : '#e2e8f0'
        ctx.font = 'bold 24px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(project.title.toUpperCase(), 200, 165)

        texture.needsUpdate = true
    }

    createInstructionsChalkboard()
    {
        const easelGroup = new THREE.Group()
        easelGroup.position.set(-5.6, 2.0, 0.8)
        easelGroup.rotation.y = 0.35 // Angled towards viewer

        // Chalkboard canvas
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 550
        const ctx = canvas.getContext('2d')

        // Blackboard background
        ctx.fillStyle = '#1c242b'
        ctx.fillRect(0, 0, 400, 550)

        // Chalk border
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 4
        ctx.strokeRect(10, 10, 380, 530)

        // Instructions chalk text
        ctx.fillStyle = '#f8fafc'
        ctx.textAlign = 'left'

        ctx.font = 'bold 36px "Space Grotesk", sans-serif'
        ctx.fillText('NEXT  ► [D]', 40, 80)
        ctx.fillText('PREV  ◄ [A]', 40, 160)
        ctx.fillText('SCROLL  ↕', 40, 240)
        ctx.fillText('OPEN  ↵ [ENTER]', 40, 320)

        ctx.fillStyle = '#f87171'
        ctx.fillText('EXIT  [ESC]', 40, 420)

        ctx.font = '20px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText('Click cards to select', 40, 490)

        const chalkTex = new THREE.CanvasTexture(canvas)
        const boardMat = new THREE.MeshBasicNodeMaterial({ map: chalkTex })
        const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.75), boardMat)
        boardMesh.position.set(0, 0.8, 0.1)

        const woodFrame = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.9, 0.15), this.woodMat)
        woodFrame.position.set(0, 0.8, 0)
        easelGroup.add(woodFrame)
        easelGroup.add(boardMesh)

        // Easel legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6)
        const leg1 = new THREE.Mesh(legGeo, this.woodMat)
        leg1.position.set(-0.8, 0, -0.2)
        leg1.rotation.z = 0.15
        easelGroup.add(leg1)

        const leg2 = new THREE.Mesh(legGeo, this.woodMat)
        leg2.position.set(0.8, 0, -0.2)
        leg2.rotation.z = -0.15
        easelGroup.add(leg2)

        const backLeg = new THREE.Mesh(legGeo, this.woodMat)
        backLeg.position.set(0, 0, -0.8)
        backLeg.rotation.x = -0.3
        easelGroup.add(backLeg)

        this.group.add(easelGroup)
    }

    createWorkbenchProps()
    {
        const tableGroup = new THREE.Group()
        tableGroup.position.set(0, 0, 1.2)

        // Wooden table top
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.35, 1.6), this.woodMat)
        tableTop.position.set(0, 1.0, 0)
        tableTop.castShadow = true
        tableGroup.add(tableTop)

        // Table legs
        const legGeo = new THREE.CylinderGeometry(0.14, 0.16, 1.0, 6)
        const legPositions = [
            [-3.3, 0.5, -0.6],
            [ 3.3, 0.5, -0.6],
            [-3.3, 0.5,  0.6],
            [ 3.3, 0.5,  0.6]
        ]
        for(const pos of legPositions)
        {
            const leg = new THREE.Mesh(legGeo, this.darkWoodMat)
            leg.position.set(pos[0], pos[1], pos[2])
            tableGroup.add(leg)
        }

        // 1. Glowing Cauldron / Alchemical Pot
        const cauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), this.cauldronMat)
        cauldron.position.set(-2.2, 1.45, 0.1)
        cauldron.scale.set(1.0, 0.85, 1.0)
        tableGroup.add(cauldron)

        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), this.liquidMat)
        liquid.position.set(-2.2, 1.7, 0.1)
        tableGroup.add(liquid)

        // 2. Tech Books / Research Journals
        const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 1.0), new THREE.MeshStandardNodeMaterial({ color: '#d97706', roughness: 0.7 }))
        book1.position.set(0.8, 1.25, 0.1)
        book1.rotation.y = 0.2
        tableGroup.add(book1)

        const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.9), new THREE.MeshStandardNodeMaterial({ color: '#2563eb', roughness: 0.7 }))
        book2.position.set(0.9, 1.38, 0.05)
        book2.rotation.y = -0.15
        tableGroup.add(book2)

        // 3. Candle & Flask Props
        const flaskGeo = new THREE.ConeGeometry(0.2, 0.45, 8)
        const flask = new THREE.Mesh(flaskGeo, new THREE.MeshStandardNodeMaterial({ color: '#10b981', roughness: 0.3 }))
        flask.position.set(2.4, 1.4, 0.2)
        tableGroup.add(flask)

        this.group.add(tableGroup)
    }

    renderScreenCanvas()
    {
        const ctx = this.screenCtx
        const p = projectsData[this.currentIndex]
        const total = projectsData.length

        // Background
        ctx.fillStyle = '#0a0e17'
        ctx.fillRect(0, 0, 1200, 750)

        // Procedural Starfield & Cyber Grid
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.12)'
        ctx.lineWidth = 1
        for(let x = 0; x < 1200; x += 40)
        {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 750); ctx.stroke()
        }
        for(let y = 0; y < 750; y += 40)
        {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke()
        }

        // Center Ambient Glow
        const radGrad = ctx.createRadialGradient(600, 360, 20, 600, 360, 450)
        radGrad.addColorStop(0, 'rgba(147, 51, 234, 0.22)')
        radGrad.addColorStop(1, 'rgba(10, 14, 23, 0.0)')
        ctx.fillStyle = radGrad
        ctx.fillRect(0, 0, 1200, 750)

        // Outer Neon Border
        ctx.strokeStyle = '#c084fc'
        ctx.lineWidth = 8
        ctx.strokeRect(16, 16, 1168, 718)

        // Project Title
        ctx.font = 'bold 54px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText(p.title.toUpperCase(), 600, 110)

        // URL / Repo Badge Pill (Bruno Simon style)
        const repoText = 'GITHUB.COM/KARRTIK12'
        ctx.font = 'bold 22px "Space Grotesk", sans-serif'
        const pillWidth = ctx.measureText(repoText).width + 48

        ctx.fillStyle = '#9333ea'
        ctx.beginPath()
        ctx.roundRect(600 - pillWidth * 0.5, 140, pillWidth, 42, 21)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.fillText(repoText, 600, 169)

        // Central Graphic / Architecture Preview Window
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(80, 210, 1040, 230, 16)
        ctx.fill()
        ctx.stroke()

        // Description inside preview window
        ctx.font = '24px "Inter", sans-serif'
        ctx.fillStyle = '#e2e8f0'
        ctx.textAlign = 'left'
        this.wrapText(ctx, p.description, 110, 270, 980, 40)

        // Tech Stack Badges
        ctx.font = 'bold 20px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#a855f7'
        ctx.textAlign = 'left'
        ctx.fillText('STACK // TECHNOLOGIES', 80, 490)

        let badgeX = 80
        for(const tech of p.stack || [])
        {
            ctx.font = 'bold 22px "Space Grotesk", sans-serif'
            const textWidth = ctx.measureText(tech).width
            const badgeWidth = textWidth + 36

            ctx.fillStyle = 'rgba(147, 51, 234, 0.25)'
            ctx.strokeStyle = '#c084fc'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(badgeX, 515, badgeWidth, 48, 12)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = '#f3e8ff'
            ctx.textAlign = 'center'
            ctx.fillText(tech, badgeX + badgeWidth * 0.5, 547)

            badgeX += badgeWidth + 18
        }

        // Footer Bar: Visit Repo Action
        ctx.fillStyle = 'rgba(147, 51, 234, 0.9)'
        ctx.beginPath()
        ctx.roundRect(80, 620, 1040, 75, 16)
        ctx.fill()

        ctx.font = 'bold 26px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText('🔗 PRESS [ENTER] OR CLICK TO OPEN GITHUB REPOSITORY', 600, 668)

        this.screenTexture.needsUpdate = true
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

    updateAllViews()
    {
        this.renderScreenCanvas()
        for(const cardData of this.projectRackMeshes)
        {
            this.renderRackCard(cardData, cardData.index === this.currentIndex)
        }
        if(this.game.audio) this.game.audio.playChime()
    }

    next()
    {
        this.currentIndex = (this.currentIndex + 1) % projectsData.length
        this.updateAllViews()
    }

    prev()
    {
        this.currentIndex = (this.currentIndex - 1 + projectsData.length) % projectsData.length
        this.updateAllViews()
    }

    openCurrentProject()
    {
        const p = projectsData[this.currentIndex]
        const url = p.link || 'https://github.com/Karrtik12?tab=repositories'
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    focus()
    {
        if(this.isFocused) return
        this.isFocused = true

        // Perfectly framed cinematic view matching Bruno Simon:
        // Center of workstation is at (36, 3.4, -20)
        // Camera positioned directly in front at (36, 3.4, -10.8) framing the board, rack, chalkboard, and table props!
        const targetCamPos = new THREE.Vector3(36, 3.4, -10.8)
        const targetLookAt = new THREE.Vector3(36, 3.4, -20)
        this.game.view.setCinematic(targetCamPos, targetLookAt, 1.2)

        // Hide ground diamond marker during focus
        if(this.marker?.group)
        {
            this.marker.group.visible = false
        }

        // Hide distracting HUD overlays during focus
        if(this.minimapEl) this.minimapEl.style.display = 'none'
        if(this.menuToggleEl) this.menuToggleEl.style.display = 'none'
        if(this.toastEl) this.toastEl.style.display = 'none'
        if(this.zoneTitleEl) this.zoneTitleEl.style.display = 'none'

        if(this.game.audio)
        {
            this.game.audio.playChime()
        }
    }

    exitFocus()
    {
        if(!this.isFocused) return
        this.isFocused = false

        // Restore ground marker and HUD elements
        if(this.marker?.group)
        {
            this.marker.group.visible = true
        }
        if(this.minimapEl) this.minimapEl.style.display = 'block'
        if(this.menuToggleEl) this.menuToggleEl.style.display = 'flex'

        // Smoothly zoom out camera and return to boat follow mode
        this.game.view.exitCinematic(1.0)
    }

    setupKeyboardAndMouseControls()
    {
        // Global escape listener
        this.game.inputs.events.on('escape', () =>
        {
            if(this.isFocused)
            {
                this.exitFocus()
            }
        })

        // Wheel scroll pagination
        window.addEventListener('wheel', (e) =>
        {
            if(!this.isFocused) return
            if(e.deltaY > 20) this.next()
            else if(e.deltaY < -20) this.prev()
        }, { passive: true })

        // Keyboard listeners
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
            else if(e.code === 'Enter' || e.code === 'Space')
            {
                this.openCurrentProject()
            }
            else if(e.code === 'Escape' || e.code === 'KeyS' || e.code === 'ArrowDown')
            {
                this.exitFocus()
            }
        })
    }
}
