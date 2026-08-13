import { Game } from './Game.js'

/**
 * Map — renders a real-time overhead minimap displaying the lake, islands, and player boat.
 */
export class Map
{
    constructor()
    {
        this.game = Game.getInstance()

        this.canvas = document.querySelector('.js-minimap-canvas')
        if(!this.canvas) return

        this.ctx = this.canvas.getContext('2d')
        this.width = this.canvas.width
        this.height = this.canvas.height
        this.center = { x: this.width * 0.5, y: this.height * 0.5 }
        this.worldRadius = 80 // World units mapped to minimap radius

        // Update loop
        this.game.ticker.events.on('tick', () =>
        {
            this.render()
        })
    }

    worldToMap(wx, wz)
    {
        const scale = (this.width * 0.44) / this.worldRadius
        return {
            x: this.center.x + wx * scale,
            y: this.center.y + wz * scale
        }
    }

    render()
    {
        if(!this.ctx) return

        const ctx = this.ctx
        ctx.clearRect(0, 0, this.width, this.height)

        // 1. Lake Water Basin
        ctx.fillStyle = '#0c2438'
        ctx.beginPath()
        ctx.arc(this.center.x, this.center.y, this.width * 0.44, 0, Math.PI * 2)
        ctx.fill()

        // Shoreline border ring
        ctx.strokeStyle = '#386b3f'
        ctx.lineWidth = 3
        ctx.stroke()

        // 2. Islands
        const islands = [
            { x: -36, z: -22, r: 12, name: 'Socials', color: '#2d5a35' },
            { x:  36, z: -20, r: 14, name: 'Lab',     color: '#285542' },
            { x: -30, z:  24, r: 11, name: 'About',   color: '#366133' },
            { x:   0, z:  44, r:  6, name: 'Dock',    color: '#704828' }
        ]

        for(const island of islands)
        {
            const p = this.worldToMap(island.x, island.z)
            const mapR = island.r * ((this.width * 0.44) / this.worldRadius)

            ctx.fillStyle = island.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, mapR, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = '#d4b886'
            ctx.lineWidth = 1.5
            ctx.stroke()
        }

        // 3. Player Boat
        if(this.game.boat)
        {
            const b = this.game.boat
            const bp = this.worldToMap(b.position.x, b.position.z)

            // Outer glow
            ctx.fillStyle = 'rgba(96, 165, 250, 0.35)'
            ctx.beginPath()
            ctx.arc(bp.x, bp.y, 7, 0, Math.PI * 2)
            ctx.fill()

            // Directional pointer triangle
            ctx.save()
            ctx.translate(bp.x, bp.y)
            ctx.rotate(-b.rotation) // Align with heading (0 = North)

            ctx.fillStyle = '#60a5fa'
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
}
