# Referência histórica do monorepo

Os comandos deste documento usam a estrutura anterior. Para a organização vigente, leia [README](../README.md) e [MIGRACAO_REPOSITORIOS](../MIGRACAO_REPOSITORIOS.md).

# PingoFin

SaaS de gestão financeira simples para pequenos negócios, com validação inicial em autoescolas.

O bootstrap técnico, a interface local do Pingo, a administração inicial da plataforma (cadastro de empresas clientes) e a primeira versão de clientes, categorias, receitas, recebimentos, despesas e pagamentos estão implementados. O dashboard usa dados reais, o login abre diretamente a empresa única e o cadastro financeiro permite quitação à vista. Integração de IA aguarda etapa futura. Referências visuais usam dados explicitamente ilustrativos.

- [Definição do produto — MVP v0.1](../DEFINICAO_PRODUTO.md)
- [Arquitetura técnica](../ARCHITECTURE.md)
- [Direção visual e design core — claro/escuro](../DESIGN_SYSTEM.md)
- [Referência oficial do Pingo](./assets/pingo-referencia.jpg)
- [Guia para agentes](./LEGACY_AGENT_GUIDE.md)
- [Histórico obrigatório de alterações dos agentes](./AGENT_CHANGE_LOG.md)
- [Kanban interno do projeto (ferramenta temporária)](./INTERNAL_KANBAN.md)
- [Referências visuais, gráficos e imagens individuais](./referencias-visuais/README.md)
- [Validação da administração da plataforma](./PLATFORM_ADMIN_VALIDATION.md)
- [Validação das tarefas 01/02 antes do envio](./FINANCE_RELEASE_VALIDATION.md)

## Fundação atual

```text
frontend/              Nuxt: login, shell, contexto e temas
  app/design-core/     Primitivos, semânticos, tipografia e aliases
  app/services/        HTTP, sessão e diagnóstico
  app/composables/     Estado por aplicação com useState
backend/               Laravel REST /api/v1, Sanctum e Policies
  app/Support/         OrganizationContext por request e PasswordPolicy
  app/Actions/Platform Provisionamento transacional de empresa + primeiro ADMIN
  app/Actions/Financial Criação de receita e baixa, transacionais e auditadas
  app/Queries/         Leitura de receitas com recebido/restante calculados
  app/Jobs/            Smoke test técnico de fila
  database/migrations/ Users, sessions, organizations, vínculo, failed_jobs e financeiro
infra/mysql/           Inicialização do banco de testes
scripts/               Ferramentas e configuração local no Windows
docs/                  Planejamento, referência oficial e validação
compose.yaml           Somente MySQL e Redis
```

Existe também uma ferramenta interna e temporária, o **Kanban do projeto** (`/kanban`), fora do produto dos clientes: desabilitada por padrão, habilitada por `INTERNAL_KANBAN_ENABLED`, restrita às contas master da plataforma e sem vínculo com organizações. Veja [como habilitar, autorizar e remover](./INTERNAL_KANBAN.md).

O administrador master tem acesso ao **histórico de alterações** em `/plataforma/alteracoes`. A fonte única é `frontend/data/agent-changes.json`, sem armazenamento de logs em banco. Resumos têm até 300 caracteres; mudanças complexas possuem um objeto de detalhes. O servidor Nuxt verifica a sessão master antes de entregar o JSON, que permanece fora dos arquivos públicos e do bundle do navegador. Toda tarefa de agente que alterar o projeto deve registrar uma nova entrada; instruções e trava de commit estão no [guia do histórico](./AGENT_CHANGE_LOG.md).

