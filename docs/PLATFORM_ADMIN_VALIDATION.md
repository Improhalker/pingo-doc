# Validação da administração da plataforma — PingoFin

Execução local em 05/10/2026, Windows/PowerShell. Escopo: conta master, área da plataforma, listagem de empresas e cadastro de empresa com seu primeiro administrador. Fluxo, contratos e comandos estão no [README](../README.md#administração-da-plataforma-master); a decisão está na ADR-026 de [ARCHITECTURE.md](../ARCHITECTURE.md).

## Decisão registrada antes da implementação

Autorização de plataforma representada por uma tabela dedicada, `platform_administrators` (uma linha por usuário, PK = `user_id`, FK restrita, InnoDB), independente de `organization_user`. Alternativas descartadas: papel `PLATFORM_ADMIN` no enum de vínculo (misturaria plataforma e tenant), coluna booleana em `users` (fácil de expor por mass assignment) e `Gate::before` global (liberaria todas as Policies). A tabela não é preenchível em massa e só o comando `platform:create-master` a cria.

## Backend (MySQL real, banco `pingofin_test`)

`artisan test`: **44 testes passaram, 313 assertions** (24 anteriores + 20 novos em `PlatformAdministrationTest`). Pint e `composer validate --strict` passaram; `composer audit` sem avisos.

Novos testes cobrem: visitante recebe 401; ADMIN e OPERATOR recebem 403 `PLATFORM_FORBIDDEN` (antes da validação, sem criar registros); master lista (campos públicos, paginação, limite de `per_page`) e cadastra; empresa, usuário com hash e vínculo ADMIN criados; papel/privilégios enviados pelo cliente ignorados; usuário comum não se torna master (nem por requisição, nem por mass assignment, e o conjunto de rotas `/platform` é conferido); master sem acesso ao contexto de uma empresa (404) e sem vínculos; e-mail existente, inclusive em outra caixa ou com espaços, retorna 422 sem alterar senha ou vínculos; validação de fuso, nome e política de senha; falha no meio do provisionamento e conflito de unicidade que passa pela validação revertem a empresa; o novo administrador entra, acessa somente a própria organização e é negado na plataforma; login de plataforma só aceita master, mantém CSRF (419 sem token), regeneração e invalidação de sessão e rate limiting; constraints de `platform_administrators` e do vínculo; comando de criação do master (sucesso sem vazar a senha nem criar vínculos, recusa de conta existente, senha fraca, confirmação divergente e execução não interativa).

Os testes anteriores de bootstrap (CSRF, sessão, isolamento, health, Redis/MySQL indisponíveis) continuam passando. A tabela de rate limit de login usa arquivos compartilhados entre execuções; por isso os novos testes usam um IP distinto por teste.

Observação: numa execução inicial, antes de qualquer alteração minha, `InternalKanbanTest::test_moving_and_reordering_persist_densely_without_losing_tasks` falhou por ordem de chaves em `assertSame`; nas execuções seguintes passou. É um teste da ferramenta interna Kanban, fora deste escopo, e não foi alterado.

### Infraestrutura

- `migrate`: a migration `2026_10_05_000003_create_platform_administrators` foi aplicada ao `pingofin_dev` por `migrate` (aditiva); nenhuma migration existente foi editada e `migrate:fresh` não foi usado fora do banco de testes.
- `health`: `ready`, com application, MySQL e Redis `up`.
- Worker: `infra:queue-smoke` com `queue:work` real confirmou o processamento (execução `26a3e74d…`).

## Frontend

`typecheck`, `lint`, `format:check` e `build` passaram; `npm test`: **22 testes** (inclui `platform.test.ts`: contrato HTTP da plataforma com CSRF, credenciais e sem `X-Organization-Id`, erros HTTP nunca tratados como sucesso, descarte de respostas de identidade anterior e leitura de erros de campo). Estes testes verificam contratos isolados; o fluxo completo foi validado no navegador, abaixo.

## Navegador real (frontend em `localhost:3000`, API em `localhost:8000`, `pingofin_dev`)

Executado no navegador embutido, com cookies/CSRF reais:

1. Visitante em `/plataforma` → redirecionado a `/plataforma/login`.
2. Senha incorreta → erro "E-mail ou senha não conferem."; senha correta do master criado para o teste → `/plataforma`, com a lista real de empresas.
3. Formulário com e-mail de conta existente e senha curta → erros por campo ("Este e-mail já está em uso." e orientação de senha), campos de senha limpos, nada criado.
4. Cadastro válido, com cliques/envios múltiplos simultâneos → **uma** empresa criada, aviso de confirmação exibido só após o 201 e lista atualizada.
5. Logout do master → `/plataforma/login`; a API da plataforma passa a responder 401.
6. `/login` com o administrador recém-criado → somente a própria organização aparece no seletor; selecionada, o shell mostra "Administrador desta organização". Via API: `X-Organization-Id` de outra empresa → 404; própria → 200; `/api/v1/platform/organizations` → 403.
7. Esse administrador abrindo `/plataforma` → `/plataforma/acesso-negado`.
8. Viewport de 320px: sem overflow horizontal em login, lista e formulário. Temas claro e escuro: contrastes medidos nos estilos computados (corpo 15,7:1 e 16,4:1; botão 9,9:1 e 6,3:1; rótulos e dicas acima de 4,5:1; borda de campo 3,7:1 e 4,3:1).

### O que não foi validado

- O painel do navegador não conseguiu gerar capturas de tela (timeout de renderização), então a conferência visual foi feita por texto da página, estilos computados e medidas de layout, sem inspeção humana de imagem. Não há capturas anexadas.
- O formulário foi preenchido e enviado por script de página (eventos de entrada e envio reais); cliques por coordenadas não foram possíveis. Foco por teclado e `prefers-reduced-motion` não foram exercitados manualmente nas novas telas.
- O prompt oculto de `platform:create-master` foi validado nos testes automatizados (perguntas simuladas), mas **não** num terminal interativo real: no Windows, a entrada redirecionada por pipe é recusada, como esperado. Para o teste no navegador, a conta master local foi criada por um script PHP de uso único que grava as mesmas linhas do comando (usuário com hash + `platform_administrators`) a partir de uma senha aleatória de teste, fora do repositório. Esse script e o arquivo da senha foram removidos.
- Cadastro por submissões simultâneas reais foi coberto pela unicidade do banco (teste de conflito) e por disparos múltiplos na mesma página; não houve teste de carga com requisições paralelas independentes.

### Dados locais deixados no `pingofin_dev`

Uma conta master (`master.e2e@pingofin.test`), uma empresa "Autoescola Rota E2E" e seu administrador (`admin.rota@pingofin.test`). São fixtures locais criadas pelo teste; as senhas não foram guardadas. Remova-os manualmente se não os quiser; nada foi apagado automaticamente. O usuário `dev@pingofin.test` e as organizações A/B não foram alterados nem tornados master.

## Pendências preservadas

`npm audit` continua com **11 entradas high transitivas** (braces e node-forge), sem correção disponível no registro consultado; downgrade automático não foi aplicado, nem auditoria/TLS desativados. Esta etapa não torna a stack pronta para produção. Permanecem os avisos de scripts de instalação do npm e `DEP0155` do build. Não houve deploy, VPS, commit ou push, nem alterações no Figma, na prancha do Pingo ou implementação financeira/IA.

## Etapa 2 — painel de gestão das empresas (05/10/2026)

Pedido: tornar o painel da plataforma mais completo, com edição e exclusão. Implementado: detalhe da empresa com pessoas com acesso, edição de nome/fuso, inclusão de nova pessoa administradora (conta nova), suspensão/reativação, exclusão com confirmação pelo nome exato, busca por nome e filtro por situação. A ADR-026 foi atualizada com esses poderes e os limites de suspensão/exclusão.

Banco: migration aditiva `2026_10_05_000004_add_suspended_at_to_organizations` aplicada ao `pingofin_dev` por `migrate` (sem `fresh`). Novo `backend/lang/pt_BR/validation.php` com mensagens de validação em português (antes saíam em inglês).

### Backend

`artisan test`: **53 testes, 419 assertions, todos passando** (9 novos em `PlatformOrganizationManagementTest`; `PlatformAdministrationTest` ajustado para o novo contrato da lista e o novo conjunto de rotas). Pint passou. Os testes novos cobrem: membros de empresa recebem 403 em todas as operações de gestão, inclusive para IDs inexistentes (sem revelar existência); visitante 401; detalhe com membros sem hashes e 404 para ID inexistente; edição só de nome/fuso (campos extras como `suspended_at` ignorados) e validação; suspensão bloqueia `/context` com 403 `ORGANIZATION_SUSPENDED`, mantém vínculos, é idempotente e a reativação restaura o acesso; busca (com `%` tratado como texto), filtro de situação e contagem de pessoas; novo administrador sempre ADMIN, e-mail existente e senha fraca recusados sem alterar a conta existente; exclusão exige o nome exato, remove só contas exclusivas e suas sessões, preserva contas compartilhadas e o master; erro 1451 de FK vira 409 com rollback completo (simulado por exceção, porque criar uma tabela real dentro do teste faria commit implícito no MySQL).

### Frontend

`typecheck`, `lint`, `format:check` e `build` passaram; `npm test`: **25 testes** (3 novos: filtros na query, PATCH/DELETE com CSRF e corpo de confirmação, 409 nunca tratado como sucesso).

### Navegador real (`pingofin_dev`)

Com o master local de teste: busca "rota" → somente a empresa de teste; detalhe com a pessoa administradora; edição com fuso e nome inválidos → mensagens em português por campo; "Descartar" restaurou os valores; edição válida → "Alterações salvas." e título atualizado; adicionar administrador com e-mail existente → erro no campo e senhas limpas; com e-mail novo → aparece na tabela; suspensão por diálogo de confirmação → situação "Suspensa"; numa sessão HTTP separada, a nova pessoa administradora fez login (`suspended: true`) e `/context` respondeu 403 `ORGANIZATION_SUSPENDED`; reativação → `/context` 200. Exclusão de uma empresa descartável criada pelo formulário: o botão só habilita com o nome exato (diferença de maiúsculas mantém desabilitado); após confirmar, volta à lista com aviso e a conta exclusiva foi removida (conferido no banco: empresa, vínculos e conta inexistentes). Os logs técnicos registraram cada ação.

A 320px: sem overflow horizontal da página no detalhe e na lista (a tabela de 5 colunas rola dentro do próprio contêiner) e o diálogo cabe na tela. Contrastes medidos: botão de exclusão 5,7:1 (claro) e 10,2:1 (escuro); selo de situação 5,2:1 e 7,4:1; texto do diálogo 16,6:1 e 14,8:1.

Problemas encontrados e corrigidos durante a validação: mensagens de validação em inglês; aviso antigo de "empresa cadastrada" permanecia após excluir essa empresa; respostas 403/409 geradas por middleware/action sem `errors` e `request_id`.

Limitações: as mesmas da etapa 1. Sem capturas de tela (o painel do navegador não renderiza imagens), interação por script de página e não por cliques/teclado reais, e senha do master de teste redefinida por script local de uso único, já removido. As empresas "Objetiva" e "Objetiva Teste", criadas por você, não foram alteradas.

Dados de teste deixados no `pingofin_dev`: "Autoescola Rota E2E" foi renomeada para "Autoescola Rota E2E Editada" (fuso `America/Manaus`) e ganhou a pessoa administradora `segunda.rota@pingofin.test`. A empresa descartável e sua conta foram excluídas pelo próprio fluxo.
