import { Events } from '../Events.js'

/**
 * TouchControls — responsive virtual analog joystick and touch action buttons (Boost, Interact)
 * designed for seamless mobile phone and touchscreen gameplay.
 */
export class TouchControls
{
    constructor()
    {
        this.events = new Events()
        this.isTouchDevice = this.detectTouch()

        // Input state
        this.axes = {
            forward: 0,
            right: 0,
            boost: false
        }

        // Joystick configuration
        this.joystick = {
            active: false,
            touchId: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            maxRadius: 48, // max joystick travel distance in px
            deadzone: 8
        }

        // DOM elements
        this.controlsContainer = document.querySelector('.js-mobile-controls')
        this.joystickZone = document.querySelector('.js-joystick-zone')
        this.joystickBase = document.querySelector('.js-joystick-base')
        this.joystickThumb = document.querySelector('.js-joystick-thumb')
        this.boostBtn = document.querySelector('.js-touch-boost')
        this.interactBtn = document.querySelector('.js-touch-interact')

        this.hasMoved = false

        if(this.isTouchDevice)
        {
            this.setupTouchListeners()
        }
    }

    detectTouch()
    {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
    }

    setupTouchListeners()
    {
        if(!this.joystickZone) return

        // 1. Virtual Joystick Touch Tracking
        this.joystickZone.addEventListener('touchstart', (e) =>
        {
            e.preventDefault()
            const touch = e.changedTouches[0]
            if(!touch) return

            const rect = this.joystickZone.getBoundingClientRect()
            this.joystick.active = true
            this.joystick.touchId = touch.identifier

            // Center joystick base at touch point (or within zone)
            const touchX = touch.clientX - rect.left
            const touchY = touch.clientY - rect.top

            this.joystick.startX = touchX
            this.joystick.startY = touchY
            this.joystick.currentX = touchX
            this.joystick.currentY = touchY

            if(this.joystickBase)
            {
                this.joystickBase.style.display = 'block'
                this.joystickBase.style.left = `${touchX}px`
                this.joystickBase.style.top = `${touchY}px`
            }

            this.updateJoystickThumb(0, 0)
            this.calculateAxes()
        }, { passive: false })

        this.joystickZone.addEventListener('touchmove', (e) =>
        {
            e.preventDefault()
            if(!this.joystick.active) return

            for(let i = 0; i < e.changedTouches.length; i++)
            {
                const touch = e.changedTouches[i]
                if(touch.identifier === this.joystick.touchId)
                {
                    const rect = this.joystickZone.getBoundingClientRect()
                    const touchX = touch.clientX - rect.left
                    const touchY = touch.clientY - rect.top

                    let dx = touchX - this.joystick.startX
                    let dy = touchY - this.joystick.startY
                    const dist = Math.hypot(dx, dy)

                    if(dist > this.joystick.maxRadius)
                    {
                        dx = (dx / dist) * this.joystick.maxRadius
                        dy = (dy / dist) * this.joystick.maxRadius
                    }

                    this.updateJoystickThumb(dx, dy)
                    this.calculateAxes(dx, dy)
                    break
                }
            }
        }, { passive: false })

        const endJoystick = (e) =>
        {
            if(!this.joystick.active) return
            for(let i = 0; i < e.changedTouches.length; i++)
            {
                if(e.changedTouches[i].identifier === this.joystick.touchId)
                {
                    this.joystick.active = false
                    this.joystick.touchId = null
                    this.axes.forward = 0
                    this.axes.right = 0

                    if(this.joystickBase)
                    {
                        this.joystickBase.style.display = 'none'
                    }
                    this.updateJoystickThumb(0, 0)
                    break
                }
            }
        }

        this.joystickZone.addEventListener('touchend', endJoystick, { passive: false })
        this.joystickZone.addEventListener('touchcancel', endJoystick, { passive: false })

        // 2. Nitro Boost Touch Button
        if(this.boostBtn)
        {
            this.boostBtn.addEventListener('touchstart', (e) =>
            {
                e.preventDefault()
                this.axes.boost = true
                this.boostBtn.classList.add('is-active')
                this.triggerMove()
            }, { passive: false })

            const releaseBoost = (e) =>
            {
                e.preventDefault()
                this.axes.boost = false
                this.boostBtn.classList.remove('is-active')
            }

            this.boostBtn.addEventListener('touchend', releaseBoost, { passive: false })
            this.boostBtn.addEventListener('touchcancel', releaseBoost, { passive: false })
        }

        // 3. Interact Touch Button
        if(this.interactBtn)
        {
            this.interactBtn.addEventListener('touchstart', (e) =>
            {
                e.preventDefault()
                this.events.trigger('interact')
                this.interactBtn.classList.add('is-active')
                setTimeout(() => this.interactBtn.classList.remove('is-active'), 180)
            }, { passive: false })
        }
    }

    updateJoystickThumb(dx, dy)
    {
        if(this.joystickThumb)
        {
            this.joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`
        }
    }

    calculateAxes(dx = 0, dy = 0)
    {
        const dist = Math.hypot(dx, dy)
        if(dist < this.joystick.deadzone)
        {
            this.axes.forward = 0
            this.axes.right = 0
            return
        }

        // Forward is -dy in screen space (dragging up is positive forward)
        // Right is +dx in screen space (dragging right is positive right turn)
        const normDist = (dist - this.joystick.deadzone) / (this.joystick.maxRadius - this.joystick.deadzone)
        const angle = Math.atan2(dy, dx)

        this.axes.right = Math.cos(angle) * normDist
        this.axes.forward = -Math.sin(angle) * normDist

        this.triggerMove()
    }

    triggerMove()
    {
        if(!this.hasMoved && (Math.abs(this.axes.forward) > 0.1 || Math.abs(this.axes.right) > 0.1 || this.axes.boost))
        {
            this.hasMoved = true
            this.events.trigger('firstMove')
        }
    }

    show()
    {
        if(this.controlsContainer && this.isTouchDevice)
        {
            this.controlsContainer.style.display = 'flex'
        }
    }

    hide()
    {
        if(this.controlsContainer)
        {
            this.controlsContainer.style.display = 'none'
        }
    }

    setInteractVisible(visible, label = 'Interact')
    {
        if(this.interactBtn)
        {
            this.interactBtn.style.display = visible ? 'flex' : 'none'
            if(label)
            {
                const textSpan = this.interactBtn.querySelector('.js-touch-interact-text')
                if(textSpan) textSpan.textContent = label
            }
        }
    }
}
