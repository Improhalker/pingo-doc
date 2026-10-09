# Refinamento financeiro — cards 07 e 08

Data: 08/10/2026. Cards do Kanban local: 11 (07) e 12 (08). Implementação em Laravel/Nuxt, com o financeiro real existente e sem integração de IA.

## Comportamento e limites

As ações **Editar** e **Excluir** aparecem nas listas e nos detalhes de receitas/despesas. O diálogo busca uma versão atual antes de abrir o formulário. Cancelar descarta o rascunho. Categorias/clientes ativos têm busca pelo nome; o vínculo atual arquivado continua disponível. Alterar a busca preserva a opção já escolhida.

ADMIN e OPERATOR têm as capacidades de editar/excluir. Referências e operações são isoladas por empresa; master não ganha acesso financeiro. Campos editáveis: descrição/registro, categoria, total, observações, vencimento e forma prevista; receita também permite cliente e data da venda. Instante de cadastro, autor e baixas anteriores são imutáveis.

- Total não pode ficar abaixo da soma das baixas. Reduzir até o já baixado quita o restante; aumentar um total quitado reabre a pendência. Não há pagamento/recebimento automático na edição.
- Data da venda alterada não pode superar o primeiro recebimento existente no fuso da empresa. Data original de legados pode ser mantida em correções de metadados. Vencimento deve ser igual ou posterior à venda; datas civis seguem os limites dos formulários.
- Exclusão só ocorre **sem baixas**, após confirmação com descrição, valor e efeito. `deleted_at` preserva cadastro, obrigação e auditoria e retira o lançamento das listas, detalhes e pendências. Não altera caixa mensal. Não há restauração pela interface.
- Qualquer baixa parcial ou total bloqueia exclusão e explica que seria necessário estorno. Estorno, parcelas, recorrência e edição de baixas continuam fora deste recorte.
- `PATCH` recebe dados completos e `expected_version`; `DELETE`, a versão esperada. Ambas exigem `Idempotency-Key`. Mesmo reenvio reproduz a resposta sem nova auditoria, inclusive depois da exclusão. Versão desatualizada retorna 409 `FINANCIAL_ENTRY_CHANGED`; a interface oferece recarga explícita que descarta o rascunho.
- O lock usa a ordem obrigação → cadastro, inclusive nas baixas, que também incrementam versão. Recalcula valores persistidos sob o lock. Cadastro, obrigação, auditoria antes/depois e reserva idempotente participam da mesma transação; falha de auditoria desfaz tudo. ID antigo de obrigação excluída não permite baixar.

Migração **aditiva**, aplicada no banco de desenvolvimento: `2026_10_08_000004_add_financial_entry_revision_and_soft_deletion`. `version` inicia em 1 e `deleted_at` em nulo nas tabelas existentes. Aplicar com `../scripts/php.ps1 artisan migrate --no-interaction` em `backend`; não executar reset ou migrations destrutivas.

O card 08 mantém o cálculo por baixas no mês selecionado: resultado positivo usa sucesso + seta para cima + texto; negativo usa erro + seta para baixo + texto e sinal negativo; zero usa superfície neutra, símbolo de igualdade e texto. A seta representa o sinal, sem percentual ou comparação entre meses. O carregamento limpa o dado anterior; erro não aparece como zero. Cores usam tokens existentes dos dois temas, com texto e ícones acessíveis.

## Validação automatizada desta alteração

- Backend: **132 testes / 1.567 assertions**, suíte completa em MySQL `pingofin_test`. `FinancialEntryChangesTest` cobre correção dos campos, vínculos, baixas parciais/totais, exclusão lógica, dashboard, reenvio, conflito de versão, outra empresa/master, precisão inválida, referência arquivada, venda posterior à baixa e rollback da auditoria.
- Concorrência real: `ExpenseConcurrencyTest` usa outra conexão MySQL para confirmar bloqueio da edição pelo lock de baixa e recusa de exclusão após pagamento concorrente, sem registrar reserva idempotente da operação rejeitada. Também preserva os testes anteriores de baixa/reenvio.
- Frontend: **103 testes**, incluindo contratos PATCH/DELETE com CSRF, empresa, valor exato, versão, chave, aborto e rejeição de 403/404/409/422. Os testes existentes de dinheiro/dashboard preservam centavos e valores negativos.
- Passaram Pint, typecheck, lint, format:check, build e validador obrigatório do histórico com `--worktree` (23 entradas, preservando o histórico commitado). O build usa Nitro, preservando a rota do histórico exclusiva do master. Avisos de tempo dos plugins Vite e de depreciação do pacote Vue não impediram a compilação.

## Conferência no navegador

Usada uma empresa de teste com nome e registros explicitamente sintéticos no banco **de desenvolvimento**, com login normal de um ADMIN temporário. A sessão foi encerrada e a fixture removida após a conferência, com guardas de banco, nome, e-mail e vínculos. Nenhum lançamento de empresa real foi alterado. O cenário confirmou:

- Receita editada pela lista: descrição, cliente, categoria, total, data da venda, vencimento e observação aparecem atualizados após a resposta real da API. Cancelar um rascunho não salvou a descrição.
- Despesa editada pelo detalhe em 320 px, com categoria, valor, vencimento e forma prevista atualizados. Tab alcança “Salvar alterações”; Enter salva. O detalhe recarrega e a forma sugerida da futura baixa acompanha a correção.
- Confirmação de exclusão cancelável; depois de excluir a despesa sintética sem baixas, a lista mostra o aviso e a pendência desaparece do dashboard. Caixa de outubro continua `600.00 − 300.00 = 300.00`.
- Receita integralmente recebida mostra o motivo do bloqueio e confirmação de exclusão desabilitada. Os testes de API cobrem também a baixa parcial e o estorno indisponível.
- API real: outubro `300.00` positivo, setembro `-100.00` negativo, agosto `0.00` neutro, julho `0.01` positivo e junho `-0.01` negativo. Troca de mês por controles anteriores/atual. Conferidos temas claro e escuro, texto acessível na árvore e largura de 320 px.
- Corrigidos excedentes de largura do diálogo, do cabeçalho com nome de empresa longo e dos filtros de receita. Tabelas mantêm valores e ações em linhas empilhadas no celular; títulos das linhas têm largura mínima no desktop. Galeria e Pingo não foram alterados.

Capturas em [capturas/refinamento-07-08](./capturas/refinamento-07-08/): [positivo](./capturas/refinamento-07-08/resultado-positivo.jpg), [negativo](./capturas/refinamento-07-08/resultado-negativo.jpg), [zero](./capturas/refinamento-07-08/resultado-zero.jpg), [escuro](./capturas/refinamento-07-08/resultado-positivo-escuro.jpg), [edição em celular](./capturas/refinamento-07-08/edicao-mobile.jpg), [exclusão em celular](./capturas/refinamento-07-08/exclusao-mobile.jpg) e [dashboard em celular](./capturas/refinamento-07-08/dashboard-mobile.jpg).

Não foi executada uma sessão com leitor de tela dedicado nem simulação visual de queda de rede. Erros e rollback foram exercitados pelos testes; labels, mensagens e foco foram conferidos na interface. Atualização de outra aba continua exigindo recarregar/Atualizar; não há push em tempo real. O histórico de agentes segue no JSON frontend e não se confunde com a auditoria financeira no banco.
