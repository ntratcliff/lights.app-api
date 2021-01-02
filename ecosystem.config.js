module.exports = {
	apps: [
		{
			name: 'lights.app-api',
			script: './dist/server.js',
			watch: true,
			autorestart: true,
			time: true,
			restart_delay: 1000,
			env: {
				NODE_ENV: 'development',
				PIGPIO: true,
				DATA_PATH: '/var/lib/lights.app/api/'
			},
			env_production: {
				NODE_ENV: 'production',
			}
		}
	]
};