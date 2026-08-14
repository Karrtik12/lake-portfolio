import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * InteractivePoints — manages in-world 3D diamond interactables, pulsing focus beams,
 * floating billboard labels, and direct raycast click/tap handling.
 */
export class InteractivePoints
{
    constructor()
    {
        this.game = Game.getInstance()
        this.items = []
        this.activeItem = null

        // Materials
        this.diamondMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#38bdf8',
            roughness: 0.2,
            metalness: 0.8,
            emissive: '#0284c7',
            emissiveIntensity: 0.6
        })

        this.diamondActiveMaterial = new THREE.MeshStandardNodeMaterial({
            color: '#fbbf24', // Golden glow when active/focused
            roughness: 0.1,
            metalness: 0.9,
            emissive: '#f59e0b',
            emissiveIntensity: 1.2
        })

        this.haloMaterial = new THREE.MeshBasicNodeMaterial({
            color: '#38bdf8',
            wireframe: true,
            transparent: true,
            opacity: 0.4
        })

        this.haloActiveMaterial = new THREE.MeshBasicNodeMaterial({
            color: '#fbbf24',
            wireframe: true,
            transparent: true,
            opacity: 0.9
        })

        // Listen for keyboard interact (Enter) on desktop
        this.game.inputs.events.on('interact', () =>
        {
            if(this.game.labIsland && this.game.labIsland.isFocused)
            {
                return
            }

            if(this.activeItem)
            {
                this.activeItem.interact()
                return
            }

            // Fallback: check if player boat is within 22m of any item
            if(!this.game.boat) return
            const boatPos = new THREE.Vector2(this.game.boat.position.x, this.game.boat.position.z)
            let nearest = null
            let minDist = 22.0

            for(const item of this.items)
            {
                const d = item.position.distanceTo(boatPos)
                if(d < minDist)
                {
                    minDist = d
                    nearest = item
                }
            }

            if(nearest)
            {
                nearest.interact()
            }
        })

        // Update loop
        this.game.ticker.events.on('tick', (delta) =>
        {
            this.update(delta)
        })
    }

    createPoint(options)
    {
        const item = {}
        item.position = new THREE.Vector2(options.position.x, options.position.z)
        item.heightY = options.position.y || 1.0
        item.labelText = options.label || 'Point of Interest'
        item.interactCallback = options.onInteract
        item.isPlayerNear = false
        item.isFocused = false

        // Group container
        item.group = new THREE.Group()
        item.group.position.set(options.position.x, item.heightY, options.position.z)
        this.game.scene.add(item.group)

        // 1. Octahedron Diamond Mesh
        const diamondGeo = new THREE.OctahedronGeometry(0.85, 0)
        const diamond = new THREE.Mesh(diamondGeo, this.diamondMaterial)
        item.diamond = diamond
        item.group.add(diamond)

        // 2. Glowing Halo Wireframe Sphere
        const haloGeo = new THREE.SphereGeometry(1.35, 12, 8)
        const halo = new THREE.Mesh(haloGeo, this.haloMaterial)
        halo.visible = false
        item.halo = halo
        item.group.add(halo)

        // 3. Dynamic High-Res Canvas Texture for 3D Floating Pill Label
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 80
        const ctx = canvas.getContext('2d')
        item.canvas = canvas
        item.ctx = ctx

        const texture = new THREE.CanvasTexture(canvas)
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        item.labelTexture = texture

        const labelMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        })

        const label = new THREE.Sprite(labelMat)
        label.position.set(0, 1.75, 0)
        label.scale.set(3.6, 0.9, 1.0)
        item.label = label
        item.group.add(label)

        // Initial label render
        this.renderLabel(item, false)

        // 4. Point light for diamond glow
        const light = new THREE.PointLight('#38bdf8', 2.0, 14.0)
        light.position.set(0, 0, 0)
        item.light = light
        item.group.add(light)

        // Reveal / Conceal animations
        item.reveal = () =>
        {
            if(item.revealed) return
            item.revealed = true
            item.label.visible = true
            item.group.visible = true
            gsap.to(diamond.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.4, ease: 'back.out(1.7)' })
            gsap.to(label.scale, { x: 3.6, y: 0.9, z: 1.0, duration: 0.4, ease: 'back.out(1.5)' })
        }

        item.conceal = () =>
        {
            if(!item.revealed) return
            item.revealed = false
            item.label.visible = false
            gsap.to(diamond.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3, ease: 'power2.in' })
            gsap.to(label.scale, { x: 0, y: 0, z: 0, duration: 0.3, ease: 'power2.in' })
        }

        item.interact = () =>
        {
            gsap.to(diamond.scale, {
                x: 1.8,
                y: 1.8,
                z: 1.8,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            })

            if(this.game.audio)
            {
                this.game.audio.playChime()
            }

            if(typeof item.interactCallback === 'function')
            {
                item.interactCallback()
            }
        }

        // Register with RayCursor so clicking/tapping the 3D diamond in the water triggers interaction
        if(this.game.rayCursor)
        {
            this.game.rayCursor.addIntersect({
                mesh: item.group,
                active: true,
                onClick: () => item.interact()
            })
        }

        this.items.push(item)
        return item
    }

    renderLabel(item, isFocused)
    {
        const ctx = item.ctx
        ctx.clearRect(0, 0, 320, 80)

        // Rounded pill background
        ctx.fillStyle = isFocused ? 'rgba(15, 23, 42, 0.96)' : 'rgba(10, 14, 23, 0.85)'
        ctx.strokeStyle = isFocused ? '#fbbf24' : '#38bdf8'
        ctx.lineWidth = isFocused ? 5 : 3

        ctx.beginPath()
        ctx.roundRect(8, 8, 304, 64, 32)
        ctx.fill()
        ctx.stroke()

        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024)

        if(isFocused && !isTouch)
        {
            // Desktop Focused State: show keyboard enter prompt
            ctx.fillStyle = '#fbbf24'
            ctx.font = 'bold 13px "Space Grotesk", sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('PRESS [ENTER] ↵', 160, 26)

            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 22px "Space Grotesk", sans-serif'
            ctx.fillText(item.labelText, 160, 54)
        }
        else
        {
            // Clean centered title on mobile and unfocused desktop (NO enter sign)
            ctx.fillStyle = isFocused ? '#ffffff' : '#f8fafc'
            ctx.font = 'bold 22px "Space Grotesk", sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(item.labelText, 160, 40)
        }

        item.labelTexture.needsUpdate = true
    }

    setFocusState(item, isFocused)
    {
        if(item.isFocused === isFocused) return
        item.isFocused = isFocused

        if(item.label)
        {
            this.renderLabel(item, isFocused)
        }

        if(item.diamond)
        {
            item.diamond.material = isFocused ? this.diamondActiveMaterial : this.diamondMaterial
            if(isFocused)
            {
                gsap.killTweensOf(item.diamond.scale)
                gsap.to(item.diamond.scale, { x: 1.45, y: 1.45, z: 1.45, duration: 0.35, ease: 'back.out(1.7)' })
            }
            else
            {
                gsap.killTweensOf(item.diamond.scale)
                gsap.to(item.diamond.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.25, ease: 'power2.out' })
            }
        }

        if(item.halo)
        {
            item.halo.material = isFocused ? this.haloActiveMaterial : this.haloMaterial
            item.halo.visible = isFocused
        }
    }

    update(delta)
    {
        if(!this.game.boat) return

        const boatPos = new THREE.Vector2(this.game.boat.position.x, this.game.boat.position.z)
        const time = performance.now() * 0.001

        let closestItem = null
        let minDistance = Infinity

        for(const item of this.items)
        {
            // Continuous diamond spin & gentle bob
            item.diamond.rotation.y = time * 1.6
            item.diamond.rotation.x = Math.sin(time * 2.0) * 0.25

            // Halo pulse
            item.halo.rotation.z = time * 0.8
            const pulse = 1.0 + Math.sin(time * 3.0) * 0.08
            if(!item.isFocused)
            {
                item.halo.scale.set(pulse, pulse, pulse)
            }

            item.group.position.y = item.heightY + Math.sin(time * 2.5 + item.position.x) * 0.18

            // Billboard label towards active camera
            if(this.game.view?.camera)
            {
                item.label.quaternion.copy(this.game.view.camera.quaternion)
            }

            // Proximity check to player boat
            const dist = item.position.distanceTo(boatPos)
            const isNear = dist < 22.0

            item.isPlayerNear = isNear

            if(isNear)
            {
                item.reveal()
                if(dist < minDistance)
                {
                    minDistance = dist
                    closestItem = item
                }
            }
            else
            {
                item.conceal()
            }
        }

        // Highlight the single active / closest diamond with the golden glow focus beam
        for(const item of this.items)
        {
            if(item === closestItem)
            {
                this.setFocusState(item, true)
            }
            else
            {
                this.setFocusState(item, false)
            }
        }

        this.activeItem = closestItem
    }
}
