import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

/**
 * RayCursor — handles mouse raycasting against interactive objects and markers.
 */
export class RayCursor
{
    constructor()
    {
        this.game = Game.getInstance()

        this.raycaster = new THREE.Raycaster()
        this.pointer = new THREE.Vector2(-999, -999)
        this.intersects = []
        this.hoveredItem = null

        // Track pointer
        window.addEventListener('pointermove', (e) =>
        {
            this.pointer.x = (e.clientX / this.game.viewport.width) * 2 - 1
            this.pointer.y = -(e.clientY / this.game.viewport.height) * 2 + 1
        })

        // Pointerdown / touch tap interaction for mobile & desktop
        window.addEventListener('pointerdown', (e) =>
        {
            this.pointer.x = (e.clientX / this.game.viewport.width) * 2 - 1
            this.pointer.y = -(e.clientY / this.game.viewport.height) * 2 + 1
            this.update()
            if(this.hoveredItem && typeof this.hoveredItem.onClick === 'function')
            {
                this.hoveredItem.onClick()
            }
        })

        // Click interaction
        window.addEventListener('click', () =>
        {
            if(this.hoveredItem && typeof this.hoveredItem.onClick === 'function')
            {
                this.hoveredItem.onClick()
            }
        })

        // Update loop
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    addIntersect(item)
    {
        this.intersects.push(item)
        return item
    }

    removeIntersect(item)
    {
        const index = this.intersects.indexOf(item)
        if(index !== -1)
        {
            this.intersects.splice(index, 1)
        }
    }

    update()
    {
        if(!this.game.view?.camera || this.intersects.length === 0) return

        this.raycaster.setFromCamera(this.pointer, this.game.view.camera)

        let closestItem = null
        let closestDist = Infinity

        for(const item of this.intersects)
        {
            if(!item.active || !item.mesh) continue

            const hits = this.raycaster.intersectObject(item.mesh, true)
            if(hits.length > 0 && hits[0].distance < closestDist)
            {
                closestDist = hits[0].distance
                closestItem = item
            }
        }

        if(closestItem !== this.hoveredItem)
        {
            if(this.hoveredItem && typeof this.hoveredItem.onLeave === 'function')
            {
                this.hoveredItem.onLeave()
            }

            this.hoveredItem = closestItem

            if(this.hoveredItem)
            {
                document.body.style.cursor = 'pointer'
                if(typeof this.hoveredItem.onEnter === 'function')
                {
                    this.hoveredItem.onEnter()
                }
            }
            else
            {
                document.body.style.cursor = 'default'
            }
        }
    }
}
