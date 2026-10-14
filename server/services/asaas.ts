import { z } from 'zod'

export class AsaasError extends Error {
  constructor(
    public readonly uncertain: boolean,
    public readonly status?: number,
  ) {
    super(
      uncertain
        ? 'Resultado do provedor requer conciliação.'
        : 'O provedor recusou a operação.',
    )
  }
}
export interface AsaasOptions {
  apiKey: string
  environment: 'sandbox' | 'production'
  /** Dependency injection exclusively for controlled HTTP contract tests. */
  baseUrl?: string
  timeoutMs?: number
}
export interface CheckoutInput {
  reference: string
  name: string
  amountCents: number
  walletId: string
  commissionBps: number
  callbackOrigin: string
  nextDueDate: string
}
/** Contract verified against the official v3 Checkout and subscription documentation. */
export class AsaasClient {
  private readonly base: string
  constructor(private readonly options: AsaasOptions) {
    this.base =
      options.baseUrl ??
      (options.environment === 'sandbox'
        ? 'https://api-sandbox.asaas.com/v3'
        : 'https://api.asaas.com/v3')
    const url = new URL(this.base)
    if (
      options.baseUrl &&
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
      throw new Error(
        'Endpoint de teste deve ser local; produção usa endpoint oficial.',
      )
  }
  private async request(
    path: string,
    method: 'GET' | 'POST' | 'DELETE',
    body?: unknown,
  ): Promise<unknown> {
    let response: Response
    try {
      response = await fetch(`${this.base}${path}`, {
        method,
        headers: {
          access_token: this.options.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'LinkAtletas/2.0',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 8000),
      })
    } catch {
      throw new AsaasError(true)
    }
    if (!response.ok)
      throw new AsaasError(
        response.status >= 500 || response.status === 408,
        response.status,
      )
    try {
      return await response.json()
    } catch {
      throw new AsaasError(true)
    }
  }
  async createCheckout(input: CheckoutInput) {
    const result = await this.request('/checkouts', 'POST', {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 60,
      externalReference: input.reference,
      callback: {
        successUrl: `${input.callbackOrigin}/atleta/financeiro?checkout=retorno`,
        cancelUrl: `${input.callbackOrigin}/atleta/financeiro?checkout=cancelado`,
        expiredUrl: `${input.callbackOrigin}/atleta/financeiro?checkout=expirado`,
      },
      items: [
        {
          name: input.name,
          description: 'Acompanhamento esportivo mensal',
          quantity: 1,
          value: input.amountCents / 100,
        },
      ],
      subscription: { cycle: 'MONTHLY', nextDueDate: input.nextDueDate },
      splits: [
        {
          walletId: input.walletId,
          percentualValue: (10000 - input.commissionBps) / 100,
        },
      ],
    })
    const parsed = z
      .object({ id: z.string().min(1).max(200) })
      .safeParse(result)
    if (!parsed.success) throw new AsaasError(true)
    const checkoutHost =
      this.options.environment === 'sandbox'
        ? 'https://sandbox.asaas.com'
        : 'https://asaas.com'
    return {
      id: parsed.data.id,
      url: `${checkoutHost}/checkoutSession/show?id=${encodeURIComponent(parsed.data.id)}`,
    }
  }
  async cancelSubscription(id: string) {
    const result = await this.request(
      `/subscriptions/${encodeURIComponent(id)}`,
      'DELETE',
    )
    if (!z.object({ deleted: z.literal(true) }).safeParse(result).success)
      throw new AsaasError(true)
  }
  async cancelCheckout(id: string) {
    await this.request(`/checkouts/${encodeURIComponent(id)}/cancel`, 'POST')
  }
  async getSubscription(id: string): Promise<{
    id: string
    deleted: boolean
    status: string
    externalReference?: string | null
  }> {
    const result = await this.request(
      `/subscriptions/${encodeURIComponent(id)}`,
      'GET',
    )
    const parsed = z
      .object({
        id: z.string(),
        deleted: z.boolean().default(false),
        status: z.string(),
        externalReference: z.string().nullable().optional(),
      })
      .safeParse(result)
    if (!parsed.success || parsed.data.id !== id) throw new AsaasError(true)
    return parsed.data
  }
  async checkoutSubscriptions(checkoutId: string): Promise<string[]> {
    const result = await this.request(
      `/payments?checkoutSession=${encodeURIComponent(checkoutId)}&limit=100`,
      'GET',
    )
    const parsed = z
      .object({
        data: z.array(
          z.object({ subscription: z.string().nullable().optional() }),
        ),
      })
      .safeParse(result)
    if (!parsed.success) throw new AsaasError(true)
    return [
      ...new Set(
        parsed.data.data.flatMap((item) =>
          item.subscription ? [item.subscription] : [],
        ),
      ),
    ]
  }
}
