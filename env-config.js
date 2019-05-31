const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.ENTITY_RESOLVER_ADDRESS': '0x0dCA233CE5152d58c74E74693A3C496D01542244',
    'process.env.VOTING_PROCESS_CONTRACT_ADDRESS': '0x0000000000000000000000000000000000000000',
    'process.env.BOOTNODES_URL': "https://bootnodes.github.io/gateways.json",
    'process.env.ETH_NETWORK_ID': "vctestnet",
}
