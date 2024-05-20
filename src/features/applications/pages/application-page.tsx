import { invariant } from '@/utils/invariant'
import { UrlParams } from '../../../routes/urls'
import { useRequiredParam } from '../../common/hooks/use-required-param'
import { cn } from '@/features/common/utils'
import { isInteger } from '@/utils/is-integer'
import { useLoadableApplication } from '../data'
import { RenderLoadable } from '@/features/common/components/render-loadable'
import { ApplicationDetails } from '../components/application-details'
import { is404 } from '@/utils/error'

const transformError = (e: Error) => {
  if (is404(e)) {
    return new Error(applicationNotFoundMessage)
  }

  // eslint-disable-next-line no-console
  console.error(e)
  return new Error(applicationFailedToLoadMessage)
}

export const applicationPageTitle = 'Application'
export const applicationNotFoundMessage = 'Application not found'
export const applicationInvalidIdMessage = 'Application Id is invalid'
export const applicationFailedToLoadMessage = 'Application failed to load'

export function ApplicationPage() {
  const { applicationId: _applicationId } = useRequiredParam(UrlParams.ApplicationId)
  invariant(isInteger(_applicationId), applicationInvalidIdMessage)

  const applicationId = parseInt(_applicationId, 10)
  const loadableApplication = useLoadableApplication(applicationId)

  return (
    <div>
      <h1 className={cn('text-2xl text-primary font-bold')}>{applicationPageTitle}</h1>
      <RenderLoadable loadable={loadableApplication} transformError={transformError}>
        {(application) => <ApplicationDetails application={application} />}
      </RenderLoadable>
    </div>
  )
}