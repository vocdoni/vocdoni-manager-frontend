/* eslint-disable */
const env = require("./env-config.js")
const withCss = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const lessToJS = require('less-vars-to-js')
const fs = require('fs')
const path = require('path')

// Where your antd-custom.less file lives
const themeVariables = lessToJS(
  fs.readFileSync(path.resolve(__dirname, './styles/antd-custom.less'), 'utf8')
)


module.exports = withCss(withLess({
  env,
  exportTrailingSlash: true,
  exportPathMap: () => generatePathMap(),
  lessLoaderOptions: {
    javascriptEnabled: true,
    modifyVars: themeVariables, // make your antd custom effective
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const antStyles = /antd\/.*?\/style.*?/
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
}))

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
    // '/processes/edit': { page: '/processes/edit' },
    '/processes/new': { page: '/processes/new' },
    '/processes/active': { page: '/processes/active' },
    '/processes/ended': { page: '/processes/ended' },
    '/posts': { page: '/posts' },
    '/posts/edit': { page: '/posts/edit' },
    '/posts/new': { page: '/posts/new' },
  }
}
