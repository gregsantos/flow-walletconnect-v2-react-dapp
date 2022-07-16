import { BigNumber, utils } from 'ethers'
import { createContext, ReactNode, useContext, useState } from 'react'
import * as encoding from '@walletconnect/encoding'
import { TypedDataField } from '@ethersproject/abstract-signer'
import { Transaction as EthTransaction } from '@ethereumjs/tx'
import { eip712, formatTestTransaction, getLocalStorageTestnetFlag } from '../helpers'
import { useWalletConnectClient } from './ClientContext'
import { DEFAULT_EIP155_METHODS } from '../constants'
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

type TRpcRequestCallback = (chainId: string, address: string) => Promise<void>

interface IContext {
  ping: () => Promise<void>
  ethereumRpc: {
    testSendTransaction: TRpcRequestCallback
    testSignTransaction: TRpcRequestCallback
    testEthSign: TRpcRequestCallback
    testSignPersonalMessage: TRpcRequestCallback
    testSignTypedData: TRpcRequestCallback
  }
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

  const _verifyEip155MessageSignature = (message: string, signature: string, address: string) =>
    utils.verifyMessage(message, signature).toLowerCase() === address.toLowerCase()

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

  // -------- ETHEREUM/EIP155 RPC METHODS --------

  const ethereumRpc = {
    testSendTransaction: _createJsonRpcRequestHandler(async (chainId: string, address: string) => {
      const caipAccountAddress = `${chainId}:${address}`
      const account = accounts.find(account => account === caipAccountAddress)
      if (account === undefined) throw new Error(`Account for ${caipAccountAddress} not found`)

      const tx = await formatTestTransaction(account)

      const balance = BigNumber.from(balances[account][0].balance || '0')
      if (balance.lt(BigNumber.from(tx.gasPrice).mul(tx.gasLimit))) {
        return {
          method: DEFAULT_EIP155_METHODS.ETH_SEND_TRANSACTION,
          address,
          valid: false,
          result: 'Insufficient funds for intrinsic transaction cost'
        }
      }

      const result = await client!.request<string>({
        topic: session!.topic,
        chainId,
        request: {
          method: DEFAULT_EIP155_METHODS.ETH_SEND_TRANSACTION,
          params: [tx]
        }
      })

      // format displayed result
      return {
        method: DEFAULT_EIP155_METHODS.ETH_SEND_TRANSACTION,
        address,
        valid: true,
        result
      }
    }),
    testSignTransaction: _createJsonRpcRequestHandler(async (chainId: string, address: string) => {
      const caipAccountAddress = `${chainId}:${address}`
      const account = accounts.find(account => account === caipAccountAddress)
      if (account === undefined) throw new Error(`Account for ${caipAccountAddress} not found`)

      const tx = await formatTestTransaction(account)

      const signedTx = await client!.request<string>({
        topic: session!.topic,
        chainId,
        request: {
          method: DEFAULT_EIP155_METHODS.ETH_SIGN_TRANSACTION,
          params: [tx]
        }
      })

      const valid = EthTransaction.fromSerializedTx(signedTx as any).verifySignature()

      return {
        method: DEFAULT_EIP155_METHODS.ETH_SIGN_TRANSACTION,
        address,
        valid,
        result: signedTx
      }
    }),
    testSignPersonalMessage: _createJsonRpcRequestHandler(
      async (chainId: string, address: string) => {
        // test message
        const message = `My email is john@doe.com - ${Date.now()}`

        // encode message (hex)
        const hexMsg = encoding.utf8ToHex(message, true)

        // personal_sign params
        const params = [hexMsg, address]

        // send message
        const signature = await client!.request<string>({
          topic: session!.topic,
          chainId,
          request: {
            method: DEFAULT_EIP155_METHODS.PERSONAL_SIGN,
            params
          }
        })

        //  split chainId
        const [namespace, reference] = chainId.split(':')

        const targetChainData = chainData[namespace][reference]

        if (typeof targetChainData === 'undefined') {
          throw new Error(`Missing chain data for chainId: ${chainId}`)
        }

        const valid = _verifyEip155MessageSignature(message, signature, address)

        // format displayed result
        return {
          method: DEFAULT_EIP155_METHODS.PERSONAL_SIGN,
          address,
          valid,
          result: signature
        }
      }
    ),
    testEthSign: _createJsonRpcRequestHandler(async (chainId: string, address: string) => {
      // test message
      const message = `My email is john@doe.com - ${Date.now()}`
      // encode message (hex)
      const hexMsg = encoding.utf8ToHex(message, true)
      // eth_sign params
      const params = [address, hexMsg]

      // send message
      const signature = await client!.request<string>({
        topic: session!.topic,
        chainId,
        request: {
          method: DEFAULT_EIP155_METHODS.ETH_SIGN,
          params
        }
      })

      //  split chainId
      const [namespace, reference] = chainId.split(':')

      const targetChainData = chainData[namespace][reference]

      if (typeof targetChainData === 'undefined') {
        throw new Error(`Missing chain data for chainId: ${chainId}`)
      }

      const valid = _verifyEip155MessageSignature(message, signature, address)

      // format displayed result
      return {
        method: DEFAULT_EIP155_METHODS.ETH_SIGN + ' (standard)',
        address,
        valid,
        result: signature
      }
    }),
    testSignTypedData: _createJsonRpcRequestHandler(async (chainId: string, address: string) => {
      const message = JSON.stringify(eip712.example)

      // eth_signTypedData params
      const params = [address, message]

      // send message
      const signature = await client!.request<string>({
        topic: session!.topic,
        chainId,
        request: {
          method: DEFAULT_EIP155_METHODS.ETH_SIGN_TYPED_DATA,
          params
        }
      })

      // Separate `EIP712Domain` type from remaining types to verify, otherwise `ethers.utils.verifyTypedData`
      // will throw due to "unused" `EIP712Domain` type.
      // See: https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
      const { EIP712Domain, ...nonDomainTypes }: Record<string, TypedDataField[]> =
        eip712.example.types

      const valid =
        utils
          .verifyTypedData(eip712.example.domain, nonDomainTypes, eip712.example.message, signature)
          .toLowerCase() === address.toLowerCase()

      return {
        method: DEFAULT_EIP155_METHODS.ETH_SIGN_TYPED_DATA,
        address,
        valid,
        result: signature
      }
    })
  }

  return (
    <JsonRpcContext.Provider
      value={{
        ping,
        ethereumRpc,
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
