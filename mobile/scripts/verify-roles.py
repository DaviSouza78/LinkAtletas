import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import time
import urllib.error

root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('android_harness', root / 'scripts/android/verify-integrated.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
h.size = list(map(int, re.findall(r'\d+', h.adb('shell', 'wm', 'size'))))[-2:]
suffix = str(int(time.time()))
password = 'SenhaNativa123!'
coach_email = 'coach-roles-' + suffix + '@example.invalid'
athlete_email = 'athlete-roles-' + suffix + '@example.invalid'


def sign_in(email, secret):
    h.fill('E-mail', email)
    h.fill('Senha', secret)
    h.tap('Entrar')
    h.locate('Sair')


def sign_out():
    h.top()
    h.tap('Sair')
    h.locate('E-mail')


def confirm(label='CONFIRMAR'):
    h.tap(label, class_name='android.widget.Button')


def profile(name, price):
    return {'name': name, 'city': 'Joinville, SC', 'bio': 'Fixture isolada do APK', 'sports': ['Corrida'], 'goals': ['Performance'], 'levels': ['Intermediário'], 'availability': ['Segunda noite'], 'mode': 'online', 'budget': 500, 'price': price}


def api_forbidden(token, method, endpoint, data=None):
    try:
        h.request(method, endpoint, data, token)
    except urllib.error.HTTPError as error:
        if error.code in (403, 404):
            return
        raise
    raise AssertionError('Operacao indevida nao foi recusada: ' + endpoint)


def run():
    h.relaunch()
    h.locate('E-mail')
    h.fill('E-mail', 'ausente-roles@example.invalid')
    h.fill('Senha', password)
    h.tap('Entrar')
    h.locate('E-mail ou senha incorretos.')
    h.record('Erro de login nativo tratado sem crash')
    h.tap('Criar conta', scroll=True)
    h.fill('Nome', 'Treinador APK Roles')
    h.tap('Tipo de conta: Treinador', scroll=True)
    h.fill('E-mail', coach_email, scroll=True)
    h.fill('Senha', password, scroll=True)
    h.tap('Criar conta', scroll=True)
    h.locate('Sair')
    coach = h.login(coach_email, password)
    coach_id = h.request('GET', '/auth/session', token=coach)['user']['id']
    h.request('PUT', '/profiles/me', profile('Treinador APK Roles', 180), coach)
    h.record('Cadastro do treinador pelo APK com papel persistido no PostgreSQL')
    h.relaunch()
    h.locate('Sair')
    h.tab('Perfil')
    h.fill('Preco mensal (R$)', '190', scroll=True)
    h.tap('Salvar perfil', scroll=True)
    h.eventually(lambda: h.request('GET', '/profiles/me', token=coach)['profile']['price'] == 190, 'Preco profissional nao persistido')
    h.fill('CREF', '012345-G/SC', scroll=True)
    h.fill('Evidencia profissional', 'Registro ficticio para conferencia do ensaio isolado', scroll=True)
    h.tap('Enviar para analise', scroll=True)
    verification = h.eventually(lambda: h.request('GET', '/verifications', token=coach)['verifications'], 'CREF nao submetido')[0]
    h.record('Sessao restaurada, preco editado e CREF enviado pelo treinador no APK')
    h.capture('roles-coach-cref-pendente')
    sign_out()
    sign_in('admin@linkatletas.local', 'SenhaAdmin123!')
    admin = h.login('admin@linkatletas.local', 'SenhaAdmin123!')
    h.tab('CREF')
    h.fill('Justificativa da decisao', 'Conferencia ficticia do ensaio nativo', scroll=True)
    h.tap('Aprovar', scroll=True)
    confirm()
    h.eventually(lambda: h.request('GET', '/profiles/me', token=coach)['profile']['verificationStatus'] == 'approved', 'CREF nao aprovado')
    h.record('Administrador aprova CREF pelo APK com auditoria e efeito no perfil')
    h.capture('roles-admin-cref-aprovado')
    h.tab('Regras financeiras')
    h.fill('Comissao da plataforma (%)', '12', scroll=True)
    h.fill('Carencia (dias)', '4', scroll=True)
    h.tap('Salvar regras', scroll=True)
    confirm()
    h.eventually(lambda: h.request('GET', '/billing/config', token=admin)['commissionBps'] == 1200, 'Regras financeiras nao persistidas')
    h.record('Administrador altera comissao e carencia pelo APK em modo academico')
    h.tab('Pedidos de privacidade')
    h.locate('Pedidos de privacidade')
    h.tab('Avisos')
    h.locate('Notificações', partial=True)
    h.record('Administrador acessa pedidos de privacidade e notificacoes pelo APK')
    sign_out()
    h.tap('Criar conta', scroll=True)
    h.fill('Nome', 'Atleta APK Roles')
    h.fill('E-mail', athlete_email, scroll=True)
    h.fill('Senha', password, scroll=True)
    h.tap('Criar conta', scroll=True)
    h.locate('Sair')
    athlete = h.login(athlete_email, password)
    athlete_id = h.request('GET', '/auth/session', token=athlete)['user']['id']
    h.request('PUT', '/profiles/me', profile('Atleta APK Roles', 0), athlete)
    h.tab('Buscar')
    h.fill('Buscar por nome', 'Treinador APK Roles')
    h.tap('Solicitar acompanhamento de Treinador APK Roles', scroll=True)
    contract = h.eventually(lambda: h.request('GET', '/contracts', token=athlete)['contracts'], 'Solicitacao nao persistida')[0]
    h.record('Atleta encontra treinador aprovado e solicita vinculo pelo APK')
    sign_out()
    sign_in(coach_email, password)
    h.tab('Vínculos')
    h.tap('Aceitar solicitacao', scroll=True)
    confirm('ACEITAR')
    h.eventually(lambda: h.request('GET', '/contracts', token=athlete)['contracts'][0]['status'] == 'active', 'Vinculo nao aceito')
    h.record('Treinador aceita vinculo pelo APK e atleta ve estado ativo na API')
    h.tab('Treinos')
    h.tap('Novo treino', scroll=True)
    h.fill('Titulo do treino', 'Ficha APK Roles', scroll=True)
    h.fill('Nome do exercicio 1', 'Corrida leve', scroll=True)
    h.fill('Duracao (min) 1', '15', scroll=True)
    h.tap('Publicar treino', scroll=True)
    workout = h.eventually(lambda: next((item for item in h.request('GET', '/workouts', token=athlete)['workouts'] if item['title'] == 'Ficha APK Roles'), None), 'Treino nao publicado')
    h.record('Treinador prescreve e publica treino com bloco pelo APK')
    h.capture('roles-coach-treino-publicado')
    h.tab('Financeiro')
    h.fill('Nome do plano', 'Plano APK Roles', scroll=True)
    h.fill('Mensalidade (R$)', '190', scroll=True)
    h.tap('Salvar plano', scroll=True)
    h.eventually(lambda: h.request('GET', '/billing/plan', token=coach)['plan']['amountCents'] == 19000, 'Plano nao salvo')
    h.record('Treinador configura plano pelo APK sem cobranca externa')
    sign_out()
    sign_in(athlete_email, password)
    h.tab('Treinos')
    h.tap('Abrir Ficha APK Roles', scroll=True)
    h.tap('Blocos realizados: Corrida leve', scroll=True)
    h.fill('Percepção de esforço (1 a 10)', '6', scroll=True)
    h.fill('Notas ao treinador', 'Feedback real do APK Roles', scroll=True)
    h.tap('Salvar execução', scroll=True)
    h.eventually(lambda: next(item for item in h.request('GET', '/workouts', token=coach)['workouts'] if item['id'] == workout['id'])['execution'] is not None, 'Execucao nao persistida')
    h.record('Atleta executa treino nativo com retorno disponivel ao treinador')
    h.tab('Mensagens')
    h.fill('Mensagem ao treinador', 'Chat do atleta APK Roles', scroll=True)
    h.tap('Enviar mensagem', scroll=True)
    h.eventually(lambda: any(item['text'] == 'Chat do atleta APK Roles' for item in h.request('GET', '/contracts/' + contract['id'] + '/messages', token=coach)['messages']), 'Mensagem nao persistida')
    h.record('Atleta envia mensagem nativa com leitura autorizada pelo treinador')
    h.tab('Avaliações')
    h.fill('Sua experiência', 'Acompanhamento APK Roles aprovado', scroll=True)
    h.tap('Publicar avaliação', scroll=True)
    review = h.eventually(lambda: h.request('GET', '/reviews?coachId=' + coach_id, token=coach)['reviews'], 'Avaliacao nao criada')[0]
    h.record('Atleta publica avaliacao pelo APK na fixture com carencia isolada')
    sign_out()
    sign_in(coach_email, password)
    h.tab('Avaliações')
    h.fill('Resposta ao atleta', 'Resposta do treinador APK Roles', scroll=True)
    h.tap('Salvar resposta', scroll=True)
    h.eventually(lambda: h.request('GET', '/reviews?coachId=' + coach_id, token=athlete)['reviews'][0]['reply'] == 'Resposta do treinador APK Roles', 'Resposta nao persistida')
    h.record('Treinador responde avaliacao pelo APK')
    h.tab('Mensagens')
    h.locate('Chat do atleta APK Roles', scroll=True)
    h.fill('Mensagem ao treinador', 'Resposta nativa do treinador Roles', scroll=True)
    h.tap('Enviar mensagem', scroll=True)
    h.eventually(lambda: any(item['text'] == 'Resposta nativa do treinador Roles' for item in h.request('GET', '/contracts/' + contract['id'] + '/messages', token=athlete)['messages']), 'Resposta de chat nao persistida')
    h.record('Treinador conversa pelo APK com identidade e contraparte corretas')
    sign_out()
    sign_in('admin@linkatletas.local', 'SenhaAdmin123!')
    h.tab('Moderacao')
    h.fill('Justificativa da moderacao', 'Ocultacao ficticia do ensaio APK', scroll=True)
    h.tap('Ocultar avaliacao', scroll=True)
    confirm()
    h.eventually(lambda: any(item['id'] == review['id'] and item['hidden'] for item in h.request('GET', '/admin/reviews', token=admin)['reviews']), 'Moderacao nao persistida')
    h.record('Administrador oculta avaliacao pelo APK com justificativa')
    h.capture('roles-admin-moderacao')
    api_forbidden(athlete, 'GET', '/admin/verifications')
    api_forbidden(coach, 'GET', '/admin/privacy/requests')
    api_forbidden(athlete, 'POST', '/workouts', {'contractId': contract['id'], 'title': 'Indevido', 'sport': 'Corrida', 'scheduledDate': time.strftime('%Y-%m-%d'), 'instructions': '', 'status': 'draft', 'blocks': [{'name': 'Bloco', 'instructions': ''}]})
    api_forbidden(admin, 'GET', '/contracts/' + contract['id'] + '/messages')
    h.record('API real recusa acessos cruzados de atleta treinador e administrador')
    errors = h.adb('logcat', '-d', '-s', 'AndroidRuntime:E', 'ReactNativeJS:E')
    if re.search(r'FATAL EXCEPTION|TypeError:|ReferenceError:|Unhandled JS Exception', errors):
        raise AssertionError('Erro nativo detectado no log do aplicativo')


try:
    run()
except Exception as error:
    try:
        h.capture('roles-falha')
    except Exception:
        pass
    result = {'passed': False, 'steps': h.steps, 'error': str(error), 'testCommit': os.getenv('GITHUB_SHA')}
    (h.OUT / 'roles-result.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    raise
else:
    result = {'passed': True, 'steps': h.steps, 'testCommit': os.getenv('GITHUB_SHA'), 'apkSourceRun': os.getenv('APK_SOURCE_RUN'), 'apkSha256': hashlib.sha256(Path('android-local/LinkAtletas-local.apk').read_bytes()).hexdigest(), 'roles': ['athlete', 'coach', 'admin'], 'environment': 'Android API 35 emulator with isolated real API/PostgreSQL', 'googleOAuthRealValidated': False, 'realDeviceValidated': False, 'externalBillingValidated': False, 'durationSeconds': round(time.time() - h.started, 2)}
    (h.OUT / 'roles-result.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(result, indent=2, ensure_ascii=False))
