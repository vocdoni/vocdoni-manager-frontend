/* eslint-disable */
const env = require("./env-config.js")

// Where your antd-custom.less file lives
module.exports = {
    env,
    exportTrailingSlash: true,
    exportPathMap: () => generatePathMap(),
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
}

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

async function generatePathMap() {
    return {
        '/': { page: '/' },
        '/account/new': { page: '/account/new' },
        '/account/import': { page: '/account/import' },
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
