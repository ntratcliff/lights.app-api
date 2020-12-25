import { Gpio } from 'pigpio'

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
			this.value = options.value // initializes pwm for this light
		} else {
			this.value = 0
		}
	}

	/**
	 * Set the brightness value of the light [0, 255]
	 * @param {number} value The brightness value [0, 255]
	 */
	set value (value) {
		value = Math.min(Math.max(value, 0), 255) // clamp [0, 255]
		this.gpio.pwmWrite(value)
	}

	/**
	 * Get the brightness value of the light [0, 255]
	 */
	get value () {
		return this.gpio.getPwmDutyCycle()
	}

	toJSON () {
		return {
			id: this.id,
			name: this.name,
			value: this.value
		}
	}
}