const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.BACKEND_URL_PREFIX': isProduction ? '/api' : 'http://localhost:7000/api',
    'process.env.MANAGER_URL': '/api',
    'process.env.CENSUS_SERVICE_URL': 'https://census.testnet.vocdoni.io',
    'process.env.CENSUS_REQUEST_URL': 'https://organization.testnet.vocdoni.io/census-register/',
    'process.env.VOTING_ENTITY_CONTRACT_ADDRESS': '0x2e154F16D5C1a080fc1082cf9992524aC94F3866',
    'process.env.VOTING_PROCESS_CONTRACT_ADDRESS': '0x353249397d2BCba5851D3d2f515DC3c4c63cE6a3',
}