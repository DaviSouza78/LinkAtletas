import type { Consultation } from '../../../shared/interaction-contracts'
import { calendarToken, clearCalendarToken } from './googleAuthorization'

interface CalendarEvent {
  id: string
  status?: string
  hangoutLink?: string
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[]; createRequest?: { status?: { statusCode: string } } }
}
const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
async function call(path: string, method = 'GET', body?: unknown) {
  const token = await calendarToken()
  const response = await fetch(base + path, { method, signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  if (response.status === 401) { await clearCalendarToken(); throw new Error('A autorizacao Google expirou. Conecte novamente antes de repetir.') }
  if (response.status === 403) throw new Error('Google recusou o acesso. Confira consentimento, escopos e ativacao da Calendar API.')
  return response
}
export async function createGoogleMeet(item: Consultation) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id) || item.status !== 'scheduled' || !Number.isFinite(item.durationMinutes) || item.durationMinutes <= 0) throw new Error('Selecione uma consultoria agendada valida.')
  const start = new Date(item.startsAt), end = new Date(start.getTime() + item.durationMinutes * 60000)
  if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) throw new Error('A reuniao precisa ter inicio futuro valido.')
  const id = 'la' + item.id.replaceAll('-', '').toLowerCase()
  let response = await call('/' + id + '?conferenceDataVersion=1')
  if (response.status === 404) {
    response = await call('?conferenceDataVersion=1&sendUpdates=none', 'POST', {
      id, summary: 'Consultoria LinkAtletas', description: 'Agendamento criado pelo responsavel no LinkAtletas. Sem convites automaticos.',
      start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() },
      conferenceData: { createRequest: { requestId: id, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    })
    if (response.status === 409) response = await call('/' + id + '?conferenceDataVersion=1')
  }
  if (!response.ok) throw new Error('Nao foi possivel confirmar o evento. Consulte sua agenda antes de tentar novamente.')
  let event = await response.json() as CalendarEvent
  if (event.id !== id || event.status === 'cancelled') throw new Error('O evento reservado nao esta disponivel. Confira sua agenda Google.')
  for (let attempt = 0; attempt < 5; attempt++) {
    if (event.id !== id || event.status === 'cancelled') throw new Error('O evento reservado nao esta disponivel. Confira sua agenda Google.')
    const url = event.hangoutLink || event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
    if (url) {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'meet.google.com' || parsed.username || parsed.password) throw new Error('O Google nao retornou um endereco Meet valido.')
      return { eventId: event.id, meetingUrl: url }
    }
    if (event.conferenceData?.createRequest?.status?.statusCode === 'failure') break
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const next = await call('/' + id + '?conferenceDataVersion=1')
    if (!next.ok) break
    event = await next.json() as CalendarEvent
  }
  throw new Error('Evento registrado, mas o Meet ainda nao esta disponivel. Confira sua agenda; tentar vincular novamente usa o mesmo identificador, sem criar outro evento.')
}