O financeiro implementado está descrito em [Clientes, categorias, receitas e recebimentos](#clientes-categorias-receitas-e-recebimentos-primeira-versão), [Despesas e pagamentos](#despesas-e-pagamentos-primeira-versão) e [Dashboard básico](#dashboard-básico-com-números-reais). Não há IA conectada, billing ou integrações. A galeria de desenvolvimento contém gráficos com dados sintéticos identificados como exemplos, independentes de uma organização. Não há cadastro público, convites, recuperação de senha, gestão completa de equipe nas empresas ou emissão de tokens pessoais.

## Requisitos e escolhas operacionais

Ambiente validado em Windows com PowerShell 7, PHP nativo e Node portável. Docker Desktop já instalado fornece somente MySQL/Redis; não há aplicação containerizada, Nx, Turborepo ou Supervisor local.

| Ferramenta                 | Versão efetiva                                                                |
| -------------------------- | ----------------------------------------------------------------------------- |
| PHP                        | 8.5.8, com BCMath disponível e PDO MySQL, curl e zip habilitados no ini local |
| Composer                   | 2.10.3, PHAR local com instalador verificado por SHA384                       |
| Node / npm                 | 24.21.0 / 11.19.0, distribuição oficial portável verificada por SHA256        |
| Nuxt / Vue / Vue Router    | 4.5.2 / 3.5.43 / 5.3.1                                                        |
| TypeScript / Tailwind      | 5.9.3 / 4.3.3                                                                 |
| Laravel / Sanctum / Predis | 13.34.0 / 4.3.3 / 3.6.1                                                       |
| MySQL / Redis              | 8.4.11 / 8.2.10, imagens fixadas por digest                                   |
| ESLint / Prettier / Vitest | 10.12.0 / 3.9.9 / 4.1.11                                                      |
| PHPUnit / Pint             | 12.5.38 / 1.32.1                                                              |

Laravel 13 é compatível com o PHP disponível, conforme a [política oficial de suporte](https://laravel.com/framework/docs/13.x/releases). O manifest usa PHP `^8.5` para acompanhar a plataforma efetivamente validada; isso não fixa a decisão definitiva de runtime do produto. Nuxt 4 segue seus [requisitos oficiais](https://nuxt.com/docs/4.x/getting-started/installation); Node nativo 24.14.1 não atende a um requisito transitivo do lint, por isso usamos 24.21.0 local sem atualizar a instalação global. Vue Router 5 acompanha o requisito real do Nuxt escolhido.

Tailwind 4 usa o [plugin oficial Vite para Nuxt](https://tailwindcss.com/docs/installation/framework-guides/nuxt), com cores/medidas próprias. MySQL usa a [linha 8.4 LTS](https://dev.mysql.com/doc/refman/8.4/en/). Redis e Predis evitam depender de uma extensão Redis PHP ausente no Windows. Sessões ficam no MySQL; cache e fila, no Redis. Rate limiting de login usa arquivos locais para funcionar durante uma falha auxiliar do Redis. Para múltiplos servidores futuros, reavaliar esse armazenamento dos limites.

Estas são escolhas operacionais do bootstrap. Fonte definitiva, branding final, assets isolados do Pingo, domínio de produção, duração definitiva de sessão, renderização final e infraestrutura do VPS permanecem TBD.

## Instalação local no Windows

Use PowerShell 7 e PHP 8.5 no PATH, com BCMath disponível para os cálculos monetários exatos. O Composer exige `ext-bcmath` e recusa a instalação sem ela. Inicie o Docker Desktop e confirme `docker info` com resposta do servidor. Ter apenas o executável Docker não basta. Os scripts abaixo não alteram o PHP ou o Node globais.

Na raiz:

```powershell
Set-Location E:\Projects\sistemafinanceiro
./scripts/setup-tools.ps1
./scripts/setup-node.ps1
Set-Location backend
../scripts/composer.ps1 install
Set-Location ../frontend
../scripts/npm.ps1 ci
Set-Location ..
./scripts/configure-local.ps1
docker compose up -d --wait --wait-timeout 180
Set-Location backend
../scripts/php.ps1 artisan migrate --no-interaction
../scripts/php.ps1 artisan migrate:status
../scripts/php.ps1 artisan db:seed --class=DevelopmentSeeder --no-interaction
```

Composer usa TLS e CA local; o instalador e o Node são verificados antes da execução. Ferramentas baixadas ficam em `.tools/`, ignorado pelo Git. Em um checkout situado em outro diretório, ajuste somente o `Set-Location` inicial.

`configure-local.ps1` cria arquivos ausentes, gera senhas aleatórias para a infraestrutura e fixtures e gera `APP_KEY`. Preserva arquivos locais existentes e não imprime segredos. Não copie `.env` entre máquinas nem publique sua chave. Configure manualmente valores existentes quando necessário.

| Arquivo                                         | Responsabilidade                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `.env.example` → `.env` na raiz                 | Senhas apenas da infraestrutura local                              |
| `backend/.env.example` → `.env`                 | API, MySQL, sessão, CORS, Redis/fila/cache e fixture local         |
| `backend/.env.testing.example` → `.env.testing` | Banco MySQL e namespace Redis exclusivos para testes               |
| `frontend/.env.example` → `.env`                | `NUXT_PUBLIC_API_BASE` e `NITRO_HOST=localhost` para preview local |

Os exemplos não contêm segredos ou configurações de providers de IA. `.env`, caches, builds, logs, dependências e ferramentas locais são ignorados; exemplos e lockfiles devem ser preservados.

### Bancos e fixtures

MySQL escuta em `127.0.0.1:3307`; Redis, em `127.0.0.1:6380`. Essas conexões internas não definem hostnames de cookies. Os volumes são exclusivos do projeto `pingofin-bootstrap`.

`pingofin_dev` guarda o desenvolvimento. `pingofin_test` é descartável, criado por `infra/mysql/init.sh` somente na primeira inicialização do volume. O usuário local `pingofin` acessa apenas esses bancos. Se usar um MySQL existente, crie ambos e suas permissões explicitamente; nunca apague dados ou volumes para contornar um erro de configuração.

Os testes recusam qualquer conexão default diferente de MySQL ou banco diferente de `pingofin_test` antes de executar migrations. Usam `RefreshDatabase` apenas nesse banco dedicado. Não rode `migrate:fresh` sobre bancos existentes não identificados como descartáveis.

O seeder recusa ambientes diferentes de `local` ou banco diferente de `pingofin_dev`. Cria duas organizações sintéticas e uma conta por empresa (ADR-028), ambas com a senha **local** `DEV_USER_PASSWORD` do arquivo ignorado: `dev@pingofin.test` (ADMIN em A) e `operador@pingofin.test` (OPERATOR em B). Fixtures antigas ligavam `dev@` às duas empresas; reexecutar o seeder move o vínculo sintético de B para `operador@`. Não existe senha padrão ou usuário de produção. Para consultar a senha, abra seu próprio `backend/.env`; não a inclua em relatórios ou screenshots.

Fixtures não criam conta master: use `platform:create-master` (seção abaixo). Aplicação/conexão MySQL usam UTC; tabelas usam InnoDB. Organizações carregam timezone IANA, inicialmente `America/Sao_Paulo`. Os módulos financeiros implementados estão descritos nas seções seguintes.

## Iniciar e acessar

Mantenha MySQL/Redis ativos. Abra três terminais:

```powershell
# Terminal 1 — API
Set-Location E:\Projects\sistemafinanceiro\backend
../scripts/php.ps1 artisan serve --host=localhost --port=8000

# Terminal 2 — frontend
Set-Location E:\Projects\sistemafinanceiro\frontend
../scripts/npm.ps1 run dev

# Terminal 3 — worker
Set-Location E:\Projects\sistemafinanceiro\backend
../scripts/php.ps1 artisan queue:work redis '--queue=bootstrap-smoke,default' --sleep=1 --tries=2 --timeout=30
```

- [Aplicação/login](http://localhost:3000/login)
- [Liveness](http://localhost:8000/api/v1/health/live): processo Laravel respondeu, sem depender de sessão/banco.
- [Readiness](http://localhost:8000/api/v1/health): executa `SELECT 1` MySQL e `PING` Redis; retorna 200 somente se ambos responderem, 503 em degradação/falha.
- [Diagnóstico de desenvolvimento](http://localhost:3000/dev/diagnostics): exige sessão, chama a API pelo navegador e só está disponível no servidor de desenvolvimento. Não integra a navegação cotidiana.

O health não expõe credenciais, hostnames internos ou stack traces. Falha no Redis não impede login ou consultas básicas de sessão/contexto no MySQL. Healths não executam o middleware stateful de sessão, inclusive quando recebem Origin do frontend.

Para comprovar o worker, em outro terminal no backend:

```powershell
../scripts/php.ps1 artisan infra:queue-smoke
```

O comando publica um job Redis técnico, aguarda confirmação identificada por UUID durante até 20s e remove seu marcador. O marcador também expira em 120s; o job permite no máximo duas tentativas e não cria dados de negócio. Não há endpoint de execução arbitrária de jobs. A conexão Redis publica após commit. Workers locais não dependem de Supervisor; Windows não fornece `pcntl`, portanto os futuros jobs devem ter timeouts próprios de I/O e ser revalidados em Linux antes da produção.

Pare servidores/workers com Ctrl+C. Para parar apenas a infraestrutura deste projeto, use `docker compose stop`; não use `down -v` para reiniciar o desenvolvimento, pois remove os volumes.

## Sessão e organização

O cliente HTTP central em `services/http.ts` usa `credentials: include`, `Accept: application/json`, CSRF inicializado pelo Sanctum e `X-XSRF-TOKEN` decodificado. Login regenera a sessão; logout invalida e renova CSRF. Erros 401, 419, 422 e 429 não são sucessos. Somente logout pode repetir uma vez após reinitializar CSRF, por ser uma operação segura/idempotente; falha na repetição permanece um erro.

| Operação                    | Endpoint                                       |
| --------------------------- | ---------------------------------------------- |
| Inicializar CSRF            | GET `/sanctum/csrf-cookie`                     |
| Entrar                      | POST `/api/v1/auth/login`                      |
| Ler usuário e seus vínculos | GET `/api/v1/auth/me`                          |
| Sair                        | POST `/api/v1/auth/logout`                     |
| Ler contexto autorizado     | GET `/api/v1/context`; `X-Organization-Id` opcional |

**Uma empresa por conta (ADR-028).** O login da empresa leva direto à Visão geral: o servidor resolve o contexto pelo vínculo único da conta, sem tela de seleção nem seletor na navegação; o nome da empresa aparece só como informação. `X-Organization-Id` é opcional; se enviado, precisa coincidir com esse vínculo (formato inválido 422; outra empresa 404, sem revelar existência). `/auth/me` informa `access` (`ok`, `none`, `multiple`, `suspended`, `platform`) e `organization`.

Conta sem vínculo, com empresa suspensa ou com vínculo em mais de uma empresa (legado) recebe 403 `ORGANIZATION_NONE`, `ORGANIZATION_SUSPENDED` ou `ORGANIZATION_AMBIGUOUS`: no login a mensagem aparece na própria tela e nenhuma sessão é criada; com a sessão aberta (vínculo revogado, suspensão), a interface vai para `/acesso-indisponivel`, que oferece "Tentar novamente" e "Sair" e só volta ao início quando a API confirma o acesso, sem loop. Master entrando por `/login` segue para `/plataforma`.

Vínculos legados nunca são resolvidos escolhendo a primeira empresa. Para listar e ajustar, a partir de `backend/`:

```powershell
../scripts/php.ps1 artisan platform:legacy-memberships
../scripts/php.ps1 artisan platform:legacy-memberships --email=pessoa@exemplo.test --keep=<ID da empresa>
```

O ajuste pede confirmação, remove apenas os vínculos excedentes (empresas, contas e dados de negócio são preservados), avisa se uma empresa ficou sem ADMIN e registra `platform.legacy_membership_resolved` no log técnico. O painel da plataforma marca essas pessoas na lista de acessos da empresa. Os cadastros da plataforma criam somente contas novas, sempre de empresa única. Uma constraint única no banco para `organization_user.user_id` fica para depois da limpeza dos legados. Policy verifica contexto/vínculo. ADMIN pertence à organização, nunca ao usuário global.

`OrganizationContext` é scoped e limpo ao terminar a request. Para futuras entidades tenant-owned, consultas e bindings deverão filtrar pelo ID desse contexto autorizado; Policies deverão conferir ownership e capacidade no vínculo, e referências deverão ter constraints correspondentes. Não existem essas entidades ou uma camada genérica especulativa neste bootstrap.

Frontend usa `useState`, sem Pinia. Troca de organização/logout cancela requests, invalida dados dependentes e descarta respostas de gerações antigas. Tokens e dados de sessão não ficam em localStorage.

### Local e futuro ambiente de produção

O navegador usa **localhost em ambos os serviços**, portas 3000/8000. Cookies locais são host-only (`SESSION_DOMAIN=null`), `SameSite=Lax`, sessão HttpOnly, e Secure desabilitado somente para HTTP local. CORS autoriza exatamente `http://localhost:3000` com credentials; não há wildcard.

A duração local de 120 minutos é provisória. Produção exige HTTPS, cookies Secure, origem e stateful domains exatos, e apenas subdomínios controlados do mesmo domínio registrável. Não copiar domínio de cookie de produção para localhost. A implantação futura em VPS/Nginx/PHP-FPM, configuração de segurança e supervisão continuam fora desta execução.

## Administração da plataforma (master)

O PingoFin precisa cadastrar empresas clientes sem cadastro público. Isso é feito por uma conta **master**, com autorização de plataforma separada dos papéis por organização (decisão **ADR-026** em [ARCHITECTURE.md](../ARCHITECTURE.md)).

| Identidade | Origem                                                                              | Pode                                                                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Master     | Linha em `platform_administrators`, criada só pelo comando `platform:create-master` | Gerir o cadastro das empresas: listar/buscar, cadastrar com o primeiro administrador, ver quem tem acesso, editar nome/fuso, incluir administrador, suspender/reativar e excluir. **Não** acessa dados de negócio nem o contexto das empresas |
| ADMIN      | Vínculo `organization_user`                                                         | Administra somente a própria organização                                                                                                                                                                                                      |
| OPERATOR   | Vínculo `organization_user`                                                         | Atua conforme as capacidades dessa organização                                                                                                                                                                                                |

Não existe `PLATFORM_ADMIN` no enum de papéis, `Gate::before` global, vínculo automático do master às empresas nem endpoint que promova alguém a master. Acesso excepcional de suporte aos dados de uma empresa (impersonação, vínculo temporário) **não está decidido** e exigirá decisão própria, com auditoria.

### Criar o primeiro master

Em um terminal interativo, a partir de `backend/`:

```powershell
../scripts/php.ps1 artisan platform:create-master
```

O comando pergunta nome e e-mail (também aceita `--name` e `--email`) e pede a senha **com entrada oculta**, duas vezes. A senha nunca é lida de argumentos, ambiente, seed ou `.env.example`, nem é impressa ou registrada. O comando recusa e-mail já existente (nunca converte uma conta existente em master), recusa execução não interativa, grava usuário e autorização em uma transação e **não cria vínculos com organizações**.

Política de senha desta etapa (`App\Support\PasswordPolicy`): mínimo de 12 caracteres, com letras e números, no máximo 72 bytes (limite do bcrypt); sem consulta externa a bases de senhas vazadas. No Windows, o prompt oculto exige um terminal real; entrada redirecionada por pipe não é aceita.

### URLs e fluxo

| URL do frontend             | Função                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/plataforma/login`         | Entrada exclusiva do master. Conta de empresa recebe a mesma falha genérica de senha incorreta                                                                  |
| `/plataforma`               | Lista paginada com busca por nome, filtro de situação (ativas/suspensas), contagem de pessoas, avisos de cadastro/exclusão e ação "Cadastrar empresa"           |
| `/plataforma/empresas/nova` | Empresa (nome, fuso IANA, padrão `America/Sao_Paulo`) e primeira pessoa administradora (nome, e-mail, senha e confirmação)                                      |
| `/plataforma/empresas/{id}` | Painel da empresa: editar nome e fuso, ver pessoas com acesso, adicionar administrador, suspender/reativar (com confirmação) e excluir (digitando o nome exato) |
| `/plataforma/acesso-negado` | Destino de quem está autenticado sem autorização de plataforma                                                                                                  |
| `/login`                    | Entrada das empresas: o novo administrador entra aqui e acessa diretamente sua empresa                                                                 |

Fluxo: criar master → `/plataforma/login` → cadastrar empresa → sair → `/login` com o administrador criado → abrir diretamente a empresa. Um master que entra por `/login` não vê organizações: não há acesso automático aos espaços das empresas.

### Contratos introduzidos

| Operação                             | Endpoint                                                                              | Autorização                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Entrar na plataforma                 | POST `/api/v1/platform/auth/login`                                                    | Público, `throttle:login`, CSRF; só aceita master                                                       |
| Listar empresas                      | GET `/api/v1/platform/organizations?page=&per_page=&search=&status=active\|suspended` | Sessão + Gate `platform.manage`; 25 por página, máximo 100, mais recentes primeiro com desempate por ID |
| Cadastrar empresa e primeiro ADMIN   | POST `/api/v1/platform/organizations`                                                 | Sessão + Gate `platform.manage`; 10 por minuto por usuário/IP                                           |
| Detalhe com pessoas com acesso       | GET `/api/v1/platform/organizations/{id}`                                             | Sessão + Gate `platform.manage`                                                                         |
| Editar nome/fuso                     | PATCH `/api/v1/platform/organizations/{id}`                                           | Idem; 30 escritas por minuto                                                                            |
| Suspender / reativar                 | POST `.../{id}/suspend` e `.../{id}/reactivate`                                       | Idem; idempotentes                                                                                      |
| Adicionar administrador (conta nova) | POST `.../{id}/administrators`                                                        | Idem; 10 por minuto                                                                                     |
| Excluir                              | DELETE `.../{id}` com `confirmation_name`                                             | Idem; nome exato obrigatório                                                                            |

Logout continua em `/api/v1/auth/logout`, e `GET /api/v1/auth/me` passou a informar `is_platform_administrator` (apenas para a interface). As rotas `/platform` **não** usam o middleware `organization` nem `X-Organization-Id`.

- Lista: `data[]` com `id`, `name`, `timezone`, `status` (`ACTIVE`/`SUSPENDED`), `suspended_at`, `members_count`, `created_at`, `updated_at` e `first_administrator` (nulo na lista), mais `links` e `meta`.
- Detalhe e respostas de edição/suspensão/novo administrador: os mesmos campos mais `members[]` com `id`, `name`, `email`, `role`, `joined_at` e `only_in_this_organization` (a conta seria excluída junto com a empresa). Nenhum dado de negócio da empresa é exposto.
- Edição aceita somente `name` e `timezone`; suspensão e membros têm operações próprias. Novo administrador: `name`, `email`, `password`, `password_confirmation`; sempre conta nova com papel ADMIN.
- Exclusão: uma transação remove vínculos, a empresa e as contas que só acessavam ela (com suas sessões); contas com outros vínculos e masters são preservados. Resposta `data.removed_accounts`. Se outra tabela ainda referenciar a empresa, 409 `PLATFORM_ORGANIZATION_HAS_DATA` e nada é apagado: suspenda-a.
- Empresa suspensa: os membros continuam vendo-a em `/auth/me` (`suspended: true`), mas `/context` responde 403 `ORGANIZATION_SUSPENDED`.
- Cadastro, corpo: `organization.{name,timezone}` e `administrator.{name,email,password,password_confirmation}`. Resposta 201 com a empresa e `first_administrator.{id,name,email}`. Papéis, permissões e privilégios enviados pelo cliente são ignorados: o papel ADMIN é definido no servidor.
- Erros no formato padrão da API: 401, 403 (`PLATFORM_FORBIDDEN`, verificado antes de resolver o `{id}`, para não revelar quais empresas existem), 404, 409, 419, 422 e 429. Mensagens de validação em português (`backend/lang/pt_BR/validation.php`). E-mail já cadastrado devolve 422 em `administrator.email`, sem alterar a conta existente. Senhas e hashes nunca são devolvidos.

O cadastro cria empresa, usuário (senha com hash) e vínculo ADMIN em **uma transação MySQL**. Submissões simultâneas do mesmo e-mail são resolvidas pela unicidade do banco: uma vence e a outra recebe 422, sem empresa órfã. O nome da empresa não é único: empresas com o mesmo nome e e-mails diferentes são permitidas. Vincular uma conta existente a uma nova empresa é um fluxo futuro explícito.

### Sessão

Há um único cookie de sessão por navegador. Entrar como master (ou como empresa) substitui a identidade anterior: o frontend limpa o estado, cancela requests pendentes e descarta respostas atrasadas. Não é possível manter master e administrador de empresa autenticados ao mesmo tempo no mesmo navegador; use outro navegador ou janela anônima. Login regenera a sessão e logout a invalida; CSRF, CORS, rate limiting e ausência de bearer tokens permanecem como no bootstrap. O `middleware/platform` do frontend só organiza a navegação; cada chamada é autorizada pelo backend.

### Logs

Os eventos `platform.master_created`, `platform.organization_provisioned`, `platform.organization_updated` (com os nomes dos campos alterados), `platform.organization_suspended`, `platform.organization_reactivated`, `platform.administrator_added` e `platform.organization_deleted` entram no log técnico estruturado (IDs e `request_id`, sem senhas, hashes ou e-mails). Não são auditoria financeira: `audit_logs` registra somente as operações financeiras das empresas.

### Limites e próximos passos

Não implementados: cadastro público, convites e e-mail, recuperação de senha, gestão completa de equipe pelo master (remover pessoas, mudar papéis, redefinir senhas), suporte/impersonação, vincular conta existente, lixeira/restauração de empresa excluída, IA e billing. A exclusão é permanente; com dados reais, definir antes política de retenção e backup. Próximos candidatos: convite do administrador e recuperação de senha (substituindo a senha inicial compartilhada), troca obrigatória da senha inicial, auditoria persistente da plataforma e decisão sobre acesso de suporte.

## Clientes, categorias, receitas e recebimentos (primeira versão)

Telas da empresa, com uma organização aberta: `/clientes`, `/categorias`, `/receitas`, `/receitas/nova` e `/receitas/{id}`. As rotas abaixo exigem sessão e o contexto da empresa única da conta (`X-Organization-Id` opcional e conferido); `organization_id` vem do contexto autorizado no servidor, nunca do payload. O master não tem vínculo com empresas e recebe 403 `ORGANIZATION_NONE`.

| Recurso      | Endpoints (`/api/v1`)                                                                                         | ADMIN           | OPERATOR        |
| ------------ | ------------------------------------------------------------------------------------------------------------- | --------------- | --------------- |
| Clientes     | `GET/POST customers`, `GET/PATCH customers/{id}`, `POST customers/{id}/archive` e `/unarchive`                | Mantém          | Consulta        |
| Categorias   | `GET/POST categories`, `GET/PATCH categories/{id}` (só o nome), `POST categories/{id}/archive` e `/unarchive` | Mantém          | Consulta        |
| Receitas     | `GET/POST revenues`, `GET revenues/{id}`                                                                      | Cria e consulta | Cria e consulta |
| Recebimentos | `POST receivables/{id}/receipts`                                                                              | Registra        | Registra        |

- Venda (`revenues`), obrigação (`receivables`, uma por venda nesta versão) e baixa (`receipts`) são registros separados. A venda não conta como recebida: vendido, recebido e restante são calculados no servidor a partir das baixas. Situação derivada: recebido (restante zero), atrasado (restante positivo e vencimento anterior ao dia atual da organização) ou pendente, inclusive no próprio dia do vencimento.
- Dinheiro: `DECIMAL(19,2)`, strings decimais canônicas na API (`"1000.00"`), bcmath no PHP e centavos inteiros (`BigInt`) na interface. Aceito: positivo, até duas casas e no máximo `999999999.99`; números JSON e precisão excedente são recusados, sem arredondamento.
- Datas: `sale_date` e `due_date` são datas civis `YYYY-MM-DD` no fuso IANA da organização. `received_at` é o instante efetivo da baixa, enviado em ISO 8601 com offset e guardado em UTC (`DATETIME(6)`). A interface converte a data e hora digitadas pelo fuso da empresa, não pelo do navegador.
- Criação de receita e baixa exigem `Idempotency-Key` (16 a 100 caracteres `A-Z`, `a-z`, `0-9`, `_` ou `-`). O escopo é empresa, pessoa, operação e chave; o hash do payload canônico e a resposta ficam em `idempotency_keys` na mesma transação da operação. Repetição igual devolve o resultado original com `Idempotent-Replayed: true`; mesma chave com outro payload devolve 409 `IDEMPOTENCY_KEY_REUSED`. Uma falha desfaz também a reserva da chave.
- A baixa trava a obrigação (`SELECT … FOR UPDATE`), recalcula o restante dentro da transação e recusa valor acima dele (422). Criação, baixa e `audit_logs` são atômicas: se a auditoria falhar, a operação é desfeita.
- Tabelas financeiras usam FKs compostas `(organization_id, id)` e FKs restritivas para `organizations`. ID de outra empresa responde 404 em leitura/alteração e 422 como referência de um novo lançamento. Categoria de despesa ou arquivada e cliente arquivado são recusados em novos lançamentos; arquivar preserva as receitas já registradas.
- Trocar de empresa ou sair aborta as requisições da empresa anterior (`$tenantRequests`) e limpa listas, formulários, tentativas pendentes e avisos.

Limites da primeira versão de receitas: sem parcelas, recorrência, estorno, edição de baixas ou IA. Correção e exclusão de lançamentos estão descritas no card 07 abaixo. A quitação integral no cadastro está descrita no card 06. O resumo financeiro está no dashboard do card 04. TTL e limpeza de `idempotency_keys` são TBD. Recebimento retroativo exige data e hora explícitas. Ao recarregar, o contexto da empresa única é resolvido novamente pelo servidor, sem etapa de seleção. O formulário de receita lista até 100 clientes ativos e oferece busca quando há mais.

## Despesas e pagamentos (primeira versão)

Card 03 do Kanban: telas `/despesas`, `/despesas/nova` e `/despesas/{id}` no shell da empresa. ADMIN e OPERATOR podem consultar, criar e registrar pagamentos; o master continua sem acesso financeiro. Endpoints com sessão e o contexto da empresa da conta: `GET/POST /api/v1/expenses`, `GET /api/v1/expenses/{id}` e `POST /api/v1/payables/{id}/payments`.

- Despesa contém descrição, categoria ativa do tipo EXPENSE, total e observações. Uma obrigação (`payables`) guarda vencimento e forma prevista. Cadastrar uma despesa pendente não cria pagamento nem saída de caixa; a opção explícita de quitação no cadastro está descrita no card 06.
- Cada pagamento (`payments`) preserva valor, forma, instante efetivo `paid_at` em UTC e autor. Dinheiro, limite e chave idempotente seguem os contratos de receitas. Criação e pagamento gravam a auditoria financeira na mesma transação; o pagamento trava a obrigação e recalcula o restante antes da baixa. FKs compostas por empresa e restritivas preservam o histórico.
- Pago e restante derivam da soma dos pagamentos reais. Restante zero é `PAID` (Quitado), restante positivo antes do dia atual da empresa é `OVERDUE`; vencimento hoje é `PENDING`. Exemplo: despesa de 300, pagamento de 100 → pago 100, a pagar 200.
- Listagem com busca por descrição/categoria, paginação, situação (`pending`, `overdue`, `paid`) e período inclusivo de vencimentos (`due_from`, `due_to`). O período filtra o dia civil do vencimento, não a data dos pagamentos. Categorias arquivadas continuam no histórico e permitem pagar despesas anteriores.
- Trocar empresa, mudar o registro ou sair descarta dados e rascunhos e aborta requisições antigas. O formulário busca categorias quando há mais de 100. Valores e datas não ficam no localStorage.

Recorte inicial do card: sem parcelamento, recorrência, fornecedores, anexos ou estorno. O card 07 acrescenta edição e exclusão lógica do cadastro, descritas abaixo. O dashboard do card 04 considera os pagamentos efetivos. Validação da entrega inicial em [docs/EXPENSE_VALIDATION.md](./EXPENSE_VALIDATION.md).

## Vencimento livre e quitação à vista no cadastro (card 06)

Em Nova receita e Nova despesa a pessoa escolhe explicitamente entre **Ainda vou receber/pagar** e **Já recebi/paguei à vista**. Nada é considerado quitado só pela data.

- **Pendente:** o vencimento é escolhido livremente (na receita, não pode ser anterior à data da venda). A tela sugere a data da venda até a pessoa mexer no vencimento e nunca sobrescreve a escolha. Baixas posteriores, inclusive parciais, continuam no detalhe.
- **Quitado à vista:** a pessoa informa a forma e a data e hora efetivas (sugestão: agora, editável, no fuso da empresa). Não é pedido vencimento.
- **Regra documentada:** a obrigação de um lançamento quitado no cadastro vence no dia civil, no fuso da empresa, do instante efetivo da baixa, e sua forma prevista é a forma efetiva.
- **Contrato:** `POST /api/v1/revenues` e `POST /api/v1/expenses` aceitam `settlement` opcional, com `{ method, received_at }` ou `{ method, paid_at }` em ISO 8601 com offset. Com `settlement`, `due_date` e `expected_method` são recusados (422); sem ele, continuam obrigatórios. O valor é sempre o total, e campos extras em `settlement` são recusados. O recebimento não pode estar no futuro nem ser anterior à data da venda; o pagamento não pode estar no futuro.
- **Atomicidade e repetição:** lançamento, obrigação, baixa integral e as duas auditorias (`revenue.created`/`receipt.created` ou `expense.created`/`payment.created`) são gravados na mesma transação da `Idempotency-Key`. Uma falha desfaz tudo; o reenvio com a mesma chave devolve o mesmo resultado sem duplicar, e a mesma chave com outra quitação dá 409.
- **Acesso:** criar quitado também exige a capacidade de baixa da empresa (ADMIN e OPERATOR a têm hoje).
- **Dashboard:** entradas e saídas usam o instante efetivo da baixa. Um lançamento pendente segue em a receber/a pagar e não vira movimentação de caixa.

Fora do recorte: parcelas, recorrência, estorno e edição de baixas. Validação em [docs/SETTLE_ON_CREATE_VALIDATION.md](./SETTLE_ON_CREATE_VALIDATION.md).

## Corrigir e excluir lançamentos (card 07)

ADMIN e OPERATOR podem editar e excluir receitas/despesas pela lista ou pelo detalhe. Master permanece sem acesso financeiro. `PATCH /api/v1/revenues/{id}` e `/expenses/{id}` recebem os dados completos, `expected_version` e `Idempotency-Key`. Descrição, categoria, total, observações, vencimento e forma prevista são editáveis; receitas também permitem cliente e data da venda. O instante de registro e o autor originais continuam imutáveis.

- Edição preserva todas as baixas, seus valores, formas, instantes e autores. Total deve ser pelo menos o já recebido/pago; aumentar o total de um lançamento quitado pode reabri-lo como pendente. Data da venda alterada não pode ficar depois de um recebimento existente, e o vencimento não pode anteceder a venda. Metadados de legados podem manter a data original da venda.
- Referências devem pertencer à empresa e a categoria deve ter o tipo correto. O vínculo atual pode continuar arquivado; outro cliente/categoria arquivado não pode ser escolhido. A interface oferece busca nas opções ativas e preserva o vínculo atual.
- `DELETE` nas mesmas rotas recebe apenas `expected_version`, com chave idempotente. Exclui logicamente somente lançamentos **sem baixas**. A confirmação identifica o lançamento e explica o efeito; se houver qualquer baixa, responde 422 e informa que seria necessário estorno, ainda indisponível.
- `deleted_at` retira o cadastro das listas, detalhe, filtros e pendências do dashboard. Obrigação, cadastro e auditoria permanecem no banco. Baixa por um ID antigo da obrigação responde 404; não há restauração pela interface.
- Escritas travam obrigação e cadastro na mesma ordem das baixas. Cada edição, exclusão ou nova baixa incrementa `version`; editor desatualizado recebe 409 `FINANCIAL_ENTRY_CHANGED`, com recarga explícita que descarta o rascunho. Reenvio igual reproduz a resposta, inclusive após exclusão. Auditoria antes/depois e reserva idempotente participam da mesma transação.

Migração aditiva `2026_10_08_000004_add_financial_entry_revision_and_soft_deletion` adiciona versão e exclusão lógica às duas tabelas. Regras, testes e evidências: [docs/FINANCIAL_REFINEMENT_VALIDATION.md](./FINANCIAL_REFINEMENT_VALIDATION.md).

## Corrigir recebimentos e pagamentos (card 09)

Regras aprovadas pelo usuário em 08/10/2026 (ADR-031): **correção vinculada**, para erros de digitação de valor, data/hora ou forma; **ADMIN e OPERATOR** podem corrigir, sempre com motivo. Devolução real de dinheiro (estorno) continua fora do escopo.

- A baixa original **nunca é editada nem apagada**. A correção grava uma nova linha com os valores certos, o motivo, o autor e o instante da correção, vinculada à original por `corrects_id`; a original recebe `superseded_at` e deixa de contar nos totais. Uma correção pode ser corrigida de novo (cadeia), nunca sobrescrita.
- Totais, situação, restante, listas, lembretes e dashboard usam apenas as baixas vigentes. Corrigir a data move o valor para o mês correto no dashboard: a regra é refletir o caixa como se o erro não tivesse existido, com o histórico preservado.
- Contrato: `POST /api/v1/receipts/{id}/corrections` e `POST /api/v1/payments/{id}/corrections` com `expected_version` (versão do lançamento revisado), `amount`, `method`, `received_at`/`paid_at` e `reason` (5 a 500 caracteres), mais `Idempotency-Key`. O valor corrigido é positivo e não pode passar do que falta na parcela somado à própria baixa. "Nada mudou" é 422.
- Concorrência: trava obrigação, lançamento e baixa nessa ordem. Versão desatualizada (outra edição ou baixa no meio do caminho) dá 409 `FINANCIAL_ENTRY_CHANGED`; baixa já corrigida, 409 `SETTLEMENT_ALREADY_CORRECTED`. Reenvio com a mesma chave não duplica. Auditoria `receipt.corrected`/`payment.corrected` com antes/depois, saldo da parcela e motivo, na mesma transação.
- Interface: botão **Corrigir** em cada baixa vigente do histórico; diálogo com edição, **revisão do antes/depois e do efeito** (por exemplo, "menos R$ 100,00 recebido; restante R$ 0,00 → R$ 100,00") e confirmação. Cancelar em qualquer etapa não altera nada. O histórico mostra a linha original como "Corrigido", com a linha que a substituiu, e a nova como "Correção vigente", com o motivo.
- Lançamentos com baixas vigentes continuam sem exclusão (card 07): corrigir não é estornar.

## Entrada, parcelas e lembretes (card 10)

Regras aprovadas em 08/10/2026 (ADR-032): centavos que sobram na divisão vão para a **última** parcela; parcelas mensais que começam nos dias 29 a 31 usam o **último dia** dos meses mais curtos e voltam ao dia original depois (31/01 → 28/02 → 31/03).

- Nova receita e Nova despesa ganham o modo **Parcelado**: entrada opcional (marcada explicitamente como já recebida/paga, com forma e data/hora, ou pendente com vencimento), número de parcelas, primeiro vencimento, forma e lembrete. A prévia é editável linha a linha (valor, vencimento, forma, lembrete) e mostra se a soma confere com o total; nada é salvo até registrar.
- Contrato: `installments` com 2 a 60 linhas `{amount, due_date, expected_method, reminder_date?, down_payment?, settlement?}`. Só a primeira linha pode ser a entrada e só ela pode trazer `settlement`; a soma precisa ser exatamente o total (422 caso contrário). Com `installments`, `due_date`/`expected_method`/`settlement`/`reminder_date` de topo são recusados. O fluxo simples continua e aceita `reminder_date` opcional.
- Cada linha é uma obrigação (`receivables`/`payables` com `sequence`, `is_down_payment` e `reminder_date`). Lançamento, parcelas, baixa da entrada e auditoria são gravados na mesma transação idempotente; uma falha não deixa nada parcial.
- Respostas trazem `installments` (valor, recebido/pago, restante, vencimento, lembrete, forma e situação de cada linha). `receivable`/`payable` passa a ser a **próxima parcela em aberto**. A situação do lançamento é atrasada quando qualquer parcela em aberto venceu; o filtro de vencimento das despesas encontra lançamentos com alguma parcela no período.
- Baixas são registradas por parcela: o detalhe tem a tabela de parcelas com "Registrar" e o formulário com seletor de parcela, sempre limitado ao restante daquela parcela; parciais continuam permitidas.
- **Lembretes** (`/lembretes`, `GET /api/v1/reminders`): parcelas em aberto cujo lembrete chegou no dia local da empresa, e as dos próximos 7 dias. Mostram só o restante; quitadas e lançamentos excluídos não aparecem. "Revisar e registrar" abre o lançamento com a parcela selecionada; **nada é baixado automaticamente**.
- Edição (card 07) de um lançamento parcelado altera descrição, categoria, cliente, data da venda e observações; total, vencimentos e formas das parcelas ficam como cadastrados. Exclusão só sem baixas.
- Legados: a migração `2026_10_08_000005_add_settlement_corrections_and_installments` é aditiva. Lançamentos antigos viram cronogramas de uma parcela, com valores e baixas intactos; `payables` ganhou `sequence` com unicidade por despesa e sequência.

Fora do recorte: WhatsApp, e-mail, push, débito automático, recorrência, edição do cronograma depois de salvo e estorno. Validação em [docs/CORRECTIONS_INSTALLMENTS_VALIDATION.md](./CORRECTIONS_INSTALLMENTS_VALIDATION.md).

## Relatórios e fluxo de caixa (card 11)

`/relatorios` (menu **Relatórios**) reúne três visões da empresa aberta, somente leitura, para ADMIN e OPERATOR (capacidade `report.view`); master recebe 403, outra empresa 404. Cada visão informa período, base, fuso e instante da consulta, e lembra que mostra apenas o que foi registrado no PingoFin (não é saldo bancário). ADR-033.

- **Resultado mensal** (`GET /api/v1/reports/monthly?from=YYYY-MM&to=YYYY-MM`, até 12 meses; padrão: últimos 6): entradas, saídas e resultado por mês local das baixas vigentes — a mesma regra e as mesmas somas do dashboard —, comparação com o mês anterior (`result_change`), **vendido** pela data da venda e **despesas que vencem** pela data de vencimento (bases não-caixa, rotuladas à parte) e entradas/saídas **por categoria** em base de caixa, com participação em pontos-base (truncada).
- **Extrato do realizado** (`GET /api/v1/reports/statement`): recebimentos e pagamentos vigentes em ordem cronológica, por período civil (`from`/`to`, até 366 dias; padrão: mês atual), tipo, categoria, forma e ordem. `status=corrected|all` lista baixas substituídas (card 09) só para conferência; elas nunca entram nos totais. Cada linha leva ao lançamento com a parcela.
- **A receber e a pagar** (`GET /api/v1/reports/obligations`): parcelas em aberto por vencimento com valor, já baixado e restante; filtros de período de vencimento opcional (até 366 dias), tipo, situação (`pending`, `overdue`, `partial`), categoria e forma prevista. Sem filtros, os totais são os mesmos "a receber/a pagar" do dashboard. Venda não recebida aparece aqui e nunca no extrato; baixa parcial divide-se entre os dois.
- Totais (`summary`) são calculados no MySQL para o conjunto filtrado inteiro, não para a página; linhas e totais vêm da mesma leitura REPEATABLE READ. Baixas são agregadas por obrigação e cada baixa liga-se a uma única parcela, lançamento e categoria, sem duplicar principal. Paginação com desempate por ID (`meta` no formato das listas). Lançamentos excluídos ficam de fora.
- `has_entries` distingue "nenhum lançamento cadastrado" de "nenhum movimento no período"; erro de leitura aparece com "Tentar novamente", nunca como zero.
- As Queries (`app/Queries/Reports`) recebem filtros explícitos e não dependem da requisição, para reuso futuro em consultas do Pingo.

Fora do recorte: exportação CSV, BI, gráficos interativos, recorrência (card 13), saldo disponível e integração bancária. Validação em [docs/REPORTS_VALIDATION.md](./REPORTS_VALIDATION.md).

## Dashboard básico com números reais

Card 04: a página inicial `/` mostra a **Visão geral** da organização aberta. `GET /api/v1/dashboard?month=YYYY-MM` exige sessão, contexto autorizado e capacidade `dashboard.view` (ADMIN/OPERATOR). Master sem vínculo recebe 403 ORGANIZATION_NONE; empresa suspensa recebe 403. Mês omitido usa o mês atual no fuso da empresa; intervalo aceito: 2000-01 a 2100-12. Fuso e empresa não são aceitos como campos da query.

- Entradas e saídas somam baixas reais por `received_at`/`paid_at`, do início do mês local até o início do próximo, exclusivo. Resultado é entradas menos saídas, em base de caixa. Venda ou despesa sem baixa não movimenta esses indicadores.
- Card 08: resultado positivo usa tokens de sucesso, seta para cima e “Resultado positivo”; negativo usa tokens de erro, seta para baixo e “Resultado negativo”, preservando o sinal; zero fica neutro com “Resultado zerado”. A seta indica o sinal do resultado, sem comparação com outro mês. Loading/erro não são apresentados como zero. Evidências em [docs/FINANCIAL_REFINEMENT_VALIDATION.md](./FINANCIAL_REFINEMENT_VALIDATION.md).
- A receber/a pagar somam os restantes de **todos** os vencimentos, incluindo atrasos e datas fora do mês selecionado. Atraso usa o dia atual da empresa; vencimento hoje não é atraso. Baixas são agregadas por obrigação antes dos joins, evitando duplicação dos totais.
- API entrega `period`, `as_of`, `today`, `monthly`, `outstanding`, `daily` e `due`. Cada dia inclui entradas/saídas exatas, inclusive zeros. As listas mostram até seis atrasos e seis próximos vencimentos (hoje até hoje + 30 dias, inclusive), com contagem total, valor restante e link ao lançamento.
- As cinco consultas financeiras usam a mesma transação InnoDB em REPEATABLE READ, sem alterar o isolamento padrão da sessão. Os limites UTC de cada dia respeitam mudanças de offset sem depender das tabelas de fuso do MySQL. Sem cache de valores; respostas `no-store`.
- Interface reutiliza shell, tokens e shadcn, com seletor mensal, atualização manual, loading, erro com retry e vazio. Trocar mês/empresa descarta respostas antigas e os valores anteriores. O gráfico SVG real usa a composição das referências locais e tem tabela diária acessível; números permanecem strings/BigInt.

Sem saldo bancário/disponível, relatórios avançados, exportação ou IA. A galeria ilustrativa continua separada. Sem atualização em tempo real: uma baixa em outra aba exige **Atualizar**. Evidências e limites em [docs/DASHBOARD_VALIDATION.md](./DASHBOARD_VALIDATION.md).

## Design core e Pingo

As tabelas do DESIGN_SYSTEM foram materializadas integralmente, com 17 primitivos e 31 tokens semânticos/status por tema. Tipografia, espaçamento 4/8/12/16/24/32/48px e aliases ficam em `frontend/app/design-core`. Tailwind referencia variáveis CSS; não há paleta de template aplicada às telas. A direção visual **B · Acolhedora** (05/10/2026) está registrada no [DESIGN_SYSTEM §16](../DESIGN_SYSTEM.md#16-direção-b--acolhedora-registro-de-05102026): fonte Manrope carregada localmente (`@fontsource-variable/manrope`, OFL), sidebar roxa recuada, navbar com glass discreto, elevação leve, controles de 44px e raios 6/8/12/16px por componente.

Componentes vêm do **shadcn-vue** (new-york-v4) em `frontend/app/components/ui`, importados explicitamente e mapeados aos tokens em `design-core/component-tokens.css`; o módulo `shadcn-nuxt` não é usado. Ícones: `@lucide/vue` (o pacote `lucide-vue-next` está deprecado). O shell compartilhado (`components/app/Shell.vue`) serve administração e empresas; o título de cada página é o único `<h1>`, exibido na navbar via `usePageHeading`.

Preferência `light | dark | system`, tema resolvido `light | dark`, aplicação no elemento raiz e `color-scheme`. Uma inicialização no head define o tema antes da pintura. Somente a preferência visual é persistida. System acompanha `prefers-color-scheme`; seleção explícita tem prioridade. **System como default e seletor no header/login são provisórios para validar o bootstrap**, sem fechar os TBDs de produto.

Usamos CSR (`ssr: false`) para evitar sessão SSR desnecessária. O build gera um servidor Nitro de distribuição; sua existência não implica SSR autenticado. O modo final e a futura entrega estática/Nginx versus Nitro permanecem TBD. `npm run preview` serve o build local; não constitui deploy. O [comando de preview](https://nuxt.com/docs/4.x/api/commands/preview) carrega o `.env` local, incluindo `NITRO_HOST=localhost`, e recebe a porta pelo script; não aceita o flag `--host` do servidor de desenvolvimento. Executar Nitro diretamente em produção exige configurar o ambiente por outro mecanismo.

Figma orientou o formulário de 410px, sidebar desktop de 290px, header e agrupamentos. Layout responsivo foi criado com CSS próprio; não replica coordenadas absolutas, marca/paleta/fontes/assets ou extras do Horizon. O arquivo Figma não foi editado.

`docs/assets/pingo-referencia.jpg` permanece a prancha original. Três imagens individuais transparentes do Pingo e seis gráficos SVG editáveis estão em [docs/referencias-visuais](./referencias-visuais/README.md), com catálogo, prompts e procedência. São exemplos substituíveis para validação visual; assets definitivos e animações permanecem TBD.

O Pingo flutuante (`components/pingo/Dock.vue`) fica no canto inferior direito da empresa (com organização aberta) e da administração (como prévia, sem dados de empresas): painel não modal no desktop e modal em tela cheia no mobile. `/assistente` mostra a mesma conversa em página inteira; o widget some nessa rota. Mensagens são locais, sem API de IA, respostas geradas, persistência ou lançamentos financeiros. Trocar de organização, sair ou mudar de identidade limpa conversa e rascunho. [A galeria local](http://localhost:3000/dev/referencias) mostra uma prévia de dashboard com dados ilustrativos identificados, gráficos claro/escuro, estados do Pingo e o chatbox; funciona somente em desenvolvimento e não acessa dados de uma organização.

Para alterar gráficos, editar `scripts/generate-visual-references.mjs` e executar com o Node do projeto. Para substituir imagens individuais, manter os nomes ou atualizar o catálogo `frontend/app/config/visual-references.ts`, depois executar `./scripts/sync-visual-references.ps1`. A arquitetura é uma referência de evolução; seu planejamento não amplia o escopo atual de interface.

## Validação

Comandos do backend, a partir de `backend/`:

```powershell
../scripts/composer.ps1 validate --strict
../scripts/composer.ps1 check-platform-reqs
../scripts/composer.ps1 audit
../scripts/php.ps1 artisan migrate:status
../scripts/php.ps1 artisan test
../scripts/php.ps1 vendor/bin/pint --test
../scripts/php.ps1 artisan infra:queue-smoke
```

Verificação de sintaxe PHP para app/config/rotas/migrations/testes:

```powershell
$phpFiles = rg --files app bootstrap config database routes tests -g '*.php'
foreach ($phpFile in $phpFiles) {
    ../scripts/php.ps1 -l $phpFile
    if ($LASTEXITCODE -ne 0) { throw "Sintaxe inválida: $phpFile" }
}
```

Comandos do frontend, a partir de `frontend/`:

```powershell
../scripts/npm.ps1 run typecheck
../scripts/npm.ps1 run lint
../scripts/npm.ps1 test
../scripts/npm.ps1 run build
../scripts/npm.ps1 run format:check
../scripts/npm.ps1 audit
```

Use `npm ci`/Composer install com lockfiles, sem desativar TLS, auditoria, engine ou validação de peers. Ferramentas globais equivalentes podem substituir os wrappers quando cumprirem seus requisitos; esse fluxo alternativo não foi validado nesta máquina.

Resultados reais e limites estão em [docs/BOOTSTRAP_VALIDATION.md](./BOOTSTRAP_VALIDATION.md) (bootstrap) e [docs/PLATFORM_ADMIN_VALIDATION.md](./PLATFORM_ADMIN_VALIDATION.md) (administração da plataforma). Testes controlados alteram apenas a configuração das conexões da aplicação de teste para portas indisponíveis; não param serviços compartilhados.

### Pendências verificadas

`npm audit` reportou 11 entradas high transitivas, propagadas de dois avisos: [braces até 3.0.3](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) e [node-forge até 1.4.0](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Essas também eram as versões mais novas no registro consultado. A sugestão automática inclui downgrade de Nuxt, que não foi aplicada. As dependências são usadas pelo tooling de glob e TLS do servidor de desenvolvimento; o bootstrap serve em loopback e não usa essa geração de certificados. A auditoria continua aberta, sem declarar a stack livre de vulnerabilidades ou pronta para produção. Reavaliar correções upstream antes de expor serviços ou usar dados reais.

Composer não apresentou avisos de segurança. O build mostrou um aviso transitivo `DEP0155` de exports em `@vue/shared`; isso não impediu a construção.

No Windows, `pdo_mysql`, curl e zip inicialmente estavam ausentes do carregamento; o ini local resolveu e foi verificado com Composer/PDO. Docker levou alguns minutos para iniciar; a validação começou somente após o daemon responder. Uma lista de filas com vírgula deve ser passada entre aspas no PowerShell. Caso as portas estejam ocupadas, altere compose/.envs de forma coerente e verifique novamente as conexões; não encerre processos de outros projetos.

Permanecem TBD: fonte e assets finais, tokens escuros definitivos, UX final de navegação/tema, decisões financeiras, providers/cotas/billing, domínios e operação do VPS. Nenhuma delas foi encerrada por este bootstrap.
