export const DEFAULT_MAIN_CHAINS = [
  // mainnets
  'flow:mainnet'
]

export const DEFAULT_TEST_CHAINS = [
  // testnets
  'flow:emulator',
  'flow:testnet'
]

export const DEFAULT_CHAINS = [...DEFAULT_MAIN_CHAINS, ...DEFAULT_TEST_CHAINS]

export const DEFAULT_PROJECT_ID = process.env.REACT_APP_PROJECT_ID

export const DEFAULT_RELAY_URL = process.env.REACT_APP_RELAY_URL

export const DEFAULT_LOGGER = 'debug'

export const DEFAULT_APP_METADATA = {
  name: 'React App',
  description: 'React App for WalletConnect',
  url: 'https://walletconnect.com/',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

/**
 * Flow
 */

export enum DEFAULT_FLOW_METHODS {
  FLOW_AUTHN = 'flow_authn',
  FLOW_AUTHZ = 'flow_authz',
  FLOW_USER_SIGN = 'flow_user_sign'
}

export enum DEFAULT_FLOW_EVENTS {}

/**
 * EIP155
 */
export enum DEFAULT_EIP155_METHODS {
  ETH_SEND_TRANSACTION = 'eth_sendTransaction',
  ETH_SIGN_TRANSACTION = 'eth_signTransaction',
  ETH_SIGN = 'eth_sign',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData'
}

export enum DEFAULT_EIP_155_EVENTS {
  ETH_CHAIN_CHANGED = 'chainChanged',
  ETH_ACCOUNTS_CHANGED = 'accountsChanged'
}

/**
 * COSMOS
 */
export enum DEFAULT_COSMOS_METHODS {
  COSMOS_SIGN_DIRECT = 'cosmos_signDirect',
  COSMOS_SIGN_AMINO = 'cosmos_signAmino'
}

export enum DEFAULT_COSMOS_EVENTS {}

/**
 * SOLANA
 */
export enum DEFAULT_SOLANA_METHODS {
  SOL_SIGN_TRANSACTION = 'solana_signTransaction',
  SOL_SIGN_MESSAGE = 'solana_signMessage'
}

export enum DEFAULT_SOLANA_EVENTS {}
