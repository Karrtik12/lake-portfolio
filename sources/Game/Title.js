import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * Title — displays zone header text on entering an island area.
 */
export class Title
{
    constructor()
    {
        this.game = Game.getInstance()

        this.element = document.querySelector('.js-zone-title')
        this.textElement = document.querySelector('.js-zone-title-text')
        this.currentTitle = ''
    }

    show(text)
    {
        if(!this.element || !this.textElement) return
        if(this.currentTitle === text) return

        this.currentTitle = text
        this.textElement.textContent = text
        this.element.style.display = 'flex'

        gsap.killTweensOf(this.element)
        gsap.fromTo(
            this.element,
            { opacity: 0, scale: 0.85 },
            { opacity: 1, scale: 1.0, duration: 0.6, ease: 'back.out(1.2)' }
        )
    }

    hide()
    {
        if(!this.element) return

        this.currentTitle = ''
        gsap.killTweensOf(this.element)
        gsap.to(this.element, {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () =>
            {
                this.element.style.display = 'none'
            }
        })
    }
}
