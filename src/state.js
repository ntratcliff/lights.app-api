import { Action } from './actions.js'

export default class State {
	cosntructor (source, lights) {
		console.log("state constructor called")
		this.actions = []
		this.name = ""

		console.log("assigning object...")
		Object.assign(this, source)

		console.log(`${this.name}: instantiating actions...`) // DEBUG
		this.actions = this.actions.map(a =>  {
			var action = Action.from(a.type, a, lights)
			console.log(action) // DEBUG
			return action;
		})
	}

	enter () {
		console.log("enter!") // DEBUG 
		console.log(this) // DEBUG
		this.actions.forEach(a => a.apply())
	}

	leave () {
		this.actions.forEach(a => a.undo())
	}
}