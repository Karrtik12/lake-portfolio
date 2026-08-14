import * as THREE from 'three/webgpu'
import { Ticker } from './Ticker.js'
import { Viewport } from './Viewport.js'
import { Rendering } from './Rendering.js'
import { View } from './View.js'
import { Inputs } from './Inputs/Inputs.js'
import { Physics } from './Physics/Physics.js'
import { Boat } from './Physics/Boat.js'
import { World } from './World/World.js'
import { Title } from './Title.js'
import { Modals } from './Modals.js'
import { RayCursor } from './RayCursor.js'
import { InteractivePoints } from './InteractivePoints.js'
import { Zones } from './Zones/Zones.js'
import { AreaManager } from './Zones/AreaManager.js'
import { Map } from './Map.js'
import { Audio } from './Audio.js'
import { Quality } from './Quality.js'

/**
 * Game — singleton that bootstraps and orchestrates all systems.
 */
export class Game
{
    static getInstance()
    {
        return Game.instance
    }

    constructor()
    {
        if(Game.instance)
            return Game.instance

        Game.instance = this
        this.init()
    }

    async init()
    {
        // DOM
        this.domElement = document.querySelector('.game')
        this.canvasElement = this.domElement.querySelector('.js-canvas')

        // Core systems
        this.scene = new THREE.Scene()
        this.ticker = new Ticker()
        this.viewport = new Viewport(this.domElement)
        this.inputs = new Inputs()

        // Rendering (async — needs WebGPU init)
        this.rendering = new Rendering()
        await this.rendering.setRenderer()

        // Camera
        this.view = new View()

        // Physics engine
        this.physics = new Physics()

        // Boat player physics
        this.boat = new Boat()

        // World Environment (lake, shoreline, islands, trees, boat visual, wake)
        this.world = new World()

        // UI & Interaction Systems
        this.title = new Title()
        this.modals = new Modals()
        this.rayCursor = new RayCursor()
        this.interactivePoints = new InteractivePoints()
        this.zones = new Zones()
        this.areaManager = new AreaManager()
        this.map = new Map()
        this.audio = new Audio()
        this.quality = new Quality()

        // Loading screen
        this.setupLoadingScreen()

        // Start render loop
        this.rendering.start()

        // Show start button
        this.showStartButton()
    }

    setupLoadingScreen()
    {
        this.loadingElement = document.querySelector('.js-loading')
        this.loadingBar = document.querySelector('.js-loading-bar')
        this.loadingText = document.querySelector('.js-loading-text')
        this.loadingStart = document.querySelector('.js-loading-start')
        this.controlsElement = document.querySelector('.js-controls')
        this.orientationBlocker = document.querySelector('.js-orientation-blocker')

        // Detect mobile devices
        this.isMobile = this.detectMobile()
        this.hasStarted = false

        // Ready state
        this.loadingBar.style.width = '100%'
        this.loadingText.textContent = 'Ready to sail'

        // Setup orientation detection listeners
        this.setupOrientationChecks()
    }

    detectMobile()
    {
        const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        const isTouchSmall = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && Math.min(window.innerWidth, window.innerHeight) <= 768
        return userAgent || (isCoarse && isTouchSmall)
    }

    setupOrientationChecks()
    {
        this.checkOrientation()

        window.addEventListener('resize', () => this.checkOrientation())
        window.addEventListener('orientationchange', () =>
        {
            setTimeout(() => this.checkOrientation(), 150)
        })
    }

