import { ethers } from "ethers"

export interface ChainState {
    currentBlock: string
}

export const loadChainState = async (rpc: string): Promise<ChainState> => {
    const provider = new ethers.providers.JsonRpcProvider(rpc)
    return {
        currentBlock: (await provider.getBlockNumber()).toString()
    }
}
