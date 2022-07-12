import {
  NamespaceMetadata,
  ChainMetadata,
  ChainRequestRender,
  convertHexToNumber,
  convertHexToUtf8
} from '../helpers'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-utils'

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
    name: 'Flow Devnet',
    rpc: ['https://rest-testnet.onflow.org'],
    slip44: 539,
    testnet: true
  }
}

export const FlowMetadata: NamespaceMetadata = {
  mainnet: {
    // Flow Mainnet
    logo: 'https://avatars.githubusercontent.com/u/62387156?s=280&v=4',
    rgb: '116, 176, 244'
  },
  // Flow Devnet
  testnet: {
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

export function getChainRequestRender(request: JsonRpcRequest): ChainRequestRender[] {
  let params = [{ label: 'Method', value: request.method }]

  switch (request.method) {
    case 'eth_sendTransaction':
    case 'eth_signTransaction':
      params = [
        ...params,
        { label: 'From', value: request.params[0].from },
        { label: 'To', value: request.params[0].to },
        {
          label: 'Gas Limit',
          value: request.params[0].gas
            ? convertHexToNumber(request.params[0].gas)
            : request.params[0].gasLimit
            ? convertHexToNumber(request.params[0].gasLimit)
            : ''
        },
        {
          label: 'Gas Price',
          value: convertHexToNumber(request.params[0].gasPrice)
        },
        {
          label: 'Nonce',
          value: convertHexToNumber(request.params[0].nonce)
        },
        {
          label: 'Value',
          value: request.params[0].value ? convertHexToNumber(request.params[0].value) : ''
        },
        { label: 'Data', value: request.params[0].data }
      ]
      break

    case 'eth_sign':
      params = [
        ...params,
        { label: 'Address', value: request.params[0] },
        { label: 'Message', value: request.params[1] }
      ]
      break
    case 'personal_sign':
      params = [
        ...params,
        { label: 'Address', value: request.params[1] },
        {
          label: 'Message',
          value: convertHexToUtf8(request.params[0])
        }
      ]
      break
    default:
      params = [
        ...params,
        {
          label: 'params',
          value: JSON.stringify(request.params, null, '\t')
        }
      ]
      break
  }
  return params
}
