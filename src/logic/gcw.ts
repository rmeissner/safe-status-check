import axios from "axios"
import { clientGateway } from "./config"

export interface AddressInfo {
    value: string
}

export interface RpcInfo {
    authentication: "API_KEY_PATH" | "NO_AUTHENTICATION"
    value: string
}

export interface ChainInfo {
    chainId: string
    transactionService: string
    publicRpcUri: RpcInfo
}

export interface SafeInfo {
    implementation: AddressInfo
}

export const loadChainInfo = async (shortName: string): Promise<ChainInfo> => {
    const response = await axios.get<ChainInfo>(`${clientGateway()}/v1/chains/${shortName}`)
    return response.data
}

export const loadSafeInfo = async (chainId: string, safeAddress: string): Promise<SafeInfo> => {
    const response = await axios.get<SafeInfo>(`${clientGateway()}/v1/chains/${chainId}/safes/${safeAddress}`)
    return response.data
}