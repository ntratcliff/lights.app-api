import { Action } from "./actions"
import path from 'path'
import sanitize from 'sanitize-filename'
import fs from 'fs'
import fsutil from './fsutil'

export default class State {
	constructor (source, lights) {
		this.actions = []
		this.name = ""
		this.default = false
		if (source) {
			State._assign(this, source, lights)
		}
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
	static async writeToFs (state, overwrite = false) {	
		var path = this._getFsPath(state)
		console.log(`Writing profile to ${path}`)

		// make sure the path exists before continuing
		return fsutil.ensurePathExists(path.substring(0, path.lastIndexOf('/')))
			.then(() => {
				var data = JSON.stringify(state)

				var op = {
					flag: 'w' // open path for writing
				}

				// set flag to prevent overwrite path if it exists
				if (!overwrite) { op.flag = op.flag.concat('x') }

				return fs.promises.writeFile(path, data, op)
			})
			.then(() => {
				console.log(`Successfully saved profile to ${path}`)
			})
	}

	/**
	 * Loads saved state data from the filesystem into the provided state
	 * @param {State} state The state object to load into
	 * @param {Function} callback Callback on state loaded or fs error
	 */
	static async loadFromFs (state, lights) {
		var path
		if (typeof state === 'string') {
			path = state
			state = new State()
		} else {
			path = this._getFsPath(state)
		}

		console.log(`Loading profile from path ${path}`)

		return fs.promises.readFile(path)
			.then(data => {
				var source = JSON.parse(data)

				if (lights) {
					this._assign(state, source, lights) // create full state object from source
				}
				else {
					Object.assign(state, source) // raw assign from source
				}

				return state
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

	/**
	 * Delete a state on the filesystem
	 * @param {String} name The name of the state to delete
	 */
	static async fsDelete (name) {
		// load state to check if default
		var state = await this.loadFromFs({ name: name })
		if (state.default) {
			var defaultPath = path.join(process.env.DATA_PATH, 'default-state.json')
			try {
				await fs.promises.unlink(defaultPath)
			} catch (err) {
				if (err.code !== 'ENOENT') {
					throw err
				}
			}
		}

		// remove state
		return fs.promises.unlink(this._getFsPath({name: name}))
	}

	static async setDefault (state) {
		// ensure state is saved 
		var defaultPath = path.join(process.env.DATA_PATH, 'default-state.json')
		
		try { // remove existing if any
			var current = await this.loadFromFs(defaultPath)
			current.default = false
			this.writeToFs(current, true)
			await fs.promises.unlink(defaultPath)
		} catch (err) {
			if (err.code !== 'ENOENT') {
				return err
			}
		}

		state.default = true
		await this.writeToFs(state, true)
		return fs.promises.symlink(this._getFsPath(state), defaultPath)
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