import * as fcl from '@onflow/fcl'

const USE_LOCAL = false

fcl
  .config()
  .put('debug.accounts', true)
  .put('logger.level', 2)
  .put('app.detail.title', 'Test Harness')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200')
  .put('service.OpenID.scopes', 'email')

if (USE_LOCAL) {
  fcl
    .config()
    .put('flow.network', 'local')
    .put('accessNode.api', 'http://localhost:8888')
    .put('discovery.wallet', 'http://localhost:3000/testnet/authn') // DEVWALLET "http://localhost:8701/fcl/authn"
} else {
  fcl
    .config()
    // testnet
    .put('flow.network', process.env.REACT_APP_FLOW_NETWORK)
    .put('accessNode.api', process.env.REACT_APP_ACCESS_NODE_API)
    .put('discovery.wallet', process.env.REACT_APP_DISCOVERY_WALLET)
    .put('discovery.authn.endpoint', process.env.REACT_APP_DISCOVERY_AUTHN_ENDPOINT)
  // .put('discovery.wallet', 'http://localhost:3002/testnet/authn')
  //.put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
  //.put('discovery.authn.include', ['0x82ec283f88a62e65', '0xead892083b3e2c6c'])
  // mainnet
  //.put("flow.network", "mainnet")
  //.put("discovery.wallet", "https://fcl-discovery.onflow.org/authn")
  //.put("accessNode.api", "https://rest-mainnet.onflow.org")
}
