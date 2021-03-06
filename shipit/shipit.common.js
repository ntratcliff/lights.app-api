// source: https://www.digitalocean.com/community/tutorials/how-to-automate-your-node-js-production-deployments-with-shipit-on-centos-7#step-1-%E2%80%94-setting-up-the-remote-repository

const ecosystemConfig = require('../ecosystem.config')

module.exports = shipit => {
	require('shipit-deploy')(shipit)
	require('shipit-shared')(shipit)
	const package = require('../package.json')

	/* ========== config ========== */
	shipit.initConfig({
		default: {
			branch: 'main',
			dirToCopy: 'dist',
			deployTo: '/home/lights/lights.app/api',
			repositoryUrl: 'https://github.com/ntratcliff/lights.app-api.git',
			keepReleases: 5,
			copy: false, // don't copy previous release to new 
			deploy: {
				remoteCopy: {
					copyAsDir: true // copy dirToCopy as directory not just contents
				}
			},
			shared: {
				overwrite: true,
				dirs: ['node_modules'],
				files: [
					'ecosystem.config.js',
					'rooms.config.js',
					'package.json',
					'package-lock.json',
					'default.state.json',
					'time.state.json'
				]
			},
		},
		development: {
			servers: [{
				host: 'blackberry.local',
				user: 'lights'
			}]
		},
		production: {
			servers: [{
				host: 'lights.local',
				user: 'lights'
			}]
		}
	})

	const path = require('path')

	/* ========== events ========== */
	shipit.on('fetched', () => {
		shipit.start('build')
	})

	shipit.on('published', () => {
		shipit.start('configure-data-path')
		shipit.start('pm2-server')
	})

	shipit.on('updated', () => {
		shipit.start('copy-config')
	})

	/* ========== tasks ========== */
	shipit.blTask('build', async () => {
		const op = {
			cwd: shipit.workspace
		}

		console.log(`local path: ${op.cwd}`)
		await shipit.local('npm install', op)
		await shipit.local('npm run-script build', op)
	})

	const sharedPath = path.join(shipit.config.deployTo, 'shared')

	shipit.blTask('copy-config', async () => {
		const sharedCopy = async file => 
			await shipit.copyToRemote(file, path.join(sharedPath, file))	

		await shipit.config.shared.files.forEach(f => sharedCopy(f.path))

		shipit.emit('config-copied')
	})

	shipit.blTask('pm2-server', async () => {
  		await shipit.remote(
			`sudo pm2 delete -s ${package.name} || :`
		)

 		await shipit.remote(
			`sudo pm2 start ecosystem.config.js --env production --watch true && sudo pm2 save`, 
			{ cwd: shipit.releasePath }
  		)
	})

	shipit.blTask('configure-data-path', async () => {
		const dir = ecosystemConfig.apps[0].env.DATA_PATH
		await shipit.remote(
			`sudo mkdir -p ${dir} && sudo chown -R $(whoami) ${dir}`
		)
	})
}