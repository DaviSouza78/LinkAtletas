export interface Message {
  id: string
  contractId: string
  senderId: string
  senderName: string
  text: string
  mediaId: string | null
  createdAt: string
  readAt: string | null
}
export interface Notification {
  id: string
  kind: string
  title: string
  resourceId: string | null
  createdAt: string
  readAt: string | null
}
export interface Review {
  id: string
  contractId: string
  athleteId: string
  athleteName: string
  coachId: string
  coachName: string
  rating: number
  text: string
  reply: string | null
  repliedAt: string | null
  hidden: boolean
  createdAt: string
  updatedAt: string
}
export interface Consultation {
  id: string
  contractId: string
  athleteId: string
  athleteName: string
  coachId: string
  coachName: string
  title: string
  description: string
  startsAt: string
  durationMinutes: number
  status: 'scheduled' | 'cancelled' | 'completed'
  meetingUrl: string | null
  externalEventId: string | null
  createdAt: string
  updatedAt: string
}
export interface ConsultationInput {
  contractId: string
  title: string
  description: string
  startsAt: string
  durationMinutes: number
  meetingUrl?: string
}
export type InteractionEvent =
  | { type: 'ready'; userId: string }
  | { type: 'message'; message: Message }
  | { type: 'notification'; notification: Notification }
  | {
      type: 'read'
      contractId: string
      readerId: string
      throughId: string | null
    }
  | { type: 'consultation'; consultation: Consultation }
