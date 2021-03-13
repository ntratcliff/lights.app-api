import find from 'local-devices'
import axios from 'axios'
import { debug } from 'console'

// makes a http get request to the provided device and wraps it in a promise
// function webRequest(device, path = undefined, method = 'GET', data = undefined) {
// 	return new Promise((resolve, reject) => {
// 		var req = http.request({
// 			hostname: device.ip,
// 			method: method,
// 			path: path	
// 		}, res => { 

// 			// handle bad response code
// 			if(res.statusCode < 200 || res.statusCode >= 300) {
// 				return reject(new Error(`Server response: ${res.statusCode}`))
// 			}

// 			var body = []
// 			res.on('data', chunk => {
// 				body.push(chunk)
// 			})

// 			res.on('end', () => {
// 				try {
// 					body = JSON.parse(Buffer.concat(body).toString())
// 				} catch (e) {
// 					reject(e)
// 				}

// 				resolve(body);
// 			})
// 		})

// 		req.on('error', e => reject(e))

// 		if (data) {
// 			req.write(data);
// 			req.setHeader('Content-Length', data.length)
// 		}

// 		req.end()
// 	})
// }

export default class WebPin { 
	// find device by mac address
	static find(mac) {
		return find()
		// use reduce to key devices array by mac address
		.then(devices => devices.reduce((a, d) => ({...a, [d.mac]: d}), {}))
		.then(devices => {
			if (devices[mac]) {
				return devices[mac]
			}
			else {
				throw new Error(`Could not find ${mac} on local network`)
			}
		})
	}

	constructor(mac, pin) {
		this.dutyCycle = 0
		this.mac = mac
		this.pin = pin
	}

	// attempts to connect to the web pin on the network
	connect() {
		if (this.device) return Promise.resolve()

		return WebPin.find(this.mac)
			// get info from device
			.then(d => axios.get(`http://${d.ip}`)
				.then(res => { d.info = res.data; return d })
			)
			// validate pin
			.then(d => {
				console.log(d)
				if (d.info.pwmPins.find(p => p === this.pin) === undefined){
					throw new Error(`Device ${d.mac} doesn't have a pin ${this.pin}`)
				}
				return d
			})
			// get pin duty cycle from device
			.then(d => axios.get(`http://${d.ip}/pwm/${this.pin}`)
				.then(res => { this.dutyCycle = res.data.value; return d })
			)
			// we're done!
			.then(d => {
				console.log(`Successfully connected to web pin ${this.mac}!`)
				console.log(d)
				this.device = d
				return d
			})
			// handle errors in promise chain
			.catch(error => {
				console.log(`Failed to connect to web pin ${this.mac}`)
				console.log(error)
			})
	}

	// assigns a pwm value to the pin
	pwmWrite(dutyCycle) {
		return axios.put(
			`http://${this.device.ip}/pwm/${this.pin}`, 
			dutyCycle.toString()
		)
		.then(res => { this.dutyCycle = res.data.value; return this.dutyCycle; })
	}

	// gets the current value of the pin
	getPwmDutyCycle() {
		return this.dutyCycle
	}
}