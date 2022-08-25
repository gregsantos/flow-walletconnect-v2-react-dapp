import { useState, useEffect } from 'react'
import { Buffer } from 'buffer'
import Banner from './components/Banner'
import Transaction from './components/Transaction'
import Blockchain from './components/Blockchain'
import Column from './components/Column'
import Header from './components/Header'
import Modal from './components/Modal'
import { DEFAULT_FLOW_METHODS, DEFAULT_MAIN_CHAINS, DEFAULT_TEST_CHAINS } from './constants'
import { AccountAction } from './helpers'
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
import { useTransaction } from './contexts/TransactionContext'
import * as fcl from '@onflow/fcl'
import './flow/config'
import './decorate'
import { nope, yup } from './util'

export default function App() {
  const [services, setServices] = useState([])
  const [modal, setModal] = useState('')
  const closeModal = () => setModal('')
  const openPingModal = () => setModal('ping')

  const { initTransactionState, setTxId, setTransactionStatus, setTransactionInProgress } =
    useTransaction()

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
  const { ping, isRpcRequestPending, rpcResult } = useJsonRpc()

  const { chainData } = useChainData()

  useEffect(() => {
    const fetchServices = async () =>
      await fcl.discovery.authn.subscribe((res: { results: any }) => {
        console.log('discovery api services', res)
        setServices(res.results)
      })
    fetchServices()
  }, [])

  useEffect(() => {
    console.log(
      `
      Client:`,
      client,
      `
      Pairings:`,
      pairings,
      `
      Session:`,
      session
    )
  }, [client, pairings, session])

  const onConnect = () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    connect()
  }

  const onPing = async () => {
    openPingModal()
    await ping()
  }

  const getFlowActions = (): AccountAction[] => {
    const onFlowAuthn = async (chainId: string, address: string) => {
      try {
        const res = await fcl.reauthenticate()
        console.log('res', res)
      } catch (error) {
        console.error(error, 'Error on Authn')
      }
    }
    const onFlowAuthz = async (chainId: string, address: string) => {
      initTransactionState()

      // prettier-ignore
      const transactionId = await fcl
        .mutate({
          cadence: `
            transaction(a: Int, b: Int) {
              prepare(acct: AuthAccount) {
                log(acct)
                log(a)
                log(b)
              }
            }
          `,
          args: (arg: any, t: any) => [
            arg('6', t.Int),
            arg('7', t.Int),
          ],
          limit: 999
        })
        .then(yup('Mutate'))
        .catch(nope('Error on Mutate'))

      setTxId(transactionId)
      fcl.tx(transactionId).subscribe((res: any) => {
        if (!res) {
          setTransactionStatus('error')
          setTransactionInProgress(false)
          return
        }
        setTransactionStatus(res.status)
        if (res.status === 4) {
          console.log('Tx Sealed')
          setTransactionInProgress(false)
        }
      })
    }
    const onFlowUserSign = async (chainId: string, address: string) => {
      const toHexStr = (str: string) => {
        return Buffer.from(str).toString('hex')
      }
      const MSG = toHexStr('FOO')
      try {
        const res = await fcl
          .currentUser()
          .signUserMessage(MSG)
          .then(yup('SignUserMessage'))
          .catch(nope('Error signing user message'))

        return fcl.AppUtils.verifyUserSignatures(MSG, res).then(console.log)
      } catch (error) {
        console.error(error, 'Error on Authn')
      }
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
        <h6>{`Using v${'2.0.0-beta'}`}</h6>
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
        <Transaction />

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
