// This file is evaluated when exporting the frontend application
// The environment variabled need to be set locally on in the CI/CD console

const lang = "en"
const DEVELOPMENT = process.env.NODE_ENV !== "production"

module.exports = {
    LANG: lang,
    DEVELOPMENT,

    // BLOCKCHAIN
    ETH_NETWORK_ID: process.env.ETH_NETWORK_ID || "goerli",

    // GATEWAYS
    BOOTNODES_URL_READ_ONLY: process.env.BOOTNODES_URL_READ_ONLY || (DEVELOPMENT ? "https://bootnodes.vocdoni.net/gateways.dev.json" : "https://bootnodes.vocdoni.net/gateways.json"),
    BOOTNODES_URL_RW: process.env.BOOTNODES_URL_RW || (DEVELOPMENT ? "https://bootnodes.vocdoni.net/gateways.dev.json" : "https://bootnodes.vocdoni.net/gateways.priv.json"),

    // VOCHAIN
    BLOCK_TIME: 10, // 10 seconds
    ORACLE_CONFIRMATION_DELAY: 12 * 15,

    // DOMAINS AND URL's
    APP_LINKING_DOMAIN: process.env.APP_LINKING_DOMAIN || (DEVELOPMENT ? "dev.vocdoni.link" : "vocdoni.link"),
    REGISTER_URL: process.env.REGISTER_URL || "https://registry.vocdoni.net/api/actions/register",
    ACTION_VISIBILITY_URL: process.env.ACTION_VISIBILITY_URL || "https://registry.vocdoni.net/api/actions/status",
}

console.log("Building the frontend with ENV:", module.exports)
