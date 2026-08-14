import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * Map — manages the real-time HUD minimap and the expanded interactive Big Map modal,
 * including interactive diamond markers with hover tooltip cards.
 */
export class Map
{
    constructor()
    {
        this.game = Game.getInstance()

        // 1. Minimap elements
        this.minimapEl = document.querySelector('.js-minimap')
        this.canvasMini = document.querySelector('.js-minimap-canvas')
        this.ctxMini = this.canvasMini ? this.canvasMini.getContext('2d') : null

        // 2. Big Map elements
        this.bigMapModal = document.querySelector('.js-big-map-modal')
        this.bigMapBackdrop = document.querySelector('.js-big-map-backdrop')
        this.bigMapContainer = document.querySelector('.js-big-map-container')
        this.bigMapCloseBtn = document.querySelector('.js-big-map-close')
        this.canvasBig = document.querySelector('.js-big-map-canvas')
        this.ctxBig = this.canvasBig ? this.canvasBig.getContext('2d') : null
        this.sidebarEl = document.querySelector('.js-big-map-sidebar')

        this.isBigMapOpen = false
        this.worldRadius = 140 // World units mapped to radar radius

        // Mouse hover state on Big Map canvas
        this.mousePos = { x: -999, y: -999 }
        this.hoveredDiamond = null

        // Island definitions with icons and descriptions
        this.destinations = [
            { id: 'socials', name: 'Socials Island', icon: '🏝️', x: -58, z: -38, r: 18, color: '#2d6a4f', desc: 'Social channels, contact info, GitHub & LinkedIn links' },
            { id: 'lab',     name: 'Lab Island',     icon: '🔬', x:  58, z: -35, r: 20, color: '#1b4332', desc: 'Interactive 3D project showcase (Systems, DevOps, AI/ML)' },
            { id: 'about',   name: 'About Island',   icon: '👤', x: -52, z:  44, r: 17, color: '#356e2c', desc: 'Personal biography, engineer background & experience' },
            { id: 'dock',    name: 'Beach Pier',     icon: '🏠', x:   0, z: 108, r:  8, color: '#704828', desc: 'Starting beach pier & harbor moorage' }
        ]

        this.setupEventListeners()

        // Update loop
        this.game.ticker.events.on('tick', () =>
        {
            this.renderMinimap()
            if(this.isBigMapOpen)
            {
                this.renderBigMap()
            }
        })
    }

    setupEventListeners()
    {
        // Click minimap to open big map
        if(this.minimapEl)
        {
            this.minimapEl.addEventListener('click', () =>
            {
                this.openBigMap()
            })
        }

        // Close big map
        if(this.bigMapCloseBtn)
        {
            this.bigMapCloseBtn.addEventListener('click', () => this.closeBigMap())
        }

        if(this.bigMapBackdrop)
        {
            this.bigMapBackdrop.addEventListener('click', () => this.closeBigMap())
        }

        this.game.inputs.events.on('escape', () =>
        {
            if(this.isBigMapOpen)
            {
                this.closeBigMap()
            }
        })

        // Big Map Canvas mouse move and hover detection
        if(this.canvasBig)
        {
            this.canvasBig.addEventListener('mousemove', (e) =>
            {
                const rect = this.canvasBig.getBoundingClientRect()
                const scaleX = this.canvasBig.width / rect.width
                const scaleY = this.canvasBig.height / rect.height
                this.mousePos.x = (e.clientX - rect.left) * scaleX
                this.mousePos.y = (e.clientY - rect.top) * scaleY
            })

            this.canvasBig.addEventListener('mouseleave', () =>
            {
                this.mousePos.x = -999
                this.mousePos.y = -999
                this.hoveredDiamond = null
                this.canvasBig.style.cursor = 'default'
            })

            this.canvasBig.addEventListener('click', () =>
            {
                if(this.hoveredDiamond && this.hoveredDiamond.interact)
                {
                    this.hoveredDiamond.interact()
                }
            })
        }
    }

