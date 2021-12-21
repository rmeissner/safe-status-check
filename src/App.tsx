import { Accordion, AccordionDetails, AccordionSummary, Button, CircularProgress, List, ListItem, Paper, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { CachingState, loadCachingState } from './logic/cachingState';
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

  const [chainInfo, setChainInfo] = useState<Check<InfoWithSource<ChainInfo>> | undefined>(undefined)
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

  const [safeInfo, setSafeInfo] = useState<Check<InfoWithSource<SafeInfo>> | undefined>(undefined)
  useEffect(() => {
    setSafeInfo(undefined)
    if (safeAddress?.info !== undefined && chainInfo?.info !== undefined) {
      const chainId: string = chainInfo.info.content.chainId;
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
      const ci = chainInfo.info.content;
      const si = safeInfo.info.content;
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

  const [cachingState, setCachingState] = useState<Check<CachingState> | undefined>(undefined)
  useEffect(() => {
    setCachingState(undefined)
    if (safeAddress?.info !== undefined && safeInfo?.info !== undefined && chainInfo?.info !== undefined) {
      const ci = chainInfo.info.content;
      const si = safeInfo.info.content;
      const safe = safeAddress.info;
      (async () => {
        setCachingState({ status: "loading" })
        try {
          setCachingState({ status: "done", info: await loadCachingState(ci, safe, si) })
        } catch (e) {
          setCachingState({ status: "error", error: e instanceof Error ? e : new Error("Unknown error") })
        }
      })()
    }
  }, [safeAddress, safeInfo, chainInfo, setCachingState])

  const [chainState, setChainState] = useState<Check<ChainState> | undefined>(undefined)
  useEffect(() => {
    setChainState(undefined)
    if (chainInfo?.info !== undefined) {
      const info = chainInfo.info.content;
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
    <Accordion expanded={!!safeAddress}>
      <AccordionSummary>Safe Address</AccordionSummary>
      <AccordionDetails>{renderResult(safeAddress, (info) => {
        return (
          <Typography variant="body1">{info.id}</Typography>
        )
      })}
      </AccordionDetails>
    </Accordion>
    <Accordion expanded={!!chainInfo}>
      <AccordionSummary>Chain Info</AccordionSummary>
      <AccordionDetails>{renderResult(chainInfo, (info) => {
        return (<>
          <Typography variant="caption">Chain Id</Typography>
          <Typography variant="body1">{info.content.chainId}</Typography>
          <Typography variant="caption">Name</Typography>
          <Typography variant="body1">{info.content.chainName}</Typography>
          <Typography variant="caption">Description</Typography>
          <Typography variant="body1">{info.content.description}</Typography>
          <Typography variant="caption">L2</Typography>
          <Typography variant="body1">{info.content.l2 ? "Yes" : "No"}</Typography>
          <a href={info.source} target="_blank">source</a>
        </>)
      })}
      </AccordionDetails>
    </Accordion>
    <Accordion expanded={!!safeInfo}>
      <AccordionSummary>Safe Info</AccordionSummary>
      <AccordionDetails>{renderResult(safeInfo, (info) => {
        return (<>
          <Typography variant="caption">Nonce</Typography>
          <Typography variant="body1">{info.content.nonce}</Typography>
          <Typography variant="caption">Threshold</Typography>
          <Typography variant="body1">{info.content.threshold}</Typography>
          <Typography variant="caption">Owners</Typography>
          {info.content.owners.map((owner) => {
            return (
              <Typography variant="body1">{owner.value}</Typography>
            )
          })}
          <a href={info.source} target="_blank">source</a>
        </>)
      })}
      </AccordionDetails>
    </Accordion>
    <Accordion expanded={!!indexingState}>
      <AccordionSummary>Singleton Indexing State</AccordionSummary>
      <AccordionDetails>{renderResult(indexingState, (info) => {
        return (<>
          <Typography variant="caption">Singleton Address</Typography>
          <Typography variant="body1">{info.content.address}</Typography>
          <Typography variant="caption">Singleton Version</Typography>
          <Typography variant="body1">{info.content.version}</Typography>
          <Typography variant="caption">Last indexed block</Typography>
          <Typography variant="body1">
            {info.content.lastIndexedBlockNumber}
            {!!chainState?.info?.currentBlock && (<> ({parseInt(chainState.info.currentBlock) - info.content.lastIndexedBlockNumber} blocks behind)</>)}
          </Typography>
          <a href={info.source} target="_blank">source</a>
        </>)
      })}
      </AccordionDetails>
    </Accordion>
    <Accordion expanded={!!cachingState}>
      <AccordionSummary>Transaction Information</AccordionSummary>
      <AccordionDetails>{renderResult(cachingState, (info) => {
        return (<>
          <Typography variant="caption">Queued Txs</Typography>
          <Typography variant="body1">{info.queuedTxs}</Typography>
          <Typography variant="caption">Missing Executed Txs</Typography>
          <Typography variant="body1">{info.missingExecutedTxs}</Typography>
        </>)
      })}
      </AccordionDetails>
    </Accordion>
    <Accordion expanded={!!chainState}>
      <AccordionSummary>Chain State</AccordionSummary>
      <AccordionDetails>{renderResult(chainState, (info) => {
        return (<>
          <Typography variant="caption">Current Block</Typography>
          <Typography variant="body1">{info.currentBlock}</Typography>
        </>)
      })}
      </AccordionDetails>
    </Accordion>
  </>);
}

export default App;
