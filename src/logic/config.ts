import { RpcInfo } from './gcw';

export const clientGateway = () => "https://safe-client.gnosis.io"

export const configService = () => "https://safe-config.gnosis.io"

export const buildRpcUrl = (rpcInfo: RpcInfo, infuraKey?: string): string => {
    switch(rpcInfo.authentication) {
        case "API_KEY_PATH":
            if (!infuraKey) {
                throw Error("Missing Infura key")
            }
            return rpcInfo.value + infuraKey
        case "NO_AUTHENTICATION":
            return rpcInfo.value
    }
    throw Error("Unexpected authentication type")
}