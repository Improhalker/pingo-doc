# PingoFin — Documentação

Produto, arquitetura, design system, validações, referências visuais e scripts de geração/sincronização. Documentos históricos não provam novas validações.

Leia README.md, ../pingo-doc/MIGRACAO_REPOSITORIOS.md e, antes de alterar código do produto, ../pingo-doc/DEFINICAO_PRODUTO.md, ARCHITECTURE.md, DESIGN_SYSTEM.md e docs/referencias-visuais/README.md. O estado implementado está no README histórico e nas validações, não apenas no planejamento inicial.

# PingoFin — guia para agentes

## 1. Contexto e ordem de leitura

PingoFin é um SaaS de gestão financeira simples para pequenos negócios. Autoescolas são o primeiro público de validação; o domínio permanece genérico. Pingo é o assistente e mascote roxo/amarelo.

### Regra obrigatória: registrar toda alteração de agente

Toda tarefa de agente que alterar código, configuração, documentação, scripts, testes ou assets DEVE acrescentar uma nova entrada em `../pingo-front-crm/data/agent-changes.json` antes de ser entregue. Começa pela implementação deste histórico. Uma entrada resume uma mudança coerente; não registrar cada comando executado nem somente anunciar que o trabalho foi feito.

- `summary`: texto objetivo em português, não vazio, com no máximo **300 caracteres Unicode**.
- `id`: identificador único e estável; `occurredAt`: data ISO UTC com milissegundos; `agent`: nome do agente responsável.
- Mudanças complexas DEVEM usar um objeto adicional em `details`, referenciado pelo `detailsId` da entrada e pelo `changeId` do detalhe. Separar contexto, comportamento, validação e limitações em seções; cada texto tem até 300 caracteres.
- Histórico é cumulativo e imutável após commit: nunca apagar/reaproveitar IDs nem reescrever entradas anteriores para substituir uma nova. Corrigir fatos com outra entrada. Coordenar IDs e reler o JSON antes de salvar em trabalhos concorrentes.
- Não incluir segredos, credenciais, dados de clientes, raciocínio privado ou resultados de testes que não ocorreram.
- **Fonte única: JSON no frontend. Banco de dados não pode armazenar nem fornecer estes logs.** Conteúdo não pertence a `public/`, ao bundle Vue, ao localStorage ou a exemplos abertos de desenvolvimento. A sessão existente serve apenas para autorizar a leitura pelo master.
- Executar o validador com `--worktree` antes da entrega. Se houver commit, incluir a entrada no stage; `.githooks/pre-commit` valida o stage e exige uma nova entrada. Não contornar a trava com `--no-verify`, nem desabilitar/remover a regra.

Comando na raiz: `node scripts/check-agent-changes.mjs --worktree` na raiz de pingo-front-crm. Um Node compatível disponível no PATH também pode executar o script. Testes e build do frontend validam o contrato do JSON automaticamente. Leia [docs/AGENT_CHANGE_LOG.md](./docs/AGENT_CHANGE_LOG.md) para o fluxo e a proteção de acesso.

Antes de alterar o projeto, leia os documentos deste repositório (README histórico registra o estado do produto):

1. `README.md`: estado implementado, ambiente e comandos reais.
2. `DEFINICAO_PRODUTO.md`: contexto e requisitos do produto.
3. `ARCHITECTURE.md`: exemplo e referência de arquitetura, com propostas e decisões abertas. Não interpretar todo o planejamento como implementação existente ou autorização para construir módulos adicionais.
4. `DESIGN_SYSTEM.md`: identidade, tokens, acessibilidade e composição.
5. `docs/referencias-visuais/README.md` e `manifest.json`: imagens, fontes, status e instruções de substituição.
6. `docs/BOOTSTRAP_VALIDATION.md`: evidências e limitações do bootstrap anterior.

O pedido atual do usuário prevalece sobre restrições históricas dos documentos. Preserve o trabalho existente e confirme o estado do código antes de ampliar o escopo.

## 2. Estado atual e escopo desta etapa

