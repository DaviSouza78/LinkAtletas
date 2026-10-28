export interface Consultation {
  id: string
  athleteId: number
  athleteName: string
  athleteEmail: string
  purpose: string
  description: string
  date: string
  startTime: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  meetLink?: string
  calendarLink?: string
  googleEventId?: string
  source: 'google' | 'demo'
  createdAt: string
}
