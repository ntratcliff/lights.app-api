import { DateTime } from 'luxon'
import { Interpolation, Easing } from '@tweenjs/tween.js'

export class Action {

	/** Creates Action object from source properties */
	constructor (source, lights) {
		Object.assign(this, source)
		this.lights = lights;
		this.originalValues = []
	}

	/* Applies the action to its lights */
	/* e.x. a time-based action would start its polling function */
	// apply () { }

	/* Undoes anything caused by this action and disables the action */
	/* e.x. the time-based action would stop its polling function */
	// undo () { }

	static from(type, source, lights) {
		if (types[type]) {
			return new types[type](source, lights)
		}
	}
}

/**
 * TODO: proper jsdoc
 * @var {Object} values id and value for each light this action applies to
 * e.x { id: 0, value: 255 }
 */
export class SimpleAction extends Action {
	apply () {
		this.values.forEach(l => {
			var light = this.lights[l.id] // TODO: reference lights by name?
			if (light) {
				this.originalValues[l.id] = light.value
				light.value = l.value
			}
		})
	}

	undo () {
		this.values.forEach(l => {
			var light = this.lights[l.id]
			if (light) {
				light.value = this.originalValues[l.id]
			}
		})
	}
}

export class TimeAction extends Action {
	constructor (source, lights) {
		super (source, lights)
		this.listeners = {}
	}

	apply () {
		this.timings.forEach(t => {
			var light = this.lights[t.id]
			if (light) {
				this.originalValues[t.id] = light.value

				// create update function
				this.listeners[t.id] = {}
				this.listeners[t.id].function = ((light, values) => {
					console.log(`Updating light ${light.name} from time action`)
					// current time
					var current = DateTime.local()

					// get closest time before current time
					var previous = null
					var prevIndex = -1
					for (let i = 0; i < values.length; i++) {
						var v = values[i];
						var time = DateTime.fromISO(v.time)
						if (!previous || time < current) {
							previous = {
								time: time,
								value: v.value
							}
							prevIndex = i
						}
					}

					// get next time in list
					var nextIndex = (prevIndex + 1) % values.length
					var next = values[nextIndex]
					next = {
						time: DateTime.fromISO(next.time),
						value: next.value
					}

					// calculate current time relative to prev/next
					var range = next.time.diff(previous.time)
					var norm = current.diff(previous.time)
					var progress = norm.milliseconds / range.milliseconds
					
					// set light value by progress between previous and current
					// linear interpolation between [previous.value, next.value]
					// TODO: support easing functions
					var t = progress
					v = Interpolation.Linear([previous.value, next.value], t)
					v = Math.round(v)
					console.log(`Value: ${v}`)
					light.value = v
				}).bind(null, light, t.values)

				// calculate update frequency from timing values
				var maxSpeed = null
				for (let i = 1; i < t.values.length; i++) {
					var v = t.values[i]
					var p = t.values[i-1]
					var td = DateTime.fromISO(v.time).diff(DateTime.fromISO(p.time), "seconds")
					var vd = v.value - p.value
					var speed = vd / td.seconds // value change / time
					if (speed > maxSpeed) maxSpeed = speed
				}

				console.log(`Update rate for ${light.name} is ${maxSpeed}/s`)
				this.listeners[t.id].function()
				this.listeners[t.id].handle = setInterval(
					this.listeners[t.id].function, 
					1000 / maxSpeed
				)
			} 
		})
	}

	undo () {
		this.timings.forEach(t => {
			var light = this.lights[t.id]
			if (light) {
				clearInterval(this.listeners[t.id].handle)
				light.value = this.originalValues[t.id]
			}
		})
	}
}

const types = {
	'simple': SimpleAction,
	'time': TimeAction
}
