import { createContext, useContext, useState, ReactNode } from 'react'

// https://docs.onflow.org/fcl/reference/api/#transaction-statuses
/**
 * STATUS CODE  DESCRIPTION <br/>
 * -1 No Active Transaction<br/>
 * 0  Unknown<br/>
 * 1  Transaction Pending - Awaiting Finalization<br/>
 * 2  Transaction Finalized - Awaiting Execution<br/>
 * 3  Transaction Executed - Awaiting Sealing<br/>
 * 4  Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.<br/>
 * 5  Transaction Expired<br/>
 */

/**
 * Types
 */
interface IContext {
  transactionInProgress: any
  transactionStatus: any
  txId: any
  initTransactionState: any
  setTxId: any
  setTransactionStatus: any
  setTransactionInProgress: any
}

export const TransactionContext = createContext<IContext>({} as IContext)

export const useTransaction = () => useContext(TransactionContext)

export function TransactionContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [transactionInProgress, setTransactionInProgress] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState(-1)
  const [txId, setTxId] = useState('')

  function initTransactionState() {
    setTransactionInProgress(true)
    setTransactionStatus(-1)
  }

  const value = {
    transactionInProgress,
    transactionStatus,
    txId,
    initTransactionState,
    setTxId,
    setTransactionStatus,
    setTransactionInProgress
  }

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>
}
