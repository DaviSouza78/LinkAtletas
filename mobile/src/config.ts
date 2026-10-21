/** Production and local demonstration have separate networking policies. */
export function nativeConfiguration(
  configured: string | undefined,
  profile: string | undefined,
  development: boolean,
  platform: string,
) {
  const localDemo = profile === 'local'
  const apiUrl = (
    configured ||
    (localDemo
      ? 'http://localhost:3001/api'
      : `http://${platform === 'android' ? '10.0.2.2' : 'localhost'}:3001/api`)
  ).replace(/\/$/, '')
  let error = ''
  try {
    const url = new URL(apiUrl)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username || url.password || url.search || url.hash ||
      url.hostname === 'example' || url.hostname.endsWith('.example')
    ) {
      error = 'Configure um endereço de API válido, sem credenciais e sem domínio de exemplo.'
    } else if (localDemo) {
      if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname))
        error = 'A demonstração local aceita somente a API em loopback ou no emulador Android.'
    } else if (!development && url.protocol !== 'https:') {
      error = 'O aplicativo de produção exige EXPO_PUBLIC_API_URL HTTPS. Configure o endereço e gere uma nova versão.'
    }
  } catch {
    error = 'Configure um endereço válido em EXPO_PUBLIC_API_URL.'
  }
  return { apiUrl, error, localDemo }
}
