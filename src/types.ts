export type UserRole = 'coach' | 'athlete'

export interface UserSession {
  role: UserRole
  name: string
  email: string
}

export interface Athlete {
  id: number
  name: string
  email: string
  initials: string
  sport: string
  goal: string
  plan: string
  progress: number
  compliance: number
  lastActivity: string
  nextWorkout: string
  status: 'active' | 'attention' | 'new'
  color: string
}

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

export interface AthleteNotification {
  id: string
  type: 'consultation'
  title: string
  message: string
  consultationId: string
  createdAt: string
  read: boolean
}

export interface Coach {
  id: number
  name: string
  initials: string
  specialty: string
  sports: string[]
  rating: number
  reviews: number
  price: number
  match: number
  location: string
  mode: string
  verified: boolean
  color: string
  bio: string
}

export interface Training {
  id: number
  title: string
  athlete: string
  sport: string
  date: string
  duration: string
  intensity: 'Leve' | 'Moderada' | 'Alta'
  status: 'Concluído' | 'Programado' | 'Em andamento'
  exercises: number
}
