import { vi } from 'vitest'
import { NetworkId, Wallet, WalletId, useWallet } from '@txnlab/use-wallet-react'
import { SearchTransactionsMock } from '@/tests/setup/mocks/search-transactions'
import algosdk from 'algosdk'

export const searchTransactionsMock = new SearchTransactionsMock()

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: vi.fn().mockReturnValue({}),
  useNavigate: vi.fn(),
}))

vi.mock('@algorandfoundation/algokit-utils', async () => ({
  ...(await vi.importActual('@algorandfoundation/algokit-utils')),
  getAlgoIndexerClient: vi.fn(),
  getAlgoClient: vi.fn(),
  lookupTransactionById: vi.fn(),
}))

vi.mock('@txnlab/use-wallet-react', async () => {
  const original = await vi.importActual<{ useWallet: () => ReturnType<typeof useWallet> }>('@txnlab/use-wallet-react')
  return {
    ...original,
    useWallet: vi.fn().mockImplementation(() => {
      return {
        wallets: [
          {
            disconnect: vi.fn(),
            isActive: true,
            id: WalletId.PERA,
            isConnected: true,
            metadata: {
              name: 'Pera',
              icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNzcgMTg3Ij48cmVjdCB4PSItMTEuMzgiIHk9Ii0yNS45NyIgd2lkdGg9IjIwMC4wMiIgaGVpZ2h0PSIyMzEuNTMiIHN0eWxlPSJmaWxsOiNmZTU7Ii8+PHBhdGggZD0iTTk0LjA1LDU5LjYxYzIuMDUsOC40OCwxLjM2LDE1Ljk0LTEuNTUsMTYuNjYtMi45LC43Mi02LjkxLTUuNTctOC45Ni0xNC4wNS0yLjA1LTguNDgtMS4zNi0xNS45NCwxLjU1LTE2LjY2LDIuOS0uNzIsNi45MSw1LjU3LDguOTYsMTQuMDVaIiBzdHlsZT0iZmlsbDojMWMxYzFjOyIvPjxwYXRoIGQ9Ik0xMjcuODUsNjYuOWMtNC41My00LjgxLTEzLjU1LTMuNS0yMC4xNSwyLjkxLTYuNTksNi40MS04LjI2LDE1LjUtMy43MywyMC4zMSw0LjUzLDQuOCwxMy41NSwzLjUsMjAuMTUtMi45MXM4LjI2LTE1LjUsMy43My0yMC4zMVoiIHN0eWxlPSJmaWxsOiMxYzFjMWM7Ii8+PHBhdGggZD0iTTkxLjc5LDE0MC40N2MyLjktLjcyLDMuNDktOC42LDEuMzItMTcuNjEtMi4xNy05LTYuMjktMTUuNzEtOS4xOS0xNC45OS0yLjksLjcyLTMuNDksOC42LTEuMzIsMTcuNjEsMi4xNyw5LDYuMjksMTUuNzEsOS4xOSwxNC45OVoiIHN0eWxlPSJmaWxsOiMxYzFjMWM7Ii8+PHBhdGggZD0iTTYyLjIyLDcxLjNjOC4zNywyLjQ3LDE0LjQ4LDYuOCwxMy42Niw5LjY3LS44MywyLjg3LTguMjgsMy4yLTE2LjY1LC43My04LjM3LTIuNDctMTQuNDgtNi44LTEzLjY2LTkuNjcsLjgzLTIuODcsOC4yOC0zLjIsMTYuNjUtLjczWiIgc3R5bGU9ImZpbGw6IzFjMWMxYzsiLz48cGF0aCBkPSJNMTE2LjU0LDEwMy43NGM4Ljg4LDIuNjIsMTUuNDEsNy4wNywxNC41OSw5Ljk0LS44MywyLjg3LTguNywzLjA4LTE3LjU4LC40Ni04Ljg4LTIuNjItMTUuNDEtNy4wNy0xNC41OS05Ljk0LC44My0yLjg3LDguNy0zLjA4LDE3LjU4LS40NloiIHN0eWxlPSJmaWxsOiMxYzFjMWM7Ii8+PHBhdGggZD0iTTcxLjY0LDk3LjcxYy0yLjA4LTIuMTUtOC44OCwuOTgtMTUuMiw2Ljk5LTYuMzIsNi4wMS05Ljc2LDEyLjYzLTcuNjksMTQuNzgsMi4wOCwyLjE1LDguODgtLjk4LDE1LjItNi45OSw2LjMyLTYuMDEsOS43Ni0xMi42Myw3LjY5LTE0Ljc4WiIgc3R5bGU9ImZpbGw6IzFjMWMxYzsiLz48L3N2Zz4=',
            },
          },
        ] as unknown as Wallet[],
        algodClient: {} as unknown as algosdk.Algodv2,
        activeNetwork: NetworkId.LOCALNET,
        setActiveNetwork: vi.fn(),
        setAlgodClient: vi.fn(),
        signTransactions: vi.fn(),
        transactionSigner: vi.fn(),
        isReady: true,
      } as unknown as ReturnType<typeof useWallet>
    }),
  }
})

vi.mock('@/features/blocks/data', async () => {
  const original = await vi.importActual('@/features/blocks/data')
  return {
    ...original,
    useSubscribeToBlocksEffect: vi.fn(),
  }
})

global.HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillStyle: 'ok',
    fillRect: vi.fn(),
  } as unknown as null // Hack so we don't need to implement the whole CanvasRenderingContext2D
}

vi.mock('@tauri-apps/api/event', async () => {
  const original = await vi.importActual('@tauri-apps/api/event')
  return {
    ...original,
    listen: vi.fn(),
  }
})

export const ANY_NUMBER = -1
export const ANY_STRING = 'ANY_STRING'

vi.mock('@auth0/auth0-react', async () => {
  const original = await vi.importActual('@auth0/auth0-react')
  return {
    ...original,
    useAuth0: vi.fn().mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect: vi.fn(),
      loginWithPopup: vi.fn(),
      logout: vi.fn(),
    }),
  }
})

window.HTMLElement.prototype.hasPointerCapture = vi.fn()

vi.mock('@/features/deep-link/hooks/tauri-deep-link', async () => ({
  ...(await vi.importActual('@/features/deep-link/hooks/tauri-deep-link')),
  getCurrent: vi.fn(),
  onOpenUrl: vi.fn(),
}))
