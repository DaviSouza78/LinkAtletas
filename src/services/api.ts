import type { ApiErrorBody } from '../../shared/contracts'
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    )
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = body as ApiErrorBody | null
    throw new Error(
      error?.message ||
        `Não foi possível concluir a operação (${response.status}).`,
    )
  }
  return body as T
}
export function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) }
}
