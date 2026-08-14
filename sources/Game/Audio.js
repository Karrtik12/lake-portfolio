import { Game } from './Game.js'

/**
 * Audio — Web Audio procedural synthesis and sound effects manager:
 * - Natural shoreline ocean/lake wave swells with rhythmic lapping
 * - Dynamic boat hull water spray and wake slicing audio responding to velocity
 * - Outboard boat motor hum
 * - Interactive chime triggers
 */
export class Audio
{
    constructor()
    {
        this.game = Game.getInstance()

        this.muted = true
        this.ctx = null
        this.masterGain = null

        // Audio components
        this.engineOsc = null
        this.engineGain = null
        this.waveNoiseSource = null
        this.waveFilter = null
        this.waveGain = null
        this.sprayNoiseSource = null
        this.sprayFilter = null
        this.sprayGain = null

        this.setupButtons()
        this.setupTabVisibility()

        // Hook start button on loading screen to initialize AudioContext
        const startBtn = document.querySelector('.js-loading-start')
        if(startBtn)
        {
            startBtn.addEventListener('click', () =>
            {
                this.initContext()
                if(this.muted)
                {
                    this.toggle()
                }
            })
        }

        // Update loop for dynamic boat engine and water spray
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
        this.masterGain.gain.value = this.muted ? 0 : 0.65
        this.masterGain.connect(this.ctx.destination)

        // 1. Natural Shoreline Wave Swells (Modulated Pink Noise)
        this.createShorelineWaveAudio()

        // 2. Dynamic Boat Hull Water Spray / Wake Sound
        this.createBoatWaterSprayAudio()

        // 3. Outboard Boat Motor Hum
        this.createBoatEngine()
    }

    createShorelineWaveAudio()
    {
        // 4-second stereo pink/brown noise loop
        const sampleRate = this.ctx.sampleRate
        const length = sampleRate * 4
        const buffer = this.ctx.createBuffer(2, length, sampleRate)
        const left = buffer.getChannelData(0)
        const right = buffer.getChannelData(1)

        let lastL = 0.0
        let lastR = 0.0
        for(let i = 0; i < length; i++)
        {
            const whiteL = Math.random() * 2 - 1
            const whiteR = Math.random() * 2 - 1
            lastL = (lastL + 0.02 * whiteL) / 1.02
            lastR = (lastR + 0.02 * whiteR) / 1.02
            left[i] = lastL * 3.2
            right[i] = lastR * 3.2
        }

        this.waveNoiseSource = this.ctx.createBufferSource()
        this.waveNoiseSource.buffer = buffer
        this.waveNoiseSource.loop = true

        this.waveFilter = this.ctx.createBiquadFilter()
        this.waveFilter.type = 'lowpass'
        this.waveFilter.frequency.value = 280
        this.waveFilter.Q.value = 1.8

        this.waveGain = this.ctx.createGain()
        this.waveGain.gain.value = 0.35

        this.waveNoiseSource.connect(this.waveFilter)
        this.waveFilter.connect(this.waveGain)
        this.waveGain.connect(this.masterGain)
        this.waveNoiseSource.start(0)
    }

    createBoatWaterSprayAudio()
    {
        // Dynamic water spray noise when cruising
        const sampleRate = this.ctx.sampleRate
        const length = sampleRate * 2
        const buffer = this.ctx.createBuffer(1, length, sampleRate)
        const data = buffer.getChannelData(0)

        for(let i = 0; i < length; i++)
        {
            data[i] = (Math.random() * 2 - 1) * 0.5
        }

        this.sprayNoiseSource = this.ctx.createBufferSource()
        this.sprayNoiseSource.buffer = buffer
        this.sprayNoiseSource.loop = true

        this.sprayFilter = this.ctx.createBiquadFilter()
        this.sprayFilter.type = 'bandpass'
        this.sprayFilter.frequency.value = 650
        this.sprayFilter.Q.value = 1.2

        this.sprayGain = this.ctx.createGain()
        this.sprayGain.gain.value = 0.0

        this.sprayNoiseSource.connect(this.sprayFilter)
        this.sprayFilter.connect(this.sprayGain)
        this.sprayGain.connect(this.masterGain)
        this.sprayNoiseSource.start(0)
    }

    createBoatEngine()
    {
        this.engineOsc = this.ctx.createOscillator()
        this.engineOsc.type = 'sawtooth'
        this.engineOsc.frequency.value = 45 // Idle rumble 45Hz

        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 140

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
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.65, this.ctx.currentTime, 0.05)
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
        if(this.muted || !this.ctx) return

        const now = this.ctx.currentTime

        // 1. Natural Shoreline Wave Swell modulation (period = 3.6s)
        if(this.waveFilter && this.waveGain)
        {
            const wavePhase = Math.sin(now * 1.74) * 0.5 + 0.5 // 0.0 to 1.0
            const waveFreq = 180 + wavePhase * 420 // 180Hz to 600Hz
            const waveVol = 0.18 + wavePhase * 0.26

            this.waveFilter.frequency.setTargetAtTime(waveFreq, now, 0.12)
            this.waveGain.gain.setTargetAtTime(waveVol, now, 0.12)
        }

        // 2. Dynamic boat speed modulation (engine rumble + hull water spray)
        const boat = this.game.boat
        if(boat)
        {
            const speedNorm = Math.min(Math.abs(boat.speed) / 17.0, 1.0)

            // Outboard motor hum
            if(this.engineOsc && this.engineGain)
            {
                const targetFreq = 42 + speedNorm * 68 // 42Hz to 110Hz
                const targetGain = 0.05 + speedNorm * 0.22

                this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08)
                this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08)
            }

            // Hull water spray / cutting wake sound
            if(this.sprayFilter && this.sprayGain)
            {
                const sprayFreq = 550 + speedNorm * 750 // 550Hz to 1300Hz
                const sprayVol = speedNorm * 0.32 // Silenced when idle, crisp when racing

                this.sprayFilter.frequency.setTargetAtTime(sprayFreq, now, 0.08)
                this.sprayGain.gain.setTargetAtTime(sprayVol, now, 0.08)
            }
        }
    }
}
