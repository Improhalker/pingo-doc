# Capturas reais para a landing

Capturas de 09/10/2026, feitas no Chromium/Playwright sobre as telas existentes em localhost:3000. Desktop: 1440 × 1400; mobile: 390 × 960; escala 2. Indicadores, gráfico e cronograma foram capturados como elementos nativos.

Os dados são exclusivamente sintéticos, na empresa temporária **PingoFin · Demonstração**. As oito receitas e seis despesas foram criadas pelas Actions reais do Laravel. Entrada, parcelas, baixas e totais foram renderizados pela aplicação, sem alterar seu código ou redesenhar suas telas.

As duas fixtures usadas na captura e no ajuste do foco móvel foram removidas após conferir suas identidades e quantidades. Foram removidos apenas seus vínculos, lançamentos, obrigações, baixas, auditoria e sessões. Nenhuma migration ou volume foi alterado.

| Arquivos | Origem |
| --- | --- |
| `dashboard*.png`, `indicadores.png`, `pendencias-resumo.png`, `*-card.png`, `grafico.png` | Visão geral, indicadores e gráfico diário |
| `receitas*.png` | Receitas e recebimentos |
| `despesas*.png` | Despesas e pagamentos |
| `parcelas*.png`, `cronograma.png` | Detalhe de receita com entrada + três parcelas |
| `relatorios*.png` | Resultado mensal de outubro/2026 e categorias |
| `pendencias*.png` | Relatório a receber e a pagar |
| `wiser-reference.png` | Evidência da consulta à referência externa; não integra a landing |

A landing está em `E:/Projects/pingolandingpage`. Seu catálogo e guia de substituição ficam em `src/config/media.ts` e `docs/MEDIA_CATALOG.md`; PNGs preservados e manifesto ficam em `assets/product/`. Ela carrega somente WebP estático e o Pingo existente. Não consulta o banco, sessões, APIs financeiras ou o histórico privado dos agentes.

As sombras, perspectivas e molduras são CSS. Nenhum texto, número ou interface artificial foi acrescentado aos pixels das capturas.
