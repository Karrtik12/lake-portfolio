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

        // Detect mobile devices
        this.isMobile = this.detectMobile()

        // Ready state
        this.loadingBar.style.width = '100%'
        this.loadingText.textContent = 'Ready to sail'
    }

    detectMobile()
    {
        const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const smallScreen = window.innerWidth <= 768
        const touchOnly = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
        return userAgent || (smallScreen && touchOnly)
    }

    showStartButton()
    {
        this.loadingStart.style.display = 'block'
        this.loadingStart.disabled = false
        this.loadingStart.textContent = 'Click to Explore'
        this.loadingStart.classList.remove('is-disabled')

        const onStart = () =>
        {
            this.start()
        }

        this.loadingStart.addEventListener('click', onStart, { once: true })
        this.loadingStart.addEventListener('touchend', onStart, { once: true })
    }

    start()
    {
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
