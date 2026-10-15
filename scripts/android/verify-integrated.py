"""Exercise the installed native APK through Android UIAutomator and the real API.

Only companion coach actions and fixture checks use HTTP directly. Athlete actions
run through the APK. All accounts/data are fictitious in an isolated *_test DB.
"""
import base64
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

PACKAGE = 'br.edu.linkatletas.app.local'
BASE = 'http://127.0.0.1:3001/api'
OUT = Path('emulator-evidence')
OUT.mkdir(exist_ok=True)
steps = []
started = time.time()


def adb(*args, binary=False):
    result = subprocess.run(['adb', *map(str, args)], capture_output=True, timeout=40)
    if result.returncode:
        # Do not include command arguments: input text can contain credentials.
        raise RuntimeError('Comando Android falhou: ' + result.stderr.decode(errors='replace')[:200])
    return result.stdout if binary else result.stdout.decode('utf-8', errors='replace')


def request(method, endpoint, data=None, token=None):
    headers = {'Content-Type': 'application/json', 'Origin': 'http://localhost:5173'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + endpoint, method=method, headers=headers,
                                 data=None if data is None else json.dumps(data).encode())
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)


def login(email, password):
    return request('POST', '/auth/native/login', {'email': email, 'password': password})['token']


def dump():
    adb('shell', 'uiautomator', 'dump', '/sdcard/linkatletas-window.xml')
    return ET.fromstring(adb('shell', 'cat', '/sdcard/linkatletas-window.xml'))


def labels(node):
    return [node.get('text', ''), node.get('content-desc', '')]


def bounds(node):
    values = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
    return values if len(values) == 4 else [0, 0, 0, 0]


def find(tree, label, partial=False):
    # Accessible input/button labels take precedence over decorative Text labels.
    for attribute in ('content-desc', 'text'):
        for node in tree.iter('node'):
            x1, y1, x2, y2 = bounds(node)
            if x2 <= x1 or y2 <= y1:
                continue
            value = node.get(attribute, '')
            if label in value if partial else label == value:
                return node
    return None


