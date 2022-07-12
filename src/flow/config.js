import * as fcl from '@onflow/fcl'

const USE_LOCAL = true

fcl
  .config()
  .put('debug.accounts', true)
  .put('logger.level', 2)
  .put('app.detail.title', 'Test Harness')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200')
  .put('service.OpenID.scopes', 'email')
  .put('wc.projectId', '6427e017c4bd829eef203702a51688b0')

if (USE_LOCAL) {
  fcl
    .config()
    .put('flow.network', 'local')
    .put('accessNode.api', 'http://localhost:8888')
    //.put("discovery.wallet", "http://localhost:8701/fcl/authn")
    // local Discovery
    .put('discovery.wallet', 'http://localhost:3000/testnet/authn')
} else {
  fcl
    .config()
    // testnet
    .put('env', 'testnet')
    .put('flow.network', 'testnet')
    .put('accessNode.api', 'https://rest-testnet.onflow.org')
    .put('discovery.wallet', 'http://localhost:3000/testnet/authn')
  //.put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
  // mainnet
  //.put("env", "mainnet")
  //.put("flow.network", "mainnet")
  //.put("discovery.wallet", "https://fcl-discovery.onflow.org/authn")
  //.put("accessNode.api", "https://rest-mainnet.onflow.org")
}
