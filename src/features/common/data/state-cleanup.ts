import { blockResultsAtom } from '@/features/blocks/data'
import { groupResultsAtom } from '@/features/groups/data'
import { latestTransactionIdsAtom, transactionResultsAtom } from '@/features/transactions/data'
import { Atom, Getter, PrimitiveAtom, Setter, useAtom } from 'jotai'
import { atomEffect } from 'jotai-effect'
import { accountResultsAtom } from '@/features/accounts/data'
import { applicationMetadataResultsAtom } from '@/features/applications/data/application-metadata'
import { applicationResultsAtom } from '@/features/applications/data'
import { assetMetadataResultsAtom, assetResultsAtom } from '@/features/assets/data'

const cleanUpIntervalMillis = 600_000 // 10 minutes
const expirationMillis = 3_600_000 // 1 hour
// Run every 10 minutes and cleanup data that hasn't been accessed in the last 1 hour

const stateCleanupEffect = atomEffect((get, set) => {
  const cleanup = setInterval(() => {
    const expiredTimestamp = Date.now() - expirationMillis

    const removeExpired = createExpiredDataRemover(get, set, expiredTimestamp)
    set(latestTransactionIdsAtom, (prev) => {
      const next = prev.filter(([_, timestamp]) => timestamp > expiredTimestamp)
      if (prev.length !== next.length) {
        return next
      }
      return prev
    })
    removeExpired(blockResultsAtom)
    removeExpired(groupResultsAtom)
    removeExpired(transactionResultsAtom)
    removeExpired(accountResultsAtom)
    removeExpired(applicationMetadataResultsAtom)
    removeExpired(applicationResultsAtom)
    removeExpired(assetMetadataResultsAtom)
    removeExpired(assetResultsAtom)
  }, cleanUpIntervalMillis)

  return () => clearInterval(cleanup)
})

const createExpiredDataRemover = (get: Getter, set: Setter, expiredTimestamp: number) => {
  return <Key extends string | number, Value>(resultsAtom: PrimitiveAtom<Map<Key, readonly [Atom<Value | Promise<Value>>, number]>>) => {
    const keysToRemove: Key[] = []
    const results = get(resultsAtom)
    results.forEach(([_, timestamp], key) => {
      if (timestamp > -1 && timestamp < expiredTimestamp) {
        keysToRemove.push(key)
      }
    })
    if (keysToRemove.length > 0) {
      set(resultsAtom, (prev) => {
        const next = new Map(prev)
        keysToRemove.forEach((key) => {
          next.delete(key)
        })
        return next
      })
    }
  }
}

export const useStateCleanupEffect = () => {
  useAtom(stateCleanupEffect)
}