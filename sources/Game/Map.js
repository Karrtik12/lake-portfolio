import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * Map — manages the real-time HUD minimap and the full-screen Big Map destination overlay.
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

        const boatPos = this.game.boat ? this.game.boat.position : { x: 0, z: 36 }

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

        ctx.clearRect(0, 0, w, h)

        // Background
        ctx.fillStyle = '#0a101f'
        ctx.fillRect(0, 0, w, h)

        // Concentric distance radar rings
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'
        ctx.lineWidth = 1
        for(let r = 50; r <= w * 0.44; r += 50)
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

        // Draw Islands with detailed labels
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
            ctx.font = 'bold 15px "Space Grotesk", sans-serif'
            const label = `${island.icon} ${island.name}`
            const textMetrics = ctx.measureText(label)
            const badgeW = textMetrics.width + 16
            const badgeH = 26

            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.roundRect(p.x - badgeW * 0.5, p.y - mapR - 32, badgeW, badgeH, 6)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = '#ffffff'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, p.x, p.y - mapR - 19)
        }

        // Draw Player Boat on Big Map
        if(this.game.boat)
        {
            const b = this.game.boat
            const bp = this.worldToCanvas(b.position.x, b.position.z, w, h)

            // Pulsing location ripple
            const pulse = 10 + Math.sin(performance.now() * 0.005) * 4
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

            // Boat label
            ctx.font = 'bold 13px "Space Grotesk", sans-serif'
            ctx.fillStyle = '#38bdf8'
            ctx.textAlign = 'center'
            ctx.fillText('⛵ YOU ARE HERE', bp.x, bp.y + 22)
        }
    }
}
