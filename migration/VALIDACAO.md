# Validação da migração — 09/10/2026

Conferência executada nas pastas novas de E:\Projects\PingoFin. Não usa relatórios anteriores como prova desta etapa.

| Área                 | Verificações executadas                                                                                                                   | Resultado                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Inventário           | SHA256, presença dos destinos e comparação das origens                                                                                    | Sem destinos ausentes, sem diferenças inesperadas e sem mudanças concorrentes nas fontes de código           |
| Frontend             | npm ci pelo lockfile; typecheck; lint; format:check; suite final completa com 121 testes; 8 testes dirigidos das travas também conferidos | Passou                                                                                                       |
| Frontend compilado   | Build Nuxt/Nitro e test:access com servidor real e API de sessão simulada                                                                 | Visitante 401; ADMIN/OPERATOR 403; indisponibilidade 503; master 200; sem cache e sem JSON no bundle público |
| Landing              | npm ci; typecheck; format:check; build Vue/Vite                                                                                           | Passou; dist/ gerado                                                                                         |
| Backend              | composer install; validate --strict; check-platform-reqs; Pint --test; artisan test                                                       | 158 testes passaram, 2.096 assertions                                                                        |
| Assets do CRM        | Gerador de 6 SVGs e sincronização para o frontend irmão                                                                                   | Passou; assets conferidos por hash                                                                           |
| Links locais         | Referências Markdown nos documentos próprios e aplicações, excluindo bibliotecas instaladas e guia de agentes arquivado                   | Sem links locais ausentes                                                                                    |
| Registro obrigatório | Validador --worktree na origem; contrato, imutabilidade, primeiro commit e gate de outros repos com índice Git real                       | Passou                                                                                                       |

O inventário inclui 723 mapeamentos antes das adaptações. Atributos Git padronizam LF nos quatro repositórios e mantêm hooks executáveis. Os do backend combinam as regras originais do Laravel com normalização dos scripts. Os caminhos, comandos, READMEs, guias, governança e referências de documentação foram adaptados; código de negócio, componentes, imagens e lockfiles mantêm os hashes de origem. O JSON privado recebe o resultado desta tarefa sem reescrever registros anteriores.

## Backend e serviços locais

A primeira tentativa de suite iniciou com MySQL/Redis parados e registrou erros de conexão. Foi repetida integralmente depois que os serviços do projeto pingofin-bootstrap ficaram healthy. A repetição passou. O Compose recriou somente o container MySQL para usar o caminho novo do script de inicialização, preservando os volumes mysql_data e redis_data. Não foram removidos volumes nem executadas migrations destrutivas no banco de desenvolvimento. Testes usam exclusivamente pingofin_test.

Resultado estruturado: [backend-validation.json](./backend-validation.json). O ambiente local existente foi copiado no mesmo computador; .env, .env.testing e infra/.env ficam ignorados pelo Git. Runtimes, dependências, caches, logs e builds também ficam ignorados.

## Pendências reais antes do deploy

O npm audit atual do frontend reportou 14 entradas: 8 high e 6 critical. Inclui avisos diretos em dependências transitivas e sua propagação pelo grafo; não representa necessariamente 14 vulnerabilidades independentes. Avisos envolvem simple-git/argv-parser, braces e node-forge. [Auditoria sanitizada](./dependency-audit.json). Não foram feitas atualizações ou npm audit fix --force durante a organização.

Instalação da landing reportou zero vulnerabilidades. Isso é um resultado do comando nessa data, não uma garantia permanente. O build Nuxt emitiu DEP0155 transitivo de @vue/shared, e npm avisou sobre scripts de instalação de esbuild/unrs-resolver sem allowScripts. Instalação e build concluíram; os avisos não foram ocultados.

Não houve nova inspeção de desktop/mobile no navegador nem uso de contas reais nesta migração. As fontes de UI e mídia foram preservadas por hash; as conferências visuais anteriores continuam históricas. HTTPS, domínio, cookies, CORS final, backups, supervisão de worker/scheduler e CI/CD precisam ser validados no host escolhido.

## Commits e origens

Os commits são locais nos quatro repositórios já conectados aos respectivos GitHubs. O primeiro commit do frontend inclui a fonte única do histórico. Os outros commits contêm somente .agent-change.json com ID e SHA do commit do frontend. Hooks ativos em todos os clones; nenhuma trava foi contornada.

As pastas sistemafinanceiro e pingolandingpage, incluindo .git e mudanças de trabalho, permanecem disponíveis para recuperação. Não houve push, deploy ou exclusão das origens nesta tarefa. O desenvolvimento novo usa as quatro pastas padronizadas.