- Backend Laravel: autenticação de sessão, Sanctum, contexto de organização, Policies e diagnóstico técnico.
- Administração da plataforma (ADR-026): conta master (`platform_administrators`, criada por `php artisan platform:create-master`) que gere o cadastro das empresas em `/api/v1/platform/*` (listar, cadastrar com primeiro ADMIN, ver acessos, editar, incluir ADMIN, suspender/reativar e excluir), sem acesso aos dados de negócio das empresas. Master, ADMIN e OPERATOR são autorizações distintas; não criar `Gate::before`, papel `PLATFORM_ADMIN` nem acesso de suporte sem decisão própria. Detalhes no README.
- Frontend Nuxt/Vue: login, shell, temas claro/escuro e tokens próprios. Uma empresa por conta de cliente (ADR-028): o login abre direto a empresa única, sem seletor; sem vínculo, suspensa ou vínculos legados múltiplos → `/acesso-indisponivel`. Ajuste de legados só por `platform:legacy-memberships`; nunca escolher a primeira empresa.
- Financeiro inicial: clientes/categorias, receitas/recebimentos e despesas/pagamentos. Uma obrigação, baixas parciais/totais, auditoria atômica, lock e idempotência; despesas têm filtros por vencimento/situação. Card 07: ADMIN/OPERATOR editam metadados/total sem alterar baixas; total nunca abaixo do já baixado. Exclusão lógica somente sem baixas, com confirmação e auditoria. `expected_version` protege contra edição ou baixa concorrente. Card 09 (ADR-031): baixa errada é corrigida por linha substituta vinculada, nunca editada/apagada; só baixas vigentes contam. Card 10 (ADR-032): entrada e parcelas (várias obrigações por lançamento), lembretes internos em `/lembretes`, sem baixa automática. Sem recorrência, fornecedores, anexos, edição do cronograma salvo ou estorno. Leia README, `docs/FINANCIAL_REFINEMENT_VALIDATION.md` e `docs/CORRECTIONS_INSTALLMENTS_VALIDATION.md`.
- `/relatorios` (card 11, ADR-033): resultado mensal, extrato do realizado e a receber/a pagar via `GET /api/v1/reports/{monthly,statement,obligations}`; somente leitura, ADMIN/OPERATOR, totais do conjunto filtrado no backend e base identificada. Sem CSV/BI/saldo. Leia `docs/REPORTS_VALIDATION.md`.
- `/`: dashboard real do card 04, via `GET /api/v1/dashboard?month=YYYY-MM`. Entradas/saídas/resultado pelo mês local das baixas; a receber/a pagar gerais, incluindo atrasos e excluindo cadastros com `deleted_at`. Card 08: positivo verde/seta acima, negativo vermelho/seta abaixo, zero neutro; todos com texto explícito. Leitura consistente MySQL, somas exatas e gráfico diário acessível. ADMIN/OPERATOR consultam; master sem acesso. Leia `docs/DASHBOARD_VALIDATION.md` e `docs/FINANCIAL_REFINEMENT_VALIDATION.md`.
- `/assistente`: interface do Pingo com chatbox local, sem IA conectada e sem persistência.
- `/plataforma/alteracoes`: histórico de agentes exclusivo do master; dados em `../pingo-front-crm/data/agent-changes.json`, entregues pela rota protegida do Nuxt.
- `/dev/referencias`: galeria exclusivamente de desenvolvimento, com dados sintéticos explícitos, gráficos de referência e estados do Pingo. Não usa dados ou sessão de uma organização.
- `docs/referencias-visuais/`: referências do Horizon, gráficos SVG editáveis e imagens individuais do Pingo.

O recorte original de apresentação do Pingo/chatbox e referências visuais foi ampliado pelo usuário aos cards financeiros 01–11. As telas financeiras registram lançamentos reais pelas Actions autorizadas; o chat permanece local. Não criar API de IA, provider, SDK, chave, endpoint de inferência ou análise financeira automática. O chat não simula uma resposta inteligente nem confirma operações financeiras. O dashboard não apresenta saldo bancário/disponível: saldo inicial e contas continuam sem decisão.

Também está autorizado o histórico de alterações solicitado pelo usuário: JSON no frontend, leitura restrita ao master e registro obrigatório para agentes. Esta regra vale para todas as etapas seguintes, inclusive mudanças fora da interface do Pingo.

Exceção autorizada: o Kanban interno do projeto (`/kanban`, `../pingo-back-crm/app/Internal/Kanban`, `docs/INTERNAL_KANBAN.md`) é uma ferramenta temporária fora do produto. Segue isolada, sem `organization_id`, desabilitada por padrão e restrita às contas master da plataforma; a antiga allowlist provisória foi substituída pela autorização de plataforma. Não a ampliar nem usar como base de módulos financeiros.

## 3. Organização do código

| Caminho                                              | Responsabilidade                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `../pingo-front-crm/app/components/PingoChatBox.vue` | Apresentação e mensagens locais da sessão do componente                                               |
| `../pingo-front-crm/app/components/PingoVisual.vue`  | Renderização de imagem individual; a prancha original nunca é avatar                                  |
| `../pingo-front-crm/app/config/visual-references.ts` | Catálogo único de caminhos públicos, estados e gráficos                                               |
| `../pingo-front-crm/app/design-core/`                | Primitivos, semânticos, tipografia e aliases de componentes                                           |
| `../pingo-front-crm/app/components/ui/`              | Componentes shadcn-vue adaptados aos tokens; importar explicitamente                                  |
| `../pingo-front-crm/app/components/app/`             | Shell (sidebar, navbar com `<h1>`), menu de conta, nome da empresa (sem seletor), controle segmentado |
| `../pingo-front-crm/app/components/pingo/`           | Pingo flutuante e conversa local compartilhada com `/assistente`                                      |
| `../pingo-front-crm/public/referencias/`             | Cópias dos assets consumidos pela galeria/interface                                                   |
| `docs/referencias-visuais/`                          | Fontes, documentação, prompts e referências visuais versionadas                                       |
| `scripts/generate-visual-references.mjs`             | Geração determinística dos SVGs nos dois temas                                                        |
| `scripts/sync-visual-references.ps1`                 | Sincronização dos assets de referência para o frontend                                                |

