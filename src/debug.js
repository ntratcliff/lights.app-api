import { DateTime } from 'luxon'

class TimeState {
	constructor () {
		this.name = "Time state debug"

		// create time-based values repeating 0-255-0 every 2 minutes
		const values = []
		for (let i = 0; i < 10; i++) {
			values.push({
				time: DateTime.local().plus({ minutes: i })
					.toLocaleString(DateTime.TIME_24_WITH_SECONDS),
				value: i % 2 * 255
			})
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