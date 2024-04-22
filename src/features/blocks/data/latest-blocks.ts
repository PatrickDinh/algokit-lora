import { JotaiStore } from '@/features/common/data/types'
import { atom, useAtom, useAtomValue, useStore } from 'jotai'
import { useMemo } from 'react'
import { blocksAtom, syncedRoundAtom } from '.'
import { isDefined } from '@/utils/is-defined'
import { asBlockSummary } from '../mappers'
import { transactionsAtom } from '@/features/transactions/data'
import { asTransactionSummary } from '@/features/transactions/mappers/transaction-mappers'
import { atomEffect } from 'jotai-effect'
import { AlgorandSubscriber } from '@algorandfoundation/algokit-subscriber'
import { algod } from '@/features/common/data'
import { BlockResult, Round } from './types'
import { TransactionId } from '@/features/transactions/data/types'
import { TransactionResult } from '@algorandfoundation/algokit-utils/types/indexer'

const maxBlocksToDisplay = 5

const latestBlockSummariesAtomBuilder = (store: JotaiStore) => {
  return atom((get) => {
    const syncedRound = get(syncedRoundAtom)
    if (!syncedRound) {
      return []
    }
    const blocks = store.get(blocksAtom)
    const transactions = store.get(transactionsAtom)

    return Array.from({ length: maxBlocksToDisplay }, (_, i) => {
      const round = syncedRound - i
      const block = blocks.get(round)

      if (block) {
        const transactionSummaries = block.transactionIds.map((transactionId) => {
          return asTransactionSummary(transactions.get(transactionId)!)
        })

        return asBlockSummary(block, transactionSummaries)
      }
    }).filter(isDefined)
  })
}

export const useLatestBlockSummariesAtom = (store: JotaiStore) => {
  return useMemo(() => {
    return latestBlockSummariesAtomBuilder(store)
  }, [store])
}

export const useLatestBlockSummaries = () => {
  const store = useStore()
  return useAtomValue(useLatestBlockSummariesAtom(store))
}

const subscribeToBlocksEffect = atomEffect((get, set) => {
  const subscriber = new AlgorandSubscriber(
    {
      filters: [
        {
          name: 'all-transactions',
          filter: {
            customFilter: () => true,
          },
        },
      ],
      maxRoundsToSync: 1,
      waitForBlockWhenAtTip: true,
      syncBehaviour: 'skip-sync-newest',
      watermarkPersistence: {
        get: async () => get(syncedRoundAtom) ?? 0,
        set: async (watermark) => {
          set(syncedRoundAtom, watermark)
        },
      },
    },
    algod
  )

  subscriber.onPoll(async (result) => {
    if (!result.blockMetadata || result.blockMetadata.length < 1) {
      return
    }

    const [blockTransactionIds, transactions] = result.subscribedTransactions.reduce(
      (acc, t) => {
        if (!t.parentTransactionId && t['confirmed-round']) {
          // Filter out filtersMatched and balanceChanges, as we don't need them
          const { filtersMatched, balanceChanges, ...transaction } = t
          const round = transaction['confirmed-round']!

          return [
            new Map<Round, string[]>([...acc[0], [round, (acc[0].get(round) ?? []).concat(transaction.id)]]),
            new Map<TransactionId, TransactionResult>([...acc[1], [transaction.id, transaction]]),
          ] as const
        }
        return acc
      },
      [new Map<Round, string[]>(), new Map<TransactionId, TransactionResult>()] as const
    )

    const blocks = result.blockMetadata.map((b) => {
      return [
        b.round,
        {
          round: b.round,
          timestamp: b.timestamp,
          transactionIds: blockTransactionIds.get(b.round) ?? [],
        } as BlockResult,
      ] as const
    })

    set(transactionsAtom, (prev) => {
      return new Map([...prev, ...transactions])
    })

    set(blocksAtom, (prev) => {
      return new Map([...prev, ...blocks])
    })
  })

  subscriber.start()

  return async () => {
    await subscriber.stop('unmounted')
  }
})

export const useSubscribeToBlocksEffect = () => {
  useAtom(subscribeToBlocksEffect)
}