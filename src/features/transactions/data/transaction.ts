import { Atom, atom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { loadable } from 'jotai/utils'
import { TransactionId } from './types'
import { asTransaction } from '../mappers/transaction-mappers'
import { getTransactionResultAtom } from './transaction-result'
import { assetSummaryResolver } from '@/features/assets/data/asset-summary'
import { abiMethodResolver } from '@/features/abi-methods/data'
import { TransactionResult } from './types'

export const createTransactionsAtom = (transactionResults: TransactionResult[]) => {
  return atom(() => {
    return transactionResults.map((transactionResult) => {
      return asTransaction(transactionResult, assetSummaryResolver, abiMethodResolver)
    })
  })
}

export const createTransactionAtom = (transactionResult: TransactionResult | Atom<TransactionResult | Promise<TransactionResult>>) => {
  return atom(async (get) => {
    const txn = 'read' in transactionResult ? await get(transactionResult) : transactionResult
    return asTransaction(txn, assetSummaryResolver, abiMethodResolver)
  })
}

const useTransactionAtom = (transactionId: TransactionId) => {
  return useMemo(() => {
    return createTransactionAtom(getTransactionResultAtom(transactionId))
  }, [transactionId])
}

export const useLoadableTransactionAtom = (transactionId: TransactionId) => {
  return useAtomValue(loadable(useTransactionAtom(transactionId)))
}
