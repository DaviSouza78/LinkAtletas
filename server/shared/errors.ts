import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { extname } from 'node:path'
import type {} from '@fastify/static'
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new HttpError(status, code, message)
}
export function installErrors(app: FastifyInstance, serveFrontend = false) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const fields: Record<string, string[]> = {}
      for (const issue of error.issues)
        (fields[issue.path.join('.') || 'form'] ??= []).push(issue.message)
      return reply
        .code(400)
        .send({
          code: 'VALIDATION',
          message: 'Revise os campos informados.',
          fields,
        })
    }
    if (error instanceof HttpError)
      return reply
        .code(error.statusCode)
        .send({ code: error.code, message: error.message })
    const err = error as {
      code?: string
      statusCode?: number
      validation?: unknown
    }
    if (err.code === '23505')
      return reply
        .code(409)
        .send({
          code: 'CONFLICT',
          message: 'Já existe um registro com esses dados.',
        })
    if (err.validation || err.statusCode === 400)
      return reply
        .code(400)
        .send({ code: 'VALIDATION', message: 'Revise os campos informados.' })
    if (err.statusCode === 429)
      return reply
        .code(429)
        .send({
          code: 'RATE_LIMIT',
          message: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
        })
    if (err.statusCode === 413)
      return reply
        .code(413)
        .send({
          code: 'TOO_LARGE',
          message: 'Os dados enviados ultrapassam o limite permitido.',
        })
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500)
      return reply.code(err.statusCode).send({
        code: 'INVALID_REQUEST',
        message: 'A requisição não pôde ser aceita. Confira o formato enviado.',
      })
    request.log.error(
      { code: err.code || 'INTERNAL', requestId: request.id },
      'Falha ao processar requisição',
    )
    return reply
      .code(500)
      .send({
        code: 'INTERNAL',
        message: 'Não foi possível concluir a operação. Tente novamente.',
      })
  })
  app.setNotFoundHandler((request, reply) => {
    const pathname = request.url.split('?')[0]
    if (
      serveFrontend &&
      ['GET', 'HEAD'].includes(request.method) &&
      pathname !== '/api' &&
      !pathname.startsWith('/api/') &&
      !extname(pathname)
    )
      return reply.sendFile('index.html')
    return reply
      .code(404)
      .send({ code: 'NOT_FOUND', message: 'Recurso não encontrado.' })
  })
}
