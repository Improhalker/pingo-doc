# PingoFin — documentação

Fonte central de produto, arquitetura, direção visual, evidências e responsabilidades dos quatro repositórios. Os aplicativos executáveis ficam nos repositórios irmãos; este repositório não é publicado como site.

- [NFS-e pausada: contexto, branch e retomada](./docs/PAUSA_NFSE.md)
- [Mapa, migração e preparação para deploy](./MIGRACAO_REPOSITORIOS.md)
- [Produto — planejamento inicial](./DEFINICAO_PRODUTO.md)
- [Arquitetura e decisões](./ARCHITECTURE.md)
- [Design system do CRM](./DESIGN_SYSTEM.md)
- [Estado e comandos anteriores — histórico](./docs/LEGACY_MONOREPO_README.md)
- [Histórico de agentes: acesso e proteção](./docs/AGENT_CHANGE_LOG.md)
- [Assets e referências do CRM](./docs/referencias-visuais/README.md)
- [Direção da landing](../pingo-landingpage/DIRECAO_VISUAL_LANDING_PAGE.md)

Originais 2D, exports e capturas do CRM ficam em docs/. A landing mantém seus próprios originais 3D e capturas comerciais. scripts/generate-visual-references.mjs gera SVGs em docs/ e no frontend irmão; scripts/sync-visual-references.ps1 sincroniza apenas PNGs/SVGs de interface. Ambas as operações exigem registrar a alteração e validar o frontend.

Os documentos *_VALIDATION.md descrevem conferências históricas, identificadas por data; não comprovam o estado atual de um novo deploy. Leia o relatório da migração para as verificações desta etapa.

## Histórico obrigatório

A fonte única é o JSON privado em `../pingo-front-crm/data/agent-changes.json`. Toda tarefa de agente deve acrescentar entrada imutável com resumo de até 300 caracteres Unicode e detalhes separados para mudanças complexas. Nunca copie o JSON para outro repositório, public/, bundle do navegador, banco ou localStorage.

No frontend, execute `node scripts/check-agent-changes.mjs --worktree` e inclua o JSON no stage. Commit do frontend deve preceder commits relacionados nos demais repositórios. Neles, atualize e inclua `.agent-change.json` com ID novo e SHA completo do commit do frontend que contém o registro. Os hooks leem o registro diretamente desse commit, recusam IDs reutilizados e não mantêm cópias do histórico.

Ative em cada clone: `git config --local core.hooksPath .githooks`. Não contornar a trava. Clone o frontend como irmão ou configure `PINGOFIN_FRONT_ROOT`. Linux usa Node compatível no PATH; Windows pode executar o setup-node.ps1 local.

## Validação no GitHub

O workflow `.github/workflows/validate.yml` executa verificações próprias deste repositório em push para main, pull request e acionamento manual. As Actions ficam fixadas por SHA e não recebem credenciais de produção. A publicação desta etapa é o código no GitHub; hospedagem e DNS serão configurados depois.
