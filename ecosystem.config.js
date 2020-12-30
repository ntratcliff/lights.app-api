module.exports = {
	apps: [
		{
			name: 'lights.app-api',
			script: './dist/server.js',
			watch: true,
			autorestart: true,
			restart_delay: 1000,
			env: {
				NODE_ENV: 'development',
				PIGPIO: true
			},
			env_production: {
				NODE_ENV: 'production',
				PIGPIO: true
			}
		}
	]
};