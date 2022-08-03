import axios, { AxiosInstance } from 'axios'
import { AssetData } from './types'

const ethereumApi: AxiosInstance = axios.create({
  baseURL: 'https://ethereum-api.xyz',
  timeout: 30000, // 30 secs
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export async function apiGetAccountBalance(address: string, chainId: string): Promise<AssetData> {
  const ethChainId = chainId.split(':')[1]
  const response = await ethereumApi.get(
    `/account-balance?address=${address}&chainId=${ethChainId}`
  )
  const { result } = response.data
  return result
}
