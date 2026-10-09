# Kanban interno do projeto

Ferramenta **temporária e interna** para acompanhar o desenvolvimento do PingoFin. Não faz parte do produto das empresas clientes, não aparece em menus e não depende de organização, nem os módulos financeiros dependem dela.

- Página: `http://localhost:3000/kanban` (acesso somente pela URL).
- API: `/api/v1/internal/kanban/tasks` (Sanctum por sessão, sem `X-Organization-Id`).
- Quadro único e compartilhado, com quatro colunas fixas: A fazer (`TODO`), Em andamento (`IN_PROGRESS`), Em validação (`IN_REVIEW`) e Concluído (`DONE`). Começa vazio; não há seeds.
- Tarefa: ID, título (obrigatório, até 120 caracteres), descrição opcional em texto simples (até 2.000), status, posição, `created_at` e `updated_at` (UTC).

## Habilitar, autorizar e desabilitar

A ferramenta vem **desabilitada**. Em `backend/.env` (ignorado pelo Git):

```dotenv
INTERNAL_KANBAN_ENABLED=true
```

- Entre com uma conta master em `/plataforma/login` e abra `/kanban`. A autorização usa o vínculo existente em `platform_administrators`, conferido pelo backend em cada operação, sem exigir organização selecionada.
- ADMIN/OPERATOR de empresas não concedem acesso. A antiga variável `INTERNAL_KANBAN_ALLOWED_EMAILS` não é mais consumida; pode ser removida do `.env` local.
- Se `config:cache` estiver em uso, execute `php artisan config:clear` (ou recarregue o cache) após alterar.
- Para desabilitar, defina `INTERNAL_KANBAN_ENABLED=false`. A API responde 403 (`INTERNAL_KANBAN_DISABLED`), a página mostra “Ferramenta desativada” e nada é apagado.

A autorização master substitui a allowlist provisória, conforme a evolução prevista. Para criar uma conta master, utilize o comando `platform:create-master` documentado no README; não altere papéis de organização para conceder esse acesso. Remover o vínculo master revoga o acesso às próximas chamadas, inclusive em uma sessão já autenticada. A flag continua permitindo desabilitar a ferramenta inteira sem apagar tarefas.

Respostas da API: visitante 401; ferramenta desabilitada 403 `INTERNAL_KANBAN_DISABLED`; conta sem autorização master 403 `INTERNAL_KANBAN_FORBIDDEN`. Na página, visitantes vão ao login master e contas de empresas à página de acesso negado da plataforma.

## Endpoints

| Operação | Rota |
| --- | --- |
| Listar (ordem determinística: coluna, posição, id) | `GET /tasks` |
| Criar (entra no fim de A fazer) | `POST /tasks` `{title, description?}` |
| Editar título/descrição | `PATCH /tasks/{id}` `{title, description?}` (descrição ausente mantém; `null` limpa) |
| Excluir | `DELETE /tasks/{id}` (204) |
| Mover/reordenar | `POST /tasks/{id}/move` `{status, position}` — resposta traz o quadro inteiro |

Campos não declarados são recusados com 422. `position` é o índice (base 0) na coluna de destino, contado sem a tarefa movida; valores acima do tamanho da coluna são recusados.

## Concorrência

Toda escrita roda em uma transação InnoDB que trava as linhas da tabela em ordem de `id`: escritas simultâneas são serializadas e **a última confirmada prevalece** sobre o estado atual do servidor. As posições das colunas afetadas são renumeradas de 0 a n-1 na mesma transação (vizinhos não têm `updated_at` alterado). Se qualquer passo falhar, tudo é revertido. Não há WebSockets, versionamento otimista ou colaboração em tempo real: outra pessoa só vê alterações ao recarregar, e a resposta de cada movimentação devolve o quadro autoritativo.

No navegador, a movimentação é otimista, mas apenas uma escrita fica em andamento por vez (a interface é bloqueada enquanto salva). Se a API recusar, a posição anterior é restaurada e um erro é exibido. Respostas de requisições canceladas ou antigas são ignoradas.

## Interface

Arrastar e soltar usa a API nativa de drag and drop do navegador, sem dependência nova. Como ela não funciona de forma confiável em telas de toque nem por teclado, cada card oferece “Mover para” (fim da coluna escolhida), “Subir” e “Descer”. Em até 640px as colunas empilham e há links de navegação por coluna.

## Exportar tarefas antes de remover

```sql
SELECT id, title, description, status, position, created_at, updated_at
FROM internal_kanban_tasks ORDER BY status, position, id;
```

Execute no `pingofin_dev` (ou no banco desejado) com o cliente MySQL do projeto e salve o resultado em CSV/JSON.

## Remover a ferramenta no futuro

1. Exporte as tarefas (acima) e desabilite com `INTERNAL_KANBAN_ENABLED=false`.
2. Apague `backend/app/Internal/Kanban/`, `backend/routes/internal-kanban.php`, `backend/config/internal_kanban.php`, `backend/tests/Feature/InternalKanbanTest.php` e a linha `require __DIR__.'/internal-kanban.php';` em `backend/routes/api.php`.
3. Em `backend/bootstrap/app.php`, remova o bloco que preserva os códigos `INTERNAL_KANBAN_`; em `config/cors.php`, `PATCH`/`DELETE` podem ser removidos se nenhuma outra rota os usar.
4. Apague `frontend/app/pages/kanban.vue`, `layouts/internal.vue`, `components/internal/`, `composables/useInternalKanban.ts`, `services/internal-kanban.ts`, `types/internal-kanban.ts`, `utils/internal-kanban.ts` e `tests/internal-kanban.test.ts`.
5. Remova as variáveis `INTERNAL_KANBAN_*` dos arquivos `.env`/`.env.example`.
6. A tabela `internal_kanban_tasks` **não** é removida automaticamente. Se desejado, crie uma migration nova com `Schema::dropIfExists('internal_kanban_tasks')`; não edite a migration já aplicada.

## Limitações

- Não há acesso separado para colaboradores internos: somente contas master enquanto a ferramenta estiver habilitada.
- Sem histórico de alterações, comentários, responsáveis, prazos, anexos ou múltiplos quadros.
- Drag and drop nativo não funciona em telas de toque; use os controles alternativos.
