module.exports = shipit => {
	require('./shipit.common.cjs')(shipit)

	/* ========== events ========== */
	shipit.on('updated', () => {
		shipit.start('nvm')
		shipit.start('npm-install')
	})

	/* ========== tasks ========== */
	const path = require('path')
	const sharedPath = path.join(
		shipit.config.deployTo,
		'shared'
	)

	shipit.blTask('nvm', async () => {
		await shipit.remote('nvm install', { cwd: sharedPath })
	})

	shipit.blTask('npm-install', async () => {
		await shipit.remote(`cd ${sharedPath} && npm install --production`)
	})
}