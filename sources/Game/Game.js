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
        this.loadingText.textContent = this.isMobile ? '' : 'Ready to sail'
    }

    detectMobile()
    {
        const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const smallScreen = window.innerWidth <= 768
        const touchOnly = 'ontouchstart' in window && navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches
        return userAgent || (smallScreen && touchOnly)
    }

    showStartButton()
    {
        if(this.isMobile)
        {
            // Disable the button and show mobile-not-supported message
            this.loadingStart.style.display = 'block'
            this.loadingStart.disabled = true
            this.loadingStart.textContent = 'Desktop Only'
            this.loadingStart.classList.add('is-disabled')

            // Show mobile message below the button
            const mobileMsg = document.createElement('p')
            mobileMsg.className = 'mobile-message'
            mobileMsg.textContent = 'Mobile devices are not supported yet. Please visit on a desktop browser.'
            this.loadingStart.insertAdjacentElement('afterend', mobileMsg)
            return
        }

        this.loadingStart.style.display = 'block'
        this.loadingStart.addEventListener('click', () =>
        {
            this.start()
        }, { once: true })
    }

    start()
    {
        // Hide loading screen
        this.loadingElement.classList.add('is-hidden')

        // Switch camera to follow boat
        this.view.setMode(View.MODE_FOLLOW)

        // Show persistent bottom-left controls HUD
        this.controlsElement.style.display = 'flex'

        // Setup menu toggle
        this.setupMenu()

        console.log('🚤 Lake Portfolio — started')
    }

    setupMenu()
    {
        const menuToggle = document.querySelector('.js-menu-toggle')
        const menuPanel = document.querySelector('.js-menu-panel')
        let menuOpen = false

        menuToggle.addEventListener('click', () =>
        {
            menuOpen = !menuOpen
            menuPanel.style.display = menuOpen ? 'block' : 'none'
        })

        // Reset position
        const resetBtn = document.querySelector('.js-reset-btn')
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
