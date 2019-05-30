const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.ENTITY_RESOLVER_ADDRESS': '0x2e154F16D5C1a080fc1082cf9992524aC94F3866',
    'process.env.VOTING_PROCESS_CONTRACT_ADDRESS': '0x353249397d2BCba5851D3d2f515DC3c4c63cE6a3',
    'process.env.BOOTNODES_URL': "https://bootnodes.github.io/gateways.json",
    'process.env.ETH_NETWORK_ID': "vctestnet",
}
