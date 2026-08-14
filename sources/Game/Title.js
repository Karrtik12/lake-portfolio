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

        gsap.killTweensOf(this.textElement)
        gsap.fromTo(
            this.textElement,
            { opacity: 0, y: -16 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
        )
    }

    hide()
    {
        if(!this.element || !this.textElement) return

        this.currentTitle = ''
        gsap.killTweensOf(this.textElement)
        gsap.to(this.textElement, {
            opacity: 0,
            y: -16,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: () =>
            {
                this.element.style.display = 'none'
            }
        })
    }
}
