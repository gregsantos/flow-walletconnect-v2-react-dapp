import * as fcl from '@onflow/fcl'
import * as fclWC from '@onflow/fcl-wc'

const USE_LOCAL = false

const WC_PROJECT_ID = process.env.REACT_APP_WC_PROJECT_ID
const WC_METADATA = {
  name: 'FCL WalletConnect',
  description: 'FCL DApp for WalletConnect',
  url: 'https://flow.com/',
  icons: ['https://avatars.githubusercontent.com/u/62387156?s=280&v=4']
}

const wcAdapter = fclWC.wcAdapter(WC_PROJECT_ID, WC_METADATA)

fcl
  .config()
  .put('debug.accounts', true)
  .put('logger.level', 2)
  .put('app.detail.title', 'Test Harness')
  .put('app.detail.icon', 'https://placekitten.com/g/200/200')
  .put('service.OpenID.scopes', 'email')
  .put('wc.adapter', wcAdapter)

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
