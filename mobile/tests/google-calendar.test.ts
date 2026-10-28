import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Consultation } from '../../shared/interaction-contracts'

const native = vi.hoisted(() => ({
  configure: vi.fn(),
  checkPlayServices: vi.fn(async () => undefined),
  presentExplicitSignIn: vi.fn(),
  getCurrentUser: vi.fn(),
  requestScopes: vi.fn(async () => ({})),
  getTokens: vi.fn(),
  clearCachedAccessToken: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
}))
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))
vi.mock('react-native-nitro-google-signin', () => ({
  GoogleOneTapSignIn: native,
  isSuccessResponse: (response: { type: string }) =>
    response.type === 'success',
}))
const fetcher = vi.fn<typeof fetch>()
const scope = 'https://www.googleapis.com/auth/calendar.events.owned'
const id = '11111111-1111-4111-8111-111111111111'
const eventId = 'la' + id.replaceAll('-', '')
const consultation = () =>
  ({
    id,
    status: 'scheduled',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 30,
    description: 'Dado privado ficticio que nao pode sair',
    athleteName: 'Nome privado',
    title: 'Descricao privada',
    contractId: 'contract',
  }) as Consultation
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  fetcher.mockReset()
  vi.stubGlobal('fetch', fetcher)
  vi.stubEnv(
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    '123-test.apps.googleusercontent.com',
  )
  native.presentExplicitSignIn.mockResolvedValue({ type: 'success', data: {} })
  native.getCurrentUser.mockReturnValue({ scopes: [scope] })
  native.getTokens.mockResolvedValue({
    accessToken: 'google-token-fixture',
    idToken: 'unused-id-token',
  })
  native.requestScopes.mockResolvedValue({
    accessToken: 'google-token-fixture',
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('autorizacao Google nativa com SDK controlado', () => {
  it('solicita somente eventos proprios e nao usa offline ou segredo de cliente', async () => {
    const { authorizeCalendar } = await import(
      '../src/services/googleAuthorization'
    )
    expect(await authorizeCalendar()).toBe('google-token-fixture')
    expect(native.configure).toHaveBeenCalledWith(
      expect.objectContaining({
        webClientId: '123-test.apps.googleusercontent.com',
        scopes: [scope],
        offlineAccess: false,
        autoSelectOnSignIn: false,
      }),
    )
    expect(native.configure.mock.calls[0][0]).not.toHaveProperty('clientSecret')
  })
  it('interrompe cancelamento sem executar chamadas Google Calendar', async () => {
    native.presentExplicitSignIn.mockResolvedValue({ type: 'cancelled' })
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    await expect(createGoogleMeet(consultation())).rejects.toThrow('cancelada')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('recusa cliente ausente antes de importar ou executar SDK nativo', async () => {
    vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', '')
    const { authorizeCalendar } = await import(
      '../src/services/googleAuthorization'
    )
    await expect(authorizeCalendar()).rejects.toThrow('Configure')
    expect(native.configure).not.toHaveBeenCalled()
  })
  it('pede escopo faltante explicitamente', async () => {
    native.getCurrentUser.mockReturnValue({ scopes: [] })
    const { authorizeCalendar } = await import(
      '../src/services/googleAuthorization'
    )
    await authorizeCalendar()
    expect(native.requestScopes).toHaveBeenCalledWith([scope])
  })
  it('descarta token e encerra sessao Google ao desconectar', async () => {
    const { authorizeCalendar, disconnectCalendar } = await import(
      '../src/services/googleAuthorization'
    )
    await authorizeCalendar()
    await disconnectCalendar()
    expect(native.clearCachedAccessToken).toHaveBeenCalledWith(
      'google-token-fixture',
    )
    expect(native.signOut).toHaveBeenCalledOnce()
  })
  it('recusa cancelamento do consentimento sem usar token anterior', async () => {
    native.getCurrentUser.mockReturnValue({ scopes: [] })
    native.requestScopes.mockResolvedValue({ accessToken: null })
    const { authorizeCalendar } = await import(
      '../src/services/googleAuthorization'
    )
    await expect(authorizeCalendar()).rejects.toThrow('nao disponibilizou')
    expect(native.getTokens).not.toHaveBeenCalled()
  })
})

describe('criacao e recuperacao de evento Google com HTTP controlado', () => {
  it('envia horario e titulo generico sem descricao privada, nomes ou convidados', async () => {
    fetcher.mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(
      response({
        id: eventId,
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      }),
    )
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    expect(await createGoogleMeet(consultation())).toEqual({
      eventId,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    })
    const [url, request] = fetcher.mock.calls[1]
    expect(String(url)).toContain('sendUpdates=none')
    expect(String(url)).not.toContain('google-token-fixture')
    expect(request?.headers).toMatchObject({
      Authorization: 'Bearer google-token-fixture',
    })
    const body = JSON.parse(String(request?.body))
    expect(body.id).toBe(eventId)
    expect(body).not.toHaveProperty('attendees')
    expect(String(request?.body)).not.toContain('Dado privado')
    expect(String(request?.body)).not.toContain('Nome privado')
  })
  it('reutiliza evento existente sem novo POST', async () => {
    fetcher.mockResolvedValueOnce(
      response({
        id: eventId,
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      }),
    )
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    await createGoogleMeet(consultation())
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls[0][1]?.method).toBe('GET')
  })
  it('recupera conflito de criacao pelo identificador deterministico', async () => {
    fetcher
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({}, 409))
      .mockResolvedValueOnce(
        response({
          id: eventId,
          hangoutLink: 'https://meet.google.com/abc-defg-hij',
        }),
      )
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    expect((await createGoogleMeet(consultation())).eventId).toBe(eventId)
    expect(fetcher.mock.calls.map(([, request]) => request?.method)).toEqual([
      'GET',
      'POST',
      'GET',
    ])
  })
  it('limpa token expirado sem repetir automaticamente uma criacao', async () => {
    fetcher.mockResolvedValueOnce(response({}, 401))
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    await expect(createGoogleMeet(consultation())).rejects.toThrow('expirou')
    expect(native.clearCachedAccessToken).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('mantem erro explicito quando Google nao disponibiliza Meet', async () => {
    fetcher.mockResolvedValueOnce(
      response({
        id: eventId,
        conferenceData: {
          createRequest: { status: { statusCode: 'failure' } },
        },
      }),
    )
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    await expect(createGoogleMeet(consultation())).rejects.toThrow(
      'Evento registrado',
    )
  })
  it.each([
    'http://meet.google.com/test',
    'https://meet.google.com.evil.test/test',
    'https://user:pass@meet.google.com/test',
  ])('recusa endereco de conferencia improprio: %s', async (hangoutLink) => {
    fetcher.mockResolvedValueOnce(response({ id: eventId, hangoutLink }))
    const { createGoogleMeet } = await import('../src/services/googleCalendar')
    await expect(createGoogleMeet(consultation())).rejects.toThrow('valido')
  })
})
