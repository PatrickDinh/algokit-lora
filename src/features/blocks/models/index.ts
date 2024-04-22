import { TransactionModel, TransactionSummary, TransactionType } from '@/features/transactions/models'

export type TransactionsSummary = {
  count: number
  countByType: [TransactionType, number][]
}

export type CommonBlockProperties = {
  round: number
  timestamp: string
  transactionsSummary: TransactionsSummary
}

export type BlockDetails = CommonBlockProperties & {
  previousRound?: number
  nextRound?: number
  transactions: TransactionModel[]
}

export type BlockSummary = CommonBlockProperties & {
  transactions: TransactionSummary[]
}