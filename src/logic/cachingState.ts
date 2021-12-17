import axios from "axios"
import { EIP3770Address } from "./eip3770"
import { ChainInfo, SafeInfo } from "./gcw"
import { MultisigTransaction, Page } from "./sts"

export interface CachingState {
    missingExecutedTxs: number
    queuedTxs: number
}

const loadMissingExecutedTxs = async (chainInfo: ChainInfo, safe: EIP3770Address, safeInfo: SafeInfo): Promise<number> => {
    const source = `${chainInfo.transactionService}/api/v1/safes/${safe.id}/multisig-transactions/?ordering=-nonce&trusted=true&limit=1&executed=true`
    const response = await axios.get<Page<MultisigTransaction>>(source)
    const txs = response.data.results
    console.log({safeInfo, txs})
    return safeInfo.nonce - 1 - (txs.length > 0 ? txs[0].nonce : 0)
}

const loadQueuedTxs = async (chainInfo: ChainInfo, safe: EIP3770Address, safeInfo: SafeInfo): Promise<number> => {
    const source = `${chainInfo.transactionService}/api/v1/safes/${safe.id}/multisig-transactions/?ordering=-nonce&trusted=true&limit=1&executed=false`
    const response = await axios.get<Page<MultisigTransaction>>(source)
    return response.data.count
}

export const loadCachingState = async (chainInfo: ChainInfo, safe: EIP3770Address, safeInfo: SafeInfo): Promise<CachingState> => {
    return {
        missingExecutedTxs: await loadMissingExecutedTxs(chainInfo, safe, safeInfo),
        queuedTxs: await loadQueuedTxs(chainInfo, safe, safeInfo)
    }
}