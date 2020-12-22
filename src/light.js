import Gpio from 'pigpio'

/** A PWM driven light */
export class Light {
	/**
	 * Create a Light
	 * @param {number} gpio The GPIO pin used to drive this light
	 * @param {number} [value=0] The initial brightness value of the light [0, 255]
	 */
	constructor (gpio, value = 0) {
		this.gpio = new Gpio(gpio, {mode: Gpio.OUTPUT})
		this.value = value; // initializes pwm for this light
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
			value: this.value
		}
	}
}