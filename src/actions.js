import { DateTime } from 'luxon'
import MathUtil from './math-utils'

export class Action {

	/** Creates Action object from source properties */
	constructor(source, lights) {
		Object.assign(this, source)
		this.lights = lights;
		this._originalValues = []
	}

	/* Applies the action to its lights */
	/* e.x. a time-based action would start its polling function */
	// apply () { }

	/* Undoes anything caused by this action and disables the action */
	/* e.x. the time-based action would stop its polling function */
	// undo () { }

	toJSON () {
		// auto exclude props starting with _ (private)
		var copy = {}
		for (var prop in this) {
			if (!String(prop).startsWith("_")) {
				copy[prop] = this[prop]
			}
		}
		return copy
	}

	static from(source, lights) {
		source.type = source.type.toLowerCase()
		if (types[source.type]) {
			return new types[source.type](source, lights)
		} else {
			throw `Unexpected action type ${source.type}`
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
				this._originalValues[l.id] = light.value
				light.value = l.value
			}
		})
	}

	undo() {
		this.values.forEach(l => {
			var light = this.lights[l.id]
			if (light) {
				light.value = this._originalValues[l.id]
			}
		})
	}
}

export class TimeAction extends Action {
	constructor(source, lights) {
		super(source, lights)
		this._animators = {}
	}

	apply() {
		this.timings.forEach(t => {
			var light = this.lights[t.id]
			if (light) {
				this._originalValues[t.id] = light.value

				// create animator
				this._animators[t.id] = new TimeAnimatedLight(light, t.values)
				this._animators[t.id].start()
			}
		})
	}

	undo() {
		this.timings.forEach(t => {
			var light = this.lights[t.id]
			if (light) {
				this._animators[t.id].stop()
				light.value = this._originalValues[t.id]
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
		// DEBUG
		console.log(`Updating light ${this.light.name} from time action`)
		console.log('Values:')
		console.log(this.values)
		
		// current time
		var current = DateTime.local()

		console.log(`Current time is ${current.toString()}`) // DEBUG

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

		// DEBUG
		console.log(`Nearest previous time: ${previous.time.toString()}`)
		console.log(`Nearest next time: ${next.time.toString()}`)

		// calculate current time relative to prev/next
		var range = next.time.diff(previous.time).milliseconds
		var norm = current.diff(previous.time).milliseconds
		var progress = norm / range

		console.log(
			`${(progress*100).toFixed(2)}% between` + 
			` ${previous.time.toString()} and` + 
			` ${next.time.toString()}`
		) // DEBUG

		// set light value by progress between previous and current
		// linear interpolation between [previous.value, next.value]
		// TODO: support easing functions
		v = MathUtil.lerp(previous.value, next.value, progress)
		v = Math.round(v)

		console.log(
			`${(progress*100).toFixed(2)}%` + 
			` [${previous.value} ---` +
			` ${v} ---` + 
			` ${next.value}]`
		) // DEBUG

		this.light.value = v

		// calculate next update time from current and next timings
		var vd = next.value - previous.value
		var rate = 0
		if (vd !== 0) {
			// rate = |(v2 - v1) / (t2 - t1)|
			rate = Math.floor(1 / Math.abs(vd / range))
			console.log(`${rate}ms = 1ms / |${vd}u / ${range}ms|`)
		} else { // no value change until next time 
			rate = range - norm // range - norm = ms to next time
			console.log(`${rate}ms = ${range}ms - ${norm}ms (vd = ${vd})`)
		}

		console.log(`Next update in ${rate}`)
		this.handle = setTimeout(this.update.bind(this), rate)
	}
}

const types = {
	'simple': SimpleAction,
	'time': TimeAction
}
