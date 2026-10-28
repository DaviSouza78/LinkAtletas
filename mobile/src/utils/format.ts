export function money(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function datetime(value: string) {
  return new Date(value).toLocaleString('pt-BR')
}
