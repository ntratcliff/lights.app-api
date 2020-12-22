
		module.exports = {
		apps: [
		  {
		    name: 'lights.app-api',
		    script: '/home/lights/lights.app/api/releases/20201222175024/server.js',
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
		};