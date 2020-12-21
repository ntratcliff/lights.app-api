const { Gpio } = require("pigpio");
const express = require("express");
var app = express();

// TODO: get all lights (loaded from config)
const leds = [
	new Gpio(2, {mode: Gpio.OUTPUT}), // north
	new Gpio(14, {mode: Gpio.OUTPUT}), // west
]

leds.forEach(l => l.pwmWrite(0)); // start pwm on all lights

app.use(express.json());

// get light state by light id
app.get('/lights/:id', function(req, res) {
	// get led by route id
	var led = leds[req.params.id];

	// TODO: handle invalid ids 

	// send current pin value
	res.send({
		"value": led.getPwmDutyCycle() // [0,255]
	});
});

// put light state by light id
app.put('/lights/:id', function(req, res) {
	// get led from route id
	var led = leds[req.params.id];

	// TODO: handle invalid ids

	// get value from request body
	var value = req.body.value // TODO: clamp [0,255]

	led.pwmWrite(value)

	// send current pin value
	res.send({
		"value": led.getPwmDutyCycle() // [0,255]
	});
});

var server = app.listen(8081, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log(`Server listening at http://${host}:${port}`);
});