import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from '../Game.js'
import projectsData from '../../data/projects.js'

/**
 * LabIsland — 3D interactive Lab workstation showcase:
 * elevated on a large wooden deck stage platform with a central wooden display,
 * 3D purple navigation buttons, right-side project rack, left-side chalk instruction easel,
 * and a 3D floating interactive repository badge hovering above the billboard.
 */
export class LabIsland
{
    constructor()
    {
        this.game = Game.getInstance()
        this.position = new THREE.Vector3(36, 1.2, -18)
        this.currentIndex = 0
        this.isFocused = false
        this.lastFocusTime = 0

        // HUD elements
        this.minimapEl = document.querySelector('.js-minimap')
        this.menuToggleEl = document.querySelector('.js-menu-toggle')
        this.toastEl = document.querySelector('.js-interact-toast')
        this.zoneTitleEl = document.querySelector('.js-zone-title')

        // Materials
        this.stageWoodMat = new THREE.MeshStandardNodeMaterial({
            color: '#422814',
            roughness: 0.85,
            flatShading: true
        })

        this.stageBorderMat = new THREE.MeshStandardNodeMaterial({
            color: '#2a1608',
            roughness: 0.9,
            flatShading: true
        })

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

        this.rackSlots = []

        this.createWorkstation3D()
        this.setupKeyboardAndMouseControls()

        // Floating badge tick animation
        this.game.ticker.events.on('tick', () =>
        {
            if(this.repoBadgeMesh)
            {
                const time = performance.now() * 0.002
                this.repoBadgeMesh.position.y = 6.8 + Math.sin(time) * 0.08
            }
        })
    }

