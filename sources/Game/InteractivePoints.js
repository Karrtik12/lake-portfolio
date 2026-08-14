import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * InteractivePoints — manages in-world 3D diamond interactables, pulsing focus beams,
 * high-resolution opaque floating labels, and the on-screen interactive toast button.
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

        // On-screen Interaction Toast Button Elements
        this.toastEl = document.querySelector('.js-interact-toast')
        this.toastKeyEl = document.querySelector('.js-interact-toast-key')
        this.toastTextEl = document.querySelector('.js-interact-toast-text')
        this.isToastVisible = false

        // Click / tap handler for the on-screen toast button
        if(this.toastEl)
        {
            this.toastEl.addEventListener('click', (e) =>
            {
                e.preventDefault()
                e.stopPropagation()

                if(this.activeItem && typeof this.activeItem.interact === 'function')
                {
                    this.activeItem.interact()
                }
            })
        }

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

    create(posOrOptions, label, onInteract)
    {
        if(posOrOptions && posOrOptions.position)
        {
            return this.createPoint(posOrOptions)
        }
        return this.createPoint({
            position: posOrOptions,
            label: label,
            onInteract: onInteract
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

        // 3. High-Resolution 2X Retina Canvas for 3D Floating Capsule Label (Always 100% Opaque)
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 128
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
            depthWrite: false,
            depthTest: true
        })

        // Standard 3D world sprite size (4:1 aspect ratio matching 512:128)
        item.baseScaleY = 0.75
        item.baseScaleX = 3.0

        const label = new THREE.Sprite(labelMat)
        label.position.set(0, 1.75, 0)
        label.scale.set(item.baseScaleX, item.baseScaleY, 1.0)
        item.label = label
        item.group.add(label)

        // Initial label render
        this.renderLabel(item, false)

        // 4. Point light for diamond glow
        const light = new THREE.PointLight('#38bdf8', 2.0, 14.0)
        light.position.set(0, 0, 0)
        item.light = light
        item.group.add(light)

        let lastInteractTime = 0
        item.interact = () =>
        {
            const now = performance.now()
            if(now - lastInteractTime < 450) return
            lastInteractTime = now

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

        // Register diamond mesh with RayCursor so clicking/tapping the 3D diamond in the water triggers interaction
        if(this.game.rayCursor && item.diamond)
        {
            this.game.rayCursor.addIntersect({
                mesh: item.diamond,
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
        ctx.clearRect(0, 0, 512, 128)

        // Measure text with generous safety padding
        ctx.font = '700 36px "Space Grotesk", sans-serif'
        const textMetrics = ctx.measureText(item.labelText)
        const textW = textMetrics.width

        const padX = 42
        const pillW = Math.min(480, Math.max(220, textW + padX * 2))
        const pillH = 76
        const pillX = (512 - pillW) * 0.5
        const pillY = (128 - pillH) * 0.5
        const pillRadius = pillH * 0.5

        // Solid, rich, 100% opaque capsule fill (high contrast against water)
        ctx.fillStyle = isFocused ? '#1e293b' : '#131d31'
        ctx.strokeStyle = isFocused ? '#fbbf24' : '#38bdf8'
        ctx.lineWidth = isFocused ? 7 : 4.5

        ctx.beginPath()
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius)
        ctx.fill()
        ctx.stroke()

        // Pure white high-contrast centered text (never offset or truncated)
        ctx.fillStyle = '#ffffff'
        ctx.font = '700 36px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(item.labelText, 256, 64)

        item.labelTexture.needsUpdate = true
    }

    setFocusState(item, isFocused)
    {
        if(item.isFocused === isFocused) return
        item.isFocused = isFocused

        if(item.label)
        {
            this.renderLabel(item, isFocused)

            // Smooth subtle scale pulse when in focus
            gsap.killTweensOf(item.label.scale)
            if(isFocused)
            {
                gsap.to(item.label.scale, {
                    x: item.baseScaleX * 1.12,
                    y: item.baseScaleY * 1.12,
                    duration: 0.3,
                    ease: 'power2.out'
                })
            }
            else
            {
                gsap.to(item.label.scale, {
                    x: item.baseScaleX,
                    y: item.baseScaleY,
                    duration: 0.25,
                    ease: 'power2.out'
                })
            }
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

            // Billboard label towards active camera (always visible)
            if(this.game.view?.camera && item.label)
            {
                item.label.quaternion.copy(this.game.view.camera.quaternion)
            }

            // Proximity check to player boat
            const dist = item.position.distanceTo(boatPos)
            const isNear = dist < 22.0

            item.isPlayerNear = isNear

            if(isNear && dist < minDistance)
            {
                minDistance = dist
                closestItem = item
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

        // Manage on-screen interaction toast button
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024)

        if(closestItem && !this.isToastVisible)
        {
            this.isToastVisible = true
            if(this.toastKeyEl)
            {
                this.toastKeyEl.style.display = isTouch ? 'none' : 'inline-block'
            }
            if(this.toastEl && this.toastTextEl)
            {
                this.toastTextEl.textContent = `Open ${closestItem.labelText}`
                this.toastEl.style.display = 'flex'
                gsap.killTweensOf(this.toastEl)
                gsap.fromTo(this.toastEl, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
            }
        }
        else if(closestItem && this.isToastVisible && this.toastTextEl)
        {
            this.toastTextEl.textContent = `Open ${closestItem.labelText}`
            if(this.toastKeyEl)
            {
                this.toastKeyEl.style.display = isTouch ? 'none' : 'inline-block'
            }
        }
        else if(!closestItem && this.isToastVisible)
        {
            this.isToastVisible = false
            if(this.toastEl)
            {
                gsap.killTweensOf(this.toastEl)
                gsap.to(this.toastEl, {
                    opacity: 0,
                    y: 10,
                    duration: 0.25,
                    onComplete: () =>
                    {
                        this.toastEl.style.display = 'none'
                    }
                })
            }
        }

        this.activeItem = closestItem
    }
}
