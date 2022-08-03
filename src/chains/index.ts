import * as flow from './flow'

import { ChainMetadata } from '../helpers'

export function getChainMetadata(chainId: string): ChainMetadata {
  const namespace = chainId.split(':')[0]
  switch (namespace) {
    case 'flow':
      return flow.getChainMetadata(chainId)
    default:
      throw new Error(`No metadata handler for namespace ${namespace}`)
  }
}
