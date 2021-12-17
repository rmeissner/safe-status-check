import axios from "axios";
import { ChainInfo, SafeInfo } from "./gcw";
import { InfoWithSource } from "./types";

export interface Page<T> {
    count: number
    results: T[]
}

export interface MultisigTransaction {
    nonce: number
}

export interface MasterCopyState {
    address: string,
    version: string,
    lastIndexedBlockNumber: number,
    l2: boolean
}

export const loadIndexingStatus = async (chainInfo: ChainInfo, safeInfo: SafeInfo): Promise<InfoWithSource<MasterCopyState>> => {
    const source = `${chainInfo.transactionService}/api/v1/about/master-copies/`
    const response = await axios.get<MasterCopyState[]>(source)
    const status = response.data.find((status) => status.address === safeInfo.implementation.value)
    if (!status) throw Error("Unsupported mastercopy")
    return {
        source,
        content: status
    }
}