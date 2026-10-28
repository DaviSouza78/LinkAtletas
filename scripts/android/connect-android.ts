import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const candidates = [
  process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
  process.platform === 'win32' && 'C:/dev/tools/android-platform-tools/platform-tools/adb.exe',
].filter((value): value is string => Boolean(value))
const executable = candidates.find(existsSync) || 'adb'
const args = process.argv.slice(2)
const options = new Map<string, string>()
for (let index = 0; index < args.length; index += 2) {
  const option = args[index], value = args[index + 1]
  if (!['--serial', '--install'].includes(option) || options.has(option))
    throw new Error('Use apenas --serial IDENTIFICADOR e --install CAMINHO_DO_APK, sem repetir opcoes.')
  if (!value || value.startsWith('--'))
    throw new Error(`Informe um valor apos ${option}.`)
  options.set(option, value)
}
const requestedSerial = options.get('--serial')
const apk = options.get('--install')
if (apk && !existsSync(apk)) throw new Error('Informe um arquivo APK existente apos --install.')
const port = Number(process.env.API_PORT || 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT inválida.')
function adb(parameters: string[]) {
  return execFileSync(executable, parameters, { encoding: 'utf8', timeout: 15_000, windowsHide: true })
}
try {
  const output = adb(['devices'])
  const devices = output.split(/\r?\n/).map((line) => line.match(/^(\S+)\s+device$/)?.[1]).filter((value): value is string => Boolean(value))
  if (!devices.length) throw new Error('Nenhum Android autorizado foi encontrado. Conecte por USB, ative a depuração USB e autorize este computador no aparelho.')
  if (devices.length > 1 && !requestedSerial) throw new Error('Há mais de um Android conectado. Use --serial IDENTIFICADOR para escolher o aparelho.')
  const chosen = requestedSerial || devices[0]
  if (!devices.includes(chosen)) throw new Error('O Android escolhido não está conectado ou autorizado.')
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('A API respondeu sem saúde. Confira banco e logs antes de conectar.')
  adb(['-s', chosen, 'reverse', 'tcp:3001', `tcp:${port}`])
  if (apk) {
    adb(['-s', chosen, 'install', '-r', path.resolve(apk)])
  }
  if (!adb(['-s', chosen, 'shell', 'pm', 'path', 'br.edu.linkatletas.app.local']).includes('package:'))
    throw new Error('O APK local não está instalado. Use --install CAMINHO_DO_APK para instalar.')
  const launch = adb(['-s', chosen, 'shell', 'am', 'start', '-W', '-n', 'br.edu.linkatletas.app.local/.MainActivity'])
  if (/Error:|Exception/i.test(launch)) throw new Error('O Android não conseguiu abrir o aplicativo local.')
  console.log(`Aplicativo local conectado à API do computador na porta ${port}. Mantenha a conexão USB e a API em execução.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Não foi possível conectar o Android.')
  process.exitCode = 1
}
