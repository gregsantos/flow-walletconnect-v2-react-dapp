import { createContext, ReactNode, useContext, useState } from 'react'
import { getLocalStorageTestnetFlag } from '../helpers'
import { useWalletConnectClient } from './ClientContext'
import { useChainData } from './ChainDataContext'

/**
 * Types
 */
interface IFormattedRpcResponse {
  method?: string
  address?: string
  valid: boolean
  result: string
}

interface IContext {
  ping: () => Promise<void>
  rpcResult?: IFormattedRpcResponse | null
  isRpcRequestPending: boolean
  isTestnet: boolean
  setIsTestnet: (isTestnet: boolean) => void
}

/**
 * Context
 */
export const JsonRpcContext = createContext<IContext>({} as IContext)

/**
 * Provider
 */
export function JsonRpcContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<IFormattedRpcResponse | null>()
  const [isTestnet, setIsTestnet] = useState(getLocalStorageTestnetFlag())

  const { client, session, accounts, balances } = useWalletConnectClient()

  const { chainData } = useChainData()

  const _createJsonRpcRequestHandler =
    (rpcRequest: (chainId: string, address: string) => Promise<IFormattedRpcResponse>) =>
    async (chainId: string, address: string) => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      if (typeof session === 'undefined') {
        throw new Error('Session is not connected')
      }

      try {
        setPending(true)
        const result = await rpcRequest(chainId, address)
        setResult(result)
      } catch (err: any) {
        console.error('RPC request failed: ', err)
        setResult({
          address,
          valid: false,
          result: err?.message ?? err
        })
      } finally {
        setPending(false)
      }
    }

  const ping = async () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    if (typeof session === 'undefined') {
      throw new Error('Session is not connected')
    }

    try {
      setPending(true)

      let valid = false

      try {
        await client.ping({ topic: session.topic })
        valid = true
      } catch (e) {
        valid = false
      }

      // display result
      setResult({
        method: 'ping',
        valid,
        result: valid ? 'Ping succeeded' : 'Ping failed'
      })
    } catch (e) {
      console.error(e)
      setResult(null)
    } finally {
      setPending(false)
    }
  }

  return (
    <JsonRpcContext.Provider
      value={{
        ping,
        rpcResult: result,
        isRpcRequestPending: pending,
        isTestnet,
        setIsTestnet
      }}
    >
      {children}
    </JsonRpcContext.Provider>
  )
}

export function useJsonRpc() {
  const context = useContext(JsonRpcContext)
  if (context === undefined) {
    throw new Error('useJsonRpc must be used within a JsonRpcContextProvider')
  }
  return context
}
