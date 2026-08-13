import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * InteractivePoints — floating 3D diamond markers with dynamic glowing active focus beams,
 * animated halo rings, and crisp billboarded labels.
 */
export class InteractivePoints
{
    static STATE_HIDDEN = 1
    static STATE_CONCEALED = 2
    static STATE_OPEN = 3

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

        // Listen for keyboard interact (Enter / Space)
        this.game.inputs.events.on('interact', () =>
        {
            if(this.activeItem && this.activeItem.state === InteractivePoints.STATE_OPEN)
            {
                this.activeItem.interact()
            }
        })

        // Update loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    create(position, labelText, interactCallback)
    {
        const group = new THREE.Group()
        group.position.copy(position)
        group.position.y += 1.8 // Float above water/ground

        // 1. Floating Diamond
        const diamondGeo = new THREE.OctahedronGeometry(0.7, 0)
        const diamond = new THREE.Mesh(diamondGeo, this.diamondMaterial)
        group.add(diamond)

        // 2. Pulsing Halo Ring
        const haloGeo = new THREE.TorusGeometry(1.1, 0.04, 8, 24)
        haloGeo.rotateX(Math.PI * 0.5)
        const halo = new THREE.Mesh(haloGeo, this.haloMaterial)
        group.add(halo)

        // 3. Vertical Focus Beam (shown when active)
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8)
        const beamMat = new THREE.MeshBasicNodeMaterial({
            color: '#fbbf24',
            transparent: true,
            opacity: 0.0
        })
        const beam = new THREE.Mesh(beamGeo, beamMat)
        beam.position.y = 1.6
        group.add(beam)

        // 4. Canvas Text Label (Billboard)
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 80
        const ctx = canvas.getContext('2d')

        const labelTexture = new THREE.CanvasTexture(canvas)
        labelTexture.minFilter = THREE.LinearFilter
        labelTexture.magFilter = THREE.LinearFilter

        const labelGeo = new THREE.PlaneGeometry(3.0, 0.75)
        const labelMat = new THREE.MeshBasicNodeMaterial({
            map: labelTexture,
            transparent: true,
            depthWrite: false
        })

        const label = new THREE.Mesh(labelGeo, labelMat)
        label.position.y = 1.35
        label.scale.setScalar(0)
        group.add(label)

        this.game.scene.add(group)

        const item = {
            group,
            diamond,
            halo,
            beam,
            label,
            canvas,
            ctx,
            labelTexture,
            labelText,
            position: new THREE.Vector2(position.x, position.z),
            heightY: group.position.y,
            state: InteractivePoints.STATE_CONCEALED,
            isFocused: false,
            interactCallback,
            mesh: diamond,
            active: true
        }

        this.renderLabel(item, false)

        // RayCursor click hit target
        item.intersect = this.game.rayCursor.addIntersect({
            mesh: diamond,
            active: true,
            onClick: () => item.interact(),
            onEnter: () => item.reveal(),
            onLeave: () =>
            {
                if(!item.isPlayerNear) item.conceal()
            }
        })

        item.reveal = () =>
        {
            if(item.state === InteractivePoints.STATE_OPEN) return
            item.state = InteractivePoints.STATE_OPEN

            gsap.to(diamond.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.4, ease: 'back.out(2)' })
            gsap.to(label.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.4, ease: 'back.out(2)' })
        }

        item.conceal = () =>
        {
            if(item.state === InteractivePoints.STATE_CONCEALED) return
            item.state = InteractivePoints.STATE_CONCEALED
            this.setFocusState(item, false)

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

        this.items.push(item)
        return item
    }

    renderLabel(item, isFocused)
    {
        const ctx = item.ctx
        ctx.clearRect(0, 0, 320, 80)

        // Rounded pill background
        ctx.fillStyle = isFocused ? 'rgba(15, 23, 42, 0.95)' : 'rgba(10, 14, 23, 0.85)'
        ctx.strokeStyle = isFocused ? '#fbbf24' : '#38bdf8'
        ctx.lineWidth = isFocused ? 5 : 3

        ctx.beginPath()
        ctx.roundRect(8, 8, 304, 64, 32)
        ctx.fill()
        ctx.stroke()

        if(isFocused)
        {
            // Glowing enter prompt tag
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
            ctx.fillStyle = '#f8fafc'
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

        this.renderLabel(item, isFocused)

        if(isFocused)
        {
            item.diamond.material = this.diamondActiveMaterial
            item.halo.material = this.haloActiveMaterial
            gsap.to(item.beam.material, { opacity: 0.65, duration: 0.3 })
            gsap.to(item.halo.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 0.4, ease: 'back.out(2)' })
        }
        else
        {
            item.diamond.material = this.diamondMaterial
            item.halo.material = this.haloMaterial
            gsap.to(item.beam.material, { opacity: 0.0, duration: 0.3 })
            gsap.to(item.halo.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3 })
        }
    }

    update()
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
            const isNear = dist < 14.0

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
