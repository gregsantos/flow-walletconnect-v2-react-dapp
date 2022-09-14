import Client from '@walletconnect/sign-client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import {
  createContext,
  ReactNode,
  SetStateAction,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import * as fcl from '@onflow/fcl'
import { init, getSdkError } from '@onflow/fcl-wc'
import { AccountBalances } from '../helpers'
import { getRequiredNamespaces } from '../helpers/namespaces'
import { DEFAULT_APP_METADATA, DEFAULT_PROJECT_ID } from '../constants'

/**
 * Types
 */
interface IContext {
  client: Client | undefined
  session: SessionTypes.Struct | undefined
  connect: (pairing?: { topic: string }) => Promise<void>
  disconnect: () => Promise<void>
  isInitializing: boolean
  chains: string[]
  pairings: PairingTypes.Struct[]
  accounts: string[]
  balances: AccountBalances
  isFetchingBalances: boolean
  setChains: any
  showRequestModal: boolean
  setShowRequestModal: Dispatch<SetStateAction<boolean>>
  sessionRequestData: any // SessionRequestData | null
}

interface PeerMetadata {
  name: string
  description: string
  url: string
  icons: string[]
}

interface IPairing {
  topic: string
  expiry: number
  relay: {
    protocol: string
  }
  active: boolean
  peerMetadata: PeerMetadata
}

interface WcRequestData {
  session: any
  pairing: IPairing
  uri: string | undefined
}

/**
 * Context
 */
export const ClientContext = createContext<IContext>({} as IContext)

/**
 * Provider
 */
