# Validação do card 11 — relatórios e fluxo de caixa detalhado

Execução local em 08/10/2026, Windows, MySQL real (`pingofin_test` nos testes; `pingofin_dev` no navegador, com empresa e conta temporárias removidas ao final). Contratos e regras: [README](../README.md#relatórios-e-fluxo-de-caixa-card-11) e ADR-033 em [ARCHITECTURE.md](../ARCHITECTURE.md).

## Decisões tomadas pelo agente (revisáveis)

O card deixava a base por categoria em aberto (`TBD` da arquitetura). Escolhas documentadas, sem consulta prévia ao usuário:

| Tema | Escolha |
| --- | --- |
| Entradas/saídas por categoria | Caixa (baixas vigentes), a mesma base do resultado mensal |
| Vendido e despesas não pagas | Colunas próprias: vendido pela data da venda; despesas pela data de vencimento das parcelas (despesa não tem data de contratação) |
| Comparação de meses | Diferença do resultado de caixa para o mês anterior do período, em texto |
| Limites | Resultado mensal até 12 meses (padrão: últimos 6); extrato e período de vencimento até 366 dias; até 100 linhas por página |
| Baixas corrigidas (card 09) | Fora dos totais; podem ser listadas no extrato só para conferência |
| Exportação CSV | Fora do recorte (o card só a previa se incluída) |
| Permissão | `report.view` para ADMIN e OPERATOR, como o dashboard |

## Backend

`artisan test`: **158 testes, todos passando** (8 novos em `ReportsTest`, 263 asserções), Pint passou. Cobertura:

- Aceite 1: entradas, saídas e resultado de outubro iguais ao `GET /dashboard` do mesmo mês; total geral e por categoria (caixa) com participação em pontos-base.
- Aceite 2: venda não recebida aparece em "a receber" e não no extrato nem nas entradas; vendido conta pela data da venda.
- Aceite 3: filtros de tipo, categoria, forma, situação (vigente/corrigida/todas) e período mudam linhas e totais juntos; recebimento parcial de R$ 300 de R$ 1.000 aparece no extrato e deixa R$ 700 no previsto; registrar o restante move o valor de um relatório para o outro.
- Aceite 4: entrada + 4 parcelas e correção de pagamento (R$ 300 → R$ 280) sem duplicar principal; a correção conta uma vez, com o valor corrigido.
- Aceite 5: outra empresa vê zero e `has_entries=false`, mesmo filtrando por categoria alheia; master 403; ADMIN de outra empresa com o cabeçalho desta 404; sem sessão 401; OPERATOR permitido.
- Limites locais/UTC: recebimento às 23h30 de 30/09 (02h30 de 01/10 em UTC) pertence a setembro no relatório mensal e no extrato.
- Paginação: duas páginas com os mesmos totais, união igual à lista completa, ordem inversa estável e página além do fim vazia com totais.
- Sem filtros, o previsto coincide com "a receber/a pagar" e atrasos do dashboard.
- Validação: 366 dias aceitos e 367 recusados, fim antes do início, data inválida, forma/tipo/situação/ordem inválidos, `per_page` acima de 100, `organization_id` proibido, 13 meses recusados e 12 aceitos.
- Lançamento excluído sai do previsto e do vendido; empresa sem lançamentos é distinguida de período sem movimento.
- Relatórios não escrevem auditoria e não aceitam POST.

## Frontend

`typecheck`, `lint`, `format:check`, `build` e `npm test` (**116 testes**; 7 novos em `reports.test.ts`: rótulos de resultado e comparação, porcentagem sem ponto flutuante, rótulo de entrada/parcela, limites de período iguais aos do servidor, navegação entre meses e link do lançamento) passaram.

## Navegador real

Conta temporária no papel OPERATOR, dados sintéticos criados pela API (venda com recebimento parcial, venda não recebida, venda parcelada com entrada, recebimento em 30/09 às 23h30, despesa paga e corrigida, aluguel de agosto):

- Resultado mensal (maio–outubro): outubro com entradas R$ 700, saídas R$ 280 e resultado R$ 420, iguais ao dashboard; setembro R$ 200; agosto -R$ 650 marcado como negativo; comparação "R$ 220,00 a mais que o mês anterior"; categorias com barras e porcentagens escritas.
- Extrato de outubro: três baixas vigentes em ordem; com "Somente saídas" e "Vigentes e corrigidas", a baixa original de R$ 300 aparece como "Corrigida · fora dos totais" e o total de saídas continua R$ 280; a lista de categorias acompanha o tipo escolhido.
- A receber e a pagar: R$ 2.000 a receber (R$ 700 em atraso) e R$ 20 a pagar, iguais ao dashboard; parcial mostra "já baixado" e "baixa parcial"; período invertido mostra o erro sem consultar; o link de uma parcela abriu a receita com a parcela 2 de 4 pré-selecionada.
- Período sem movimento (jan–mar) mostra "Nenhum movimento neste período."
- 320px nos temas escuro e claro: sem rolagem horizontal nas três visões; tabelas empilhadas com rótulos.

Ajustes feitos durante a validação: nome do mês sem quebra de linha na tabela; o tipo da linha do extrato passou a ser "Recebimento/Pagamento" para não confundir com "Entrada" do parcelamento; nota de que as porcentagens são truncadas.

## Limitações reais

- O estado de erro de leitura foi verificado por código e por consistência com as outras telas, não provocado no navegador.
- A lista de categorias dos filtros carrega até 100 categorias; acima disso, as excedentes não aparecem no seletor (os relatórios em si não são afetados).
- Sem exportação, gráfico de barras mensal ou recorrência (card 13). O previsto não projeta contas futuras ainda não lançadas.
- Mostra somente o que foi registrado no PingoFin; não é saldo bancário nem cobre movimentos não lançados.
