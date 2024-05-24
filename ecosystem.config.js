// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'twitter clone',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
