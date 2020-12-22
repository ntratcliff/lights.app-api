import Light from './light'
import express from 'express'
import cors from 'cors'

var app = express();

app.use(cors()); // enables all cors requests
app.use(express.json()); // parse request data as json

// TODO: load lights from config
const lights = [
	new Light(2), // north
	new Light(14), // west
]

// get light state by light id
app.get('/lights/:id', function(req, res) {
	// get led by route id
	var light = lights[req.params.id];

	// TODO: handle invalid ids 

	// send current light value
	res.send(JSON.stringify(light));
});

// put light state by light id
app.put('/lights/:id', function(req, res) {
	// get led from route id
	var light = lights[req.params.id];

	// TODO: handle invalid ids

	// get value from request body
	var value = req.body.value // TODO: clamp [0,255]

	// set value
	light.value = value

	// send current light value
	res.send(JSON.stringify(light));
});

var server = app.listen(8081, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log(`Server listening at http://${host}:${port}`);
});