    createWorkstation3D()
    {
        this.group = new THREE.Group()
        this.group.position.copy(this.position)

        // 1. Large Raised Wooden Deck Stage Platform
        this.createStagePlatform()

        // 2. Central Screen Canvas & Mesh
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
        this.screenMesh.position.set(0, 3.6, 0.22)
        this.group.add(this.screenMesh)

        // Screen Frame Structure
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.35, 0.5), this.woodMat)
        frameTop.position.set(0, 5.95, 0.2)
        this.group.add(frameTop)

        const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.35, 0.5), this.woodMat)
        frameBottom.position.set(0, 1.25, 0.2)
        this.group.add(frameBottom)

        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 0.5), this.darkWoodMat)
        postL.position.set(-3.85, 3.1, 0.2)
        this.group.add(postL)

        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 0.5), this.darkWoodMat)
        postR.position.set(3.85, 3.1, 0.2)
        this.group.add(postR)

        // 3. Floating 3D Repository Button Mesh Hovering Outside/Above Billboard
        this.createFloatingRepoBadge()

        // 4. Bruno Simon Style 3D Purple Navigation Buttons
        const arrowGeo = new THREE.BoxGeometry(0.8, 0.8, 0.5)
        this.prevArrowMesh = new THREE.Mesh(arrowGeo, this.purpleMat)
        this.prevArrowMesh.position.set(-3.85, 3.6, 0.45)
        this.group.add(this.prevArrowMesh)

        this.nextArrowMesh = new THREE.Mesh(arrowGeo, this.purpleMat)
        this.nextArrowMesh.position.set(3.85, 3.6, 0.45)
        this.group.add(this.nextArrowMesh)

        this.addArrowLabel(this.prevArrowMesh, '◄')
        this.addArrowLabel(this.nextArrowMesh, '►')

        // 5. Right-Side Project Selector Rack
        this.createProjectRack()

        // 6. Left-Side Chalkboard Instructions Easel
        this.createInstructionsChalkboard()

        this.game.scene.add(this.group)

        // Render initial screen canvas
        this.renderScreenCanvas()

        // 7. Landing Pier & Interactive Ground Diamond Marker for approaching Lab Island
        if(this.game.world?.props?.createShortPier)
        {
            this.game.world.props.createShortPier(new THREE.Vector3(36, 0, -9.5), Math.PI, 10, 3.2)
        }

        this.marker = this.game.interactivePoints.create(
            new THREE.Vector3(36, 0.8, -5.5),
            '🔬 View Lab Showcase (Enter)',
            () =>
            {
                this.focus()
            }
        )

        // RayCursor click hit targets
        const focusOnClick = {
            mesh: this.screenMesh,
            active: true,
            onClick: () =>
            {
                if(!this.isFocused) this.focus()
            },
            onEnter: () => {},
            onLeave: () => {}
        }
        this.game.rayCursor.addIntersect(focusOnClick)
        this.game.rayCursor.addIntersect({ mesh: frameTop, active: true, onClick: () => { if(!this.isFocused) this.focus() } })
        this.game.rayCursor.addIntersect({ mesh: postL, active: true, onClick: () => { if(!this.isFocused) this.focus() } })
        this.game.rayCursor.addIntersect({ mesh: postR, active: true, onClick: () => { if(!this.isFocused) this.focus() } })

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

    createFloatingRepoBadge()
    {
        const badgeCanvas = document.createElement('canvas')
        badgeCanvas.width = 540
        badgeCanvas.height = 90
        const ctx = badgeCanvas.getContext('2d')

        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 540, 90)
        grad.addColorStop(0, 'rgba(2, 132, 199, 0.95)')
        grad.addColorStop(0.5, 'rgba(37, 99, 235, 0.95)')
        grad.addColorStop(1, 'rgba(124, 58, 237, 0.95)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(4, 4, 532, 82, 41)
        ctx.fill()

        // Glowing border
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 4
        ctx.stroke()

        // Sleek refined text
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 23px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('ENTER ↵  •  OPEN GITHUB REPOSITORY ↗', 270, 45)

        const badgeTex = new THREE.CanvasTexture(badgeCanvas)
        const badgeMat = new THREE.MeshBasicNodeMaterial({ map: badgeTex, transparent: true })
        this.repoBadgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.5), badgeMat)
        this.repoBadgeMesh.position.set(0, 6.55, 0.35)
        this.group.add(this.repoBadgeMesh)

        // Click on hovering badge to open repo
        this.game.rayCursor.addIntersect({
            mesh: this.repoBadgeMesh,
            active: true,
            onClick: () =>
            {
                this.openCurrentProjectRepo()
            },
            onEnter: () => gsap.to(this.repoBadgeMesh.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.2 }),
            onLeave: () => gsap.to(this.repoBadgeMesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.2 })
        })
    }

    createStagePlatform()
    {
        const stageGroup = new THREE.Group()

        // Main Stage Deck Box
        const stageWidth = 16.5
        const stageDepth = 9.5
        const stageHeight = 0.75

        const mainDeck = new THREE.Mesh(
            new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth),
            this.stageWoodMat
        )
        mainDeck.position.set(0, stageHeight * 0.5, 0.4)
        mainDeck.receiveShadow = true
        mainDeck.castShadow = true
        stageGroup.add(mainDeck)

        // Dark Wood Perimeter Framing
        const borderGeo = new THREE.BoxGeometry(stageWidth + 0.3, 0.3, stageDepth + 0.3)
        const borderMesh = new THREE.Mesh(borderGeo, this.stageBorderMat)
        borderMesh.position.set(0, stageHeight, 0.4)
        stageGroup.add(borderMesh)

        // Front Entrance Steps
        const step1 = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.35, 1.4), this.stageWoodMat)
        step1.position.set(0, 0.18, stageDepth * 0.5 + 0.9)
        step1.castShadow = true
        stageGroup.add(step1)

        const step2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 1.2), this.stageWoodMat)
        step2.position.set(0, 0.1, stageDepth * 0.5 + 2.0)
        step2.castShadow = true
        stageGroup.add(step2)

        // 4 Corner Lantern Posts on Stage
        const postGeo = new THREE.BoxGeometry(0.3, 1.6, 0.3)
        const lanternGeo = new THREE.SphereGeometry(0.18, 8, 8)
        const lanternMat = new THREE.MeshBasicNodeMaterial({ color: '#fef08a' })

        const cornerPositions = [
            [-stageWidth * 0.47, stageHeight + 0.8, -stageDepth * 0.45],
            [ stageWidth * 0.47, stageHeight + 0.8, -stageDepth * 0.45],
            [-stageWidth * 0.47, stageHeight + 0.8,  stageDepth * 0.45],
            [ stageWidth * 0.47, stageHeight + 0.8,  stageDepth * 0.45]
        ]

        for(const pos of cornerPositions)
        {
            const p = new THREE.Mesh(postGeo, this.darkWoodMat)
            p.position.set(pos[0], pos[1], pos[2])
            p.castShadow = true
            stageGroup.add(p)

            const light = new THREE.Mesh(lanternGeo, lanternMat)
            light.position.set(pos[0], pos[1] + 0.85, pos[2])
            stageGroup.add(light)
        }

        this.group.add(stageGroup)
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
        rackGroup.position.set(5.5, 3.6, 0.1)

        // Vertical support posts
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.4, 0.3), this.woodMat)
        post.position.set(1.5, 0, 0)
        rackGroup.add(post)

        // 3 Visible Slots: Top (prev), Center (active), Bottom (next)
        const slotOffsets = [1.5, 0.0, -1.5]
        const cardHeight = 1.3
        const cardWidth = 2.6

        for(let s = 0; s < 3; s++)
        {
            const yPos = slotOffsets[s]

            const canvas = document.createElement('canvas')
            canvas.width = 440
            canvas.height = 200
            const ctx = canvas.getContext('2d')

            const texture = new THREE.CanvasTexture(canvas)
            const cardMat = new THREE.MeshBasicNodeMaterial({ map: texture })
            const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(cardWidth, cardHeight), cardMat)
            cardMesh.position.set(0, yPos, 0.1)

            // Wooden border backing
            const backMesh = new THREE.Mesh(new THREE.BoxGeometry(cardWidth + 0.1, cardHeight + 0.1, 0.15), this.darkWoodMat)
            backMesh.position.set(0, yPos, 0)
            rackGroup.add(backMesh)
            rackGroup.add(cardMesh)

            const slotData = { mesh: cardMesh, canvas, ctx, texture, slotIndex: s, targetProjectIndex: 0 }
            this.rackSlots.push(slotData)

            // Clickable
            this.game.rayCursor.addIntersect({
                mesh: cardMesh,
                active: true,
                onClick: () =>
                {
                    this.currentIndex = slotData.targetProjectIndex
                    this.updateAllViews()
                },
                onEnter: () => gsap.to(cardMesh.position, { z: 0.25, duration: 0.2 }),
                onLeave: () => gsap.to(cardMesh.position, { z: 0.1, duration: 0.2 })
            })
        }

        this.group.add(rackGroup)
        this.updateRackSlots()
    }

    updateRackSlots()
    {
        const total = projectsData.length
        const prevIdx = (this.currentIndex - 1 + total) % total
        const currIdx = this.currentIndex
        const nextIdx = (this.currentIndex + 1) % total

        const indices = [prevIdx, currIdx, nextIdx]

        for(let s = 0; s < 3; s++)
        {
            const slot = this.rackSlots[s]
            const pIdx = indices[s]
            slot.targetProjectIndex = pIdx
            const p = projectsData[pIdx]
            const isActive = s === 1

            this.renderRackCardSlot(slot, p, pIdx, isActive)
        }
    }

    renderRackCardSlot(slot, project, projectIndex, isActive)
    {
        const { ctx, texture } = slot
        ctx.clearRect(0, 0, 440, 200)

        // Background
        ctx.fillStyle = isActive ? '#1e1b4b' : '#0b1120'
        ctx.fillRect(0, 0, 440, 200)

        // Active border
        ctx.strokeStyle = isActive ? '#c084fc' : 'rgba(255, 255, 255, 0.12)'
        ctx.lineWidth = isActive ? 8 : 3
        ctx.strokeRect(4, 4, 432, 192)

        // Gradient header banner
        const grad = ctx.createLinearGradient(12, 12, 428, 100)
        if(isActive)
        {
            grad.addColorStop(0, '#7c3aed')
            grad.addColorStop(1, '#0284c7')
        }
        else
        {
            grad.addColorStop(0, '#1e293b')
            grad.addColorStop(1, '#0f172a')
        }
        ctx.fillStyle = grad
        ctx.fillRect(12, 12, 416, 96)

        // Category Tag
        ctx.font = 'bold 16px "Space Grotesk", sans-serif'
        ctx.fillStyle = isActive ? '#fbbf24' : '#94a3b8'
        ctx.textAlign = 'left'
        ctx.fillText(`[ ${project.category.toUpperCase()} ]`, 24, 42)

        // Project Index Badge
        ctx.textAlign = 'right'
        ctx.fillText(`#${projectIndex + 1} / ${projectsData.length}`, 416, 42)

        // Subtitle
        ctx.font = '16px "Inter", sans-serif'
        ctx.fillStyle = '#cbd5e1'
        ctx.textAlign = 'left'
        ctx.fillText(project.subtitle || '', 24, 78)

        // Main Title (bottom row)
        ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8'
        ctx.font = 'bold 22px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(project.title.toUpperCase(), 220, 155)

        texture.needsUpdate = true
    }

    createInstructionsChalkboard()
    {
        const easelGroup = new THREE.Group()
        easelGroup.position.set(-5.6, 2.2, 0.8)
        easelGroup.rotation.y = 0.35

        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 550
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#1c242b'
        ctx.fillRect(0, 0, 400, 550)

        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 4
        ctx.strokeRect(10, 10, 380, 530)

        ctx.fillStyle = '#f8fafc'
        ctx.textAlign = 'left'

        ctx.font = 'bold 30px "Space Grotesk", sans-serif'
        ctx.fillText('NEXT   ► [D]', 40, 80)
        ctx.fillText('PREV   ◄ [A]', 40, 155)

        ctx.fillStyle = '#38bdf8'
        ctx.fillText('REPO   ↗ [ENTER]', 40, 235)

        ctx.fillStyle = '#f87171'
        ctx.fillText('EXIT   [ESC]', 40, 315)

        ctx.font = '19px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#94a3b8'
        ctx.fillText('Scroll ↕ to cycle projects', 40, 430)
        ctx.fillText('Click cards to select', 40, 475)

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

    renderScreenCanvas()
    {
        const ctx = this.screenCtx
        const p = projectsData[this.currentIndex]

        // Background
        ctx.fillStyle = '#070b14'
        ctx.fillRect(0, 0, 1200, 750)

        // Subtle Cyber Matrix Grid
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.10)'
        ctx.lineWidth = 1
        for(let x = 0; x < 1200; x += 40)
        {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 750); ctx.stroke()
        }
        for(let y = 0; y < 750; y += 40)
        {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke()
        }

        // Center Ambient Radial Glow
        const radGrad = ctx.createRadialGradient(600, 360, 20, 600, 360, 480)
        radGrad.addColorStop(0, 'rgba(147, 51, 234, 0.18)')
        radGrad.addColorStop(1, 'rgba(7, 11, 20, 0.0)')
        ctx.fillStyle = radGrad
        ctx.fillRect(0, 0, 1200, 750)

        // Outer Neon Border
        ctx.strokeStyle = '#c084fc'
        ctx.lineWidth = 6
        ctx.strokeRect(16, 16, 1168, 718)

        // Header Category Bar (Clean)
        ctx.font = 'bold 22px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#38bdf8'
        ctx.textAlign = 'left'
        ctx.fillText(`⚡ [ ${p.category.toUpperCase()} ]`, 80, 70)

        ctx.textAlign = 'right'
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(`PROJECT [ ${this.currentIndex + 1} / ${projectsData.length} ]`, 1120, 70)

        // Main Project Title
        ctx.font = 'bold 44px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.fillText(p.title.toUpperCase(), 80, 125)

        // Subtitle / Architecture Focus
        ctx.font = '22px "Inter", sans-serif'
        ctx.fillStyle = '#a855f7'
        ctx.fillText(p.subtitle || '', 80, 160)

        // Central Architecture Preview Window
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(80, 185, 1040, 285, 16)
        ctx.fill()
        ctx.stroke()

        // Short Project Description inside Preview Window
        ctx.font = '23px "Inter", sans-serif'
        ctx.fillStyle = '#f1f5f9'
        ctx.textAlign = 'left'
        this.wrapText(ctx, p.description, 110, 235, 980, 36)

        // Key Engineering Highlights / Metric Badges inside Preview Window
        const highlights = p.highlights || []
        let hX = 110
        for(const h of highlights)
        {
            ctx.font = 'bold 18px "Space Grotesk", sans-serif'
            const hWidth = ctx.measureText(h).width + 32

            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'
            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.roundRect(hX, 395, hWidth, 42, 10)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = '#e0f2fe'
            ctx.textAlign = 'center'
            ctx.fillText(h, hX + hWidth * 0.5, 422)

            hX += hWidth + 14
        }

        // Tech Stack Badges
        ctx.font = 'bold 19px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#c084fc'
        ctx.textAlign = 'left'
        ctx.fillText('TECH STACK // TOOLS & FRAMEWORKS', 80, 505)

        let badgeX = 80
        for(const tech of (p.stack || []).slice(0, 6))
        {
            ctx.font = 'bold 19px "Space Grotesk", sans-serif'
            const textWidth = ctx.measureText(tech).width
            const badgeWidth = textWidth + 30

            ctx.fillStyle = 'rgba(147, 51, 234, 0.25)'
            ctx.strokeStyle = '#a855f7'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.roundRect(badgeX, 525, badgeWidth, 42, 10)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = '#f3e8ff'
            ctx.textAlign = 'center'
            ctx.fillText(tech, badgeX + badgeWidth * 0.5, 552)

            badgeX += badgeWidth + 12
        }

        // Footer Navigation Bar
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
        ctx.beginPath()
        ctx.roundRect(80, 615, 1040, 75, 16)
        ctx.fill()

        ctx.font = 'bold 21px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#c084fc'
        ctx.textAlign = 'center'
        ctx.fillText(`◄ [A] PREV  •  PROJECT [ ${this.currentIndex + 1} / ${projectsData.length} ]  •  [D] NEXT ►  •  [ESC] RETURN`, 600, 662)

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

    openCurrentProjectRepo()
    {
        const p = projectsData[this.currentIndex]
        const url = p.link || 'https://github.com/Karrtik12?tab=repositories'
        window.open(url, '_blank', 'noopener,noreferrer')
        if(this.game.audio) this.game.audio.playChime()
    }

    updateAllViews()
    {
        this.renderScreenCanvas()
        this.updateRackSlots()
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

    focus()
    {
        if(this.isFocused) return
        this.isFocused = true
        this.lastFocusTime = performance.now()

        // Calculate exact distance to comfortably frame the ENTIRE workstation:
        // Left chalkboard instructions, central display screen, right project carousel rack, and top floating badge
        const camera = this.game.view.camera
        const aspect = camera.aspect || (window.innerWidth / window.innerHeight)
        const fovRad = THREE.MathUtils.degToRad(camera.fov || 45)

        const totalW = 14.8
        const totalH = 6.6

        const distH = (totalH * 0.5) / Math.tan(fovRad * 0.5)
        const distW = (totalW * 0.5) / (aspect * Math.tan(fovRad * 0.5))
        const d = Math.max(distH, distW) * 1.05

        const targetLookAt = new THREE.Vector3(36, 4.4, -17.78)
        const targetCamPos = new THREE.Vector3(36, 4.4, -17.78 + d)
        this.game.view.setCinematic(targetCamPos, targetLookAt, 1.0)

        // Hide distracting HUD overlays during focus
        if(this.minimapEl) this.minimapEl.style.display = 'none'
        if(this.menuToggleEl) this.menuToggleEl.style.display = 'none'
        if(this.toastEl) this.toastEl.style.display = 'none'
        if(this.zoneTitleEl) this.zoneTitleEl.style.display = 'none'
        const controlsEl = document.querySelector('.js-controls')
        if(controlsEl) controlsEl.style.display = 'none'

        if(this.game.audio)
        {
            this.game.audio.playChime()
        }
    }

    exitFocus()
    {
        if(!this.isFocused) return
        this.isFocused = false

        // Smoothly exit cinematic mode back to boat follow
        this.game.view.exitCinematic()

        // Restore HUD overlays when boat is back in focus
        if(this.minimapEl) this.minimapEl.style.display = 'block'
        if(this.menuToggleEl) this.menuToggleEl.style.display = 'flex'
        if(this.zoneTitleEl) this.zoneTitleEl.style.display = 'block'
        const controlsEl = document.querySelector('.js-controls')
        if(controlsEl) controlsEl.style.display = 'flex'
    }

    setupKeyboardAndMouseControls()
    {
        // Keyboard controls
        window.addEventListener('keydown', (e) =>
        {
            if(!this.isFocused) return

            switch(e.code)
            {
                case 'Enter':
                case 'NumpadEnter':
                    // Debounce check: ignore Enter key for 500ms after entering focus mode!
                    if(performance.now() - this.lastFocusTime < 500)
                    {
                        return
                    }
                    e.preventDefault()
                    this.openCurrentProjectRepo()
                    break

                case 'KeyD':
                case 'ArrowRight':
                    this.next()
                    break

                case 'KeyA':
                case 'ArrowLeft':
                    this.prev()
                    break

                case 'Escape':
                case 'KeyS':
                case 'KeyW':
                case 'ArrowUp':
                case 'ArrowDown':
                    this.exitFocus()
                    break
            }
        })

        // Wheel scroll cycling on billboard
        window.addEventListener('wheel', (e) =>
        {
            if(!this.isFocused) return
            if(Math.abs(e.deltaY) > 30)
            {
                if(e.deltaY > 0) this.next()
                else this.prev()
            }
        }, { passive: true })
    }
}
