import axios from "axios"
import { clientGateway } from "./config"
import { InfoWithSource } from "./types"

export interface AddressInfo {
    value: string
}

export interface RpcInfo {
    authentication: "API_KEY_PATH" | "NO_AUTHENTICATION"
    value: string
}

export interface ChainInfo {
    chainId: string
    chainName: string
    description: string
    l2: boolean
    transactionService: string
    publicRpcUri: RpcInfo
}

export interface SafeInfo {
    implementation: AddressInfo,
    threshold: number,
    nonce: number,
    owners: AddressInfo[]
}

export const loadChainInfo = async (shortName: string): Promise<InfoWithSource<ChainInfo>> => {
    const source = `${clientGateway()}/v1/chains/${shortName}`
    const response = await axios.get<ChainInfo>(source)
    return {
        source,
        content: response.data
    }
}

export const loadSafeInfo = async (chainId: string, safeAddress: string): Promise<InfoWithSource<SafeInfo>> => {
    const source = `${clientGateway()}/v1/chains/${chainId}/safes/${safeAddress}`
    const response = await axios.get<SafeInfo>(source)
    return {
        source,
        content: response.data
    }
}