import { Action } from "./actions"

export default class State {
	cosntructor (source, lights) {
		this.actions = []

		Object.assign(this, source)
		this.actions = this.actions.map(a => {
			return Action.from(a.type, a, lights)
		})
	}

	enter () {
		console.log("enter!")
		console.log(this)
		this.actions.forEach(a => a.apply())
	}

	leave () {
		this.actions.forEach(a => a.undo())
	}
}