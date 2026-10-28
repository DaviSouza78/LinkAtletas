import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'

const environment = vi.hoisted(() => ({
  api: vi.fn(),
  state: 'active',
  listener: undefined as undefined | ((value: string) => void),
  removed: vi.fn(),
}))
vi.mock('react-native', () => ({
  AppState: {
    get currentState() {
      return environment.state
    },
    addEventListener: vi.fn((_name, listener) => {
      environment.listener = listener
      return { remove: environment.removed }
    }),
  },
}))
vi.mock('../src/services/api', () => ({ api: environment.api }))
import { useRemote } from '../src/hooks/useRemote'
import { useAction } from '../src/hooks/useAction'

let tree: ReactTestRenderer | undefined
let remote: ReturnType<typeof useRemote<string>>
let action: ReturnType<typeof useAction>
function Probe({ path }: { path: string }) {
  remote = useRemote<string>(path)
  return null
}
function ActionProbe() {
  action = useAction()
  return null
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  environment.api.mockReset()
  environment.state = 'active'
  environment.removed.mockClear()
})
afterEach(async () => {
  if (tree) await act(async () => tree?.unmount())
  tree = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('ciclo de vida e concorrencia dos hooks nativos', () => {
  it('descarta resposta atrasada de uma rota anterior', async () => {
    let finish: (value: string) => void = () => undefined
    environment.api
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            finish = resolve
          }),
      )
      .mockResolvedValueOnce('dados novos')
    await act(async () => {
      tree = create(<Probe path="/contracts" />)
    })
    await act(async () => tree?.update(<Probe path="/workouts" />))
    expect(remote.data).toBe('dados novos')
    await act(async () => finish('dados antigos'))
    expect(remote.data).toBe('dados novos')
  })
  it('atualiza lista ativa e pausa chamadas em segundo plano', async () => {
    environment.api.mockResolvedValue('atual')
    await act(async () => {
      tree = create(<Probe path="/notifications" />)
    })
    expect(environment.api).toHaveBeenCalledTimes(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(environment.api).toHaveBeenCalledTimes(2)
    environment.state = 'background'
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })
    expect(environment.api).toHaveBeenCalledTimes(2)
    environment.state = 'active'
    await act(async () => environment.listener?.('active'))
    expect(environment.api).toHaveBeenCalledTimes(3)
    await act(async () => tree?.unmount())
    tree = undefined
    expect(environment.removed).toHaveBeenCalledOnce()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })
    expect(environment.api).toHaveBeenCalledTimes(3)
  })
  it('nao atualiza formulario de perfil automaticamente durante a digitacao', async () => {
    environment.api.mockResolvedValue('perfil')
    await act(async () => {
      tree = create(<Probe path="/profiles/me" />)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45000)
    })
    expect(environment.api).toHaveBeenCalledTimes(1)
  })
  it('bloqueia duas submissoes antes da proxima renderizacao', async () => {
    await act(async () => {
      tree = create(<ActionProbe />)
    })
    let finish: () => void = () => undefined
    const task = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    let first: Promise<void>
    await act(async () => {
      first = action.run(task)
      void action.run(task)
    })
    expect(task).toHaveBeenCalledOnce()
    await act(async () => {
      finish()
      await first
    })
    expect(action.busy).toBe(false)
  })
})
