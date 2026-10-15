# NFS-e pausada — 15/10/2026

Status: pausada por pedido do usuário. Retomar somente quando ele pedir explicitamente a continuidade da NFS-e.

## O que foi iniciado

A análise arquitetural foi iniciada nesta conversa, com diagnóstico do financeiro e proposta de módulo fiscal opcional por empresa. Não houve aprovação de implementação. Em 15/10/2026, a inspeção dos repositórios canônicos não encontrou código fiscal, migrations, telas ou integrações para retirar de main.

Não dizer que o módulo já está implementado. Lembrar que o planejamento começou e recuperar seu contexto.

## Onde retomar

Raiz canônica: E:\Projects\PingoFin. As origens antigas permanecem preservadas.

- pingo-doc: branch paused/nfse, arquivo docs/planejamento/NFSE_ARQUIVADA.md.
- pingo-front-crm: branch paused/nfse, referência da base financeira.
- pingo-back-crm: branch paused/nfse, referência da base financeira.

Branches criadas localmente. Nenhum push ou deploy integra esta tarefa. Não mesclar a branch fiscal em main agora. Antes de implementação futura, revisar a evolução de main e atualizar a base com cuidado.

## Lembrete para agentes

Quando o usuário mencionar continuar notas fiscais, informar a pausa, localizar o plano e apresentar as pendências antes de implementar. Um pedido genérico de continuar o projeto não retoma NFS-e automaticamente.

Na pausa, preservar o financeiro; não emitir notas, contratar ou cadastrar provedores nem alterar dados fiscais. O histórico obrigatório continua sendo o JSON privado do frontend, não este documento.

## Próximo foco solicitado

1. Rever o estado real do sistema financeiro e o Kanban existente.
2. Identificar o que falta para aceitar o MVP e priorizar as próximas atividades.
3. Planejar a integração de IA após essa revisão.

Essas atividades não foram executadas nesta tarefa. Não há declaração nova de prontidão do MVP. A integração de IA ainda não foi implementada.

## Bases preservadas

- pingo-front-crm: 73a8d2a93df3c041525c350595cdd2f64421d0c9
- pingo-back-crm: e988060b8f0952cd872b1781309e02d2bfc8f693
- pingo-doc: 8be80dea195ceeb56c9036bbaa543aa373db760e
