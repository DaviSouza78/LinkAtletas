import { z } from 'zod'
import { bodySchema } from '../../shared/validation.js'
import { createHash, timingSafeEqual } from 'node:crypto'
import { fail } from '../../shared/errors.js'

export const cancelReasonSchema = z
  .object({ reason: z.string().trim().min(5).max(1000) })
  .strict()

const response = {
  200: { type: 'object', additionalProperties: true },
  201: { type: 'object', additionalProperties: true },
}

export const schema = (summary: string, body?: z.ZodType) => ({
  tags: ['Financeiro'],
  summary,
  response,
  ...(body ? { body: bodySchema(body) } : {}),
})

const hash = (value: string) => createHash('sha256').update(value).digest()

export function validWebhookToken(incoming: unknown, expected: string | undefined) {
  return Boolean(
    expected &&
    expected.length >= 32 &&
    typeof incoming === 'string' &&
    incoming.length <= 255 &&
    timingSafeEqual(hash(incoming), hash(expected)),
  )
}

const cents = z.number().finite().min(0).max(1000000)

const resource = z.object({
  id: z.string().min(1).max(200),
  externalReference: z.string().max(200).nullable().optional(),
  status: z.string().max(100).optional(),
  subscription: z.string().max(200).optional(),
  customer: z.string().max(200).optional(),
  value: cents.optional(),
  netValue: cents.optional(),
  dueDate: z.iso.date().optional(),
  paymentDate: z.iso.date().nullable().optional(),
  confirmedDate: z.iso.date().nullable().optional(),
  deleted: z.boolean().optional(),
  split: z
    .array(
      z.object({
        id: z.string().max(200),
        walletId: z.string().max(200),
        status: z.string().max(100),
        fixedValue: cents.nullable().optional(),
        percentualValue: z.number().min(0).max(100).nullable().optional(),
      }),
    )
    .max(100)
    .optional(),
})

const checkoutResource = z.object({
  id: z.string().min(1).max(200),
  externalReference: z.string().max(200).nullable().optional(),
  status: z.string().optional(),
  customer: z.string().max(200).nullable().optional(),
})

export const eventSchema = z.object({
  id: z.string().min(1).max(255),
  event: z.string().min(1).max(100),
  dateCreated: z.string().min(10).max(50),
  payment: resource.optional(),
  subscription: resource.optional(),
  checkout: checkoutResource.optional(),
  additionalInfo: z
    .object({ splitId: z.string().max(200).optional() })
    .optional(),
})

export type GatewayEvent = z.infer<typeof eventSchema>

export function eventTime(value: string) {
  // Asaas's unqualified dates are São Paulo local time; explicit offsets are respected.
  const qualified = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(' ', 'T') + '-03:00'
    : value
  const time = new Date(qualified)
  if (!Number.isFinite(time.getTime()))
    fail(400, 'INVALID_EVENT_DATE', 'Data do evento inválida.')
  return time
}

export function monthlyEnd(value: string | Date) {
  const date = new Date(value)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + 1)
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate()
  date.setUTCDate(Math.min(day, last))
  return date
}
