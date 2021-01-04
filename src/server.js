import 'babel-polyfill'
import express from 'express'
import SocketIO from 'socket.io'
import dotenv from 'dotenv'

import Room from './room'
import Light from './light'
import State from './state'

import config from '../rooms.config.js'
import path from 'path'

dotenv.config() // init dotenv

process.on('SIGINT', () => {
	console.log("Interrupt signal detected. Server shutting down...")
	process.exit()
})

// load rooms and lights from config
var rooms = []
var lights = []

config.rooms.forEach(data => {
	// create room
	var room = new Room(data.name)

	// add lights to light array (and generate id from array index)
	data.lights.forEach(options => {
		var light = new Light(lights.length, options)
		lights.push(light)
		room.lights.push(light)
	})

	rooms.push(room)
})

/** @var {State[]} states Stack of states. Top of stack is active state. */
var states = []

// load and push default state
var defaultPath = path.join(process.env.DATA_PATH, 'default-state.json')
State.loadFromFs(defaultPath, lights)
	.then(state => {
		enterState(state)
	})
	.catch(err => {
		if (err.code === 'ENOENT') // no file
		{
			console.log(
				`WARN: Could not find a default state at path ${defaultPath}`
			)
		}
		else throw err
	})

// init web server
var app = express()
app.use(express.json()) // parse request data as json

var server = app.listen(8081, function() {
	var host = server.address().address
	var port = server.address().port
	console.log(`Server listening at http://${host}:${port}`)
})

// init socket.io
export var io = SocketIO(server);

io.on('connection', (socket) => {
	console.log(`connected to ${socket.id}`)

	// send current lights on connection complete
	socket.emit('lights', lights);
	
	// client wants to set a light value
	socket.on('setValue', (data) => {
		console.log(`setValue - ${data.id}: ${data.value}`)

		// TODO: handle invalid ids
		var light = lights[data.id]

		light.value = data.value
	})

	socket.on('setState', (data, callback) => {
		/* data:
			{
				// use state: "State name" to load a state by name
				state: {
					name: "State name" // human readable state name
					actions: [
						...
						// see actions for data def
					]
				}
				(replace: false,) // replace current state?
				(save: false,) // save the state?
				(overwrite: false,) // overwrite existing saved state?
			}
		*/

		if (!callback) callback = () => {}

		// create state object
		if (typeof data.state === "string") { // mutate for load in next step
			data.state = { name: data.state }	
		}

		var current = getCurrentState()
		// don't push state if it is the same as the current state
		if (current && current.name === data.state.name && !data.replace) {
			callback({
				msg: `Current state is already ${data.state.name}`
			})
			return
		}
		
		const state = new State(data.state, lights)

		if (data.state.name && !data.state.actions) { // load then enter
			State.loadFromFs(state, lights).then((state) => {
				enterState(state, data.replace || false)
				if (!data.save) callback()
			})
			.catch((err) => {
				callback(err)	
			})
		}
		else {
			// enter state
			enterState(state, data.replace || false)
			if (!data.save) callback()
		}

		if (data.save) {
			State.writeToFs(state, data.overwrite || false)
				.then(() => {
					io.emit('saveStatesChanged')
					callback()
				})
				.catch(callback)
		}
	})

	socket.on('leaveCurrentState', (data) => {
		leaveCurrentState()
	})

	socket.on('getState', (data, callback) => {
		/* data:
		{
			(name: "State name") // load state by name and return it
		}
		*/
		console.log("getState")

		if (data && data.name) {
			State.loadFromFs(data, null, (err, state) => callback(err, state))
		} else { // respond with current state
			callback(null, getCurrentState())
		}
	})

	// returns the saved states
	socket.on('getStates', (data, callback) => {
		/* data:
		{
			(full: false) // return full state information, not just names
		}
		*/

		console.log('getStates')
		State.fsList()
			.then(callback)
			.catch((error) => { throw error })
	})

	// client wants to get the current value of a light
	socket.on('getLight', (data, callback) => {
		console.log(`getLight - ${data.id}`)

		// TODO: handle invalid ids
		var light = lights[data.id]
		callback(light)
	}, )

	// rooms also have light info
	socket.on('getRooms', (data, callback) => {
		console.log('getRooms')

		callback(rooms)
	})

	socket.on('deleteState', (data, callback) => {
		/* data:
		{
			name: "State name"
		}
		*/
		console.log('deleteState')
		State.fsDelete(data.name)
			.then(() => {
				console.log(`successfully deleted ${data.name}!`)
				io.emit('saveStatesChanged')
				callback()
			})
			.catch((err) => {
				console.log(`failed to delete ${data.name}`)
				console.log(err)
				callback(err)
			})
	})

	socket.on('setDefault', (data, callback) => {
		/* data:
		{
			name: "State name"
		}
		*/
		console.log('setDefaultState')
		// load state 
		var state = new State(data, lights)
		State.loadFromFs(state, lights)
			.then(state => {
				return State.setDefault(state)
			})
			.then(() => {
				// replace state in states stack
				if (states.length <= 1) { // enter default or replace current (base)
					enterState(state, true)
				} else { // replace default at base of stack
					states[0] = state
					io.sockets.emit('stateChanged', states)
					if (states.length == 2 
						&& states[0].name === states[1].name
					) { // collapse stack into default
						leaveCurrentState()
					}
				}

				console.log(`successfully set ${state.name} as default state`)
				io.emit('saveStatesChanged')
				callback()
			})
			.catch(err => {
				console.log(err)
				callback(err)
			})
	})

	socket.on('getStateStack', (data, callback) => {
		callback(states)
	})
})

function enterState (state, replaceCurrent = false) {
	console.log("entering state")
	console.log(state)

	if (states.length > 0) {
		states[states.length - 1].leave() // leave previous state, if any

		if (replaceCurrent) {
			states.pop()
		}
	}

	states.push(state)
	states[states.length - 1].enter() // enter new state

	if (io) io.sockets.emit('stateChanged', states)
}

function leaveCurrentState () {
	if(states.length == 1) return // don't allow base state to be left

	var state = states.pop()
	if (state) {
		state.leave()
	}

	if (states.length > 0) {
		state = states[states.length - 1]
		states[states.length - 1].enter()
	} else {
		state = null
	}

	if (io) io.sockets.emit('stateChanged', states)
}

function getCurrentState () { return states[states.length - 1] }