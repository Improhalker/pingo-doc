# Dashboard básico — card 04

Implementado em 06/10/2026 no ambiente local. A página `/` consulta a API real da organização aberta. Cards 02 e 03 fornecem as receitas/recebimentos e despesas/pagamentos. A leitura não cria movimentos financeiros.

## Contrato e cálculo

`GET /api/v1/dashboard?month=2026-10`, com sessão e `X-Organization-Id`. Mês opcional (padrão: mês atual no fuso da empresa), formato `YYYY-MM`, de 2000-01 a 2100-12. `organization_id` e `timezone` na query são proibidos. ADMIN e OPERATOR consultam pela Policy; master sem vínculo ou empresa alheia recebem 404. Organização suspensa recebe 403.

| Campo | Base |
| --- | --- |
| `period` | Mês, primeira/última data civil e fuso IANA autorizado |
| `as_of` / `today` | Instante UTC da consulta / dia atual da empresa |
| `monthly.income` | Recebimentos efetivos no mês local |
| `monthly.expenses` | Pagamentos efetivos no mês local |
| `monthly.result` | Entradas menos saídas, em base de caixa |
| `outstanding.receivable` / `payable` | Restantes de todos os vencimentos, incluindo atrasos e datas fora do mês |
| `outstanding.overdue_*` | Parcela restante com vencimento anterior a hoje no fuso da empresa |
| `daily` | Valores por dia civil; dias sem baixa têm `"0.00"` |
| `due.overdue` / `upcoming` | Até seis itens por lista, total de itens e link pelo tipo/ID do lançamento |

O horizonte dos próximos vencimentos é hoje até hoje + 30 dias, inclusive. Vencimento hoje não é atraso; quitados não aparecem. Obrigações distantes continuam nos indicadores gerais, mesmo fora desse horizonte.

As baixas de cada obrigação são somadas antes dos joins. A query trata recebimentos/pagamentos e obrigações separadamente; várias baixas nunca repetem o principal. Dinheiro usa DECIMAL/bcmath e strings canônicas na API; o frontend formata com BigInt. O gráfico converte somente coordenadas normalizadas para Number, preservando os valores exatos na tabela.

O mês usa intervalo UTC fechado no início e aberto no início do próximo mês. Cada dia tem limites próprios convertidos pelo Carbon a partir do fuso da empresa, sem depender das tabelas de fuso do MySQL. As cinco consultas financeiras compartilham uma transação InnoDB em REPEATABLE READ. O isolamento é aplicado à próxima transação, sem alterar o padrão da sessão. Respostas `no-store`, sem cache dos números.

## Testes e verificações

Executados com MySQL/InnoDB real no banco dedicado e protegido `pingofin_test`:

- Suíte backend: **102 testes, 1.128 asserções**; Pint passou.
- Oito testes de dashboard: aceite 400/100/300/600/200, baixas múltiplas, centavos exatos, totais acima do limite de um lançamento, resultado negativo e fevereiro bissexto.
- Limites inclusivo/exclusivo do mês com microssegundos em São Paulo; hora repetida em Nova York e diferença de offset entre início e fim de novembro.
- Vencimento hoje/ontem no dia local, categorias/clientes arquivados no histórico, quitados ausentes, listas limitadas e horizonte inclusivo. Pendências independentes do mês escolhido.
- Isolamento, master sem acesso, visitante, contexto ausente, empresa suspensa, mês inválido e vazio.
- Um teste de consistência usa fixtures commitadas e **segunda conexão MySQL**: insere um pagamento após a primeira agregação. A resposta conserva saídas 0 e restante 300; a consulta seguinte vê saídas 100 e restante 200. Funciona com padrão da sessão READ COMMITTED, que permanece inalterado.
- Frontend: **96 testes** passaram, além de typecheck e lint. Contrato HTTP, erro sem valores zerados inventados, descarte de respostas de mês/empresa anterior, gráfico vazio, precisão além de Number seguro e navegação mensal entre anos.
- Formatação completa e build Nuxt/Nitro passaram. O build incluiu a nova entrada privada do histórico; manteve o aviso transitivo conhecido DEP0155 de `@vue/shared` e um aviso de tempos de callbacks do Vite. Ambos sem falha de build.
- Validador obrigatório `check-agent-changes.mjs --worktree` e `git diff --check` passaram. A entrada tem resumo/detalhes de até 300 caracteres, data ISO UTC com milissegundos e preserva o histórico anterior.

