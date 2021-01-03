import { Gpio } from './pigpio-interface.js'
import { io } from './server'

const DEFAULT_LERP_SPEED = 100

/** A PWM driven light */
export default class Light {
	/**
	 * Create a Light
	 * @param {number} id The ID for this light
	 * @param {object} options The light options
	 */
	constructor (id, options) {
		this.id = id
		this.name = options.name
		
		this.gpio = new Gpio(options.gpio, {mode: Gpio.OUTPUT})

		if (options.value) {
			this.gpioValue = options.value
			this.value = options.value // initializes pwm for this light
		} else {
			this.gpioValue = 0
			this.value = 0
		}

		if (options.lerpSpeed) {
			this.lerpSpeed = options.lerpSpeed
		} else {
			this.lerpSpeed = DEFAULT_LERP_SPEED
		}
	}

	/**
	 * Set the brightness value of the light [0, 255]
	 * @param {number} v The brightness value [0, 255]
	 */
	set value (v) {
		v = Math.min(Math.max(v, 0), 255) // clamp [0, 255]
		this.targetValue = v

		if (this.gpioValue !== this.targetValue && !this.lerpInterval) {
			console.log(`${this.name} starting interpolation from ${this.gpioValue} to ${this.targetValue}`)
			this.lerpInterval = setInterval(
				this.lerpValue.bind(this), 
				1000/this.lerpSpeed
			)
		}

		if (this.gpioValue !== this.targetValue && io) {
			// notify all sockets that a light changed
			io.emit('lightChanged', this)
		}
	}

	get value () { return this.targetValue }

	/**
	 * Gets the raw gpio pin value for this light [0, 255]
	 */
	get gpioValue () {
		return this.gpio.getPwmDutyCycle()
	}
	
	/**
	 * Sets the raw gpio pin value for this light [0, 255] 
	 * @param {number} value The brightness value [0, 255]
	 */
	set gpioValue (value) {
		this.gpio.pwmWrite(value)
	}

	/** 
	 * Interpolates the gpio pin value to this light's value over time.
	 * Called every N ms relative to lerpSpeed .
	 */
	lerpValue () {
		if (this.gpioValue < this.value) {
			console.log(`${this.name} going up!`)
			this.gpioValue++;
		}
		else if(this.gpioValue > this.value) {
			console.log(`${this.name} going down!`)
			this.gpioValue--;
		}
		else if(this.gpioValue === this.value) {
			console.log(`${this.name} done interpolating!`)
			clearInterval(this.lerpInterval)
			this.lerpInterval = null
		}
	}

	toJSON () {
		return {
			id: this.id,
			name: this.name,
			value: this.value
		}
	}
}