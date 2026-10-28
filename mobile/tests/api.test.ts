import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({
  storage: new Map<string, string>(),
  deleted: vi.fn(),
  download: vi.fn(),
  share: vi.fn(),
  write: vi.fn(),
}))
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))
vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: vi.fn(async (key: string) => native.storage.get(key) || null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    native.storage.set(key, value)
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    native.storage.delete(key)
  }),
}))
vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///private/cache/',
  downloadAsync: native.download,
  deleteAsync: native.deleted,
  writeAsStringAsync: native.write,
  EncodingType: { UTF8: 'utf8' },
}))
vi.mock('expo-file-system', () => ({
  File: class extends Blob {
    constructor(readonly uri: string) {
      super([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
    }
    get name() {
      return this.uri.split('/').at(-1) || ''
    }
    async bytes() {
      return new Uint8Array(await this.arrayBuffer())
    }
  },
}))
vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(async () => true),
  shareAsync: native.share,
}))

const secret = 'a'.repeat(64)
const athlete = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Atleta',
  email: 'atleta@teste.local',
  role: 'athlete',
}
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
const fetcher = vi.fn<typeof fetch>()
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  fetcher.mockReset()
  native.storage.clear()
  vi.stubGlobal('__DEV__', true)
  vi.stubGlobal('fetch', fetcher)
  vi.stubEnv('EXPO_PUBLIC_BUILD_PROFILE', undefined)
  delete process.env.EXPO_PUBLIC_API_URL
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  delete process.env.EXPO_PUBLIC_API_URL
})
async function loggedIn() {
  fetcher.mockResolvedValueOnce(
    response({
      user: athlete,
      token: secret,
      expiresAt: '2026-10-15T00:00:00Z',
    }),
  )
  const client = await import('../src/services/api')
  await client.authenticate(athlete.email, 'SenhaTeste123!')
  return client
}
describe('Transporte do cliente nativo com módulos nativos controlados', () => {
  it.each(['performance', 'message', 'instruction', 'verification'] as const)(
    'envia bytes, nome e finalidade %s em multipart',
    async (purpose) => {
      const client = await loggedIn()
      fetcher.mockResolvedValueOnce(response({ media: { id: 'media-test' } }))
      await client.upload(
        {
          uri: 'file:///private/cache/aleatorio.png',
          name: 'corrida.png',
          mimeType: 'image/png',
          lastModified: 0,
        },
        purpose,
        athlete.id,
      )
      const [url, options] = fetcher.mock.calls.at(-1)!
      expect(url).toContain(`/media?purpose=${purpose}&resourceId=`)
      const form = options!.body as FormData
      const file = form.get('file') as File
      expect(file.name).toBe('corrida.png')
      expect(file.type).toBe('image/png')
      expect(new Uint8Array(await file.arrayBuffer())).toEqual(
        new Uint8Array([137, 80, 78, 71]),
      )
      expect(options!.headers).toEqual({ Authorization: `Bearer ${secret}` })
    },
  )
  it('cadastro com nome vazio mantém a rota de cadastro e recebe validação do servidor', async () => {
    const client = await import('../src/services/api')
    fetcher.mockResolvedValueOnce(
      response(
        { code: 'VALIDATION_ERROR', message: 'Informe um nome válido.' },
        400,
      ),
    )
    await expect(
      client.authenticate(athlete.email, 'SenhaTeste123!', ''),
    ).rejects.toThrow('nome válido')
    expect(fetcher.mock.calls[0][0]).toContain('/auth/native/register')
    expect(native.storage.size).toBe(0)
  })
  it('guarda sessão no SecureStore e usa Bearer sem token em URLs', async () => {
    const client = await loggedIn()
    expect(native.storage.get('linkatletas.session')).toBe(secret)
    expect(fetcher.mock.calls[0][0]).toContain('/auth/native/login')
    fetcher.mockResolvedValueOnce(response({ user: athlete }))
    await client.api('/auth/session')
    const [url, options] = fetcher.mock.calls[1]
    expect(String(url)).not.toContain(secret)
    expect(options?.headers).toMatchObject({
      Authorization: `Bearer ${secret}`,
    })
    expect(options?.headers).not.toHaveProperty('Origin')
  })
  it('recusa perfil desconhecido e invalida sessao criada antes de persistir', async () => {
    const client = await import('../src/services/api')
    fetcher
      .mockResolvedValueOnce(
        response({ user: { ...athlete, role: 'unsupported' }, token: secret }),
      )
      .mockResolvedValueOnce(response({ ok: true }))
    await expect(
      client.authenticate(athlete.email, 'SenhaTeste123!'),
    ).rejects.toThrow('nao reconhecido')
    expect(fetcher.mock.calls[1][0]).toContain('/auth/logout')
    expect(native.storage.size).toBe(0)
  })
  it.each(['athlete', 'coach', 'admin'])(
    'autentica e restaura sessao do papel %s',
    async (role) => {
      const client = await import('../src/services/api')
      fetcher.mockResolvedValueOnce(
        response({ user: { ...athlete, role }, token: secret }),
      )
      const user = await client.authenticate(athlete.email, 'SenhaTeste123!')
      expect(user.role).toBe(role)
      expect(native.storage.get('linkatletas.session')).toBe(secret)
      expect(await client.loadSession()).toBe(secret)
      fetcher.mockResolvedValueOnce(response({ user: { ...athlete, role } }))
      expect(
        (await client.api<{ user: { role: string } }>('/auth/session')).user
          .role,
      ).toBe(role)
    },
  )
  it.each(['athlete', 'coach'] as const)(
    'envia cadastro publico de %s',
    async (role) => {
      const client = await import('../src/services/api')
      fetcher.mockResolvedValueOnce(
        response({ user: { ...athlete, role }, token: secret }),
      )
      await client.authenticate(
        athlete.email,
        'SenhaTeste123!',
        'Conta teste',
        role,
      )
      expect(fetcher.mock.calls[0][0]).toContain('/auth/native/register')
      expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({
        role,
        name: 'Conta teste',
      })
    },
  )
  it.each(['athlete', 'coach', 'admin'])(
    'preserva sessao de %s diante de resposta de permissao negada',
    async (role) => {
      const client = await import('../src/services/api')
      fetcher.mockResolvedValueOnce(
        response({ user: { ...athlete, role }, token: secret }),
      )
      await client.authenticate(athlete.email, 'SenhaTeste123!')
      fetcher.mockResolvedValueOnce(
        response(
          { code: 'FORBIDDEN', message: 'Operacao nao permitida.' },
          403,
        ),
      )
      await expect(client.api('/admin/verifications')).rejects.toThrow(
        'Operacao nao permitida.',
      )
      expect(native.storage.get('linkatletas.session')).toBe(secret)
    },
  )
  it('nega sessão expirada, apaga token e avisa a aplicação', async () => {
    const client = await loggedIn(),
      expired = vi.fn()
    client.onSessionExpired(expired)
    fetcher.mockResolvedValueOnce(
      response({ code: 'UNAUTHENTICATED', message: 'Sessão encerrada.' }, 401),
    )
    await expect(client.api('/contracts')).rejects.toThrow('Sessão encerrada.')
    expect(expired).toHaveBeenCalledOnce()
    expect(native.storage.size).toBe(0)
  })
  it('senha de confirmação incorreta permite tentar novamente sem perder sessão válida', async () => {
    const client = await loggedIn(),
      expired = vi.fn()
    client.onSessionExpired(expired)
    fetcher.mockResolvedValueOnce(
      response(
        { code: 'INVALID_CREDENTIALS', message: 'Confirme sua senha.' },
        401,
      ),
    )
    await expect(
      client.api('/privacy/delete', 'POST', { password: 'errada' }),
    ).rejects.toThrow('Confirme sua senha.')
    expect(expired).not.toHaveBeenCalled()
    expect(native.storage.size).toBe(1)
  })
  it('limpa sessão local mesmo quando logout não consegue acessar a rede', async () => {
    const client = await loggedIn()
    fetcher.mockRejectedValueOnce(new Error('offline'))
    await expect(client.logout()).rejects.toThrow('conectar à API')
    expect(native.storage.size).toBe(0)
  })
  it('WebSocket usa cabeçalho nativo e mantém segredo fora da URL', async () => {
    const client = await loggedIn(),
      constructor = vi.fn()
    class Socket {
      constructor(...args: unknown[]) {
        constructor(...args)
      }
    }
    vi.stubGlobal('WebSocket', Socket)
    client.connectEvents(() => undefined)
    expect(constructor).toHaveBeenCalledOnce()
    const [url, , options] = constructor.mock.calls[0]
    expect(url).toMatch(/^ws:\/\/.*\/api\/events$/)
    expect(url).not.toContain(secret)
    expect(options).toEqual({ headers: { Authorization: `Bearer ${secret}` } })
  })
  it('download autorizado usa cabeçalho e elimina cópia do cache após ação do usuário', async () => {
    const client = await loggedIn()
    native.download.mockResolvedValueOnce({
      status: 200,
      uri: 'file:///private/cache/teste.pdf',
    })
    await client.shareMedia({
      id: athlete.id,
      ownerId: athlete.id,
      purpose: 'message',
      resourceId: athlete.id,
      name: 'teste.pdf',
      mimeType: 'application/pdf',
      size: 100,
      createdAt: '',
    })
    const [url, destination, options] = native.download.mock.calls[0]
    expect(url).not.toContain(secret)
    expect(destination).toMatch(/^file:\/\/\/private\/cache\//)
    expect(options.headers.Authorization).toBe(`Bearer ${secret}`)
    expect(native.share).toHaveBeenCalledOnce()
    expect(native.deleted).toHaveBeenCalledWith(expect.any(String), {
      idempotent: true,
    })
  })
  it('produção sem HTTPS apresenta erro de configuração sem transmitir credenciais', async () => {
    vi.stubGlobal('__DEV__', false)
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3001/api'
    const client = await import('../src/services/api')
    await expect(client.authenticate(athlete.email, 'senha')).rejects.toThrow(
      'HTTPS',
    )
    expect(fetcher).not.toHaveBeenCalled()
    expect(client.connectEvents(() => undefined)).toBeNull()
    await expect(
      client.shareMedia({
        id: athlete.id,
        ownerId: athlete.id,
        resourceId: athlete.id,
        purpose: 'message',
        name: 'privado.pdf',
        mimeType: 'application/pdf',
        size: 10,
        createdAt: '',
      }),
    ).rejects.toThrow('HTTPS')
    expect(native.download).not.toHaveBeenCalled()
  })
  it('remove cópia parcial de mídia quando o download falha', async () => {
    const client = await loggedIn()
    native.download.mockRejectedValueOnce(new Error('download interrompido'))
    await expect(
      client.shareMedia({
        id: athlete.id,
        ownerId: athlete.id,
        resourceId: athlete.id,
        purpose: 'message',
        name: 'privado.pdf',
        mimeType: 'application/pdf',
        size: 10,
        createdAt: '',
      }),
    ).rejects.toThrow('download interrompido')
    expect(native.deleted).toHaveBeenCalledOnce()
    expect(native.share).not.toHaveBeenCalled()
  })
  it('remove exportação parcial quando a gravação falha', async () => {
    const client = await loggedIn()
    native.write.mockRejectedValueOnce(new Error('disco indisponível'))
    await expect(
      client.shareExport({ health: 'dado privado fictício' }),
    ).rejects.toThrow('disco indisponível')
    expect(native.deleted).toHaveBeenCalledOnce()
    expect(native.share).not.toHaveBeenCalled()
  })
})