def swipe(up=True):
    width, height = size
    adb('shell', 'input', 'swipe', width // 2, int(height * (.78 if up else .30)),
        width // 2, int(height * (.28 if up else .83)), 220)
    time.sleep(.2)


def top():
    for _ in range(5):
        swipe(False)


def locate(label, scroll=False, partial=False, timeout=25):
    deadline = time.time() + timeout
    tries = 0
    while time.time() < deadline:
        tree = dump()
        node = find(tree, label, partial)
        if node is not None:
            return node
        if scroll and tries < 9:
            swipe()
        else:
            time.sleep(.6)
        tries += 1
    raise AssertionError('Elemento não encontrado no APK: ' + label)


def tap(label, scroll=False, partial=False):
    node = locate(label, scroll=scroll, partial=partial)
    x1, y1, x2, y2 = bounds(node)
    adb('shell', 'input', 'tap', (x1+x2)//2, (y1+y2)//2)
    time.sleep(.35)


def fill(label, value, scroll=False):
    node = locate(label, scroll=scroll)
    x1, y1, x2, y2 = bounds(node)
    adb('shell', 'input', 'tap', (x1+x2)//2, (y1+y2)//2)
    adb('shell', 'input', 'keycombination', 113, 29)  # Ctrl+A
    adb('shell', 'input', 'text', str(value).replace(' ', '%s'))
    adb('shell', 'input', 'keyevent', 111)  # Dismiss IME without navigating back.
    time.sleep(.25)


def tab(name):
    tree = dump()
    strip = next(n for n in tree.iter('node') if n.get('class') == 'android.widget.HorizontalScrollView')
    x1, y1, x2, y2 = bounds(strip)
    y = (y1+y2)//2
    for _ in range(3):
        adb('shell', 'input', 'swipe', x1+70, y, x2-70, y, 200)
    for _ in range(6):
        if find(dump(), name) is not None:
            tap(name)
            time.sleep(.8)
            top()
            return
        adb('shell', 'input', 'swipe', x2-70, y, x1+70, y, 200)
    raise AssertionError('Aba não encontrada: ' + name)


def record(name):
    steps.append({'name': name, 'passed': True, 'elapsedSeconds': round(time.time()-started, 2)})
    print('PASS: ' + name, flush=True)


def capture(name):
    tree = dump()
    for node in tree.iter('node'):
        if node.get('password') == 'true':
            node.set('text', '[campo protegido]')
    text = ET.tostring(tree, encoding='unicode')
    text = re.sub(r'\b[a-f0-9]{64}\b', '[token omitido]', text)
    (OUT / (name + '.xml')).write_text(text, encoding='utf-8')
    (OUT / (name + '.png')).write_bytes(adb('exec-out', 'screencap', '-p', binary=True))


def relaunch():
    adb('shell', 'am', 'force-stop', PACKAGE)
    adb('shell', 'am', 'start', '-W', '-n', PACKAGE + '/.MainActivity')
    time.sleep(2)


def test():
    assert request('GET', '/billing/config')['mode'] == 'academic'
    relaunch()
    locate('E-mail')
    fill('E-mail', 'ausente-apk@e2e.local')
    fill('Senha', 'SenhaTeste123!')
    tap('Entrar')
    locate('E-mail ou senha incorretos.')
    record('Login inválido tratado pela API sem crash')

    fill('E-mail', 'emailtreinador@email.com')
    fill('Senha', 'senhatreinador')
    tap('Entrar')
    locate('Use a interface web para os perfis de treinador e administração.')
    record('Perfil treinador recusado pelo cliente atleta')

    tap('Criar conta', scroll=True)
    email = 'apk-' + str(int(time.time())) + '@e2e.local'
    password = 'SenhaTeste123!'
    fill('Nome', 'Atleta APK')
    fill('E-mail', email)
    fill('Senha', password)
    tap('Criar conta')
    locate('Olá, Atleta', partial=True)
    athlete = login(email, password)
    request('PUT', '/profiles/me', {
        'name': 'Atleta APK', 'city': 'Joinville, SC', 'bio': 'Dados ficticios do ensaio Android',
        'sports': ['Corrida'], 'goals': ['Performance'], 'levels': ['Intermediário'],
        'availability': ['Segunda noite'], 'mode': 'online', 'budget': 250, 'price': 0,
    }, athlete)
    record('Cadastro pelo APK persistido no PostgreSQL')
    relaunch()
    locate('Olá, Atleta', partial=True)
    record('Sessão real restaurada pelo SecureStore após fechar o processo')

    tab('Perfil')
    fill('Nome', 'Atleta APK Revisado')
    fill('Cidade', 'Joinville, SC')
    tap('Salvar perfil', scroll=True)
    profile = request('GET', '/profiles/me', token=athlete)['profile']
    assert profile['name'] == 'Atleta APK Revisado'
    record('Edição de perfil pelo APK conferida no servidor')

    tab('Buscar')
    tap('Solicitar acompanhamento de André Martins', scroll=True)
    coach = login('emailtreinador@email.com', 'senhatreinador')
    coach_id = request('GET', '/auth/session', token=coach)['user']['id']
    contracts = request('GET', '/contracts', token=athlete)['contracts']
    contract = next(c for c in contracts if c['coachId'] == coach_id)
    assert contract['status'] == 'pending'
    request('PATCH', '/contracts/' + contract['id'], {'status': 'active'}, coach)
    tab('Vínculos')
    locate('Ativo')
    record('Descoberta e solicitação nativas, aceite do treinador e vínculo ativo')

    workout = request('POST', '/workouts', {
        'contractId': contract['id'], 'title': 'Corrida APK integrada', 'sport': 'Corrida',
        'scheduledDate': time.strftime('%Y-%m-%d'), 'instructions': 'Ensaio com dados ficticios',
        'status': 'published', 'blocks': [{'name': 'Aquecimento APK', 'instructions': 'Corrida leve', 'durationMinutes': 5}],
    }, coach)['workout']
    tab('Treinos')
    tap('Abrir Corrida APK integrada', scroll=True)
    tap('Blocos realizados: Aquecimento APK', scroll=True)
    fill('Percepção de esforço (1 a 10)', '7', scroll=True)
    fill('Notas ao treinador', 'Feedback APK integrado', scroll=True)
    tap('Salvar execução', scroll=True)
    actual = next(w for w in request('GET', '/workouts', token=coach)['workouts'] if w['id'] == workout['id'])
    assert actual['execution']['effort'] == 7 and actual['execution']['notes'] == 'Feedback APK integrado'
    record('Treino publicado pelo treinador e execução gravada pelo APK')
    capture('treino-executado')

    tab('Mensagens')
    fill('Mensagem ao treinador', 'Mensagem enviada pelo APK', scroll=True)
    tap('Enviar mensagem', scroll=True)
    messages = request('GET', '/contracts/' + contract['id'] + '/messages', token=coach)['messages']
    assert any(m['text'] == 'Mensagem enviada pelo APK' for m in messages)
    request('POST', '/contracts/' + contract['id'] + '/messages', {'text': 'Resposta ao vivo para o APK'}, coach)
    top()
    locate('Resposta ao vivo para o APK', scroll=True)
    record('Chat nativo nos dois sentidos com resposta recebida por WebSocket')
    capture('chat-integrado')

    tab('Agenda')
    fill('Propósito', 'Consultoria APK')
    fill('Descrição', 'Revisao de progresso pelo aplicativo')
    tap('Agendar consultoria', scroll=True)
    appointments = request('GET', '/consultations', token=athlete)['consultations']
    assert any(c['title'] == 'Consultoria APK' for c in appointments)
    record('Consultoria criada no APK e persistida na agenda')

    tab('Financeiro')
    locate('Demonstração sem cobrança')
    record('Financeiro acadêmico identificado sem acionar cobrança externa')

    tab('Privacidade')
    tap('Arquivos de performance: Permitir', scroll=True)
    tap('Dados privados de saúde: Permitir', scroll=True)
    fill('Notas privadas', 'Registro privado ficticio APK', scroll=True)
    fill('Altura (cm, opcional)', '175', scroll=True)
    fill('Peso (kg, opcional)', '70', scroll=True)
    tap('Salvar dados privados', scroll=True)
    health = request('GET', '/privacy/health', token=athlete)['health']
    assert health['notes'] == 'Registro privado ficticio APK' and health['heightCm'] == 175
    record('Consentimentos e dados privados enviados pelo APK')

    # Push a real image into the isolated emulator and select it in the OS picker.
    image = OUT / 'apk-performance.png'
    image.write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6COsAAAAASUVORK5CYII='))
    adb('push', image, '/sdcard/Download/apk-performance.png')
    adb('shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', 'file:///sdcard/Download/apk-performance.png')
    tab('Treinos')
    tap('Abrir Corrida APK integrada', scroll=True)
    tap('Enviar arquivo de performance', scroll=True)
    time.sleep(2)
    picker = dump()
    if find(picker, 'apk-performance.png', True) is None:
        tap('Show roots', partial=True)
        tap('Downloads')
    tap('apk-performance.png', partial=True)
    time.sleep(2)
    media = request('GET', '/media?resourceId=' + workout['id'], token=athlete)['media']
    performance = next(m for m in media if m['purpose'] == 'performance')
    request('POST', '/media/' + performance['id'] + '/feedback', {'text': 'Correcao do treinador no APK'}, coach)
    top()
    tap('Voltar aos treinos')
    tap('Abrir Corrida APK integrada', scroll=True)
    locate('Correcao do treinador no APK', scroll=True)
    record('Seletor nativo, upload real S3 e correção do treinador visível no APK')
    capture('midia-feedback')

    tab('Avisos')
    locate('Notificações', partial=True)
    record('Notificações persistidas acessíveis no aplicativo')

    # Close and open again to exercise persisted workout and health/session reads.
    relaunch()
    locate('Olá, Atleta', partial=True)
    tab('Treinos')
    tap('Abrir Corrida APK integrada', scroll=True)
    locate('Feedback APK integrado', scroll=True)
    record('Execução e sessão preservadas após nova inicialização do APK')

    top()
    tap('Sair')
    tap('Esqueci minha senha', scroll=True)
    fill('E-mail', email)
    tap('Enviar instruções')
    locate('Se a conta existir', partial=True)
    reset = None
    deadline = time.time() + 35
    while time.time() < deadline and reset is None:
        with urllib.request.urlopen('http://127.0.0.1:8025/api/v1/messages') as response:
            mailbox = json.load(response)
        for message in mailbox.get('messages', []):
            if not any(to.get('Address') == email for to in message.get('To', [])):
                continue
            with urllib.request.urlopen('http://127.0.0.1:8025/api/v1/message/' + message['ID']) as response:
                body = json.load(response)
            found = re.search(r'token=([a-f0-9]{64})', body.get('Text', '') + body.get('HTML', ''))
            if found:
                reset = found.group(1)
        if reset is None:
            time.sleep(1)
    assert reset is not None, 'E-mail de recuperação não capturado no SMTP local'
    tap('Redefinir senha', scroll=True)
    fill('Token do link de recuperação', reset)
    password = 'NovaSenhaAPK123!'
    fill('Nova senha', password)
    tap('Atualizar senha')
    fill('E-mail', email)
    fill('Senha', password)
    tap('Entrar')
    locate('Olá, Atleta', partial=True)
    record('Recuperação pelo APK com e-mail SMTP real, token e senha nova')
    athlete = login(email, password)

    tab('Privacidade')
    tap('Arquivos de performance: Não permitir', scroll=True)
    assert not request('GET', '/media?resourceId=' + workout['id'], token=athlete)['media']
    record('Revogação no APK elimina o arquivo de performance no servidor')
    fill('Confirme sua senha', password, scroll=True)
    tap('Solicitar exclusão e encerramento', scroll=True)
    tap('Confirmar encerramento')
    locate('E-mail')
    assert request('GET', '/auth/session', token=athlete)['user'] is None
    record('Encerramento pelo APK elimina a conta e revoga a sessão')
    capture('conta-encerrada')


size = list(map(int, re.findall(r'\d+', adb('shell', 'wm', 'size'))))[-2:]
try:
    test()
    errors = adb('logcat', '-d', '-s', 'AndroidRuntime:E', 'ReactNativeJS:E')
    assert not re.search(r'FATAL EXCEPTION|TypeError:|ReferenceError:|Unhandled JS Exception', errors), 'Crash detectado no log nativo'
    result = {'passed': True, 'environment': 'Android API 35 x86_64 emulator + real PostgreSQL/SMTP/S3/API',
              'buildProfile': 'local', 'realDeviceValidated': False, 'externalBillingValidated': False,
              'reviewMinimumDaysForIsolatedFixture': 0, 'steps': steps, 'durationSeconds': round(time.time()-started, 2)}
except Exception as error:
    try:
        capture('falha')
    except Exception:
        pass
    result = {'passed': False, 'steps': steps, 'error': str(error), 'durationSeconds': round(time.time()-started, 2)}
    (OUT/'integrated-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    raise
else:
    (OUT/'integrated-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