Comandos na pasta correspondente:

```powershell
# backend
../scripts/php.ps1 artisan test --compact
../scripts/php.ps1 vendor/bin/pint --test
# frontend
../scripts/npm.ps1 run typecheck
../scripts/npm.ps1 run lint
../scripts/npm.ps1 test
../scripts/npm.ps1 run format:check
../scripts/npm.ps1 run build
# raiz
./.tools/node-v24.21.0-win-x64/node.exe ./scripts/check-agent-changes.mjs --worktree
```

## Conferência no navegador

Usei somente a conta e as empresas sintéticas já existentes no desenvolvimento. Nenhum cliente real, nova baixa ou novo cadastro foi necessário. Os registros locais anteriores confirmaram os cinco valores do aceite. Recarregar pediu a escolha de empresa novamente e preservou os números ao reabrir A.

- Setembro sem baixas mostrou entradas/saídas/resultado zero e conservou 600/200 nas pendências gerais.
- Trocar para B (OPERATOR) mostrou cinco valores zero e nenhuma pendência de A. Voltar para A recarregou pela API.
- Navegação mensal e abertura da tabela diária pelo teclado. A tabela mostrou 400/100 em 06/10 e zeros nos demais dias.
- Desktop claro/escuro; mobile 390 e 320 px. Corrigi o gráfico compacto para manter eixos legíveis. Sem rolagem horizontal da página; tabela com área de rolagem própria quando necessária. Um único h1, no shell.
- A preferência de tema Sistema e o viewport original foram restaurados. A aba do dashboard permanece aberta.

Capturas da interface real com dados sintéticos:

- [Desktop claro](./capturas/dashboard/desktop-claro.png)
- [Desktop escuro](./capturas/dashboard/desktop-escuro.png)
- [Mobile escuro, 390 px](./capturas/dashboard/mobile-escuro.png)
- [Mobile claro, 320 px](./capturas/dashboard/mobile-320-claro.png)

A composição usa DESIGN_SYSTEM e os SVGs locais `fluxo-caixa-light.svg`/`fluxo-caixa-dark.svg`: card, legenda, grade e linhas distinguíveis. A tela financeira renderiza seus próprios dados da API; não incorpora a imagem ou os valores da galeria. Não houve nova inspeção ou edição do Figma nesta tarefa.

## Arquivos e limites

Backend: `DashboardRequest`, `DashboardController`, `DashboardQuery`, método da `OrganizationPolicy`, capacidade em `OrganizationAccess`, rota e dois arquivos de testes. Frontend: `index.vue`, três componentes `finance/Dashboard*`, DTO, serviço, helpers do gráfico e testes. Documentação: README, AGENTS, este relatório, capturas e nova entrada cumulativa no JSON dos agentes.

O card 04 (ID 8) foi movido para Concluído pelo serviço existente do Kanban; os quatro cards 01–04 estão concluídos.

Sem migrations ou dependências novas. Não há saldo bancário/disponível, previsão de caixa, relatórios avançados, exportação ou IA. Sem atualização em tempo real: depois de alterar lançamentos em outra aba, usar Atualizar. A empresa escolhida continua sem persistência no navegador. Não foi exercitado leitor de tela real nem falha de API no navegador; erros HTTP foram testados em unidade. Esta entrega é local, sem commit, push ou deploy. O histórico privado de agentes mantém sua fonte única no JSON do frontend e sua autorização master; auditoria financeira é separada.