## 4. Regras visuais

Roxo é a cor principal; amarelo é detalhe. Corpo de gota, ponta amarela curvada, contorno roxo escuro, rosto amigável e estilo 2D são invariantes do Pingo. As imagens geradas são exemplos substituíveis, não uma aprovação definitiva de branding.

Use tokens semânticos nas interfaces. Preserve leitura de valores, foco de teclado, labels permanentes, nomes acessíveis e `prefers-reduced-motion`. Não comunicar status somente por cor. Gráficos devem ter descrição textual e identificar período e base.

Horizon orienta hierarquia, card de gráfico, legenda, grade e agrupamento. Não importar sua identidade, fonte, métricas, funcionalidades extras ou paleta azul. Gráficos desta pasta usam dados sintéticos e não constituem cálculo financeiro implementado.

## 5. Figma e procedência

Arquivo anexado de referência: https://www.figma.com/design/GvdP43pVkG1wNryDPczmlY/Horizon-UI---Trendiest-Open-Source-Admin-Template-Dashboard--Community-?node-id=201-1804

Antes de executar `use_figma`, ler a skill `figma-use` disponível na sessão e informar `skillNames: "figma-use"`. Abrir o app Figma no chat quando o usuário solicitar. Consultar o arquivo anexado antes de alterar ou exportar; não editar a referência externa sem pedido específico.

Registrar arquivo, página, node ID, data e limitações no manifesto. Se o acesso ou a cota falhar, preservar referências locais e relatar a limitação; não declarar inspeção que não ocorreu. Não persistir URLs temporárias de download ou credenciais.

## 6. Troca de imagens e gráficos

Substituir um Pingo por vez em `docs/referencias-visuais/pingo/`, manter o nome estável e atualizar dimensões, descrição e procedência no manifesto. Preferir PNG transparente para o personagem. Preservar a referência oficial original em `docs/assets/pingo-referencia.jpg`.

Depois executar `./scripts/sync-visual-references.ps1`. Para editar gráficos, alterar `scripts/generate-visual-references.mjs` e executar com o Node do projeto. SVGs mantêm textos, séries, cores e grupos editáveis; PNGs/screenhots são apenas evidência visual.

## 7. Dados, sessão e segurança

Não expor `.env`, chaves ou senhas em logs/documentos. Não persistir mensagens do chat, tokens ou dados financeiros em localStorage. Limpar o chat quando mudar a organização; renderizar mensagens como texto, sem HTML. Não substituir dados reais por exemplos na aplicação autenticada.

Preservar o cliente HTTP central, cookies/CSRF e isolamento por organização. Dinheiro real segue os contratos exatos de strings da arquitetura; exemplos gráficos não definem regras de domínio. Não apagar volumes, executar migrations destrutivas ou mudar serviços de outros projetos para testar UI.

## 8. Validação e entrega

No frontend, usar `scripts/npm.ps1 run typecheck`, `run lint`, `test`, `run build` e `run format:check` conforme a alteração. Conferir visualmente a galeria em claro/escuro e mobile, envio de mensagem, teclado e troca de assets. Backend só requer nova validação quando alterado.

Relatar arquivos alterados, verificações executadas e limites reais. Não tratar documentos históricos como evidência de testes realizados nesta alteração. Evitar dependências e testes que apenas espelham alterações triviais.

## Histórico obrigatório

A fonte única é o JSON privado em `../pingo-front-crm/data/agent-changes.json`. Toda tarefa de agente deve acrescentar entrada imutável com resumo de até 300 caracteres Unicode e detalhes separados para mudanças complexas. Nunca copie o JSON para outro repositório, public/, bundle do navegador, banco ou localStorage.

No frontend, execute `node scripts/check-agent-changes.mjs --worktree` e inclua o JSON no stage. Commit do frontend deve preceder commits relacionados nos demais repositórios. Neles, atualize e inclua `.agent-change.json` com ID novo e SHA completo do commit do frontend que contém o registro. Os hooks leem o registro diretamente desse commit, recusam IDs reutilizados e não mantêm cópias do histórico.

Ative em cada clone: `git config --local core.hooksPath .githooks`. Não contornar a trava. Clone o frontend como irmão ou configure `PINGOFIN_FRONT_ROOT`. Linux usa Node compatível no PATH; Windows pode executar o setup-node.ps1 local.
