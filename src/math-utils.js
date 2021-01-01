export default class {
	/** 
	 * Returns a value between from and to by t 
	 * @param {number} from The value when t = 0
	 * @param {number} to The value when t = 1
	 * @param {number} t The amount to interpolate by
	 * @param {boolean} [clamped=true] Clamps returned value to range [from, to]
	 */
	static lerp (from, to, t, clamped = true) {
		if (clamped) t = this.clamp(t, 0, 1)
		return (from * (1.0 - t)) + (to * t)
	}

	/**
	 * Returns v clamped to range [min, max]
	 * @param {number} v The value to clamp
	 * @param {number} min The minimum value
	 * @param {numbe} max The maximum value
	 */
	static clamp (v, min, max) {
		return Math.max(min, Math.min(max, v))
	}
}