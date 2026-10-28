import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import type { Role, Workout } from '../../shared/contracts'
import type { ReactElement } from 'react'

const state = vi.hoisted(() => ({
  user: {
    id: 'coach-test',
    name: 'Conta teste',
    email: 'teste@example.invalid',
    role: 'coach' as Role,
  },
  data: {} as Record<string, unknown>,
  reload: vi.fn(async () => undefined),
  api: vi.fn(async (..._args: unknown[]) => ({})),
  alert: vi.fn(),
  logout: vi.fn(async () => undefined),
}))
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  StyleSheet: { create: (styles: unknown) => styles },
  Alert: { alert: state.alert },
  Linking: { openURL: vi.fn(async () => undefined) },
  Platform: { OS: 'android' },
}))
vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(async () => ({ canceled: true })),
}))
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
}))
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }))
vi.mock('../src/services/api', () => ({
  api: state.api,
  upload: vi.fn(),
  shareMedia: vi.fn(),
  connectEvents: vi.fn(() => null),
  loadSession: vi.fn(async () => 'session-test'),
  forgetSession: vi.fn(),
  logout: state.logout,
  onSessionExpired: vi.fn(() => () => undefined),
  API_CONFIGURATION_ERROR: '',
  LOCAL_DEMO: false,
}))
vi.mock('../src/context/SessionContext', async () => ({
  SessionContext: (await import('react')).createContext(null),
  useSession: () => state.user,
}))
vi.mock('../src/hooks/useRemote', () => ({
  useRemote: (path: string) => ({
    data: state.data[path] ?? null,
    error: '',
    loading: false,
    reload: state.reload,
    setData: vi.fn(),
  }),
}))

import { ConnectionsScreen } from '../src/screens/connections/ConnectionsScreen'
import { AdminVerificationScreen } from '../src/screens/admin/AdminVerificationScreen'
import { AdminReviewsScreen } from '../src/screens/admin/AdminReviewsScreen'
import { AdminBillingScreen } from '../src/screens/admin/AdminBillingScreen'
import { WorkoutEditor } from '../src/screens/workouts/WorkoutEditor'
import { WorkoutDetail } from '../src/screens/workouts/WorkoutDetail'
import { ReviewsScreen } from '../src/screens/reviews/ReviewsScreen'
import { AgendaScreen } from '../src/screens/agenda/AgendaScreen'
import { ContractSelector } from '../src/components/connections/ContractSelector'
import App from '../App'

let tree: ReactTestRenderer | undefined
const contract = {
  id: 'contract-test',
  athleteId: 'athlete-test',
  coachId: 'coach-test',
  athleteName: 'Atleta teste',
  coachName: 'Treinador teste',
  status: 'pending' as const,
  createdAt: '2026-10-28T00:00:00Z',
  decidedAt: null,
}
const review = {
  id: 'review-test',
  contractId: contract.id,
  athleteId: contract.athleteId,
  athleteName: contract.athleteName,
  coachId: contract.coachId,
  coachName: contract.coachName,
  rating: 5,
  text: 'Conteudo de teste',
  reply: null,
  hidden: false,
}
const workout = {
  id: 'workout-test',
  contractId: contract.id,
  title: 'Treino ficticio',
  sport: 'Corrida',
  scheduledDate: '2026-10-28',
  instructions: '',
  status: 'published',
  blocks: [{ name: 'Bloco teste', instructions: '' }],
  athleteName: contract.athleteName,
  coachName: contract.coachName,
  execution: null,
} as Workout
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  state.api.mockResolvedValue({})
  state.user.role = 'coach'
  state.data = { '/contracts': { contracts: [contract] } }
})
afterEach(async () => {
  if (tree) await act(async () => tree?.unmount())
  tree = undefined
  vi.unstubAllGlobals()
})
async function render(element: ReactElement) {
  await act(async () => {
    tree = create(element)
  })
}
const button = (title: string) =>
  tree!.root
    .findAll((item) => String(item.type) === 'Pressable')
    .find((item) => item.props.accessibilityLabel === title)!
async function press(title: string) {
  const target = button(title)
  expect(target).toBeDefined()
  expect(Boolean(target.props.disabled)).toBe(false)
  await act(async () => target.props.onPress())
}
async function fill(label: string, value: string) {
  const input = tree!.root
    .findAll((item) => String(item.type) === 'TextInput')
    .find((item) => item.props.accessibilityLabel === label)!
  expect(input).toBeDefined()
  await act(async () => input.props.onChangeText(value))
}
async function confirm() {
  const buttons = state.alert.mock.calls.at(-1)?.[2] as {
    onPress?: () => void
  }[]
  expect(buttons).toBeDefined()
  await act(async () => buttons.at(-1)?.onPress?.())
}

