import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as FileSystem from 'expo-file-system/legacy'
import { File } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import type { DocumentPickerAsset } from 'expo-document-picker'
import type { AppUser } from '../../../shared/contracts'
import { nativeConfiguration } from '../config/api'
import { validRole } from '../navigation/access'

const configuration = nativeConfiguration(
  process.env.EXPO_PUBLIC_API_URL,
  process.env.EXPO_PUBLIC_BUILD_PROFILE,
  __DEV__,
  Platform.OS,
)
export const API_URL = configuration.apiUrl
export const API_CONFIGURATION_ERROR = configuration.error
export const LOCAL_DEMO = configuration.localDemo
const TOKEN_KEY = 'linkatletas.session'
let token: string | null = null
let expiredListener: (() => void) | null = null
export function onSessionExpired(listener: () => void) {
  expiredListener = listener
  return () => {
    expiredListener = null
  }
}
export async function loadSession() {
  token = await SecureStore.getItemAsync(TOKEN_KEY)
  return token
}
export async function forgetSession() {
  token = null
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
async function storeSession(value: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })
  token = value
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
  }
}
async function responseError(response: Response): Promise<never> {
  const data = (await response.json().catch(() => null)) as {
    message?: string
    code?: string
  } | null
  if (response.status === 401 && token && data?.code === 'UNAUTHENTICATED') {
    await forgetSession()
    expiredListener?.()
  }
  throw new ApiError(
    data?.message ||
      `Não foi possível concluir a solicitação (${response.status}).`,
    response.status,
    data?.code,
  )
}
export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  if (API_CONFIGURATION_ERROR) throw new Error(API_CONFIGURATION_ERROR)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    })
    if (!response.ok) return await responseError(response)
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new Error(
      'Não foi possível conectar à API. Confira a conexão e o endereço configurado.',
    )
  } finally {
    clearTimeout(timeout)
  }
}
export async function authenticate(
  email: string,
  password: string,
  name?: string,
  role: 'athlete' | 'coach' = 'athlete',
) {
  const registering = name !== undefined
  if (registering && role !== 'athlete' && role !== 'coach')
    throw new Error('Cadastro publico permite apenas atleta ou treinador.')
  const response = await api<{
    user: AppUser
    token: string
    expiresAt: string
  }>(`/auth/native/${registering ? 'register' : 'login'}`, 'POST', {
    email,
    password,
    ...(registering ? { name, role } : {}),
  })
  if (
    !response.user ||
    !validRole(response.user.role) ||
    typeof response.token !== 'string' ||
    !/^[a-f0-9]{64}$/.test(response.token)
  ) {
    token = response.token
    await api('/auth/logout', 'POST', {}).catch(() => undefined)
    await forgetSession()
    throw new Error(
      'Perfil de acesso nao reconhecido. Entre em contato com o responsavel.',
    )
  }
  await storeSession(response.token)
  return response.user
}
export async function logout() {
  try {
    await api('/auth/logout', 'POST', {})
  } finally {
    await forgetSession()
  }
}
// Expo's global fetch serializes File/Blob bytes, not the old RN URI objects.
// Keep the selected name instead of exposing DocumentPicker's cache filename.
class SelectedFile extends File {
  constructor(
    uri: string,
    private readonly selectedName: string,
  ) {
    super(uri)
  }
  override get name() {
    return this.selectedName
  }
}
export async function upload(
  asset: DocumentPickerAsset,
  purpose: 'performance' | 'message' | 'instruction' | 'verification',
  resourceId: string,
) {
  if (API_CONFIGURATION_ERROR) throw new Error(API_CONFIGURATION_ERROR)
  const selected = new SelectedFile(asset.uri, asset.name)
  if (selected.size > 3 * 1024 * 1024) {
    const { upload } = await api<{
      upload: { id: string; partSize: number; parts: number }
    }>('/media/uploads', 'POST', {
      purpose,
      resourceId,
      name: asset.name,
      mimeType: asset.mimeType || selected.type,
      size: selected.size,
    })
    try {
      for (let part = 0; part < upload.parts; part++) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 120_000)
        try {
          const response = await fetch(
            `${API_URL}/media/uploads/${upload.id}/parts/${part}`,
            {
              method: 'PUT',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/octet-stream',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: selected.slice(
                part * upload.partSize,
                (part + 1) * upload.partSize,
              ),
            },
          )
          if (!response.ok) return await responseError(response)
        } finally {
          clearTimeout(timeout)
        }
      }
      return await api<{ media: Media }>(
        `/media/uploads/${upload.id}/complete`,
        'POST',
        {},
      )
    } catch (error) {
      await api(`/media/uploads/${upload.id}`, 'DELETE').catch(() => undefined)
      throw error
    }
  }
  const form = new FormData()
  form.append('file', new SelectedFile(asset.uri, asset.name), asset.name)
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 120_000)
  try {
    const response = await fetch(
      `${API_URL}/media?purpose=${purpose}&resourceId=${encodeURIComponent(resourceId)}`,
      {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
        signal: controller.signal,
      },
    )
    if (!response.ok) return await responseError(response)
    return (await response.json()) as { media: Media }
  } finally {
    clearTimeout(timeout)
  }
}
export interface Media {
  id: string
  ownerId: string
  purpose: string
  resourceId: string
  name: string
  mimeType: string
  size: number
  createdAt: string
}
/** Explicit user action writes a decrypted copy to this app's cache and opens the share sheet. */
export async function shareMedia(media: Media) {
  if (API_CONFIGURATION_ERROR) throw new Error(API_CONFIGURATION_ERROR)
  if (!FileSystem.cacheDirectory)
    throw new Error('Diretório privado de cache indisponível.')
  const extension =
    media.name.match(/\.(png|jpe?g|webp|pdf|mp4|webm)$/i)?.[0] || ''
  const destination = `${FileSystem.cacheDirectory}linkatletas-${media.id}${extension}`
  try {
    const result = await FileSystem.downloadAsync(
      `${API_URL}/media/${media.id}/content`,
      destination,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    )
    if (result.status !== 200)
      throw new Error('Arquivo indisponível para esta sessão.')
    if (!(await Sharing.isAvailableAsync()))
      throw new Error('Compartilhamento não disponível neste dispositivo.')
    await Sharing.shareAsync(result.uri, {
      mimeType: media.mimeType,
      dialogTitle: 'Arquivo privado LinkAtletas',
    })
  } finally {
    await FileSystem.deleteAsync(destination, { idempotent: true })
  }
}
export async function shareExport(data: unknown) {
  if (!FileSystem.cacheDirectory)
    throw new Error('Diretório privado de cache indisponível.')
  const destination = `${FileSystem.cacheDirectory}linkatletas-meus-dados.json`
  try {
    await FileSystem.writeAsStringAsync(
      destination,
      JSON.stringify(data, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 },
    )
    await Sharing.shareAsync(destination, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar meus dados LinkAtletas',
    })
  } finally {
    await FileSystem.deleteAsync(destination, { idempotent: true })
  }
}
export function connectEvents(
  onEvent: (event: unknown) => void,
  onClose?: () => void,
) {
  if (!token || API_CONFIGURATION_ERROR) return null
  // React Native supports headers in the third argument; never put the bearer token in a URL.
  const NativeWebSocket = WebSocket as unknown as new (
    url: string,
    protocols?: string[],
    options?: { headers: Record<string, string> },
  ) => WebSocket
  const socket = new NativeWebSocket(
    `${API_URL.replace(/^http/, 'ws')}/events`,
    undefined,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  socket.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data))
    } catch {
      /* Unknown event does not mutate state. */
    }
  }
  socket.onclose = () => onClose?.()
  socket.onerror = () => {
    /* History refresh is the fallback; token and event contents are never logged. */
  }
  return socket
}
