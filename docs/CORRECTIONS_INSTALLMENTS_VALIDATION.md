# Validação dos cards 09 e 10 — correção de baixas, entrada, parcelas e lembretes

Execução local em 08/10/2026, Windows, MySQL real (`pingofin_test` nos testes; `pingofin_dev` no navegador, com empresa e conta temporárias removidas ao final). Regras e contratos: [README](../README.md#corrigir-recebimentos-e-pagamentos-card-09) e ADR-031/ADR-032 em [ARCHITECTURE.md](../ARCHITECTURE.md).

## Decisões tomadas com o usuário antes de implementar

| Tema | Decisão (08/10/2026) |
| --- | --- |
| Correção de baixa | Correção vinculada: a original fica guardada como "corrigida" e uma linha substituta passa a valer; caixa e dashboard refletem o valor/data/forma corretos. Devolução real fica para outra tarefa |
| Quem corrige | ADMIN e OPERATOR, sempre com motivo e histórico |
| Centavos na divisão | Na última parcela (R$ 100 em 3x = 33,33 + 33,33 + 33,34) |
| Dias 29 a 31 | Último dia dos meses mais curtos, voltando ao dia original depois |

Decisões complementares minhas, documentadas: lembrete padrão "no dia do vencimento" (editável, opcional); só a entrada pode nascer baixada; um parcelamento tem de 2 a 60 linhas; edição de lançamento parcelado não altera total, vencimentos nem formas; correção exige mudança real e não ultrapassa o que falta na parcela somado à própria baixa.

## Backend

`artisan test`: **150 testes, todos passando** (18 novos: 7 em `SettlementCorrectionTest`, 11 em `InstallmentScheduleTest`), Pint passou. Cobertura:

- Card 09: aceite R$ 500 → R$ 400 com original rastreável, efeito de R$ 100, auditoria antes/depois e dashboard; correção de data movendo o valor de setembro para outubro; reenvio idempotente, chave reaproveitada com outro corpo (409), versão desatualizada após nova baixa (409), baixa já corrigida (409), cadeia de correções e limite do saldo da parcela; motivo obrigatório, "nada mudou", valor zero/excedente, instante futuro e campo proibido; outra empresa (404), master (403) e OPERATOR permitido; falha na auditoria desfaz tudo; correção de pagamento e exclusão ainda bloqueada.
- Card 10: aceite R$ 1.200 com entrada R$ 400 recebida e 4 × R$ 200 com vencimentos, formas e lembretes próprios; dashboard/listas sem duplicar; entrada pendente sem baixa; baixa parcial limitada ao saldo da parcela e reenvio sem duplicar; lembretes na data local, só o restante, parcela quitada some, isolamento e master negado; próximos 7 dias e situação atrasada; soma inexata, entrada fora da primeira linha, baixa em parcela comum, campos faltantes, vencimento antes da venda, formatos misturados e mínimo de 2 linhas; rollback completo; despesa parcelada com entrada paga e filtro por período; legado de uma obrigação com lembrete; edição/exclusão de parcelados; `Money::split`.
- Os 132 testes anteriores (inclusive card 07, dashboard e concorrência) continuam passando com a nova agregação por parcelas.

A migration aditiva foi aplicada ao `pingofin_dev` por `migrate` (sem `fresh`).

## Frontend

`typecheck`, `lint`, `format:check`, `build` e `npm test` (**109 testes**, incluindo `installments.test.ts`: centavos, calendário 29–31, prévia do aceite, entrada inválida e efeito da correção) passaram.

## Navegador real

Com a conta temporária no papel OPERATOR, digitação e cliques reais:

- Nova receita → Parcelado: total R$ 1.200, entrada R$ 400 "já recebida" em dinheiro, 4 parcelas a partir de 10/11, lembrete 3 dias antes. A prévia mostrou entrada + 4 × R$ 200 nos dias 10 e lembretes no dia 7; alterar a última para R$ 199,99 indicou diferença de R$ 0,01; a forma da parcela 2 foi trocada para cartão. Após registrar: recebido R$ 400, restante R$ 800, cinco linhas com seus vencimentos e situações.
- "Registrar" na parcela 2 selecionou a parcela, a forma prevista (cartão) e focou o valor; R$ 250 foi recusado pelo saldo da parcela; R$ 50 registrou baixa parcial (parcela com R$ 150 restantes).
- Corrigir a entrada R$ 400 → R$ 350: revisão com antes/depois e "menos R$ 50,00 recebido; restante R$ 0,00 → R$ 50,00". Cancelar não alterou o banco; confirmar gravou a linha substituta, marcou a original e o histórico passou a mostrar "Corrigido" e "Correção vigente" com o motivo.
- Lembretes: uma receita com lembrete hoje e a parcela 1 de 2 de uma despesa com entrada paga apareceram em "Para hoje"; "Revisar e registrar" abriu a despesa com a parcela pré-selecionada.
- Dashboard e banco conferidos: entradas R$ 400 (R$ 350 corrigidos + R$ 50), saídas R$ 300, a receber R$ 950, a pagar R$ 600; a baixa original não entra nos totais.
- Celular 320px, tema escuro e claro: sem rolagem horizontal no parcelamento, na tabela de parcelas e no histórico; contraste do texto auxiliar 5,1:1 (claro) e 8,8:1 (escuro).

### Problemas encontrados e corrigidos durante a validação

- Lembretes de parcelas após uma entrada exibiam "Parcela 2 de 3"; a API passou a informar a posição e o total sem contar a entrada.
- O histórico de baixas rolava 1px na horizontal no celular; textos auxiliares agora quebram linha.

## Limitações reais

- Neste painel de navegador, `requestAnimationFrame` não dispara (janela sem pintura), então a animação de saída de qualquer diálogo nunca termina e a página fica bloqueada após fechar um diálogo — inclusive o diálogo do card 07, que já existia. Num navegador visível isso não ocorre; contornei recarregando a página entre os passos. Não foi possível validar o fechamento animado.
- A seta do controle de modo (`AppSegmented`) move o foco sem selecionar; Espaço seleciona (componente compartilhado, não alterado).
- Correção de pagamentos e o fluxo de despesa parcelada foram validados no navegador apenas na exibição e no lembrete; o restante está coberto pelos testes de API.
- Sem edição do cronograma depois de salvo, estorno/devolução, recorrência ou notificações externas.
