import { PairingTypes, SessionTypes } from '@walletconnect/types'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { AccountBalances, apiGetAccountBalance } from '../helpers'
import { getRequiredNamespaces } from '../helpers/namespaces'
import * as fcl from '@onflow/fcl'
import { getSdkError } from '@onflow/fcl-wc'
import { initWcAdapter } from '@onflow/fcl-wc'

/**
 * Types
 */
interface IContext {
  client: any | undefined
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
}

const WC_PROJECT_ID = process.env.REACT_APP_WC_PROJECT_ID
const WC_METADATA = {
  name: 'FCL WalletConnect',
  description: 'FCL DApp for WalletConnect',
  url: 'https://flow.com/',
  icons: ['https://avatars.githubusercontent.com/u/62387156?s=280&v=4']
}

/**
 * Context
 */
export const ClientContext = createContext<IContext>({} as IContext)

/**
 * Provider
 */
export function ClientContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [client, setClient] = useState<any>()
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([])
  const [session, setSession] = useState<SessionTypes.Struct>()

  const [isFetchingBalances, setIsFetchingBalances] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const [balances, setBalances] = useState<AccountBalances>({})
  const [accounts, setAccounts] = useState<string[]>([])
  const [chains, setChains] = useState<string[]>([])

  const reset = () => {
    setSession(undefined)
    setBalances({})
    setAccounts([])
    setChains([])
  }

  const getAccountBalances = async (_accounts: string[]) => {
    setIsFetchingBalances(true)
    try {
      const arr = await Promise.all(
        _accounts.map(async account => {
          const [namespace, reference, address] = account.split(':')
          const chainId = `${namespace}:${reference}`
          const assets = await apiGetAccountBalance(address, chainId)
          return { account, assets: [assets] }
        })
      )

      const balances: AccountBalances = {}
      arr.forEach(({ account, assets }) => {
        balances[account] = assets
      })
      setBalances(balances)
    } catch (e) {
      console.error(e)
    } finally {
      setIsFetchingBalances(false)
    }
  }

  const onSessionConnected = useCallback(async (_session: SessionTypes.Struct) => {
    console.log('onSessionConnected', _session)

    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map(namespace => namespace.accounts)
      .flat()
    const allNamespaceChains = Object.keys(_session.namespaces)

    console.log('All namespace accounts', allNamespaceAccounts)

    setSession(_session)
    setChains(allNamespaceChains)
    setAccounts(allNamespaceAccounts)
    await getAccountBalances(allNamespaceAccounts)
  }, [])

  const connect = useCallback(
    async pairing => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      try {
        const requiredNamespaces = getRequiredNamespaces(chains)
        console.log('requiredNamespaces config for connect:', requiredNamespaces)

        const wcPairings = pairings.length ? pairings : null
        console.log('Local Saved Pairings', wcPairings, 'Selected chains', chains)
        const res = await fcl.reauthenticate({ wcPairings })

        console.log('Authn response:', res)
        if (client.session.length) {
          const lastKeyIndex = client.session.keys.length - 1
          const _session = client.session.get(client.session.keys[lastKeyIndex])
          await onSessionConnected(_session)
        }
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }))
      } catch (e) {
        console.error(e)
        // ignore rejection
      }
    },
    [client, pairings, chains, onSessionConnected]
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
  }, [client, session])

  const _subscribeToEvents = useCallback(
    async _client => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }

      _client.on('session_ping', (args: any) => {
        console.log('EVENT', 'session_ping', args)
      })

      _client.on('session_event', (args: any) => {
        console.log('EVENT', 'session_event', args)
      })

      _client.on('session_update', ({ topic, params }: any) => {
        console.log('EVENT', 'session_update', { topic, params })
        const { namespaces } = params
        const _session = _client.session.get(topic)
        const updatedSession = { ..._session, namespaces }
        onSessionConnected(updatedSession)
      })

      _client.on('session_delete', () => {
        console.log('EVENT', 'session_delete')
        reset()
      })
    },
    [onSessionConnected]
  )

  const _checkPersistedState = useCallback(
    async _client => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      // populates existing pairings to state
      setPairings(_client.pairing.getAll({ active: true }))
      console.log('RESTORED PAIRINGS: ', _client.pairing.getAll({ active: true }))

      if (typeof session !== 'undefined') return
      // populates (the last) existing session to state
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1
        const _session = _client.session.get(_client.session.keys[lastKeyIndex])
        console.log('RESTORED SESSION:', _session)
        await onSessionConnected(_session)
        return _session
      }
    },
    [session, onSessionConnected]
  )

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true)
      const { servicePlugin, client, QRCodeModal } = await initWcAdapter({
        projectId: WC_PROJECT_ID,
        metadata: WC_METADATA
      })
      fcl.config.put('wc.adapter', { servicePlugin, client, QRCodeModal })
      const _client = client
      console.log('servicePlugin', servicePlugin)
      console.log('CREATED CLIENT: ', _client)
      setClient(_client)
      await _subscribeToEvents(_client)
      await _checkPersistedState(_client)
    } catch (err) {
      console.log('E', err)

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
      setChains
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
      setChains
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
