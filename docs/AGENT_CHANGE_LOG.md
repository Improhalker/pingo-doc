# Histórico obrigatório de alterações dos agentes

## Fonte e acesso

`pingo-front-crm/data/agent-changes.json` é a fonte única, versionada, dos registros. A página `/plataforma/alteracoes` mostra resumos de até 300 caracteres e permite expandir detalhes. O acesso usa a conta master da plataforma (`is_platform_administrator`), independente de ADMIN/OPERATOR de uma empresa.

Os logs não dependem de banco para persistência ou consulta. A autorização reutiliza a sessão existente do Laravel, cuja infraestrutura continua sendo a do projeto. A rota Nuxt `GET /api/platform/agent-changes` confirma essa sessão em `/api/v1/auth/me` antes de entregar o conteúdo: visitante recebe 401, usuário de empresa 403, master o JSON e falha na verificação de sessão 503. A resposta usa `private, no-store` e `Vary: Cookie`.

O JSON não fica em `public/` e não é importado no bundle Vue. Não copiar seu conteúdo para assets públicos, localStorage, galeria dev ou outro armazenamento. Apenas tipos/validador são compartilhados. O estado é descartado quando muda a identidade, e respostas antigas não o restauram.

Para esta proteção, servir o frontend com o servidor Nuxt/Nitro ou um adaptador que execute sua rota protegida. Uma exportação puramente estática não oferece esse endpoint. A fonte é incorporada ao build do servidor: alterações exigem novo build/deploy para chegar à versão publicada.

## Registro de uma tarefa

Toda alteração feita por agente, inclusive documentação, configuração, scripts, testes e assets, exige uma nova entrada antes da entrega. Essa implementação já está registrada. Não inventar registros de tarefas anteriores.

1. Reler o JSON e escolher um ID único em minúsculas, sem reutilizar IDs.
2. Acrescentar a `changes` uma entrada com `id`, `occurredAt` em ISO UTC com milissegundos, `agent` e `summary` objetivo em português.
3. O resumo deve ter de 1 a 300 caracteres Unicode, sem espaços nas extremidades. Não truncar silenciosamente para esconder excesso de conteúdo.
4. Para alteração complexa, criar outro objeto em `details`, com `id`, `changeId` e `sections` de `title`/`text`. Vincular pelo `detailsId` da entrada. Cada seção tem até 300 caracteres; títulos, até 80. Acrescentar seções para explicar comportamento, decisões, testes e limites reais.
5. Preservar entradas/detalhes já commitados; uma correção deve ser registrada como nova alteração. Não inserir segredos, dados de clientes ou resultados fictícios de validação.
6. Validar antes de entregar. Para commit, incluir o JSON no stage junto com a mudança correspondente.

O histórico é mantido em arquivo pelos agentes. A interface não edita registros e não registra automaticamente cliques de usuários. O objeto inicial é um exemplo válido do formato.

## Validação e trava de commit

Na raiz de pingo-front-crm, com o Node do projeto:

```powershell
./.tools/node-v24.21.0-win-x64/node.exe ./scripts/check-agent-changes.mjs
./.tools/node-v24.21.0-win-x64/node.exe ./scripts/check-agent-changes.mjs --worktree
./.tools/node-v24.21.0-win-x64/node.exe ./scripts/check-agent-changes.mjs --staged
```

Sem flags: contrato do JSON. `--worktree`: exige entrada nova em relação a HEAD quando há arquivos alterados. `--staged`: lê o JSON do índice Git, exige uma nova entrada para o commit e impede reescrita/exclusão de histórico. `--base <ref>` permite comparar com outra referência, por exemplo a base de uma revisão. Um Node compatível no PATH pode substituir o caminho portável.

Testes e build do frontend executam o validador de contrato por `pretest`/`prebuild`. As instruções obrigatórias vivem em `AGENTS.md`; `CLAUDE.md` as importa e reforça a ação para Claude Code.

`.githooks/pre-commit` bloqueia commits sem uma nova entrada válida no stage. Ativar em cada clone:

```powershell
git config --local core.hooksPath .githooks
```

Não usar `--no-verify`, desativar a trava, reduzir o limite ou remover a regra para concluir trabalho de agente. A configuração local do hook não acompanha o clone automaticamente; instruções, hook e validador são versionados. Sem commit, a responsabilidade continua obrigatória no encerramento da tarefa.

## Validação desta implementação

Passaram os 47 testes do frontend, typecheck, lint, format:check e build. Os testes do histórico verificam limite Unicode, campos obrigatórios, IDs, vínculos de detalhes, respostas de autorização e falhas de conexão. Os testes da trava usam repositórios Git descartáveis e verificam o JSON realmente no stage, inclusive quando a cópia de trabalho foi corrigida depois.

A verificação HTTP usa o servidor Nitro compilado e uma API de sessão simulada, sem contas reais nem banco. Confirmou visitante 401, ADMIN/OPERATOR 403, indisponibilidade da sessão 503 e master 200, respostas sem cache, ausência de registros nas URLs públicas e no bundle público. Após o build, reproduzir na raiz de pingo-front-crm:

```powershell
./.tools/node-v24.21.0-win-x64/node.exe ./scripts/test-agent-change-access.mjs
```

O argumento opcional `--serve` mantém a fixture isolada em `http://127.0.0.1:4310` para inspeção visual. Pressionar Enter ou Ctrl+C a encerra. Sua sessão é simulada e não concede acesso à aplicação real. O script encerra apenas o servidor que ele próprio iniciou.

No navegador, a fixture confirmou busca com e sem resultados, expansão por teclado, logout, bloqueio de ADMIN, temas claro/escuro e largura de 390 px sem rolagem horizontal. As capturas usam “Master de teste”: [resumo final](./capturas/historico-master-resumo.png), [claro](./capturas/historico-master-claro.png), [escuro](./capturas/historico-master-escuro.png) e [mobile](./capturas/historico-master-mobile.png). Os detalhes abertos foram capturados durante a conferência, antes de acrescentar seus resultados ao objeto inicial.

O hook está ativo neste clone (`core.hooksPath=.githooks`). Nenhum arquivo foi colocado no stage ou commitado nesta tarefa. A integração com uma conta real e o backend Laravel não foi exercitada; esta alteração não modifica o backend.

## Fluxo vigente após divisão dos repositórios

Execute os comandos de validação e teste deste documento na raiz de pingo-front-crm. O arquivo agora se chama data/agent-changes.json, mantendo schema, IDs e proteção. Leia [MIGRACAO_REPOSITORIOS](../MIGRACAO_REPOSITORIOS.md). Para backend, landing e documentação, o commit contém somente .agent-change.json, com ID e SHA do registro já commitado no frontend. O hook valida diretamente esse commit e rejeita reutilização do ID. Não copie registros privados para os outros repositórios.
