import { Gpio as Pigpio } from 'pigpio'

const FakeModes = {
	INPUT: "INPUT",
	OUTPUT: "OUTPUT"
}

class EmulatedGpio
{ 
	constructor (gpio, options = {mode: FakeModes.INPUT}) {
		this.gpio = gpio
		Object.assign(this, options)
		this.dutyCycle = 0

		if(process.env.NODE_ENV === 'development') {
			console.log(
				`(EmulatedGpio) gpio started on pin ${this.gpio}` + 
				` with mode ${this.mode}`
			)
		}
	}

	pwmWrite (dutyCycle) {
		this.dutyCycle = dutyCycle
		if(process.env.NODE_ENV === 'development') {
			console.log(`(EmulatedGpio)[pwmWrite] dutyCycle: ${dutyCycle}`)
		}
	}	

	getPwmDutyCycle () { return this.dutyCycle }
}

/** Wrapper for pigpio module that provides an emulator if pigpio isn't available */
export let Gpio = (() => {
	if (process.env.PIGPIO) {
		return Pigpio
	} else {
		return Object.assign(EmulatedGpio, FakeModes)
	}
})()