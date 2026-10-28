export const items = (options: readonly string[]) =>
  options.map((value) => ({ id: value, label: value }))

export const number = (value: string) => Number(value.replace(',', '.'))
