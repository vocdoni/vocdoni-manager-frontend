// This file is evaluated when exporting the frontend application
// The environment variabled need to be set locally on in the CI/CD console

const lang = 'en'
const COMMIT_SHA = process.env.COMMIT_SHA || 'development'
const networkEnv = process.env.VOCDONI_ENVIRONMENT || 'dev'
let bootnodes = 'https://bootnodes.vocdoni.net/gateways.json'
let explorer = 'https://explorer.vocdoni.net'
let manager = 'https://manager.vocdoni.net/api/manager'
let linking = 'vocdoni.link'
if (networkEnv !== 'prod') {
    bootnodes = bootnodes.replace('.json', `.${networkEnv}.json`)
    explorer = explorer.replace('explorer.', `explorer.${networkEnv}.`)
    linking = `${networkEnv}.${linking}`
    manager = manager.replace('manager.', `manager.${networkEnv}.`)
}
let BOOTNODES_URL_RW = process.env.BOOTNODES_URL_RW
if (typeof BOOTNODES_URL_RW === 'undefined' || (typeof BOOTNODES_URL_RW === 'string' && !BOOTNODES_URL_RW.length)) {
    BOOTNODES_URL_RW = bootnodes

    if (networkEnv !== 'dev') {
        BOOTNODES_URL_RW = BOOTNODES_URL_RW.replace('.json', '.priv.json')
    }
}
let BOOTNODES_URL_READ_ONLY = process.env.BOOTNODES_URL_READ_ONLY
if (typeof BOOTNODES_URL_READ_ONLY === 'undefined' || (typeof BOOTNODES_URL_RW === 'string' && !BOOTNODES_URL_READ_ONLY.length)) {
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

    MANAGER_BACKEND_URI: process.env.MANAGER_BACKEND_URI || manager,
    MANAGER_BACKEND_PUB_KEY: process.env.MANAGER_BACKEND_PUB_KEY || '028b1d1380c37d114ac5a2b056d11cec76439664d00b076f9ace97adbe03da6fe1',
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || false,
    FORCE_TELEMETRY: process.env.FORCE_TELEMETRY || false,
}

console.log('Building the frontend with ENV:', module.exports)
