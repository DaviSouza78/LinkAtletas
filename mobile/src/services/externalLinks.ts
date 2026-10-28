import { Linking } from 'react-native'

export function externalHttps(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Endereco externo invalido.')
  }
  if (
    value.length > 2000 ||
    /[\u0000-\u0020\u007f<>"\\]/.test(value) ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password
  )
    throw new Error(
      'Use endereco HTTPS sem credenciais ou caracteres invalidos.',
    )
  return value
}
export async function openExternal(value: string) {
  await Linking.openURL(externalHttps(value))
}
