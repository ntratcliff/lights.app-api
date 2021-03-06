module.exports = shipit => {
	require('./shipit.common.js')(shipit)

	/* ========== events ========== */
	shipit.on('config-copied', () => {
		shipit.start('npm-install')
	})

	/* ========== tasks ========== */
	const path = require('path')
	const sharedPath = path.join(
		shipit.config.deployTo,
		'shared'
	)
	shipit.blTask('npm-install', async () => {
		await shipit.remote(`cd ${sharedPath} && npm install --production`)
	})
}