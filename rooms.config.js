/**
 * Configuration file for lights. 
 * 
 * The room object is defined as:
 * @param {string} name The human-readable name
 * @param {array} lights The lights in the room
 * 
 * Light options are defined as:
 * @param {string} name The human-readable name
 * @param {number} gpio The GPIO pin used to drive this light
 * @param {number} [value=0] The initial brightness value of the light [0, 255]
 */

export default {
	rooms: [
		{
			name: "Living Room",
			lights: [
				{ name: "North", gpio: 2 },
				{ name: "West", gpio: 14 }
			]
		}
	]	
}