# Organização dos repositórios — 09/10/2026

A raiz padronizada é E:\Projects\PingoFin. A migração copia o conteúdo de trabalho atual, inclusive alterações ainda não commitadas, sem mover ou apagar as origens. Mantém os remotes GitHub já configurados e seus commits iniciais. Não reescreve o histórico Git dos repositórios antigos.

## Responsabilidades

| Repositório                                                           | Responsabilidade                                                                                                                 | Artefato de deploy                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [pingo-front-crm](https://github.com/Improhalker/pingo-front-crm)     | Nuxt/Vue, navegação, formulários, sessão, componentes, temas, cliente HTTP, rota protegida e fonte única do histórico de agentes | .output/ com servidor Nitro               |
| [pingo-back-crm](https://github.com/Improhalker/pingo-back-crm)       | Laravel, autenticação, organização, Policies, regras financeiras, banco, auditoria, relatórios, filas e infra local              | Aplicação PHP, public/ como document root |
| [pingo-landingpage](https://github.com/Improhalker/pingo-landingpage) | Marketing público, composição responsiva, animações, catálogos e mídias específicas; nenhuma sessão ou informação privada        | dist/ estático                            |
| [pingo-doc](https://github.com/Improhalker/pingo-doc)                 | Produto, arquitetura, design system, referências, originais do CRM, evidências, inventário e procedimentos                       | Documentação versionada, sem runtime      |

Os arquivos de cada aplicação estão diretamente na raiz do seu repo, sem outra pasta frontend/ ou backend/. Documentação conserva docs/ para manter os assets e os links entre evidências. A landing conserva seus guias e mídias específicas porque são parte do seu fluxo editorial. O design core executável continua no frontend; não foi criada dependência de runtime no repo de documentação.

## O que foi preservado e adaptado

- Conteúdo fonte, lockfiles, exemplos de ambiente, migrações, testes, capturas, referências, prompts, PNGs e catálogos existentes.
- Histórico privado completo do frontend, sem apagar nem reescrever entradas já existentes. O frontend mantém autorização master pela sessão Laravel.
- Scripts independentes para instalar Node, PHP/Composer e iniciar aplicações; caminhos da trava de histórico e do teste HTTP atualizados.
- Infraestrutura local agora em pingo-back-crm/infra. O Compose mantém nome pingofin-bootstrap e volumes; nenhuma operação de alteração de banco ou exclusão de volumes faz parte desta organização.
- Ambientes locais foram copiados no mesmo computador e ficam ignorados. Dependências e runtimes locais ficam ignorados e são reconstruíveis pelos scripts/lockfiles. Não há upload de ambientes ou segredos.
- Documentos históricos de validação mantêm suas datas e limites; README histórico está em docs/LEGACY_MONOREPO_README.md. Comandos antigos nesse documento não são os comandos da nova estrutura.

O inventário [migration/source-inventory.json](./migration/source-inventory.json) registra cada origem, destino e SHA256 do conteúdo de trabalho antes das adaptações. O relatório de conferência identificará explicitamente os arquivos adaptados; código de domínio, componentes, assets e lockfiles devem conservar seu conteúdo.

## Comandos locais

Backend, na raiz de pingo-back-crm:

```powershell
./scripts/composer.ps1 install
./scripts/php.ps1 artisan serve --host=localhost --port=8000
./scripts/php.ps1 artisan queue:work redis --queue=bootstrap-smoke,default --sleep=1 --tries=2 --timeout=30
```

Frontend, na raiz de pingo-front-crm: ./scripts/npm.ps1 ci; ./scripts/npm.ps1 run dev (localhost:3000).
Landing, na raiz de pingo-landingpage: ./scripts/npm.ps1 ci; ./scripts/npm.ps1 run dev (localhost:5174).
No Linux, usar npm/composer/php diretamente com runtimes compatíveis.

Infra local: docker compose --env-file infra/.env -f infra/compose.yaml up -d --wait na raiz do backend. MySQL/Redis deste projeto foram iniciados para validar a migração, com volumes existentes preservados. Não foram interrompidos serviços de outros projetos.

## Registro e commits coordenados

1. Acrescentar uma entrada imutável em pingo-front-crm/data/agent-changes.json, inclusive para mudanças só em backend, landing ou documentação. Mudanças complexas exigem details separado. Rodar o validador --worktree no frontend.
2. Commitar o registro junto com as mudanças do frontend. O hook valida o JSON realmente no stage; permite a primeira importação em um repo sem HEAD.
3. Nos outros repos, atualizar .agent-change.json com changeId, frontRepository=pingo-front-crm e SHA completo em frontCommit. Commitar junto com o trabalho correspondente. O hook consulta o registro nesse commit do frontend e recusa ID ausente ou já utilizado no próprio repo.
4. Ativar core.hooksPath=.githooks em cada clone. Para clones fora desta disposição, definir PINGOFIN_FRONT_ROOT. Não publicar o JSON privado em landing ou docs. .agent-change.json só contém referência, sem resumos ou detalhes privados.
5. Para enviar depois, publicar primeiro o commit do frontend que contém o registro e depois os demais. Esta tarefa prepara commits locais; não executa push nem deploy.

## Preparação para deploy

Os projetos estão separados para releases independentes. Backend exige PHP compatível, MySQL/Redis, worker/scheduler supervisionados, backup, secrets no host, HTTPS, CORS e cookies exatos. Frontend exige processo Nitro; publicação estática não serve a rota privada do histórico. Landing aceita hospedagem estática e só URLs públicas em VITE_APPLICATION_URL/VITE_PILOT_URL. Domínios, provedor, CI/CD e configuração final de produção continuam a definir; não há deploy executado nesta tarefa.

## Descontinuação das pastas antigas

E:\Projects\sistemafinanceiro e E:\Projects\pingolandingpage ficam preservadas como origem e recuperação. O desenvolvimento novo passa a usar as quatro pastas aqui descritas. Antes de remover as antigas: enviar os commits, validar os deployments reais e fluxos autenticados, revisar ambientes e processos locais e guardar o histórico Git original em backup. Não apagar bancos/volumes junto com pastas de código. A remoção das origens será uma etapa posterior explícita.

## Validação desta migração

Conferência concluída: builds das duas aplicações passaram; backend com 158 testes e 2.096 assertions; frontend com 121 testes e 8 checks dirigidos das travas. Inventário e links locais conferidos. Veja [resultados e limitações](./migration/VALIDACAO.md), incluindo a auditoria de dependências pendente antes do deploy.
