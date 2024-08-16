import { Address } from '@/features/accounts/data/types'
import { microAlgos } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { Auth0ContextInterface, useAuth0 } from '@auth0/auth0-react'
import { useAtomValue } from 'jotai'
import { atomWithRefresh, loadable, useAtomCallback } from 'jotai/utils'
import { useCallback, useMemo } from 'react'

type DispenserApiErrorResponse =
  | {
      code:
        | 'dispenser_out_of_funds'
        | 'forbidden'
        | 'authorization_error'
        | 'txn_expired'
        | 'txn_invalid'
        | 'txn_already_processed'
        | 'txn_not_found'
        | 'invalid_asset'
        | 'unexpected_error'
        | 'missing_params'
      message: string
    }
  | {
      code: 'fund_limit_exceeded'
      message: string
      limit: number
      resetsAt: string
    }

const calculateHoursUntilReset = (resetsAt: string): number => {
  const nowUtc = new Date()
  const resetDate = new Date(resetsAt)
  const diffInMillis = resetDate.getTime() - nowUtc.getTime()
  const diffInHours = diffInMillis / (1_000 * 60 * 60)
  const roundedDiffInHours = Math.round(diffInHours * 10) / 10
  return roundedDiffInHours < 0 ? 0 : roundedDiffInHours
}

const handleApiResponse = async <T>(response: Response, mapper: (response: Response) => Promise<T> | T) => {
  if (!response.ok) {
    const statusCode = response.status
    const errorResponse = (await response.json().catch((_) => undefined)) as DispenserApiErrorResponse | undefined
    let errorMessage = `Dispenser API error, ${statusCode}.`
    if (errorResponse) {
      errorMessage = `Dispenser API error, ${errorResponse.message}.`
      if (statusCode === 401) {
        errorMessage = `Unauthorized. Please log out and try again.`
      } else if (errorResponse.code === 'fund_limit_exceeded') {
        const hoursUntilReset = calculateHoursUntilReset(errorResponse.resetsAt)
        errorMessage = `Funding limit exceeded. Try again in ~${hoursUntilReset} hours.`
      }
    }

    throw Error(errorMessage)
  }

  return await mapper(response)
}

const getFundLimit = async (dispenserUrl: string, token: string) => {
  const response = await fetch(`${dispenserUrl}/fund/0/limit`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal && 'timeout' in AbortSignal ? AbortSignal.timeout(20_000) : undefined,
  })

  return await handleApiResponse(response, async (response) => {
    return microAlgos((await response.json()).amount as number)
  })
}

const fundAccount = async (dispenserUrl: string, token: string, receiver: Address, amount: AlgoAmount) => {
  const response = await fetch(`${dispenserUrl}/fund/0`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      receiver,
      amount: amount.microAlgos,
    }),
    signal: AbortSignal && 'timeout' in AbortSignal ? AbortSignal.timeout(20_000) : undefined,
  })

  await handleApiResponse(response, () => {})
}

const createFundLimitAtom = (dispenserUrl: string, getAccessTokenSilently: Auth0ContextInterface['getAccessTokenSilently']) => {
  return atomWithRefresh(async (_get) => {
    const accessToken = await getAccessTokenSilently()
    return getFundLimit(dispenserUrl, accessToken)
  })
}

const useFundLimitAtom = (dispenserUrl: string, getAccessTokenSilently: Auth0ContextInterface['getAccessTokenSilently']) => {
  const fundLimitAtom = useMemo(() => {
    return createFundLimitAtom(dispenserUrl, getAccessTokenSilently)
  }, [dispenserUrl, getAccessTokenSilently])

  return fundLimitAtom
}

export const useDispenserApi = (dispenserApiUrl: string) => {
  const { getAccessTokenSilently } = useAuth0()

  const fundLimitAtom = useFundLimitAtom(dispenserApiUrl, getAccessTokenSilently)

  const fundAccountAndRefreshFundLimit = useAtomCallback(
    useCallback(
      async (_get, set, receiver: Address, amount: AlgoAmount) => {
        const token = await getAccessTokenSilently()

        await fundAccount(dispenserApiUrl, token, receiver, amount)
        set(fundLimitAtom)
      },
      [dispenserApiUrl, fundLimitAtom, getAccessTokenSilently]
    )
  )

  return {
    fundLimit: useAtomValue(loadable(fundLimitAtom)),
    fundAccount: fundAccountAndRefreshFundLimit,
  }
}