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
    const routes = {
        public: {
            '/': { page: '/' },
            '/entities': { page: '/entities' },
            '/processes/active': { page: '/processes/active' },
            '/processes/ended': { page: '/processes/ended' },
            '/posts': { page: '/posts' },
            '/posts/view': { page: '/posts/view' },
        },
        private: {
            '/account/new': { page: '/account/new' },
            '/account/import': { page: '/account/import' },
            '/entities/edit': { page: '/entities/edit' },
            '/entities/new': { page: '/entities/new' },
            '/processes': { page: '/processes' },
            '/processes/new': { page: '/processes/new' },
            // '/processes/edit': { page: '/processes/edit' },
            '/posts/edit': { page: '/posts/edit' },
            '/posts/new': { page: '/posts/new' },
            '/members': { page: '/members' },
            '/members/view': { page: '/members/view' },
            '/targets': { page: '/targets' },
            '/targets/view': { page: '/targets/view' },
            '/census': { page: '/census' },
            '/census/view': { page: '/census/view' }
        },
    }

    if (env.BOOTNODES_URL_RW && env.BOOTNODES_URL_RW.length > 0) {
        return {...routes.public, ...routes.private}
    }

    return routes.public
}
