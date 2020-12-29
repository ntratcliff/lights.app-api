const types = {
	'simple': SimpleAction
}

export class Action {

	/** Creates Action object from source properties */
	constructor (source, lights) {
		Object.assign(this, source)
		this.lights = lights;
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
	constructor (source, lights) {
		super(source, lights)
		this.originalValues = []
	}

	apply () {
		console.log("applying action") // DEBUG
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
