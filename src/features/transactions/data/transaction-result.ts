import { TransactionId, TransactionResult } from './types'
import { readOnlyAtomCache } from '@/features/common/data'
import { indexer } from '@/features/common/data/algo-client'
import { Getter, Setter } from 'jotai/index'
import { indexerTransactionToTransactionResult } from '../mappers/indexer-transaction-mappers'

const getTransactionResult = (_: Getter, __: Setter, transactionId: TransactionId) =>
  indexer
    .lookupTransactionByID(transactionId)
    .do()
    .then((result) => {
      return indexerTransactionToTransactionResult(result.transaction)
    })

const keySelector = (transactionId: TransactionId) => transactionId

export const [transactionResultsAtom, getTransactionResultAtom] = readOnlyAtomCache<
  Parameters<typeof keySelector>,
  ReturnType<typeof keySelector>,
  Promise<TransactionResult> | TransactionResult
>(getTransactionResult, keySelector)

export const getTransactionResultAtoms = (transactionIds: TransactionId[]) => {
  return transactionIds.map((transactionId) => getTransactionResultAtom(transactionId))
}
