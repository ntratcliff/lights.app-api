import fs from 'fs'

export default class {
	static async ensurePathExists (path) {
		return fs.promises.mkdir(path, { recursive: true })
			.catch((err) => {
				if (err.code === 'EEXIST') return // already exists
			})
	}
}