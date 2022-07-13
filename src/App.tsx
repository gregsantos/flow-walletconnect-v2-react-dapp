import React, { useEffect, useState } from 'react'
import { version } from '@walletconnect/sign-client/package.json'
import Banner from './components/Banner'
import Blockchain from './components/Blockchain'
import Column from './components/Column'
import Header from './components/Header'
import Modal from './components/Modal'
import { DEFAULT_FLOW_METHODS, DEFAULT_MAIN_CHAINS, DEFAULT_TEST_CHAINS } from './constants'
import { AccountAction, setLocaleStorageTestnetFlag } from './helpers'
import RequestModal from './modals/RequestModal'
import PairingModal from './modals/PairingModal'
import PingModal from './modals/PingModal'
import {
  SAccounts,
  SAccountsContainer,
  SButtonContainer,
  SConnectButton,
  SContent,
  SLanding,
  SLayout
} from './components/app'
import { useWalletConnectClient } from './contexts/ClientContext'
import { useJsonRpc } from './contexts/JsonRpcContext'
import { useChainData } from './contexts/ChainDataContext'
import * as fcl from '@onflow/fcl'
import './flow/config'
import './decorate'

export default function App() {
  const [modal, setModal] = useState('')

  const closeModal = () => setModal('')
  const openPairingModal = () => setModal('pairing')
  const openPingModal = () => setModal('ping')
  const openRequestModal = () => setModal('request')

  // Initialize the WalletConnect client.
  const {
    client,
    pairings,
    session,
    connect,
    disconnect,
    chains,
    accounts,
    balances,
    isFetchingBalances,
    isInitializing,
    setChains
  } = useWalletConnectClient()

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const { ping, isRpcRequestPending, rpcResult, isTestnet, setIsTestnet } = useJsonRpc()

  const { chainData } = useChainData()

  // Close the pairing modal after a session is established.
  useEffect(() => {
    if (session && modal === 'pairing') {
      closeModal()
    }
  }, [session, modal])

  const onConnect = () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    // Suggest existing pairings (if any).
    if (pairings.length) {
      openPairingModal()
    } else {
      // If no existing pairings are available, trigger `WalletConnectClient.connect`.
      connect()
    }
  }

  const onPing = async () => {
    openPingModal()
    await ping()
  }

  const getFlowActions = (): AccountAction[] => {
    const onFlowAuthn = async (chainId: string, address: string) => {
      console.log('onFlowAuthn')
      try {
        const res = await fcl.reauthenticate()
        console.log('res', res)
      } catch (error) {
        console.error(error, 'Error on Authn')
      }
      /*       openRequestModal()
      await flowRpc.testFlowAuthn(chainId, address) */
    }
    const onFlowAuthz = async (chainId: string, address: string) => {
      console.log('onFlowAuthz')
      /*       openRequestModal()
      await flowRpc.testFlowAuthz(chainId, address) */
    }
    const onFlowUserSign = async (chainId: string, address: string) => {
      console.log('onFlowUserSign')
      /*       openRequestModal()
      await flowRpc.testFlowUserSign(chainId, address) */
    }
    return [
      { method: DEFAULT_FLOW_METHODS.FLOW_AUTHN, callback: onFlowAuthn },
      { method: DEFAULT_FLOW_METHODS.FLOW_AUTHZ, callback: onFlowAuthz },
      { method: DEFAULT_FLOW_METHODS.FLOW_USER_SIGN, callback: onFlowUserSign }
    ]
  }

  const getBlockchainActions = (chainId: string) => {
    const [namespace] = chainId.split(':')
    switch (namespace) {
      case 'flow':
        return getFlowActions()
      default:
        break
    }
  }

  // Toggle between displaying testnet or mainnet chains as selection options.
  const toggleTestnets = () => {
    const nextIsTestnetState = !isTestnet
    setIsTestnet(nextIsTestnetState)
    setLocaleStorageTestnetFlag(nextIsTestnetState)
  }

  const handleChainSelectionClick = (chainId: string) => {
    if (chains.includes(chainId)) {
      setChains(chains.filter(chain => chain !== chainId))
    } else {
      setChains([...chains, chainId])
    }
  }

  // Renders the appropriate model for the given request that is currently in-flight.
  const renderModal = () => {
    switch (modal) {
      case 'pairing':
        if (typeof client === 'undefined') {
          throw new Error('WalletConnect is not initialized')
        }
        return <PairingModal pairings={pairings} connect={connect} />
      case 'request':
        return <RequestModal pending={isRpcRequestPending} result={rpcResult} />
      case 'ping':
        return <PingModal pending={isRpcRequestPending} result={rpcResult} />
      default:
        return null
    }
  }

  const renderContent = () => {
    const chainOptions = [...DEFAULT_TEST_CHAINS, ...DEFAULT_MAIN_CHAINS] // isTestnet ? DEFAULT_TEST_CHAINS : DEFAULT_MAIN_CHAINS

    return !accounts.length && !Object.keys(balances).length ? (
      <SLanding center>
        <Banner />
        <h6>{`Using v${version || '2.0.0-beta'}`}</h6>
        <SButtonContainer>
          <h6>Select chains:</h6>
          {chainOptions.map(chainId => (
            <Blockchain
              key={chainId}
              chainId={chainId}
              chainData={chainData}
              onClick={handleChainSelectionClick}
              active={chains.includes(chainId)}
            />
          ))}
          <SConnectButton left onClick={onConnect} disabled={!chains.length}>
            {'Connect'}
          </SConnectButton>
        </SButtonContainer>
      </SLanding>
    ) : (
      <SAccountsContainer>
        <h3>Accounts</h3>
        <SAccounts>
          {accounts.map(account => {
            const [namespace, reference, address] = account.split(':')
            const chainId = `${namespace}:${reference}`
            return (
              <Blockchain
                key={account}
                active={true}
                chainData={chainData}
                fetching={isFetchingBalances}
                address={address}
                chainId={chainId}
                balances={balances}
                actions={getBlockchainActions(chainId)}
              />
            )
          })}
        </SAccounts>
      </SAccountsContainer>
    )
  }

  return (
    <SLayout>
      <Column maxWidth={1000} spanHeight>
        <Header ping={onPing} disconnect={disconnect} session={session} />
        <SContent>{isInitializing ? 'Loading...' : renderContent()}</SContent>
      </Column>
      <Modal show={!!modal} closeModal={closeModal}>
        {renderModal()}
      </Modal>
    </SLayout>
  )
}
