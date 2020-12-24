import Light from './light'
import express from 'express'
import SocketIO from 'socket.io'

// init lights
// TODO: load from config file
var lights = []
lights.push(new Light(lights.length, 2)) // north
lights.push(new Light(lights.length, 14)) // west

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
})