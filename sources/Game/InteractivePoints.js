import * as THREE from 'three/webgpu'
import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * InteractivePoints — floating 3D diamond markers with dynamic text labels, proximity triggers, and click/key actions.
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

        // Shared materials
        this.diamondMaterial = new THREE.MeshBasicNodeMaterial({
            color: '#60a5fa',
            wireframe: false
        })

        this.diamondWireMaterial = new THREE.MeshBasicNodeMaterial({
            color: '#ffffff',
            wireframe: true
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
        const diamondGeo = new THREE.OctahedronGeometry(0.65, 0)
        const diamond = new THREE.Mesh(diamondGeo, this.diamondMaterial)
        const diamondWire = new THREE.Mesh(diamondGeo, this.diamondWireMaterial)
        diamondWire.scale.setScalar(1.05)
        diamond.add(diamondWire)
        group.add(diamond)

        // 2. Canvas Text Label (Billboard)
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 64
        const ctx = canvas.getContext('2d')

        // Render pill background + crisp text
        ctx.fillStyle = 'rgba(10, 14, 23, 0.85)'
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.roundRect(8, 8, 240, 48, 24)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labelText, 128, 32)

        const labelTexture = new THREE.CanvasTexture(canvas)
        labelTexture.minFilter = THREE.LinearFilter
        labelTexture.magFilter = THREE.LinearFilter

        const labelGeo = new THREE.PlaneGeometry(2.4, 0.6)
        const labelMat = new THREE.MeshBasicNodeMaterial({
            map: labelTexture,
            transparent: true,
            depthWrite: false
        })

        const label = new THREE.Mesh(labelGeo, labelMat)
        label.position.y = 1.1
        label.scale.setScalar(0)
        group.add(label)

        this.game.scene.add(group)

        const item = {
            group,
            diamond,
            label,
            position: new THREE.Vector2(position.x, position.z),
            heightY: group.position.y,
            state: InteractivePoints.STATE_CONCEALED,
            interactCallback,
            mesh: diamond,
            active: true
        }

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

            gsap.to(diamond.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.4, ease: 'back.out(2)' })
            gsap.to(label.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.4, ease: 'back.out(2)' })
        }

        item.conceal = () =>
        {
            if(item.state === InteractivePoints.STATE_CONCEALED) return
            item.state = InteractivePoints.STATE_CONCEALED

            gsap.to(diamond.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3, ease: 'power2.in' })
            gsap.to(label.scale, { x: 0, y: 0, z: 0, duration: 0.3, ease: 'power2.in' })
        }

        item.interact = () =>
        {
            gsap.to(diamond.scale, {
                x: 1.6,
                y: 1.6,
                z: 1.6,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            })

            if(typeof item.interactCallback === 'function')
            {
                item.interactCallback()
            }
        }

        this.items.push(item)
        return item
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
            item.diamond.rotation.y = time * 1.5
            item.diamond.rotation.x = Math.sin(time * 2.0) * 0.2
            item.group.position.y = item.heightY + Math.sin(time * 2.5 + item.position.x) * 0.15

            // Billboard label towards active camera
            if(this.game.view?.camera)
            {
                item.label.quaternion.copy(this.game.view.camera.quaternion)
            }

            // Proximity check to player boat
            const dist = item.position.distanceTo(boatPos)
            const isNear = dist < 12.0

            item.isPlayerNear = isNear

            if(isNear && dist < minDistance)
            {
                minDistance = dist
                closestItem = item
            }

            if(isNear)
            {
                item.reveal()
            }
            else
            {
                item.conceal()
            }
        }

        this.activeItem = closestItem
    }
}
