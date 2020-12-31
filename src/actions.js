import { DateTime } from 'luxon'
import { Interpolation, Easing } from '@tweenjs/tween.js'

export class Action {

	/** Creates Action object from source properties */
	constructor(source, lights) {
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
	apply() {
		this.values.forEach(l => {
			var light = this.lights[l.id] // TODO: reference lights by name?
			if (light) {
				this.originalValues[l.id] = light.value
				light.value = l.value
			}
		})
	}

	undo() {
		this.values.forEach(l => {
			var light = this.lights[l.id]
			if (light) {
				light.value = this.originalValues[l.id]
			}
		})
	}
}

export class TimeAction extends Action {
	constructor(source, lights) {
		super(source, lights)
		this.animators = {}
	}

	apply() {
		this.timings.forEach(t => {
			var light = this.lights[t.id]
			if (light) {
				this.originalValues[t.id] = light.value

				// create animator
				this.animators[t.id] = new TimeAnimatedLight(light, t.values)
				this.animators[t.id].start()
			}
		})
	}

	undo() {
		this.timings.forEach(t => {
			var light = this.lights[t.id]
			if (light) {
				this.animators[t.id].stop()
				light.value = this.originalValues[t.id]
			}
		})
	}
}

class TimeAnimatedLight {
	constructor (light, values) {
		this.light = light
		this.values = values
		this.handle = -1
	}

	start () {
		this.update()
	}

	stop () {
		clearTimeout(this.handle)
	}

	update () {
		console.log(`Updating light ${this.light.name} from time action`)
		// current time
		var current = DateTime.local()

		// get closest time before current time
		var previous = null
		var prevIndex = -1
		for (let i = 0; i < this.values.length; i++) {
			var v = this.values[i];
			var time = DateTime.fromISO(v.time)
			if (time <= current) {
				previous = {
					time: time,
					value: v.value
				}
				prevIndex = i
			} else if (i === 0) { // current time is before first value, use last value yesterday
				v = this.values[this.values.length - 1]
				previous = {
					time: DateTime.fromISO(v.time).minus({ days: 1}),
					value: v.value
				}
				prevIndex = -1
			}
		}

		// get next time in list
		var nextIndex = (prevIndex + 1) % this.values.length

		var next = this.values[nextIndex]
		next = {
			time: DateTime.fromISO(next.time),
			value: next.value
		}

		// add a day to nextif we wrapped into tomorrow time
		if (nextIndex < prevIndex) {
			next.time = next.time.plus({ day: 1 })
		}

		// calculate current time relative to prev/next
		var range = next.time.diff(previous.time).milliseconds
		var norm = current.diff(previous.time).milliseconds
		var progress = norm / range

		// set light value by progress between previous and current
		// linear interpolation between [previous.value, next.value]
		// TODO: support easing functions
		var t = progress
		v = Interpolation.Linear([previous.value, next.value], t)
		v = Math.round(v)
		console.log(`Value: ${v}`)
		this.light.value = v

		// calculate next update time from current and next timings
		// rate = |(v2 - v1) / (t2 - t1)|
		// range = t2 - t1
		var vd = next.value - previous.value
		var rate = 0
		if(vd !== 0) {
			rate = Math.floor(1 / Math.abs(vd / range))
		} else { // no value change until next time 
			rate = range - norm // range - norm = ms to next time
		}
		console.log(`Next update in ${rate}`)
		this.handle = setTimeout(this.update.bind(this), rate)
	}
}

const types = {
	'simple': SimpleAction,
	'time': TimeAction
}
