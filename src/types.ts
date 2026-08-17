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
  avatarUrl?: string
  phone?: string
  city?: string
  age?: number
  height?: string
  weight?: string
  restingHr?: number
  maxHr?: number
  vo2max?: number
  medicalClearance?: boolean
  notes?: string
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
  type: 'consultation' | 'workout' | 'feedback'
  title: string
  message: string
  consultationId?: string
  createdAt: string
  read: boolean
}

export interface CoachPlan {
  id: string
  name: string
  price: number
  period: string
  features: string[]
  popular?: boolean
}

export interface CoachReview {
  id: string
  athleteName: string
  athleteInitials: string
  rating: number
  date: string
  comment: string
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
  cref?: string
  experienceYears?: number
  activeStudents?: number
  methodology?: string
  plans?: CoachPlan[]
  testimonials?: CoachReview[]
}

export interface WorkoutSplit {
  rep: number
  distance: string
  time: string
  pace: string
  hr: number
  cadence?: number
  rpe?: number
}

export interface WorkoutDetail {
  id: number
  title: string
  athleteName: string
  athleteInitials: string
  athleteColor: string
  sport: string
  date: string
  duration: string
  distance: string
  rpe: number
  avgPace: string
  maxPace: string
  avgHr: number
  maxHr: number
  elevation: string
  calories: number
  completed: boolean
  coachFeedback?: string
  athleteNotes?: string
  splits: WorkoutSplit[]
}

export interface ChatMessage {
  id: string
  sender: 'coach' | 'athlete'
  senderName: string
  text: string
  time: string
  date: string
  read: boolean
  workoutCard?: {
    title: string
    meta: string
    workoutId: number
    status: string
  }
  videoCard?: {
    title: string
    duration: string
    thumbnailText?: string
    notes?: string
  }
  audioCard?: {
    duration: string
  }
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
  description?: string
  targetPace?: string
  targetDistance?: string
}

export interface TrainingLoadPoint {
  label: string
  fullLabel: string
  planned: number
  actual: number
  difference: number
}
