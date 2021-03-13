import find from 'local-devices'

find().then(devices => {
	console.log('Found devices:')
	console.log(devices)
})

export default class WebPin { 
	// find device by mac address
	static find(mac) {
		return find().then(
			// use reduce to key devices array by mac address
			devices => devices.reduce((a, d) => ({...a, [d.mac]: d}), {})
		).then(devices => {
			if (devices[mac]) {
				return devices[mac]
			}
			else {
				throw new Error(`Could not find ${mac} on local network`)
			}
		})
	}

	// creates a WebPin for the provided device at the mac address
	static create(mac, pin) {
		return this.find(mac).then(d => new this(d, pin))
	}

	constructor(device, pin) {
		this.device = device;
		this.pin = pin;
	}
}