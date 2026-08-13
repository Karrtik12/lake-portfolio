import * as THREE from 'three/webgpu'
import { Ticker } from './Ticker.js'
import { Viewport } from './Viewport.js'
import { Rendering } from './Rendering.js'
import { View } from './View.js'
import { Inputs } from './Inputs/Inputs.js'

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

        // Boat state placeholder (will be set by Boat.js later)
        this.boat = null

        // --- Temporary: simple scene to verify rendering works ---
        this.setupTestScene()

        // Loading screen
        this.setupLoadingScreen()

        // Start render loop
        this.rendering.start()

        // Show start button
        this.showStartButton()
    }

    /**
     * Temporary test scene — a colored plane + sphere to confirm rendering.
     * Will be replaced by World.js in Milestone 2.
     */
    setupTestScene()
    {
        // Water-like plane
        const planeGeometry = new THREE.PlaneGeometry(100, 100)
        const planeMaterial = new THREE.MeshStandardNodeMaterial({
            color: 0x1a4a6e,
            roughness: 0.3,
            metalness: 0.1
        })
        const plane = new THREE.Mesh(planeGeometry, planeMaterial)
        plane.rotation.x = -Math.PI * 0.5
        plane.position.y = -0.1
        this.scene.add(plane)

        // Small marker sphere
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
        const sphereMaterial = new THREE.MeshStandardNodeMaterial({
            color: 0x60a5fa,
            roughness: 0.2,
            metalness: 0.5
        })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.position.y = 0.5
        this.scene.add(sphere)

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xb0c4de, 0.6)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xfff4e6, 1.5)
        directionalLight.position.set(10, 20, 10)
        this.scene.add(directionalLight)

        // Sky color
        this.scene.background = new THREE.Color(0x87ceeb)
    }

    setupLoadingScreen()
    {
        this.loadingElement = document.querySelector('.js-loading')
        this.loadingBar = document.querySelector('.js-loading-bar')
        this.loadingText = document.querySelector('.js-loading-text')
        this.loadingStart = document.querySelector('.js-loading-start')
        this.controlsElement = document.querySelector('.js-controls')

        // Simulate loading progress (will be replaced by real loader)
        this.loadingBar.style.width = '100%'
        this.loadingText.textContent = 'Ready'
    }

    showStartButton()
    {
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

        // Show controls overlay
        this.controlsElement.style.display = 'block'

        // Hide controls after first movement
        this.inputs.events.on('firstMove', () =>
        {
            this.controlsElement.classList.add('is-hidden')
        })

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
