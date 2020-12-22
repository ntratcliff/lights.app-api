// source: https://www.digitalocean.com/community/tutorials/how-to-automate-your-node-js-production-deployments-with-shipit-on-centos-7#step-1-%E2%80%94-setting-up-the-remote-repository

module.exports = shipit => {
	require('shipit-deploy')(shipit);
	require('shipit-shared')(shipit);

	/* ========== config ========== */
	const appName = "lights.app-api";
	shipit.initConfig({
		default: {
			branch: 'main',
			dirToCopy: 'dist',
			deployTo: '/home/lights/lights.app/api',
			repositoryUrl: 'https://github.com/ntratcliff/lights.app-api.git',
			keepReleases: 5,
			shared: {
				overwrite: true,
				dirs: ['node_modules']
			},
		},
		production: {
			servers: 'lights@192.168.1.120'
		}
	});

	const path = require('path');
	const ecosystemFilePath = path.join(
		shipit.config.deployTo,
		'shared',
		'ecosystem.config.js'
	);

	/* ========== events ========== */
	shipit.on('updated', () => {
		shipit.start('npm-install', 'copy-config');
	});

	shipit.on('published', () => {
			shipit.start('pm2-server');
	});

	/* ========== tasks ========== */
	shipit.task('build', function() {
		shipit.local('npm run-script build')
	})

	shipit.blTask('copy-config', async () => {
		const fs = require('fs');

		const ecosystem = `
		module.exports = {
		apps: [
		  {
		    name: '${appName}',
		    script: '${shipit.releasePath}/server.js',
		    watch: true,
		    autorestart: true,
		    restart_delay: 1000,
		    env: {
		      NODE_ENV: 'development'
		    },
		    env_production: {
		      NODE_ENV: 'production'
		    }
		  }
		]
		};`;

		fs.writeFileSync('ecosystem.config.js', ecosystem, function(err) {
			if (err) throw err;
			console.log('File created successfully.');
		});

		await shipit.copyToRemote('ecosystem.config.js', ecosystemFilePath);
	});

	shipit.blTask('npm-install', async () => {
		shipit.remote(`cd ${shipit.releasePath} && npm install --production`);
	});

	shipit.blTask('pm2-server', async () => {
  await shipit.remote(`pm2 delete -s ${appName} || :`);
  await shipit.remote(
    `pm2 start ${ecosystemFilePath} --env production --watch true`
  );
});
}