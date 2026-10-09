# Validação do bootstrap — PingoFin

Execução local em 05/10/2026, Windows/PowerShell 7. Escopo: fundação técnica executável, sem módulos financeiros, IA, billing ou integrações. Requisitos, versões efetivas e comandos reproduzíveis estão no [README](../README.md).

## Ambiente e instalação

| Verificação executada | Resultado observado |
| --- | --- |
| PHP e extensões / Composer `check-platform-reqs` | PHP 8.5.8; PDO MySQL, curl, zip e requisitos do lockfile disponíveis com ini local |
| Instalador Composer / distribuição Node | SHA384 do instalador e SHA256 do ZIP oficial conferidos antes da execução |
| `setup-tools.ps1` e `configure-local.ps1` repetidos | Composer 2.10.3 instalado; arquivos locais existentes preservados, sem exibir segredos |
| Composer `install` pelo lockfile | Dependências instaladas; repetição não alterou o lockfile |
| Composer `validate --strict` | Passou |
| Composer `audit` | Nenhum aviso de segurança |
| npm `ci --strict-peer-deps --no-fund` | Instalação limpa passou com Node 24.21.0 / npm 11.19.0; postinstall Nuxt prepare passou |
| Docker daemon e `compose up -d --wait` | Daemon respondeu; containers exclusivos MySQL/Redis ficaram healthy |
| Serviços reais | MySQL 8.4.11 e Redis 8.2.10; imagens fixadas por digest |
| Conexão Laravel → MySQL | Consulta real confirmou `pingofin_dev`, timezone `+00:00`; aplicação em UTC |
| Schema real | Somente `users`, `sessions`, `organizations`, `organization_user`, `failed_jobs` e tabela técnica `migrations`; todas InnoDB |
| Redis pelo Laravel | PING retornou PONG |
| Migrations / `migrate:status` | Três migrations aplicadas, todas com estado Ran |
| Fixtures | Seeder restrito a local/`pingofin_dev`; duas organizações sintéticas e papéis diferentes no vínculo |
| Git ignore | Ambientes locais, ferramentas, dependências e builds ignorados; exemplos, lockfiles e referência do Pingo preservados |

MySQL e Redis usam volumes exclusivos do projeto. O banco descartável `pingofin_test` e os namespaces Redis de teste são separados do desenvolvimento. A proteção de `Tests\TestCase` verifica driver e nome do banco antes de migrations. Nenhum serviço compartilhado foi parado para simular falhas.

## Backend

`../scripts/php.ps1 artisan test` passou: **11 testes, 49 assertions**, usando MySQL real. O resultado foi confirmado novamente após o ajuste que restaura a configuração original da conexão ao finalizar o teste de falha.

Os testes cobrem:

- Ausência de sessão → 401 e contrato de erro; bearer não habilita autenticação por tokens.
- Contexto ausente/inválido → 422; organização sem vínculo → 404; organização autorizada → 200.
- Contexto limpo ao terminar a request e ausência de papel global em User.
- ADMIN em um vínculo e OPERATOR em outro; remoção do vínculo revoga acesso.
- Constraint única do vínculo e InnoDB conferidos no MySQL.
- CSRF exigido com middleware estrito, inclusive em teste; login sem token → 419.
- Inicialização CSRF, login com regeneração de sessão, leitura autenticada e logout que invalida a sessão persistida; acesso posterior → 401.
- Credenciais inválidas → 422; limitação de tentativas → 429.
- Health real positivo, falha controlada do Redis → 503/degraded e login ainda operacional.
- Falha controlada do MySQL → 503/unavailable, inclusive com Origin do frontend; liveness permanece 200.

Falhas de conectividade foram simuladas alterando apenas as conexões da aplicação de teste para uma porta indisponível. A configuração é restaurada; não foi usado Redis falso nem SQLite.

Também passaram a verificação de sintaxe de **44 arquivos PHP** e `vendor/bin/pint --test`. Não existe etapa fictícia de build PHP.

### HTTP e cookies reais

O servidor Laravel iniciou em `http://localhost:8000`. Requisições HTTP confirmaram:

- GET `/api/v1/health/live` → 200/alive.
- GET `/api/v1/health`, com Origin do frontend → 200/ready, application/mysql/redis up.
- GET `/sanctum/csrf-cookie` → 204; cookie de sessão HttpOnly, cookie XSRF acessível ao cliente.
- GET `/api/v1/auth/me` sem sessão → 401.
- POST login com Origin local e sem CSRF → 419.
- CORS permite exatamente `http://localhost:3000`, com credentials; sem wildcard.

Secure permanece desabilitado apenas no ambiente HTTP local. HTTPS, cookies Secure, domínio e topologia de produção continuam fora desta validação.

### Worker real

Um processo separado executou:

```powershell
../scripts/php.ps1 artisan queue:work redis '--queue=bootstrap-smoke,default' --sleep=1 --tries=2 --timeout=30
```

