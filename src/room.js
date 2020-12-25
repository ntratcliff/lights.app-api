/** A room */
export default class Room {
	/**
	 * Create a new room
	 * @param {string} name The human-readable name of the room
	 * @param {Light[]} [lights=[]] The lights in this room
	 */
	constructor(name, lights = []) {
		this.name = name;
		this.lights = lights;
	}
}