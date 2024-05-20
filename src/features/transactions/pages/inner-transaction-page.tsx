import { invariant } from '@/utils/invariant'
import { UrlParams } from '../../../routes/urls'
import { useRequiredParam } from '../../common/hooks/use-required-param'
import { TransactionDetails } from '../components/transaction-details'
import { useLoadableInnerTransactionAtom } from '../data'
import { RenderLoadable } from '@/features/common/components/render-loadable'
import { cn } from '@/features/common/utils'
import { isValidInnerTransactionId } from '../utils/is-valid-inner-transaction-id'
import { isTransactionId } from '@/utils/is-transaction-id'
import { is404 } from '@/utils/error'

const transformError = (e: Error) => {
  if (is404(e)) {
    return new Error(transactionNotFoundMessage)
  }

  // eslint-disable-next-line no-console
  console.error(e)
  return new Error(transactionFailedToLoadMessage)
}

export const transactionPageTitle = 'Transaction'
export const transactionNotFoundMessage = 'Transaction not found'
export const transactionInvalidIdMessage = 'Transaction Id is invalid'
export const transactionFailedToLoadMessage = 'Transaction failed to load'

export function InnerTransactionPage() {
  const { transactionId } = useRequiredParam(UrlParams.TransactionId)
  invariant(isTransactionId(transactionId), transactionInvalidIdMessage)

  const { innerTransactionId } = useRequiredParam(UrlParams.InnerTransactionId)
  invariant(isValidInnerTransactionId(innerTransactionId), `Invalid inner transaction id: ${innerTransactionId}`)

  const loadableTransaction = useLoadableInnerTransactionAtom(transactionId, innerTransactionId)

  return (
    <div>
      <h1 className={cn('text-2xl text-primary font-bold')}>{transactionPageTitle}</h1>
      <RenderLoadable loadable={loadableTransaction} transformError={transformError}>
        {(data) => <TransactionDetails transaction={data} />}
      </RenderLoadable>
    </div>
  )
}