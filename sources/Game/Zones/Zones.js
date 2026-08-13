import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Events } from '../Events.js'

/**
 * Zones — proximity trigger manager for island areas and spawn dock.
 */
export class Zones
{
    constructor()
    {
        this.game = Game.getInstance()
        this.events = new Events()
        this.items = []

        // Register default zones
        this.registerDefaultZones()

        // Update loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    registerDefaultZones()
    {
        this.create('Spawn Dock', new THREE.Vector3(0, 0, 36), 16)
        this.create('Socials Island', new THREE.Vector3(-36, 0, -22), 22)
        this.create('Lab Island', new THREE.Vector3(36, 0, -20), 24)
        this.create('About Island', new THREE.Vector3(-30, 0, 24), 20)
    }

    create(name, position, radius)
    {
        const zone = {
            name,
            position: new THREE.Vector2(position.x, position.z),
            radius,
            isIn: false
        }

        this.items.push(zone)
        return zone
    }

    update()
    {
        if(!this.game.boat) return

        const boatPos = new THREE.Vector2(this.game.boat.position.x, this.game.boat.position.z)

        for(const zone of this.items)
        {
            const dist = zone.position.distanceTo(boatPos)
            const isInside = dist < zone.radius

            if(isInside && !zone.isIn)
            {
                zone.isIn = true
                this.events.trigger('enter', [zone])
                if(this.game.title)
                {
                    this.game.title.show(zone.name)
                }
            }
            else if(!isInside && zone.isIn)
            {
                zone.isIn = false
                this.events.trigger('leave', [zone])

                // If leaving current zone, hide title if no other active zone
                const anyActive = this.items.some(z => z.isIn)
                if(!anyActive && this.game.title)
                {
                    this.game.title.hide()
                }
            }
        }
    }
}
