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
  const paths = {
    '/': { page: '/' },
    '/entities': { page: '/entities' },
    '/entities/edit': { page: '/entities/edit' },
    '/processes': { page: '/processes' },
    '/processes/new': { page: '/processes/new' },
    '/processes/edit': { page: '/processes/edit' },
    '/posts': { page: '/posts' },
    '/posts/edit': { page: '/posts/edit' },
  }
  return paths
}
