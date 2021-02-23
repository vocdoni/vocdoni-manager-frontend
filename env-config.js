// This file is evaluated when exporting the frontend application
// The environment variabled need to be set locally on in the CI/CD console

const lang = 'en'
const COMMIT_SHA = process.env.COMMIT_SHA || 'development'
const networkEnv = process.env.VOCDONI_ENVIRONMENT || 'dev'
let bootnodes = 'https://bootnodes.vocdoni.net/gateways.json'
let explorer = 'https://explorer.vocdoni.net'
let linking = 'vocdoni.link'
if (networkEnv !== 'prod') {
    bootnodes = bootnodes.replace('.json', `.${networkEnv}.json`)
    explorer = explorer.replace('explorer.', `explorer.${networkEnv}.`)
    linking = `${networkEnv}.${linking}`
}
let BOOTNODES_URL_RW = process.env.BOOTNODES_URL_RW
if (typeof BOOTNODES_URL_RW === 'undefined') {
    BOOTNODES_URL_RW = bootnodes

    if (networkEnv !== 'dev') {
        BOOTNODES_URL_RW = BOOTNODES_URL_RW.replace('.json', '.priv.json')
    }
}
let BOOTNODES_URL_READ_ONLY = process.env.BOOTNODES_URL_READ_ONLY
if (typeof BOOTNODES_URL_READ_ONLY === 'undefined') {
    BOOTNODES_URL_READ_ONLY = bootnodes
}

module.exports = {
    COMMIT_SHA,
    LANG: lang,
    FALLBACK_REDIRECT_URL: 'https://vocdoni.io/',

    // BLOCKCHAIN
    ETH_NETWORK_ID: process.env.ETH_NETWORK_ID || 'xdai',
    VOCDONI_ENVIRONMENT: process.env.VOCDONI_ENVIRONMENT || 'dev',

    // GATEWAYS
    BOOTNODES_URL_READ_ONLY,
    BOOTNODES_URL_RW,

    // VOCHAIN
    BLOCK_TIME: 10, // 10 seconds
    ORACLE_CONFIRMATION_DELAY: 12 * 15,
    EXPLORER_URL: process.env.EXPLORER_URL || explorer,

    // DOMAINS AND URL's
    APP_LINKING_DOMAIN: linking,
    REGISTER_URL: process.env.REGISTER_URL || 'ws://192.168.1.100/path',  // Where registered users connect from their app
    ACTION_VISIBILITY_URL: process.env.ACTION_VISIBILITY_URL || 'ws://192.168.1.100/path',

    MANAGER_BACKEND_URI: process.env.MANAGER_BACKEND_URI || 'http://127.0.0.1:8000/api/manager',  // Where the manager backend is called
    MANAGER_BACKEND_PUB_KEY: process.env.MANAGER_BACKEND_PUB_KEY || '66625f284f50fa52d53579c7873a480b351cc20f7780fa556929f5017283ad2449',
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || false,
    FORCE_TELEMETRY: process.env.FORCE_TELEMETRY || false,
}

console.log('Building the frontend with ENV:', module.exports)
