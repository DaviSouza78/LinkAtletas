export type Role = 'athlete' | 'coach' | 'admin'
export type Mode = 'online' | 'presencial' | 'hibrido'
export type VerificationStatus =
  'unsubmitted' | 'pending' | 'approved' | 'rejected'
export type ContractStatus = 'pending' | 'active' | 'rejected'
export const SPORTS = [
  'Corrida',
  'Musculação',
  'Natação',
  'Ciclismo',
  'Triatlo',
] as const
export const LEVELS = ['Iniciante', 'Intermediário', 'Avançado'] as const
export const SLOTS = [
  'Segunda manhã',
  'Segunda noite',
  'Terça manhã',
  'Terça noite',
  'Quarta manhã',
  'Quarta noite',
  'Quinta manhã',
  'Quinta noite',
  'Sexta manhã',
  'Sexta noite',
  'Sábado manhã',
  'Domingo manhã',
] as const
export const GOALS = [
  'Condicionamento',
  'Performance',
  'Emagrecimento',
  'Força',
  'Competição',
] as const
export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
}
export interface ProfileInput {
  name: string
  city: string
  bio: string
  sports: string[]
  goals: string[]
  levels: string[]
  availability: string[]
  mode: Mode
  budget: number
  price: number
}
export interface Profile extends ProfileInput {
  userId: string
  role: Role
  email: string
  cref: string
  verificationStatus: VerificationStatus
  verificationReason: string
}
export interface CoachCard extends Omit<Profile, 'email' | 'budget' | 'role'> {
  score: number
  reasons: string[]
}
export interface Verification {
  id: string
  coachId: string
  coachName: string
  cref: string
  evidence: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  submittedAt: string
  reviewedAt: string | null
  reviewerId: string | null
}
export interface Contract {
  id: string
  athleteId: string
  coachId: string
  athleteName: string
  coachName: string
  status: ContractStatus
  createdAt: string
  decidedAt: string | null
}
export interface ExerciseBlock {
  name: string
  instructions: string
  sets?: number
  repetitions?: number
  loadKg?: number
  durationMinutes?: number
  distanceKm?: number
  videoUrl?: string
}
export interface WorkoutInput {
  contractId: string
  title: string
  sport: string
  scheduledDate: string
  instructions: string
  status: 'draft' | 'published'
  blocks: ExerciseBlock[]
}
export interface ExecutionInput {
  completedBlocks: number[]
  effort: number
  notes: string
  metrics: Record<string, number>
}
export interface Execution extends ExecutionInput {
  id: string
  updatedAt: string
}
export interface Workout extends WorkoutInput {
  id: string
  coachId: string
  athleteId: string
  coachName: string
  athleteName: string
  createdAt: string
  execution: Execution | null
}
export interface MetricType {
  sport: string
  key: string
  label: string
  unit: string
  min: number
  max: number
}
export interface Dashboard {
  contracts: Contract[]
  workouts: Workout[]
}
export interface ApiErrorBody {
  code: string
  message: string
  fields?: Record<string, string[]>
}

/** HTTP contract: all endpoints are relative to /api. Cookie credentials are mandatory.
 * POST /auth/register {name,email,password,role:'athlete'|'coach'} -> 201 {user}
 * POST /auth/login {email,password} -> {user}; GET /auth/session -> {user: AppUser|null}
 * POST /auth/logout {} -> {ok:true}
 * GET /profiles/me -> {profile}; PUT /profiles/me ProfileInput -> {profile}
 * GET /coaches?sport=&query=&maxPrice=&mode= -> {coaches:CoachCard[]}
 * POST /verifications {cref,evidence} -> 201 {verification}; GET /verifications -> {verifications}
 * GET /admin/verifications -> {verifications}; PATCH /admin/verifications/:id {status:'approved'|'rejected',reason} -> {verification}
 * GET /contracts -> {contracts}; POST /contracts {coachId} -> 201 {contract}
 * PATCH /contracts/:id {status:'active'|'rejected'} -> {contract}
 * GET /workouts -> {workouts}; POST /workouts WorkoutInput -> 201 {workout}
 * GET /workouts/:id -> {workout}; PUT /workouts/:id WorkoutInput -> {workout}
 * PUT /workouts/:id/execution ExecutionInput -> {workout}
 * GET /metrics?sport= -> {metrics:MetricType[]}; GET /dashboard -> Dashboard
 */
