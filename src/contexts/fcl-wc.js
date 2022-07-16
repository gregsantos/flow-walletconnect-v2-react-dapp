import Client from '@walletconnect/sign-client'
export { default as QRCodeModal } from '@walletconnect/qrcode-modal'
export { getSdkError } from '@walletconnect/utils'
//import { getSdkError, getAppMetadata } from '@walletconnect/utils'
// export { default as Client } from '@walletconnect/sign-client'

const DEFAULT_PROJECT_ID = '6427e017c4bd829eef203702a51688b0'
const DEFAULT_RELAY_URL = 'wss://relay.walletconnect.com'
const DEFAULT_LOGGER = 'debug'
const DEFAULT_APP_METADATA = {
  name: 'Flow WalletConnect',
  description: 'Flow DApp for WalletConnect',
  url: 'https://flow.com/',
  icons: ['https://avatars.githubusercontent.com/u/62387156?s=280&v=4']
}

export let client = null

export const initClient = async (projectID, metadata) => {
  if (client) {
    return client
  }

  return Client.init({
    logger: DEFAULT_LOGGER,
    relayUrl: DEFAULT_RELAY_URL,
    projectId: projectID || DEFAULT_PROJECT_ID,
    metadata: metadata || DEFAULT_APP_METADATA
  })
}
