import { Accordion, AccordionDetails, AccordionSummary, Button, CircularProgress, List, ListItem, Paper, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { buildRpcUrl } from './logic/config';
import { EIP3770Address, parseAddress } from './logic/eip3770';
import { ChainInfo, loadChainInfo, loadSafeInfo, SafeInfo } from './logic/gcw';
import { ChainState, loadChainState } from './logic/rpc';
import { loadIndexingStatus, MasterCopyState } from './logic/sts';
import { InfoWithSource } from './logic/types';

interface Check<T> {
  status: "loading" | "error" | "done",
  info?: T
  error?: Error
}

const renderResult = <T extends unknown>(input: Check<T> | undefined, renderInfo: (info: T) => React.ReactNode): React.ReactNode => {
  if (!input) return <></>
  if (input.status === "loading") return <CircularProgress />
  if (input.status === "error") return <>Error fetching information {input.error?.message}</>
  if (!input.info) return <>No information</>
  return renderInfo(input.info)
}

function App() {

  const [addressInput, setAddressInput] = useState("")
  const [infuraKey, setInfuraKey] = useState(localStorage.getItem("SafeStatusCheck___InfuraKey") || "")

  const handleInfuraKey = (input: string) => {
    localStorage.setItem("SafeStatusCheck___InfuraKey", input)
    setInfuraKey(input)
  }

  const [safeAddress, setSafeAddress] = useState<Check<EIP3770Address> | undefined>(undefined)

  const [chainInfo, setChainInfo] = useState<Check<ChainInfo> | undefined>(undefined)
  useEffect(() => {
    setChainInfo(undefined)
    if (safeAddress?.info !== undefined) {
      const network: string = safeAddress.info.network;
      (async () => {
        setChainInfo({ status: "loading" })
        try {
          setChainInfo({ status: "done", info: await loadChainInfo(network) })
        } catch (e) {
          setChainInfo({ status: "error", error: e instanceof Error ? e : new Error("Unknown error") })
        }
      })()
    }
  }, [safeAddress, setChainInfo])

  const [safeInfo, setSafeInfo] = useState<Check<SafeInfo> | undefined>(undefined)
  useEffect(() => {
    setSafeInfo(undefined)
    if (safeAddress?.info !== undefined && chainInfo?.info !== undefined) {
      const chainId: string = chainInfo.info.chainId;
      const safeId: string = safeAddress.info.id;
      (async () => {
        setSafeInfo({ status: "loading" })
        try {
          setSafeInfo({ status: "done", info: await loadSafeInfo(chainId, safeId) })
        } catch (e) {
          setSafeInfo({ status: "error", error: e instanceof Error ? e : new Error("Unknown error") })
        }
      })()
    }
  }, [safeAddress, chainInfo, setSafeInfo])

  const [indexingState, setIndexingState] = useState<Check<InfoWithSource<MasterCopyState>> | undefined>(undefined)
  useEffect(() => {
    setIndexingState(undefined)
    if (safeInfo?.info !== undefined && chainInfo?.info !== undefined) {
      const ci = chainInfo.info;
      const si = safeInfo.info;
      (async () => {
        setIndexingState({ status: "loading" })
        try {
          setIndexingState({ status: "done", info: await loadIndexingStatus(ci, si) })
        } catch (e) {
          setIndexingState({ status: "error", error: e instanceof Error ? e : new Error("Unknown error") })
        }
      })()
    }
  }, [safeInfo, chainInfo, setIndexingState])

  const [chainState, setChainState] = useState<Check<ChainState> | undefined>(undefined)
  useEffect(() => {
    setChainState(undefined)
    if (chainInfo?.info !== undefined) {
      const info = chainInfo.info;
      (async () => {
        setChainState({ status: "loading" })
        try {
          const rpcUrl = buildRpcUrl(info.publicRpcUri, infuraKey)
          setChainState({ status: "done", info: await loadChainState(rpcUrl) })
        } catch (e) {
          setChainState({ status: "error", error: e instanceof Error ? e : new Error("Unknown error") })
        }
      })()
    }
  }, [infuraKey, chainInfo, setChainState])

  const handleAddressInput = useCallback(async (input: string) => {
    setAddressInput(input)
    setSafeAddress({ status: "loading" })
    try {
      setSafeAddress({ status: "done", info: parseAddress(input) })
    } catch (e) {
      setSafeAddress({ status: "error", error: e instanceof Error ? e : new Error("Unknown error") })
    }
  }, [setSafeAddress])

  return (<>
    <>
      <TextField sx={{ width: 400, paddingRight: "8px" }} helperText="Safe Address (with network prefix)" onChange={(e) => handleAddressInput(e.target.value)} value={addressInput} />
      <TextField sx={{ width: 400 }} helperText="Infura Key" onChange={(e) => handleInfuraKey(e.target.value)} value={infuraKey} />
      <Button onClick={() => handleAddressInput(addressInput)}>Reload</Button>
    </>
    <List>
      <Accordion expanded={!!safeAddress}>
        <AccordionSummary>Safe Address</AccordionSummary>
        <AccordionDetails>{renderResult(safeAddress, (info) => {
          return (<>{JSON.stringify(info, null, 3)}</>)
        })}
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={!!chainInfo}>
        <AccordionSummary>Chain Info</AccordionSummary>
        <AccordionDetails>{renderResult(chainInfo, (info) => {
          return (<>{JSON.stringify(info, null, 3)}</>)
        })}
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={!!safeInfo}>
        <AccordionSummary>Safe Info</AccordionSummary>
        <AccordionDetails>{renderResult(safeInfo, (info) => {
          return (<>{JSON.stringify(info, null, 3)}</>)
        })}
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={!!indexingState}>
        <AccordionSummary>Singleton Indexing State</AccordionSummary>
        <AccordionDetails>{renderResult(indexingState, (info) => {
          return (<>
            {JSON.stringify(info.content, null, 3)}<br />
            <a href={info.source} target="_blank">source</a>
          </>)
        })}
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={!!chainState}>
        <AccordionSummary>Chain State</AccordionSummary>
        <AccordionDetails>{renderResult(chainState, (info) => {
          return (<>{JSON.stringify(info, null, 3)}</>)
        })}
        </AccordionDetails>
      </Accordion>
    </List>
  </>);
}

export default App;