    openBigMap()
    {
        if(!this.bigMapModal) return
        this.isBigMapOpen = true
        this.bigMapModal.style.display = 'flex'

        gsap.killTweensOf([this.bigMapBackdrop, this.bigMapContainer])
        gsap.fromTo(this.bigMapBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        gsap.fromTo(this.bigMapContainer, { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' })

        this.renderSidebar()

        if(this.game.audio)
        {
            this.game.audio.playChime()
        }
    }

    closeBigMap()
    {
        if(!this.isBigMapOpen || !this.bigMapModal) return
        this.isBigMapOpen = false

        gsap.killTweensOf([this.bigMapBackdrop, this.bigMapContainer])
        gsap.to(this.bigMapBackdrop, { opacity: 0, duration: 0.25 })
        gsap.to(this.bigMapContainer, {
            opacity: 0,
            scale: 0.95,
            y: 15,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () =>
            {
                this.bigMapModal.style.display = 'none'
            }
        })
    }

    renderSidebar()
    {
        if(!this.sidebarEl) return

        const boatPos = this.game.boat ? this.game.boat.position : { x: 0, z: 94 }

        this.sidebarEl.innerHTML = this.destinations.map(d =>
        {
            const dist = Math.round(Math.hypot(d.x - boatPos.x, d.z - boatPos.z))
            return `
                <div class="big-map-card">
                    <div class="big-map-card-name">${d.icon} ${d.name}</div>
                    <div class="big-map-card-desc">${d.desc}</div>
                    <div class="big-map-card-dist">📍 Distance: ~${dist}m</div>
                </div>
            `
        }).join('')
    }

    worldToCanvas(wx, wz, canvasWidth, canvasHeight)
    {
        const scale = (canvasWidth * 0.44) / this.worldRadius
        return {
            x: canvasWidth * 0.5 + wx * scale,
            y: canvasHeight * 0.5 + wz * scale
        }
    }

    getDiamondList()
    {
        // Query live interactive points from the game
        if(this.game.interactivePoints?.items?.length)
        {
            return this.game.interactivePoints.items.map(item => ({
                name: item.labelText || 'Interactive Point',
                x: item.group ? item.group.position.x : item.position.x,
                z: item.group ? item.group.position.z : item.position.z,
                interact: () => item.interact()
            }))
        }

        // Fallback predefined diamonds if not yet initialized
        return [
            { name: 'LinkedIn', x: -58 + Math.cos(0.60 - 1.07) * 24.5, z: -38 + Math.sin(0.60 - 1.07) * 24.5 },
            { name: 'GitHub', x: -58 + Math.cos(0.60 - 0.53) * 24.5, z: -38 + Math.sin(0.60 - 0.53) * 24.5 },
            { name: '✉️ Mail Me', x: -58 + Math.cos(0.60) * 24.5, z: -38 + Math.sin(0.60) * 24.5 },
            { name: 'LeetCode', x: -58 + Math.cos(0.60 + 0.53) * 24.5, z: -38 + Math.sin(0.60 + 0.53) * 24.5 },
            { name: 'GeeksForGeeks', x: -58 + Math.cos(0.60 + 1.07) * 24.5, z: -38 + Math.sin(0.60 + 1.07) * 24.5 },
            { name: '👤 About Me', x: -52 + 0.763 * 24.5, z: 44 - 0.646 * 24.5 },
            { name: '🔬 Lab Showcase', x: 58, z: -6.5 }
        ]
    }

    renderMinimap()
    {
        if(!this.ctxMini) return

        const ctx = this.ctxMini
        const w = this.canvasMini.width
        const h = this.canvasMini.height
        const center = { x: w * 0.5, y: h * 0.5 }

        ctx.clearRect(0, 0, w, h)

        // Lake Water Basin
        ctx.fillStyle = '#0c2438'
        ctx.beginPath()
        ctx.arc(center.x, center.y, w * 0.44, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#386b3f'
        ctx.lineWidth = 3
        ctx.stroke()

        // Islands
        for(const island of this.destinations)
        {
            const p = this.worldToCanvas(island.x, island.z, w, h)
            const mapR = island.r * ((w * 0.44) / this.worldRadius)

            ctx.fillStyle = island.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, mapR, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = '#deb887'
            ctx.lineWidth = 1.5
            ctx.stroke()
        }

        // Diamond markers on minimap
        const diamonds = this.getDiamondList()
        for(const d of diamonds)
        {
            const dp = this.worldToCanvas(d.x, d.z, w, h)
            ctx.fillStyle = '#38bdf8'
            ctx.beginPath()
            ctx.arc(dp.x, dp.y, 2.5, 0, Math.PI * 2)
            ctx.fill()
        }

        // Boat pointer
        if(this.game.boat)
        {
            const b = this.game.boat
            const bp = this.worldToCanvas(b.position.x, b.position.z, w, h)

            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'
            ctx.beginPath()
            ctx.arc(bp.x, bp.y, 7, 0, Math.PI * 2)
            ctx.fill()

            ctx.save()
            ctx.translate(bp.x, bp.y)
            ctx.rotate(-b.rotation)

            ctx.fillStyle = '#38bdf8'
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.5

            ctx.beginPath()
            ctx.moveTo(0, -6)
            ctx.lineTo(4, 5)
            ctx.lineTo(0, 3)
            ctx.lineTo(-4, 5)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()

            ctx.restore()
        }
    }

    renderBigMap()
    {
        if(!this.ctxBig) return

        const ctx = this.ctxBig
        const w = this.canvasBig.width
        const h = this.canvasBig.height
        const center = { x: w * 0.5, y: h * 0.5 }
        const time = performance.now() * 0.001

        ctx.clearRect(0, 0, w, h)

        // Background
        ctx.fillStyle = '#0a101f'
        ctx.fillRect(0, 0, w, h)

        // Concentric distance radar rings
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'
        ctx.lineWidth = 1
        for(let r = 60; r <= w * 0.44; r += 60)
        {
            ctx.beginPath()
            ctx.arc(center.x, center.y, r, 0, Math.PI * 2)
            ctx.stroke()
        }

        // Lake Water Basin
        ctx.fillStyle = '#0d2847'
        ctx.beginPath()
        ctx.arc(center.x, center.y, w * 0.44, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#387545'
        ctx.lineWidth = 6
        ctx.stroke()

        // 1. Draw Islands with clean, centered badges
        for(const island of this.destinations)
        {
            const p = this.worldToCanvas(island.x, island.z, w, h)
            const mapR = island.r * ((w * 0.44) / this.worldRadius)

            // Beach halo
            ctx.fillStyle = '#deb887'
            ctx.beginPath()
            ctx.arc(p.x, p.y, mapR + 3, 0, Math.PI * 2)
            ctx.fill()

            // Island green plateau
            ctx.fillStyle = island.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, mapR, 0, Math.PI * 2)
            ctx.fill()

            // Text Label Badge
            ctx.font = '700 13px "Space Grotesk", sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            const label = `${island.icon} ${island.name}`
            const textMetrics = ctx.measureText(label)
            const badgeW = textMetrics.width + 24
            const badgeH = 26
            const badgeX = p.x - badgeW * 0.5
            const badgeY = p.y - mapR - 30

            // Glass badge background
            ctx.fillStyle = 'rgba(10, 16, 30, 0.92)'
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6)
            ctx.fill()
            ctx.stroke()

            // Centered text
            ctx.fillStyle = '#ffffff'
            ctx.fillText(label, p.x, badgeY + badgeH * 0.5)
        }

        // 2. Draw Interactive Diamond Markers with hover detection
        const diamonds = this.getDiamondList()
        let hoveredItem = null
        let hoveredCanvasPos = null

        for(const diamond of diamonds)
        {
            const dp = this.worldToCanvas(diamond.x, diamond.z, w, h)
            const distToMouse = Math.hypot(this.mousePos.x - dp.x, this.mousePos.y - dp.y)
            const isHovered = distToMouse < 14

            if(isHovered)
            {
                hoveredItem = diamond
                hoveredCanvasPos = dp
            }

            // Pulsing halo for each diamond
            const pulse = (Math.sin(time * 3.5 + diamond.x) + 1) * 0.5
            const haloR = isHovered ? 13 : 8 + pulse * 2.5

            ctx.fillStyle = isHovered ? 'rgba(251, 191, 36, 0.35)' : 'rgba(56, 189, 248, 0.22)'
            ctx.beginPath()
            ctx.arc(dp.x, dp.y, haloR, 0, Math.PI * 2)
            ctx.fill()

            // Draw rotating diamond polygon
            ctx.save()
            ctx.translate(dp.x, dp.y)
            ctx.rotate(time * 1.5)

            const size = isHovered ? 8 : 6
            ctx.fillStyle = isHovered ? '#fbbf24' : '#38bdf8'
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.2

            ctx.beginPath()
            ctx.moveTo(0, -size)
            ctx.lineTo(size, 0)
            ctx.lineTo(0, size)
            ctx.lineTo(-size, 0)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()

            ctx.restore()
        }

        // Set cursor style
        this.hoveredDiamond = hoveredItem
        if(this.canvasBig)
        {
            this.canvasBig.style.cursor = hoveredItem ? 'pointer' : 'default'
        }

        // 3. Draw Player Boat on Big Map
        if(this.game.boat)
        {
            const b = this.game.boat
            const bp = this.worldToCanvas(b.position.x, b.position.z, w, h)

            // Pulsing location ripple
            const pulse = 10 + Math.sin(time * 4.0) * 4
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'
            ctx.beginPath()
            ctx.arc(bp.x, bp.y, pulse, 0, Math.PI * 2)
            ctx.fill()

            ctx.save()
            ctx.translate(bp.x, bp.y)
            ctx.rotate(-b.rotation)

            ctx.fillStyle = '#38bdf8'
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2

            ctx.beginPath()
            ctx.moveTo(0, -10)
            ctx.lineTo(7, 8)
            ctx.lineTo(0, 4)
            ctx.lineTo(-7, 8)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()

            ctx.restore()

            // Boat label badge
            ctx.font = '700 12px "Space Grotesk", sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            const boatLabel = '⛵ YOU ARE HERE'
            const textMetrics = ctx.measureText(boatLabel)
            const bBadgeW = textMetrics.width + 16
            const bBadgeH = 22
            const bBadgeX = bp.x - bBadgeW * 0.5
            const bBadgeY = bp.y + 16

            ctx.fillStyle = 'rgba(10, 16, 30, 0.9)'
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)'
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.roundRect(bBadgeX, bBadgeY, bBadgeW, bBadgeH, 5)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = '#38bdf8'
            ctx.fillText(boatLabel, bp.x, bBadgeY + bBadgeH * 0.5)
        }

        // 4. Draw Rich Floating Tooltip for Hovered Diamond
        if(hoveredItem && hoveredCanvasPos)
        {
            ctx.save()

            const title = hoveredItem.name
            ctx.font = '700 13px "Space Grotesk", sans-serif'
            const titleMetrics = ctx.measureText(title)

            ctx.font = '500 11px "Inter", sans-serif'
            const sub = 'Click to open / inspect'
            const subMetrics = ctx.measureText(sub)

            const tooltipW = Math.max(titleMetrics.width, subMetrics.width) + 28
            const tooltipH = 46

            // Position above or below diamond with boundary clamp
            let tooltipX = hoveredCanvasPos.x - tooltipW * 0.5
            tooltipX = Math.max(10, Math.min(w - tooltipW - 10, tooltipX))

            let tooltipY = hoveredCanvasPos.y - tooltipH - 16
            if(tooltipY < 10)
            {
                tooltipY = hoveredCanvasPos.y + 16
            }

            // Glass tooltip card
            ctx.fillStyle = 'rgba(13, 20, 36, 0.96)'
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 1.5
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
            ctx.shadowBlur = 16
            ctx.beginPath()
            ctx.roundRect(tooltipX, tooltipY, tooltipW, tooltipH, 8)
            ctx.fill()
            ctx.stroke()

            ctx.shadowBlur = 0 // Reset shadow

            // Diamond icon + Title
            ctx.font = '700 13px "Space Grotesk", sans-serif'
            ctx.fillStyle = '#fbbf24'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`💎 ${title}`, tooltipX + tooltipW * 0.5, tooltipY + 16)

            // Subtitle action hint
            ctx.font = '500 11px "Inter", sans-serif'
            ctx.fillStyle = 'rgba(226, 232, 240, 0.8)'
            ctx.fillText(sub, tooltipX + tooltipW * 0.5, tooltipY + 32)

            ctx.restore()
        }
    }
}
