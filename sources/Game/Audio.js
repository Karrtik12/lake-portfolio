import { Game } from './Game.js'

/**
 * Audio — Web Audio synthesis and sound effects manager for ambient water, boat engine, and UI chimes.
 */
export class Audio
{
    constructor()
    {
        this.game = Game.getInstance()

        this.muted = true
        this.ctx = null
        this.masterGain = null
        this.engineOsc = null
        this.engineGain = null
        this.ambientGain = null

        this.setupButtons()
        this.setupTabVisibility()

        // Update loop for dynamic boat engine pitch
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    initContext()
    {
        if(this.ctx) return

        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if(!AudioCtx) return

        this.ctx = new AudioCtx()

        // Master Gain
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = this.muted ? 0 : 0.6
        this.masterGain.connect(this.ctx.destination)

        // 1. Synthesized Water Ambient (Filtered White Noise)
        this.createAmbientWater()

        // 2. Synthesized Boat Motor Hum (Dual Oscillator with filter)
        this.createBoatEngine()
    }

    createAmbientWater()
    {
        const bufferSize = this.ctx.sampleRate * 2
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)

        // Generate pink/brownish water noise
        let lastOut = 0.0
        for(let i = 0; i < bufferSize; i++)
        {
            const white = Math.random() * 2 - 1
            lastOut = (lastOut + 0.02 * white) / 1.02
            data[i] = lastOut * 3.5
        }

        const noise = this.ctx.createBufferSource()
        noise.buffer = buffer
        noise.loop = true

        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 320

        this.ambientGain = this.ctx.createGain()
        this.ambientGain.gain.value = 0.25

        noise.connect(filter)
        filter.connect(this.ambientGain)
        this.ambientGain.connect(this.masterGain)
        noise.start(0)
    }

    createBoatEngine()
    {
        this.engineOsc = this.ctx.createOscillator()
        this.engineOsc.type = 'sawtooth'
        this.engineOsc.frequency.value = 45 // Idle rumble 45Hz

        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 160

        this.engineGain = this.ctx.createGain()
        this.engineGain.gain.value = 0.0

        this.engineOsc.connect(filter)
        filter.connect(this.engineGain)
        this.engineGain.connect(this.masterGain)
        this.engineOsc.start(0)
    }

    playChime()
    {
        if(this.muted || !this.ctx) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime) // D5
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15) // A5

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5)

        osc.connect(gain)
        gain.connect(this.masterGain)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.55)
    }

    toggle()
    {
        this.initContext()

        if(this.ctx && this.ctx.state === 'suspended')
        {
            this.ctx.resume()
        }

        this.muted = !this.muted
        if(this.masterGain)
        {
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.05)
        }

        this.updateButtons()
    }

    setupButtons()
    {
        const audioToggles = document.querySelectorAll('.js-audio-toggle')
        for(const btn of audioToggles)
        {
            btn.addEventListener('click', () =>
            {
                this.toggle()
            })
        }
        this.updateButtons()
    }

    updateButtons()
    {
        const audioToggles = document.querySelectorAll('.js-audio-toggle')
        for(const btn of audioToggles)
        {
            btn.textContent = this.muted ? '🔇 Sound: Off' : '🔊 Sound: On'
        }
    }

    setupTabVisibility()
    {
        document.addEventListener('visibilitychange', () =>
        {
            if(document.hidden)
            {
                if(this.ctx && this.ctx.state === 'running')
                {
                    this.ctx.suspend()
                }
            }
            else
            {
                if(!this.muted && this.ctx && this.ctx.state === 'suspended')
                {
                    this.ctx.resume()
                }
            }
        })
    }

    update()
    {
        if(this.muted || !this.ctx || !this.engineOsc || !this.engineGain) return

        const boat = this.game.boat
        if(boat)
        {
            const speedNorm = Math.min(Math.abs(boat.speed) / 16.0, 1.0)
            const targetFreq = 45 + speedNorm * 65 // 45Hz to 110Hz
            const targetGain = 0.08 + speedNorm * 0.22

            this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08)
            this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08)
        }
    }
}
