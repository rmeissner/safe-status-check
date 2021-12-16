import { getAddress } from "@ethersproject/address"

export interface EIP3770Address {
    network: string,
    id: string
}

export const parseAddress = (address: string): EIP3770Address => {
    const parts = address.split(":")
    if (parts.length === 1) {
        return {
            network: "eth",
            id: getAddress(parts[0])
        }
    } else if (parts.length === 2) {
        return {
            network: parts[0],
            id: getAddress(parts[1])
        }
    } else if (parts.length === 3 && parts[0] === "eip155") {
        throw Error("TODO handle CAIP 2 format")
    } else {
        throw Error("Invalid address scheme")
    }
}