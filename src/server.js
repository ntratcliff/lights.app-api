import express from 'express'
import SocketIO from 'socket.io'
import dotenv from 'dotenv'

import Room from './room'
import Light from './light'

import config from './rooms.config.js'
import State from './state'
import defaultState from './state.default.js'

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

// push default state
var initState = new State(defaultState, lights)
enterState(initState)

// init web server
var app = express()
app.use(express.json()) // parse request data as json

var server = app.listen(8081, function() {
	var host = server.address().address
	var port = server.address().port
	console.log(`Server listening at http://${host}:${port}`)
})

// init socket.io
var io = SocketIO(server);

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

		// notify all sockets that a light changed
		io.emit('lightChanged', light)
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
}

function leaveCurrentState () {
	var state = states.pop()
	if (state) {
		state.leave()
	}

	if (states.length > 0) {
		states[states.length - 1].enter()
	}
}