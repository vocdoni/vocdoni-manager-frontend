// This file is evaluated when exporting the frontend application
// The environment variabled need to be set locally on in the CI/CD console

module.exports = {
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.DEVELOPMENT': process.env.DEVELOPMENT || false,

    // BLOCKCHAIN
    // 'process.env.ENTITY_RESOLVER_ADDRESS': process.env.ENTITY_RESOLVER_ADDRESS || '0xCe8aed46b103847C7b4a5B02BA6afa720274Ea35',
    // 'process.env.VOTING_PROCESS_CONTRACT_ADDRESS': process.env.VOTING_PROCESS_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    'process.env.ETH_NETWORK_ID': process.env.ETH_NETWORK_ID || "goerli",

    // GATEWAYS
    'process.env.BOOTNODES_URL': process.env.BOOTNODES_URL || (process.env.DEVELOPMENT ? "https://bootnodes.github.io/gateways.dev.json" : "https://bootnodes.github.io/gateways.priv.json"),

    // VOCHAIN
    'process.env.BLOCK_TIME': 10, // 10 seconds
    'process.env.ORACLE_CONFIRMATION_DELAY': 12 * 15,

    // USER REGISTRY + ACTIONS
    'process.env.REGISTER_URL': process.env.REGISTER_URL || "https://registry.vocdoni.net/api/actions/register",
    'process.env.ACTION_VISIBILITY_URL': process.env.ACTION_VISIBILITY_URL || "https://registry.vocdoni.net/api/actions/status",
}
