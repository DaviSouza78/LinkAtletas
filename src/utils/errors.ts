export function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : 'Não foi possível concluir a operação.'
}
