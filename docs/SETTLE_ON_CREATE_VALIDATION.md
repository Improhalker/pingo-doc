# Validação do card 06 — vencimento livre e quitação à vista no cadastro

Execução local em 07/10/2026, Windows/PowerShell, MySQL real (`pingofin_test` nos testes, `pingofin_dev` no navegador). Contrato e regras no [README](../README.md#vencimento-livre-e-quitação-à-vista-no-cadastro-card-06); decisão ADR-029 em [ARCHITECTURE.md](../ARCHITECTURE.md).

## Backend

`artisan test`: **122 testes, 1.339 assertions, todos passando**, dos quais 8 novos em `SettleOnCreateTest`. Pint passou. Os cenários usam o relógio fixado em 07/10/2026 15:00 em America/Sao_Paulo:

- Receita pendente com venda em 07/10 e vencimento em 20/10: vencimento preservado, situação pendente e nenhuma baixa. Uma data de vencimento passada não gera baixa (situação atrasada).
- Receita "já recebida" de R$ 300 via Pix: situação recebida, restante zero, vencimento interno igual ao dia do recebimento (07/10), forma prevista igual à efetiva e o mesmo estado após recarregar. Duas auditorias são gravadas e uma nova baixa é recusada.
- Despesa pendente com vencimento em 20/10 e despesa "já paga" de R$ 300 via Pix, com situação quitada e restante zero.
- Dashboard: entradas e saídas contam somente as baixas, no mês local do instante efetivo; um pagamento de 30/09 às 23h30 conta em setembro. Pendentes permanecem em a receber/a pagar.
- Reenvio com a mesma `Idempotency-Key`: o mesmo registro é devolvido, sem duplicar lançamento nem baixa. A mesma chave com outra quitação responde 409.
- Falha simulada na auditoria da baixa (a última gravação) desfaz venda/despesa, obrigação, baixa, chave de idempotência e auditorias.
- Validação: recebimento no futuro ou anterior à venda, forma ausente ou inválida, instante malformado, campo `amount` extra, `due_date`/`expected_method` junto com a quitação e vencimento ausente no modo pendente. Nada é gravado em nenhum desses casos.
- Isolamento: OPERATOR cria quitado; categoria de outra empresa é recusada; master recebe 403.

## Frontend

`typecheck`, `lint`, `format:check`, `test` e `build` passaram. Não foram criados testes de frontend específicos: a lógica nova fica nas páginas e foi exercitada no navegador.

## Navegador real

Executado com uma empresa e uma conta temporárias, removidas ao final junto com seus lançamentos:

- Nova receita pendente, venda em 07/10 com vencimento escolhido em 20/10. Mudar a data da venda depois não alterou o vencimento escolhido; antes da escolha, o vencimento acompanhava a venda como sugestão.
- Nova receita "Já recebi à vista" via Pix: o detalhe mostra Recebido, R$ 300 recebidos e restante zero. Com a página totalmente carregada, o horário efetivo editado (10:30 e 09:15) foi gravado como escolhido.
- Dois cliques seguidos em enviar geraram um único registro (IDs consecutivos, sem duplicata).
- Nova despesa pendente (20/10, boleto). Depois, um pagamento parcial de R$ 100 pelo detalhe, com digitação real, deixou R$ 200 a pagar.
- Nova despesa "Já paguei à vista" com digitação e cliques reais: Quitado, restante zero, mantido após recarregar.
- Dashboard do mês: entradas R$ 330 (só baixas), saídas R$ 400 (R$ 300 à vista + R$ 100 parcial), a receber R$ 300 (receita pendente) e a pagar R$ 200. No banco: 11 auditorias, coerentes com 4 receitas, 3 recebimentos, 2 despesas e 2 pagamentos.
- Teclado: o controle de modo é um grupo de opções com nome acessível ("Esta venda já foi recebida?"/"Esta despesa já foi paga?"). Tab e Espaço selecionam a opção.
- 320px nos temas claro e escuro: sem rolagem horizontal. Um problema encontrado e corrigido: os rótulos do controle de modo estouravam a borda; agora ocupam a largura toda e quebram linha.

## Limites e observações

- Com teclado real, a seta move o foco entre as opções do `AppSegmented`, mas não seleciona; é preciso Espaço. Esse comportamento vem do componente compartilhado (reka-ui), usado também em outras telas, e não foi alterado nesta tarefa.
- Parte do preenchimento foi feita por script de página. Quando o script rodou antes de a página terminar de carregar, os valores ficaram só no DOM; por isso os fluxos decisivos foram repetidos com a página carregada ou com digitação real.
- O seletor nativo de data e hora aparece no formato do idioma do navegador.
- Sem parcelas, recorrência, estorno ou edição de baixas.
