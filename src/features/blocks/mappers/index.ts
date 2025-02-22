import { Transaction, TransactionSummary } from '@/features/transactions/models'
import { Block, BlockSummary, CommonBlockProperties } from '../models'
import { BlockResult, Round } from '../data/types'
import { asTransactionsSummary } from '@/features/transactions/mappers'
import { AsyncMaybeAtom } from '@/features/common/data/types'
import { asJson, normaliseAlgoSdkData } from '@/utils/as-json'
import { TransactionResult } from '@/features/transactions/data/types'

const asCommonBlock = (block: BlockResult, transactions: (Transaction | TransactionSummary)[]): CommonBlockProperties => {
  return {
    round: block.round,
    timestamp: new Date(block.timestamp * 1000).toISOString(),
    transactionsSummary: asTransactionsSummary(transactions),
  }
}

export const asBlockSummary = (block: BlockResult, transactions: TransactionSummary[]): BlockSummary => {
  return { ...asCommonBlock(block, transactions), transactions }
}

export const asBlock = (
  block: BlockResult,
  transactions: Transaction[],
  transactionResults: TransactionResult[],
  nextRound: AsyncMaybeAtom<Round>
): Block => {
  const { transactionIds: _, ...rest } = block

  return {
    ...asCommonBlock(block, transactions),
    previousRound: block.round > 0 ? block.round - 1n : undefined,
    nextRound,
    transactions,
    json: asJson(
      normaliseAlgoSdkData({
        ...rest,
        ...(!rest.upgradeVote ? { upgradeVote: { upgradeApprove: false, upgradeDelay: 0 } } : undefined), // Match how indexer handles an undefined upgrade-vote
        transactions: transactionResults,
      })
    ),
    proposer: block.proposer,
  }
}
