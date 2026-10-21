# APK Android conectado ao computador

Revisão de 21/10/2026. O perfil `local` gera **LinkAtletas Local**, pacote `br.edu.linkatletas.app.local`, com JavaScript incluído no APK. Não precisa de Metro/Expo Go, conta Expo, domínio público ou pagamento para demonstrar o fluxo acadêmico.

## Executar no Windows e conectar por USB

1. Na pasta `C:\dev\projects\LinkAtletas`, iniciar Docker e executar:

```powershell
docker compose up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev:all
```

2. Manter esse terminal aberto. Web: [localhost:5173](http://localhost:5173); API: [saúde](http://localhost:3001/api/health). Se já estiverem funcionando, não iniciar outra cópia nas mesmas portas.
3. No Android, habilitar opções do desenvolvedor/depuração USB, conectar o cabo e autorizar esse computador na tela do aparelho. Em outro terminal:

```powershell
cd C:\dev\projects\LinkAtletas
pnpm mobile:connect --install "C:\dev\output\LinkAtletas-APK-local-revisado\LinkAtletas-local.apk"
```

O comando verifica a saúde da API, encontra o ADB instalado, confirma o aparelho autorizado, instala o arquivo indicado, configura `adb reverse tcp:3001 tcp:3001` e abre o aplicativo. Se houver vários dispositivos, acrescentar `--serial <identificador>`; se o APK já estiver instalado, omitir `--install`. Para outra porta da API, definir `API_PORT` antes do comando. Ao reconectar/reiniciar o aparelho, executar `pnpm mobile:connect` novamente.

O APK também será disponibilizado na publicação da revisão; substituir o caminho por aquele em que ele foi baixado. As [contas fictícias](manual.md) funcionam após o seed. Preferir criar um atleta de teste e usar a web para o treinador/administrador; o cliente nativo é do atleta.

## Segurança e limites

O perfil local aceita HTTP somente em `localhost`, `127.0.0.1` e `10.0.2.2`; não libera tráfego claro para toda a rede. O endereço `localhost:3001` no aparelho chega ao computador pelo túnel USB. O backend permanece vinculado ao computador; não é necessário abrir firewall ou publicar banco/S3. Usar somente dados fictícios nesse perfil.

O perfil normal exige `EXPO_PUBLIC_API_URL` HTTPS e rejeita domínios documentais `.example`. Compilar com outra URL exige novo APK; variáveis públicas não podem conter segredos. O pacote local é separado do pacote normal e a assinatura usada é de desenvolvimento, inadequada para publicação nas lojas.

## Reproduzir o teste que exercita o APK

O workflow `Android emulator smoke`, opção `integrated=true`, chama [android-integrated.yml](../../.github/workflows/android-integrated.yml). Sem `apk_run_id`, compila um APK novo; com esse campo preenchido, testa exatamente o artefato daquele build. `build_only=true` compila sem iniciar o emulador. `test_focus=all` executa o roteiro completo; `test_focus=workout` serve apenas para diagnóstico isolado do login/ficha e não comprova o fluxo inteiro. O ensaio usa Android API 35 e serviços reais PostgreSQL, SMTP e S3 em banco isolado `_test`.

O [roteiro automatizado](../../scripts/android/verify-integrated.py) executa ações no APK e consulta o servidor para conferir persistência; ações de treinador e algumas preferências iniciais são fixtures via API. A regra de avaliação usa zero dias somente nesse banco de teste; a configuração normal mantém sete dias. Resultados e limites estão na [verificação móvel](evidencias/mobile-verificacao.md).

Não havia aparelho físico conectado ao ADB nesta revisão. Teste em emulador não certifica todas as versões/fabricantes, acessibilidade manual, iPhone/iPad nem publicação nas lojas.
