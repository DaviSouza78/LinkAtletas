import type { AthleteNotification, Consultation } from '../types'

const CONSULTATIONS_KEY = 'linkatletas.consultations'
const NOTIFICATIONS_KEY = 'linkatletas.notifications.athlete'
const CHANGE_EVENT = 'linkatletas:consultations-changed'

const seedConsultations: Consultation[] = [
  {
    id: 'consultoria-seed-1', athleteId: 1, athleteName: 'Marina Costa', athleteEmail: 'emailatleta@email.com',
    purpose: 'Revisão do ciclo de meia maratona',
    description: 'Avaliar a resposta aos intervalados e alinhar o bloco final antes do longão de 18 km.',
    date: '2026-08-18', startTime: '19:00', duration: 45, status: 'scheduled',
    source: 'demo', createdAt: '2026-08-14T15:00:00.000Z',
  },
  {
    id: 'consultoria-seed-2', athleteId: 2, athleteName: 'Rafael Nunes', athleteEmail: 'rafael.nunes@exemplo.com',
    purpose: 'Ajuste de carga para o Ironman 70.3',
    description: 'Revisar desconforto no joelho e adaptar os treinos de ciclismo da próxima semana.',
    date: '2026-08-20', startTime: '18:30', duration: 30, status: 'scheduled',
    source: 'demo', createdAt: '2026-08-15T12:30:00.000Z',
  },
]

function parseStored<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

export function getConsultations(): Consultation[] {
  const stored = parseStored<Consultation[] | null>(CONSULTATIONS_KEY, null)
  if (stored) return stored
  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(seedConsultations))
  return seedConsultations
}

export function getUpcomingConsultations(athleteId?: number): Consultation[] {
  const now = new Date()
  return getConsultations()
    .filter(item => item.status === 'scheduled' && (!athleteId || item.athleteId === athleteId))
    .filter(item => new Date(`${item.date}T${item.startTime}:00`) >= new Date(now.getTime() - 60 * 60 * 1000))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
}

export function saveConsultation(consultation: Consultation) {
  const all = getConsultations()
  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify([...all, consultation]))
  const notification: AthleteNotification = {
    id: `notification-${consultation.id}`,
    type: 'consultation',
    title: 'Nova consultoria agendada',
    message: `${consultation.purpose} · ${formatConsultationDate(consultation.date, consultation.startTime)}`,
    consultationId: consultation.id,
    createdAt: new Date().toISOString(),
    read: false,
  }
  const notifications = getAthleteNotifications()
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([notification, ...notifications]))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function getAthleteNotifications(): AthleteNotification[] {
  return parseStored<AthleteNotification[]>(NOTIFICATIONS_KEY, [])
}

export function markAthleteNotificationsRead() {
  const notifications = getAthleteNotifications().map(item => ({ ...item, read: true }))
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function subscribeToConsultations(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function formatConsultationDate(date: string, time: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .format(new Date(`${date}T${time}:00`))
    .replace('.', '')
}