`../scripts/php.ps1 artisan infra:queue-smoke` confirmou consumo assíncrono real. A execução `877642bd-50ad-4c70-82d3-3149ef6d55cf` foi processada pelo worker, que registrou DONE em aproximadamente 125ms. O comando observou e removeu o marcador identificado; o marcador também tem TTL. Não foi usado Queue::fake nem endpoint público para publicar jobs.

## Frontend

Após a instalação limpa, passaram novamente:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Passou |
| `npm run lint` | Passou, sem erros ou warnings de lint |
| `npm test` | 7 testes passaram |
| `npm run build` | Build Nuxt/Nitro gerado com sucesso |
| `npm run format:check` | Passou; confirmado também após corrigir o script de preview |
| `npm run dev` | Servidor iniciou em localhost:3000 |
| `npm run preview` | Build iniciou em loopback na porta 3000 |

Os sete testes provam resolução light/dark/system e prioridade explícita, cancelamento de requests/recusa de respostas antigas, credentials/CSRF/contexto enviados pelo cliente HTTP e rejeição de respostas 401, 419, 422 e 503. Stubs unitários nesses contratos complementam os fluxos reais descritos abaixo.

### Navegador e inspeção visual

Validação pelo navegador, com frontend e backend em origens distintas por porta:

- Login claro e escuro com labels persistentes; tentativa inválida exibiu erro e estados de envio, sem sucesso fictício.
- Login com fixture local autenticou por cookies; reload manteve a sessão.
- Nenhuma organização foi escolhida automaticamente. Seleção de A mostrou Administrador desta organização; B mostrou Operador desta organização.
- Shell claro/escuro em desktop e viewport de 320px; sem overflow horizontal observado.
- Menu mobile abriu com foco dentro do dialog; Escape fechou e restaurou o foco ao botão Abrir menu.
- Tema Sistema resolveu para light no ambiente atual, com `data-theme` e `color-scheme` coerentes. Resolução para ambos os estados do sistema também foi testada em unidade; não foi simulada uma mudança real do tema do Windows.
- Diagnóstico de desenvolvimento exibiu a resposta real de health usando a camada de serviços no navegador.
- Logout redirecionou ao login; tentar abrir a área protegida novamente exigiu autenticação.
- O build de distribuição também completou login/contexto/logout. `/dev/diagnostics` exibiu **404 no cliente**, sem executar o diagnóstico; a aplicação usa CSR, portanto isso não equivale a uma rota HTTP 404 renderizada pelo servidor.

Capturas locais, somente com fixtures sintéticas e sem credenciais:

- [Shell claro desktop](./validation/shell-light.png)
- [Shell escuro desktop](./validation/shell-dark.png)
- [Shell escuro em 320px](./validation/shell-mobile-dark.png)

O viewport temporário do navegador foi restaurado ao terminar a inspeção. O preview foi encerrado e o servidor de desenvolvimento reiniciado.

## Preservação e limites

Os documentos de planejamento e a prancha oficial foram preservados. SHA256 da prancha original: `268B582E5A0FD8E7EB8C1016061358BD8559E79F4FAAF2A586072C8DA718825A`, igual ao anexo fornecido. Não houve recorte, geração de personagem, variante ou animação. A referência Figma foi somente lida; sua identidade e extras não foram copiados, nem o arquivo foi editado.

Primitivos e tabelas semânticas/status foram materializados diretamente de DESIGN_SYSTEM: 17 primitivos e 31 tokens por tema. Fonte definitiva continua TBD; usa-se fallback substituível. SSR autenticado, domínio/sessão definitivos, UX final e assets aprovados continuam abertos. As escolhas operacionais provisórias estão identificadas no README.

`npm audit` continua reportando **11 entradas high transitivas, propagadas de dois avisos upstream**, de braces e node-forge. As versões mais recentes consultadas ainda eram as afetadas. Não foi aplicado o downgrade incompatível sugerido automaticamente, nem desativado TLS, auditoria ou validação de dependências. Os avisos e links estão no [README](../README.md#pendências-verificadas). Esta entrega não declara a stack livre de vulnerabilidades ou pronta para produção.

O npm também avisou sobre scripts de instalação de esbuild/unrs-resolver ainda não cobertos por allowScripts; a instalação e o build real passaram, sem contornar esse controle. O build emitiu DEP0155 transitivo de @vue/shared. Esses avisos não foram ocultados.

VPS, Nginx/PHP-FPM, HTTPS e operação Linux não foram configurados nem validados. Windows não oferece pcntl; timeouts e supervisão futuros do worker exigem validação no ambiente de produção escolhido.

Não foram implementados módulos financeiros ou IA, nem feitos commit, push ou deploy. A etapa encerra na fundação local validada, com as pendências de segurança e os TBDs explicitamente registrados.
