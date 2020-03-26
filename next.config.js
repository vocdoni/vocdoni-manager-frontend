const env = require("./env-config.js")

module.exports = {
  env,
  exportTrailingSlash: true,
  exportPathMap: () => generatePathMap(),
  webpack: (config, { isServer }) => {
    if (isServer) {
      const antStyles = /antd\/.*?\/style\/css.*?/
      const origExternals = [...config.externals]
      config.externals = [
        (context, request, callback) => {
          if (request.match(antStyles)) return callback()
          if (typeof origExternals[0] === 'function') {
            origExternals[0](context, request, callback)
          } else {
            callback()
          }
        },
        ...(typeof origExternals[0] === 'function' ? [] : origExternals),
      ]

      config.module.rules.unshift({
        test: antStyles,
        use: 'null-loader',
      })
    }
    return config
  },
}

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

async function generatePathMap() {
  return {
    '/': { page: '/' },
    '/entities': { page: '/entities' },
    '/entities/edit': { page: '/entities/edit' },
    '/entities/new': { page: '/entities/new' },
    '/processes': { page: '/processes' },
    '/processes/edit': { page: '/processes/edit' },
    '/processes/new': { page: '/processes/new' },
    '/posts': { page: '/posts' },
    '/posts/edit': { page: '/posts/edit' },
    '/posts/new': { page: '/posts/new' },
  }
}
