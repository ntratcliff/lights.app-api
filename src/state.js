import { Action } from "./actions"
import path from 'path'
import sanitize from 'sanitize-filename'
import fs from 'fs'
import fsutil from './fsutil'

export default class State {
	constructor (source, lights) {
		console.log("state constructor called")
		this.actions = []
		this.name = ""
		State._assign(this, source, lights)
	}

	enter () {
		console.log("enter!") // DEBUG 
		console.log(this) // DEBUG
		this.actions.forEach(a => a.apply())
	}

	leave () {
		this.actions.forEach(a => a.undo())
	}

	/**
	 * Writes the state to the filesystem
	 * @param {State} state The state to write
	 * @param {boolean} [overwrite=false] Whether or not to overwrite the file if it already exists
	 * @param {function} callback Callback passed to fs.writeFile
	 */
	static writeToFs (state, overwrite = false, callback) {	
		var path = this._getFsPath(state)
		console.log(`Writing profile to ${path}`)

		// make sure the path exists before continuing
		fsutil.ensurePathExists(path.substring(0, path.lastIndexOf('/')))
			.then(() => {
				var data = JSON.stringify(state)

				var op = {
					flag: 'w' // open path for writing
				}

				// set flag to prevent overwrite path if it exists
				if (!overwrite) { op.flag.concat('x') }

				fs.promises.writeFile(path, data, op)
					.then(() => {
						console.log(`Successfully saved profile to ${path}`)
					})
					.catch((err) => {
						if (callback) {
							callback(err)
						} else {
							throw err
						}
					})
			})
			.catch(err => { throw err })
	}

	/**
	 * Loads saved state data from the filesystem into the provided state
	 * @param {State} state The state object to load into
	 * @param {Function} callback Callback on state loaded or fs error
	 */
	static loadFromFs (state, lights, callback) {
		var path = this._getFsPath(state)

		console.log(`Loading profile from path ${path}`)

		fs.readFile(path, (err, data) => {
			if (err) {
				callback(err)
			} else {
				var source = JSON.parse(data)
				this._assign(state, source, lights)
				callback(err, state)
			}
		})
	}

	/** Returns a list of all states saved on the filesystem */
	static async fsList () {
		// list all saved states
		var dir = this._getProfilesPath()
		var files = await fs.promises.readdir(dir)

		console.log(files)

		var list = []
		for (var file of files) 
		{
			var state = await fs.promises.readFile(path.join(dir, file))
			list.push(JSON.parse(state))
		}

		return list
	}

	static _getProfilesPath() {
		return path.join(process.env.DATA_PATH, 'profiles')
	}

	static _getFsPath(state) {
		var fileName = state.name.toLowerCase().replace(' ', '-').concat('.json')
		fileName = sanitize(fileName)
		return path.join(this._getProfilesPath(), fileName)
	}

	static _assign (state, source, lights) {
		console.log("assigning object...")
		Object.assign(state, source)

		console.log(`${state.name}: instantiating actions...`) // DEBUG
		state.actions = state.actions.map(a =>  {
			var action = Action.from(a, lights)
			console.log(action) // DEBUG
			return action;
		})
	}
}