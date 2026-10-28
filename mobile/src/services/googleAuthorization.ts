import { Platform } from 'react-native'

export const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.events.owned'
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim()
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()
const clientPattern = /^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/
export const googleCalendarConfigured = Boolean(
  webClientId &&
    clientPattern.test(webClientId) &&
    (Platform.OS !== 'ios' || (iosClientId && clientPattern.test(iosClientId))),
)
let sdk: typeof import('react-native-nitro-google-signin') | undefined
let accessToken = ''

export async function authorizeCalendar() {
  if (!googleCalendarConfigured)
    throw new Error(
      'Configure o cliente OAuth Google do aplicativo e gere um novo APK antes de conectar a agenda.',
    )
  await clearCalendarToken()
  sdk ??= await import('react-native-nitro-google-signin')
  sdk.GoogleOneTapSignIn.configure({
    webClientId: webClientId!,
    iosClientId,
    scopes: [CALENDAR_SCOPE],
    offlineAccess: false,
    autoSelectOnSignIn: false,
  })
  await sdk.GoogleOneTapSignIn.checkPlayServices()
  const result = await sdk.GoogleOneTapSignIn.presentExplicitSignIn()
  if (!sdk.isSuccessResponse(result))
    throw new Error('Autorizacao Google cancelada ou nao concluida.')
  const user = sdk.GoogleOneTapSignIn.getCurrentUser()
  const tokens = user?.scopes.includes(CALENDAR_SCOPE)
    ? await sdk.GoogleOneTapSignIn.getTokens()
    : await sdk.GoogleOneTapSignIn.requestScopes([CALENDAR_SCOPE])
  if (!tokens.accessToken)
    throw new Error('O Google nao disponibilizou acesso a agenda.')
  accessToken = tokens.accessToken
  return accessToken
}

export async function calendarToken() {
  return accessToken || authorizeCalendar()
}
export async function clearCalendarToken() {
  const previous = accessToken
  accessToken = ''
  if (previous && sdk)
    await sdk.GoogleOneTapSignIn.clearCachedAccessToken(previous).catch(
      () => undefined,
    )
}
export async function disconnectCalendar() {
  await clearCalendarToken()
  if (sdk) await sdk.GoogleOneTapSignIn.signOut().catch(() => undefined)
}
