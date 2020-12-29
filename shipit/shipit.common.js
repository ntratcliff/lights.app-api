// source: https://www.digitalocean.com/community/tutorials/how-to-automate-your-node-js-production-deployments-with-shipit-on-centos-7#step-1-%E2%80%94-setting-up-the-remote-repository

module.exports = shipit => {
	require('shipit-deploy')(shipit)
	require('shipit-shared')(shipit)
	const package = require('../package.json')

	/* ========== config ========== */
	shipit.initConfig({
		default: {
			branch: 'states',
			dirToCopy: 'src',
			deployTo: '/home/lights/lights.app/api',
			repositoryUrl: 'https://github.com/ntratcliff/lights.app-api.git',
			keepReleases: 5,
			shared: {
				overwrite: true,
				dirs: ['node_modules'],
				files: [
					'.nvmrc',
					'ecosystem.config.js',
					'rooms.config.js',
					'package.json',
					'package-lock.json',
					'state.default.json'
				]
			},
		},
		development: {
			servers: 'lights@blackberry.local'
		},
		production: {
			servers: 'lights@raspberry.local'
		}
	})

	const path = require('path')

	/* ========== events ========== */
	shipit.on('published', () => {
		shipit.start('pm2-server')
	})

	shipit.on('updated', () => {
		shipit.start('copy-config')
	})

	/* ========== tasks ========== */
	const sharedPath = path.join(shipit.config.deployTo, 'shared')

	shipit.blTask('copy-config', async () => {
		const sharedCopy = async file => 
			await shipit.copyToRemote(file, path.join(sharedPath, file))	

		await shipit.config.shared.files.forEach(f => sharedCopy(f.path))
	})

	shipit.blTask('pm2-server', async () => {
  		await shipit.remote(
			`sudo pm2 delete -s ${package.name} || :`
		)
		const ecosystemPath = path.join(
			shipit.releasePath,
			'ecosystem.config.js'
		)

 		await shipit.remote(
			`sudo pm2 start --env production --watch true && sudo pm2 save`, 
			{ cwd: shipit.releasePath }
  		)
	})
}