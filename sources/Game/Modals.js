import gsap from 'gsap'
import { Game } from './Game.js'

/**
 * Modals — manages HTML overlay dialogs for project details, about bio, and external links.
 */
export class Modals
{
    constructor()
    {
        this.game = Game.getInstance()

        this.modalElement = document.querySelector('.js-modal')
        this.backdropElement = document.querySelector('.js-modal-backdrop')
        this.contentElement = document.querySelector('.js-modal-content')
        this.isOpen = false

        if(this.backdropElement)
        {
            this.backdropElement.addEventListener('click', () =>
            {
                this.close()
            })
        }

        this.game.inputs.events.on('escape', () =>
        {
            if(this.isOpen)
            {
                this.close()
            }
        })
    }

    open(htmlContent)
    {
        if(!this.modalElement || !this.contentElement) return
        if(this.isOpen) return // Prevent duplicate open calls

        this.isOpen = true
        this.contentElement.innerHTML = `
            <button class="modal-close js-modal-close" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                color: rgba(255,255,255,0.8);
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1rem;
                display: flex;
                align-items: center;
                justify-content: center;
            ">✕</button>
            ${htmlContent}
        `

        const closeBtn = this.contentElement.querySelector('.js-modal-close')
        if(closeBtn)
        {
            closeBtn.addEventListener('click', () => this.close())
        }

        this.modalElement.style.display = 'flex'
        gsap.killTweensOf([this.backdropElement, this.contentElement])

        gsap.fromTo(
            this.backdropElement,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 }
        )

        gsap.fromTo(
            this.contentElement,
            { opacity: 0, scale: 0.92, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        )
    }

    close()
    {
        if(!this.isOpen || !this.modalElement) return

        this.isOpen = false
        gsap.killTweensOf([this.backdropElement, this.contentElement])

        gsap.to(this.backdropElement, {
            opacity: 0,
            duration: 0.25
        })

        gsap.to(this.contentElement, {
            opacity: 0,
            scale: 0.95,
            y: 15,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () =>
            {
                this.modalElement.style.display = 'none'
            }
        })
    }
}
