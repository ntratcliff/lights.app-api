import { DateTime } from 'luxon'

class TimeState {
	constructor () {
		this.name = "Time state debug"

		const values = []

		// 0-255-0 over 1 minute
		var time = DateTime.local()
		for (let i = 0; i < 3; i++) {
			values.push({
				time: time.toLocaleString(DateTime.TIME_24_WITH_SECONDS),
				value: i % 2 * 255
			})
			time = time.plus({ seconds: 30 })
		}

		// 0-128-0 over 2 minutes
		for (let i = 0; i < 3; i++) {
			values.push({
				time: time.toLocaleString(DateTime.TIME_24_WITH_SECONDS),
				value: i % 2 * 128
			})
			time = time.plus({ minutes: 1 })
		}

		console.log("(Debug) timeState timings:")
		console.log(values)

		this.actions = [{
			type: "time",
			timings: [{
				id: 0,
				values: values
			}]
		}]
	}
}

export let timeState = new TimeState()