describe('operacoes das telas nativas com API e ambiente controlados', () => {
  it.each(['athlete', 'coach', 'admin'] as const)(
    'restaura o aplicativo e exibe somente o menu de %s',
    async (role) => {
      state.user.role = role
      state.api.mockResolvedValueOnce({ user: { ...state.user } })
      await render(<App />)
      expect(button('Sair')).toBeDefined()
      expect(Boolean(button('Buscar'))).toBe(role === 'athlete')
      expect(Boolean(button('CREF'))).toBe(role === 'admin')
      expect(Boolean(button('Treinos'))).toBe(role !== 'admin')
      await press('Sair')
      expect(state.logout).toHaveBeenCalledOnce()
      expect(button('CREF')).toBeUndefined()
      expect(button('Entrar')).toBeDefined()
    },
  )
  it('treinador aceita solicitacao pela tela apos confirmacao', async () => {
    await render(<ConnectionsScreen />)
    await press('Aceitar solicitacao')
    expect(state.api).not.toHaveBeenCalled()
    await confirm()
    expect(state.api).toHaveBeenCalledWith(
      '/contracts/contract-test',
      'PATCH',
      { status: 'active' },
    )
  })
  it('atleta nao recebe os botoes de decisao do treinador', async () => {
    state.user.role = 'athlete'
    await render(<ConnectionsScreen />)
    expect(button('Aceitar solicitacao')).toBeUndefined()
    expect(button('Recusar solicitacao')).toBeUndefined()
  })
  it.each(['athlete', 'coach'] as const)(
    'seletor mostra a contraparte de %s',
    async (role) => {
      state.user.role = role
      await render(
        <ContractSelector
          contracts={[contract]}
          selected={contract.id}
          onChange={() => undefined}
        />,
      )
      const labels = tree!.root
        .findAll((item) => String(item.type) === 'Pressable')
        .map((item) => item.props.accessibilityLabel)
        .join(' ')
      expect(labels).toContain(
        role === 'coach' ? contract.athleteName : contract.coachName,
      )
    },
  )
  it('administrador aprova CREF com justificativa sem enviar dados de identidade do ator', async () => {
    state.user.role = 'admin'
    state.data['/admin/verifications'] = {
      verifications: [
        {
          id: 'verification-test',
          coachId: contract.coachId,
          coachName: contract.coachName,
          cref: 'CREF TESTE',
          evidence: 'Evidencia ficticia',
          status: 'pending',
        },
      ],
    }
    await render(<AdminVerificationScreen />)
    expect(button('Aprovar').props.disabled).toBe(true)
    await fill('Justificativa da decisao', 'Conferencia ficticia concluida')
    await press('Aprovar')
    await confirm()
    expect(state.api).toHaveBeenCalledWith(
      '/admin/verifications/verification-test',
      'PATCH',
      { status: 'approved', reason: 'Conferencia ficticia concluida' },
    )
  })
  it('administrador modera avaliacao com confirmacao e justificativa', async () => {
    state.user.role = 'admin'
    state.data['/admin/reviews'] = { reviews: [review], reports: [] }
    await render(<AdminReviewsScreen />)
    await fill('Justificativa da moderacao', 'Motivo documentado')
    await press('Ocultar avaliacao')
    await confirm()
    expect(state.api).toHaveBeenCalledWith(
      '/admin/reviews/review-test',
      'PATCH',
      { hidden: true, reason: 'Motivo documentado' },
    )
  })
  it('configuracao financeira converte porcentagem em pontos base', async () => {
    state.user.role = 'admin'
    state.data['/billing/config'] = {
      mode: 'academic',
      environment: 'disabled',
      commissionBps: 1000,
      graceDays: 3,
    }
    await render(<AdminBillingScreen />)
    await fill('Comissao da plataforma (%)', '12,5')
    await fill('Carencia (dias)', '4')
    await press('Salvar regras')
    await confirm()
    expect(state.api).toHaveBeenCalledWith('/admin/billing/settings', 'PATCH', {
      commissionBps: 1250,
      graceDays: 4,
    })
  })
  it('treinador publica ficha completa pelo editor nativo', async () => {
    const saved = vi.fn(async () => undefined)
    await render(
      <WorkoutEditor
        contracts={[{ ...contract, status: 'active' }]}
        onSaved={saved}
        onCancel={() => undefined}
      />,
    )
    await fill('Titulo do treino', 'Treino publicado')
    await fill('Data do treino (AAAA-MM-DD)', '2026-10-28')
    await fill('Nome do exercicio 1', 'Corrida leve')
    await fill('Duracao (min) 1', '15,5')
    await press('Publicar treino')
    expect(state.api).toHaveBeenCalledWith(
      '/workouts',
      'POST',
      expect.objectContaining({
        contractId: contract.id,
        status: 'published',
        blocks: [
          { name: 'Corrida leve', instructions: '', durationMinutes: 15.5 },
        ],
      }),
    )
    expect(saved).toHaveBeenCalledOnce()
  })
  it('treinador ve retorno da ficha sem receber formulario de execucao de atleta', async () => {
    state.data['/metrics?sport=Corrida'] = { metrics: [] }
    state.data['/media?resourceId=workout-test'] = { media: [] }
    await render(<WorkoutDetail workout={workout} onBack={() => undefined} />)
    expect(button('Salvar execução')).toBeUndefined()
    expect(button('Enviar orientacao privada')).toBeDefined()
  })
  it('treinador responde avaliacao sem formulario para avaliar a si mesmo', async () => {
    state.data['/reviews?coachId=coach-test'] = {
      reviews: [review],
      average: 5,
      count: 1,
    }
    await render(<ReviewsScreen />)
    expect(button('Publicar avaliação')).toBeUndefined()
    await fill('Resposta ao atleta', 'Obrigado pelo retorno')
    await press('Salvar resposta')
    expect(state.api).toHaveBeenCalledWith(
      '/reviews/review-test/reply',
      'POST',
      { text: 'Obrigado pelo retorno' },
    )
  })
  it('treinador conclui consultoria com motivo e confirmacao', async () => {
    state.data['/consultations'] = {
      consultations: [
        {
          id: 'consultation-test',
          title: 'Consulta teste',
          startsAt: '2026-10-20T19:00:00Z',
          status: 'scheduled',
          durationMinutes: 30,
        },
      ],
    }
    await render(<AgendaScreen />)
    await press('Alterar ou cancelar')
    await fill('Motivo da alteração', 'Atendimento realizado')
    await press('Concluir consultoria')
    await confirm()
    expect(state.api).toHaveBeenCalledWith(
      '/consultations/consultation-test',
      'PATCH',
      { status: 'completed', reason: 'Atendimento realizado' },
    )
  })
})