export function ClientContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [client, setClient] = useState<Client>()
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([])
  const [session, setSession] = useState<SessionTypes.Struct>()

  const [isFetchingBalances, setIsFetchingBalances] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const [balances, setBalances] = useState<AccountBalances>({})
  const [accounts, setAccounts] = useState<string[]>([])
  const [chains, setChains] = useState<string[]>([])
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false)
  const [sessionRequestData, setSessionRequestData] = useState<PeerMetadata | null>(null)

  const reset = () => {
    setSession(undefined)
    setBalances({})
    setAccounts([])
    setChains([])
  }

  const getAccountBalances = async (_accounts: string[]) => {
    console.log('getAccountBalances', _accounts)

    setIsFetchingBalances(true)
    try {
      const arr = await Promise.all(
        _accounts.map(async account => {
          const [namespace, reference, address] = account.split(':')
          // const chainId = `${namespace}:${reference}`
          // const assets = await apiGetAccountBalance(address, chainId)
          const balance = '0.00'
          console.log('Get Account Balance', address, namespace, reference)

          return { account, balance }
        })
      )

      const balances: AccountBalances = {}
      arr.forEach(({ account, balance }) => {
        balances[account] = balance
      })
      setBalances(balances)
    } catch (e) {
      console.error(e)
    } finally {
      setIsFetchingBalances(false)
    }
  }

  const onSessionConnected = useCallback(async (_session: SessionTypes.Struct) => {
    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map(namespace => namespace.accounts)
      .flat()
    const allNamespaceChains = Object.keys(_session.namespaces)

    setSession(_session)
    setChains(allNamespaceChains)
    setAccounts(allNamespaceAccounts)
    setSessionRequestData(null)
    setShowRequestModal(false)
    await getAccountBalances(allNamespaceAccounts)
  }, [])

  const connect = useCallback(
    async (pairing: any) => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      try {
        // use this to update config?
        const requiredNamespaces = getRequiredNamespaces(chains)
        console.log('requiredNamespaces config for connect:', chains, requiredNamespaces['flow'])
        try {
          const res = await fcl.reauthenticate()
          console.log('res', res)
        } catch (error) {
          console.error(error, 'Error on Authn')
        } finally {
          setShowRequestModal(false)
        }
        if (client.session.length) {
          const lastKeyIndex = client.session.keys.length - 1
          const _session = client.session.get(client.session.keys[lastKeyIndex])
          console.log('session', _session, client.session.keys[lastKeyIndex])
          await onSessionConnected(_session)
          // Update known pairings after session is connected.
          setPairings(client.pairing.getAll({ active: true }))
        }
      } catch (e) {
        console.error(e)
        // ignore rejection
      }
    },
    [chains, client, onSessionConnected]
  )

  const disconnect = useCallback(async () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    if (typeof session === 'undefined') {
      throw new Error('Session is not connected')
    }
    await client.disconnect({
      topic: session.topic,
      reason: getSdkError('USER_DISCONNECTED')
    })
    // Reset app state after disconnect.
    reset()
    fcl.unauthenticate()
  }, [client, session])

  const _subscribeToEvents = useCallback(
    async (_client: Client) => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }

      _client.on('session_ping', args => {
        console.log('EVENT', 'session_ping', args)
      })

      _client.on('session_event', args => {
        console.log('EVENT', 'session_event', args)
      })

      _client.on('session_update', ({ topic, params }) => {
        console.log('EVENT', 'session_update', { topic, params })
        const { namespaces } = params
        const _session = _client.session.get(topic)
        const updatedSession = { ..._session, namespaces }
        onSessionConnected(updatedSession)
      })

      _client.on('session_delete', () => {
        console.log('EVENT', 'session_delete')
        reset()
        fcl.unauthenticate()
      })
    },
    [onSessionConnected]
  )

  const _checkPersistedState = useCallback(
    async (_client: Client) => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      // populates existing pairings to state
      setPairings(_client.pairing.getAll({ active: true }))

      if (typeof session !== 'undefined') return
      // populates (the last) existing session to state
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1
        const _session = _client.session.get(_client.session.keys[lastKeyIndex])

        await onSessionConnected(_session)
        return _session
      }
    },
    [session, onSessionConnected]
  )

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true)

      const { FclWcServicePlugin, client } = await init({
        projectId: DEFAULT_PROJECT_ID,
        metadata: DEFAULT_APP_METADATA,
        includeBaseWC: true,
        wallets: [
          {
            f_type: 'Service',
            f_vsn: '1.0.0',
            type: 'authn',
            method: 'WC/RPC',
            // this should be the wallets universal link and is used match with existing pairing
            uid: 'https://link.lilico.app/wc',
            endpoint: 'flow_authn',
            provider: {
              address: '0x9a4a5f2e7de57741',
              name: 'Lilico Mobile',
              icon: '/images/lilico.png',
              description:
                'A Mobile crypto wallet on Flow built for explorers, collectors, and gamers.',
              color: '#FC814A',
              supportEmail: 'hi@lilico.app',
              website: 'https://link.lilico.app/wc'
            }
          }
        ],
        sessionRequestHook: (data: WcRequestData) => {
          console.log('WC Request data', data)
          const peerMetadata = data?.pairing?.peerMetadata
          setSessionRequestData(peerMetadata)
          setShowRequestModal(true)
        },
        pairingModalOveride: {
          open: (uri: string = '', cb: () => void) => {
            console.log(`open modal for uri ${uri}`)
            window.setTimeout(() => cb(), 1000)
          },
          close: () => {
            console.log('close modal')
          }
        }
      })
      fcl.pluginRegistry.add(FclWcServicePlugin)

      const _client = client
      // console.log('CLIENT INIT: ', _client)
      setClient(_client)
      await _subscribeToEvents(_client)
      await _checkPersistedState(_client)
    } catch (err) {
      throw err
    } finally {
      setIsInitializing(false)
    }
  }, [_checkPersistedState, _subscribeToEvents])

  useEffect(() => {
    if (!client) {
      createClient()
    }
  }, [client, createClient])

  const value = useMemo(
    () => ({
      pairings,
      isInitializing,
      balances,
      isFetchingBalances,
      accounts,
      chains,
      client,
      session,
      connect,
      disconnect,
      setChains,
      showRequestModal,
      setShowRequestModal,
      sessionRequestData
    }),
    [
      pairings,
      isInitializing,
      balances,
      isFetchingBalances,
      accounts,
      chains,
      client,
      session,
      connect,
      disconnect,
      setChains,
      showRequestModal,
      setShowRequestModal,
      sessionRequestData
    ]
  )

  return (
    <ClientContext.Provider
      value={{
        ...value
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useWalletConnectClient() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error('useWalletConnectClient must be used within a ClientContextProvider')
  }
  return context
}
