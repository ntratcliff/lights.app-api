import find from 'local-devices'
import http from 'http'
import { debug } from 'console'

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
		this.mac = mac;
		this.pin = pin;
	}

	// attempts to connect to the web pin on the network
	connect() {
		if (this.device) return Promise.resolve()

		return WebPin.find(this.mac)
			.then(d => {

				// get device info
				return new Promise((resolve, reject) => {
					var req = http.request({
						hostname: d.ip,
						method: 'GET'
					}, res => { 
						// handle bad response
						if(res.statusCode < 200 || res.statusCode >= 300) {
							return reject(new Error(`Server response: ${res.statusCode}`))
						}

						var body = []
						res.on('data', chunk => {
							body.push(chunk)
						})

						res.on('end', () => {
							try {
								body = JSON.parse(Buffer.concat(body).toString())
							} catch (e) {
								reject(e)
							}
							d.info = body;
							resolve(d);
						})
					})

					req.on('error', e => reject(e))

					req.end()
				})
			})
			// validate pin
			.then(d => {
				console.log(d)
				if(d.info.pwmPins.find(p => p === this.pin) === undefined){
					throw new Error(`Device ${d.mac} doesn't have a pin ${this.pin}`)
				}
			})
			.then(d => {
				console.log('Successfully connected to web pin!')
				console.log(d)
				this.device = d
			})
			.catch(error => {
				console.log('Failed to connect to web pin')
				console.log(error)
			})

	}
}