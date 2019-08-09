const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.ENTITY_RESOLVER_ADDRESS': process.env.ENTITY_RESOLVER_ADDRESS || '0xCe8aed46b103847C7b4a5B02BA6afa720274Ea35',
    'process.env.VOTING_PROCESS_CONTRACT_ADDRESS': process.env.VOTING_PROCESS_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    'process.env.BOOTNODES_URL': process.env.BOOTNODES_URL || "https://bootnodes.github.io/gateways.json",
    'process.env.ETH_NETWORK_ID': process.env.ETH_NETWORK_ID || "goerli",
}
