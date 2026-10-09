# Despesas e pagamentos — validação do card 03

Implementação conferida em 06/10/2026. Card interno 7, “03 · Despesas e pagamentos — primeira versão”. Os cards 01 e 02 estavam concluídos. O escopo mantém uma obrigação por despesa e pagamentos totais ou parciais explícitos.

## Comportamento entregue

- `/despesas`: busca por descrição/categoria, paginação, situação e intervalo inclusivo de vencimentos. Vencimento hoje é pendente; atraso usa o dia da organização. Quitação deriva do restante zero.
- `/despesas/nova`: descrição, categoria ativa EXPENSE da empresa, total, vencimento, forma prevista e observações. Categorias têm busca quando o catálogo excede 100 itens. Cadastrar não cria saída efetiva.
- `/despesas/{id}`: total, pago, restante e pagamentos com valor, forma, instante e autor. Recebe pagamento parcial ou total e recusa valores superiores ao restante.
- API Laravel: `GET/POST expenses`, `GET expenses/{id}` e `POST payables/{id}/payments`, dentro de `/api/v1`, com sessão e contexto de organização. ADMIN e OPERATOR criam/pagam; master continua sem acesso ao financeiro.
- MySQL: `expenses`, `payables`, `payments`, dinheiro DECIMAL e FKs compostas por empresa, restritivas. Actions gravam auditoria e idempotência na mesma transação. A baixa bloqueia a obrigação antes de recalcular o restante.

## Verificações executadas

| Verificação                                     | Resultado                                                |
| ----------------------------------------------- | -------------------------------------------------------- |
| `../scripts/php.ps1 artisan test`               | 93 testes, 969 asserções, MySQL dedicado `pingofin_test` |
| `../scripts/php.ps1 vendor/bin/pint --test`     | Passou                                                   |
| `../scripts/npm.ps1 test`                       | 88 testes em 7 arquivos                                  |
| `../scripts/npm.ps1 run typecheck`              | Passou                                                   |
| `../scripts/npm.ps1 run lint`                   | Passou                                                   |
| `../scripts/npm.ps1 run format:check`           | Passou                                                   |
| `../scripts/npm.ps1 run build`                  | Build Nuxt/Nitro passou                                  |
| Migration aditiva de despesas em `pingofin_dev` | Aplicada, sem remover dados existentes                   |

Os novos testes cobrem criação sem baixa, 300/100/200, métodos e instantes preservados, valores exatos (inclusive 0,10 + 0,20), limites monetários, referências externas/arquivadas, ADMIN/OPERATOR/master, revogação, filtros e datas inválidas. Auditoria com falha desfaz despesa/pagamento e reserva da chave. FKs impedem troca de empresa e exclusão de registros com histórico.

Concorrência usa duas conexões MySQL com dados commitados: um lock externo bloqueia a baixa; uma segunda escrita com a mesma chave é reproduzida; um pagamento de 250 commitado entre a consulta da chave e o lock faz uma tentativa de 100 ser recusada com restante 50. Os dois últimos cenários controlam a intercalação das conexões via eventos de consulta; não são um teste de carga com servidores HTTP paralelos.

## Navegador e aparência

Foi usada exclusivamente a conta sintética local `dev@pingofin.test` nas organizações de teste A/B. Nenhum dado de cliente real foi criado ou alterado.

- Cadastro real de despesa sintética de R$300, vencendo hoje, e pagamento de R$100 em dinheiro: detalhe mostrou 300/100/200 e histórico com forma, autor e horário.
- Pagamento de R$201 bloqueado pela interface; os testes também provam a recusa no backend. Idempotência e concorrência foram verificadas pelos testes, sem manipular o navegador para forçar requisições.
- Reload pediu novamente a empresa, conforme o contrato existente; selecionar A conservou valores e método. Trocar para B mostrou “Despesa não encontrada nesta empresa”; sua listagem permaneceu vazia.
- Tema claro desktop, tema escuro e larguras de 390/320 px. Foi corrigido overflow de 7 px nos filtros em 320 px, usando duas linhas de opções. Menu mobile abre e fecha com Escape; filtros respondem às setas do teclado.
- O seletor de situação permanece habilitado durante a consulta para preservar o foco de teclado; a consulta mais recente cancela a anterior.

Capturas com dados sintéticos: [detalhe claro](./capturas/despesas/detalhe-claro.png), [detalhe mobile escuro](./capturas/despesas/detalhe-mobile-escuro.png) e [listagem em 320 px](./capturas/despesas/lista-mobile-320.png).

## Limites

Sem parcelamento, recorrência, fornecedores, anexos, edição, cancelamento, estorno, dashboard ou IA. O intervalo da listagem filtra vencimentos; não é um relatório de saídas por data de pagamento. Dashboard é o card 04. TTL/limpeza das chaves idempotentes continua aberto, conforme o contrato das receitas.

O build mantém o aviso transitivo conhecido DEP0155 de `@vue/shared`. Não houve troca de dependências, publicação, commit ou push. Mudanças preexistentes do Kanban foram preservadas; a conclusão deste card só altera sua posição pelo serviço interno existente.

O registro obrigatório desta implementação fica em `frontend/data/agent-changes.json`, com fonte exclusiva no frontend e leitura restrita ao master. A auditoria financeira é distinta desse histórico e segue a transação de domínio já existente.