    checkOrientation()
    {
        const isPortrait = this.isMobile && (window.innerHeight > window.innerWidth)

        if(!this.hasStarted)
        {
            // On loading screen: require landscape before enabling "Click to Explore"
            if(isPortrait)
            {
                if(this.loadingText)
                {
                    this.loadingText.textContent = 'Please rotate device to landscape'
                    this.loadingText.classList.add('is-portrait-hint')
                }
                if(this.loadingStart)
                {
                    this.loadingStart.style.display = 'block'
                    this.loadingStart.disabled = true
                    this.loadingStart.textContent = 'Rotate to Landscape'
                    this.loadingStart.classList.add('is-disabled')
                }
            }
            else
            {
                if(this.loadingText)
                {
                    this.loadingText.textContent = 'Ready to sail'
                    this.loadingText.classList.remove('is-portrait-hint')
                }
                if(this.loadingStart)
                {
                    this.loadingStart.style.display = 'block'
                    this.loadingStart.disabled = false
                    this.loadingStart.textContent = 'Click to Explore'
                    this.loadingStart.classList.remove('is-disabled')
                }
            }
        }
        else
        {
            // During active gameplay: show blocker dialog if rotated to portrait
            if(isPortrait)
            {
                if(this.orientationBlocker) this.orientationBlocker.style.display = 'flex'
            }
            else
            {
                if(this.orientationBlocker) this.orientationBlocker.style.display = 'none'
            }
        }
    }

    showStartButton()
    {
        this.loadingStart.style.display = 'block'
        this.checkOrientation()

        const onStart = (e) =>
        {
            // Only start if not in portrait mode on mobile
            if(this.isMobile && window.innerHeight > window.innerWidth)
            {
                e.preventDefault()
                return
            }
            this.start()
        }

        this.loadingStart.addEventListener('click', onStart)
        this.loadingStart.addEventListener('touchend', onStart)
    }

    start()
    {
        if(this.hasStarted) return
        this.hasStarted = true

        // Hide loading screen
        this.loadingElement.classList.add('is-hidden')

        // Switch camera to follow boat
        this.view.setMode(View.MODE_FOLLOW)

        // Show controls HUD on desktop, or mobile touch controls on mobile/touchscreen
        if(this.isMobile || this.inputs.touch?.isTouchDevice)
        {
            if(this.controlsElement) this.controlsElement.style.display = 'none'
            if(this.inputs.touch) this.inputs.touch.show()
        }
        else
        {
            if(this.controlsElement) this.controlsElement.style.display = 'flex'
        }

        this.checkOrientation()

        // Setup menu toggle
        this.setupMenu()

        console.log('🚤 Lake Portfolio — started')
    }

    setupMenu()
    {
        const menuToggle = document.querySelector('.js-menu-toggle')
        const menuPanel = document.querySelector('.js-menu-panel')
        let menuOpen = false

        menuToggle.addEventListener('click', (e) =>
        {
            e.stopPropagation()
            menuOpen = !menuOpen
            menuPanel.style.display = menuOpen ? 'block' : 'none'
        })

        // Close menu when clicking outside
        document.addEventListener('click', (e) =>
        {
            if(menuOpen && !menuPanel.contains(e.target) && e.target !== menuToggle)
            {
                menuOpen = false
                menuPanel.style.display = 'none'
            }
        })

        // Fullscreen toggle (both top-bar button and menu panel option)
        const fsBtn = document.querySelector('.js-fullscreen-btn')
        const fsToggle = document.querySelector('.js-fullscreen-toggle')

        const toggleFullscreen = () =>
        {
            const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement

            if(!isFullscreen)
            {
                const el = document.documentElement
                if(el.requestFullscreen) el.requestFullscreen()
                else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen()
                else if(el.mozRequestFullScreen) el.mozRequestFullScreen()
                else if(el.msRequestFullscreen) el.msRequestFullscreen()
            }
            else
            {
                if(document.exitFullscreen) document.exitFullscreen()
                else if(document.webkitExitFullscreen) document.webkitExitFullscreen()
                else if(document.mozCancelFullScreen) document.mozCancelFullScreen()
                else if(document.msExitFullscreen) document.msExitFullscreen()
            }
            menuOpen = false
            if(menuPanel) menuPanel.style.display = 'none'
        }

        if(fsBtn) fsBtn.addEventListener('click', toggleFullscreen)
        if(fsToggle) fsToggle.addEventListener('click', toggleFullscreen)

        // Reset position
        const resetBtn = document.querySelector('.js-reset-btn')
        if(resetBtn)
        {
            resetBtn.addEventListener('click', () =>
            {
                if(this.boat)
                {
                    this.boat.reset()
                }
                menuOpen = false
                menuPanel.style.display = 'none'
            })
        }
    }
}
