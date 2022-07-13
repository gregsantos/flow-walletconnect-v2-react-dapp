// import Client, {CLIENT_EVENTS} from "@walletconnect/sign-client"
import Client from '@walletconnect/sign-client'
import QRCodeModal from '@walletconnect/legacy-modal'
import { ERROR, getAppMetadata } from '@walletconnect/utils'

const INIT_DATA = {
  RELAY_URL: 'wss://relay.walletconnect.com',
  LOGGER: 'debug'
}

const data = {
  client: null
}

const fclWC = {
  init: async projectId => {
    if (data.client) {
      return data.client
    }

    const client = await Client.init({
      logger: INIT_DATA.LOGGER,
      relayUrl: INIT_DATA.RELAY_URL,
      projectId: projectId,
      metadata: {
        name: 'Example Dapp',
        description: 'Example Dapp',
        url: 'https://testFlow.com/',
        icons: ['https://avatars.githubusercontent.com/u/62387156?s=280&v=4']
      }
    })

    // Clean session due to no new modal for now
    const sessions = client.session.getAll()
    console.log('sessions ->', sessions)
    sessions.forEach(session => client.session.delete(session.topic))

    const pairings = client.pairing.getAll()
    console.log('pairings ->', pairings)
    pairings.forEach(pairing => client.pairing.delete(pairing.topic))

    data.client = client
    return { Client: data.client, QRCodeModal }
  },
  Client,
  QRCodeModal,
  ERROR,
  getAppMetadata
  // CLIENT_EVENTS,
}

export default fclWC
