import { NamespaceMetadata, ChainMetadata } from '../helpers'

export const FlowChainData = {
  mainnet: {
    id: 'flow:mainnet',
    name: 'Flow Mainnet',
    rpc: ['https://rest-mainnet.onflow.org'],
    slip44: 539,
    testnet: false
  },
  testnet: {
    id: 'flow:testnet',
    name: 'Flow Testnet',
    rpc: ['https://rest-testnet.onflow.org'],
    slip44: 539,
    testnet: true
  },
  emulator: {
    id: 'flow:emulator',
    name: 'Flow Emualtor',
    rpc: ['http://localhost:8888'],
    slip44: 539,
    testnet: true
  }
}

export const FlowMetadata: NamespaceMetadata = {
  // Flow Mainnet
  mainnet: {
    logo: 'https://avatars.githubusercontent.com/u/62387156?s=280&v=4',
    rgb: '116, 176, 244'
  },
  // Flow Testnet
  testnet: {
    logo: 'https://avatars.githubusercontent.com/u/62387156?s=280&v=4',
    rgb: '116, 176, 244'
  },
  // Flow Emualtor
  emulator: {
    logo: 'https://avatars.githubusercontent.com/u/62387156?s=280&v=4',
    rgb: '116, 176, 244'
  }
}

export function getChainMetadata(chainId: string): ChainMetadata {
  const reference = chainId.split(':')[1]
  const metadata = FlowMetadata[reference]

  if (typeof metadata === 'undefined') {
    throw new Error(`No chain metadata found for chainId: ${chainId}`)
  }
  return metadata
}
