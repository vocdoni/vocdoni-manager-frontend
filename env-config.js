// This file is evaluated when exporting the frontend application
// The environment variabled need to be set locally on in the CI/CD console

const lang = "en"
const DEVELOPMENT = process.env.NODE_ENV !== "production"

module.exports = {
    LANG: lang,
    DEVELOPMENT,
    FALLBACK_REDIRECT_URL: "https://vocdoni.io/",

    // BLOCKCHAIN
    ETH_NETWORK_ID: process.env.ETH_NETWORK_ID || "xdai",
    // USE TEST/STAGE CONTRACTS
    TEST_CONTRACTS: process.env.TEST_CONTRACTS || "",

    // GATEWAYS
    BOOTNODES_URL_READ_ONLY: DEVELOPMENT ? "https://bootnodes.vocdoni.net/gateways.dev.json" : (process.env.BOOTNODES_URL_READ_ONLY || "https://bootnodes.vocdoni.net/gateways.json"),
    BOOTNODES_URL_RW: DEVELOPMENT ? "https://bootnodes.vocdoni.net/gateways.dev.json" : process.env.BOOTNODES_URL_RW,

    // VOCHAIN
    BLOCK_TIME: 10, // 10 seconds
    ORACLE_CONFIRMATION_DELAY: 12 * 15,

    // DOMAINS AND URL's
    APP_LINKING_DOMAIN: process.env.APP_LINKING_DOMAIN || (DEVELOPMENT ? "dev.vocdoni.link" : "vocdoni.link"),
    REGISTER_URL: process.env.REGISTER_URL || "ws://192.168.1.100/path",  // Where registered users connect from their app
    ACTION_VISIBILITY_URL: process.env.ACTION_VISIBILITY_URL || "ws://192.168.1.100/path",

    MANAGER_BACKEND_URI: process.env.MANAGER_BACKEND_URI || "ws://127.0.0.1:8000/api/manager",  // Where the manager backend is called
    MANAGER_BACKEND_PUB_KEY: process.env.MANAGER_BACKEND_PUB_KEY || "66625f284f50fa52d53579c7873a480b351cc20f7780fa556929f5017283ad2449"
}

console.log("Building the frontend with ENV:", module.exports)
