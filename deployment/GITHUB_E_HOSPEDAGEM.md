# Publicação independente do PingoFin

Esta etapa publica código nos quatro repositórios GitHub. Hospedagem, DNS e domínios serão definidos pelo usuário em seguida. GitHub Actions valida o código; não provisiona servidores nem executa migrations de produção.

| Repositório                                                           | Responsabilidade                                         | Validação independente                                         | Saída para futura hospedagem                      |
| --------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| [pingo-front-crm](https://github.com/Improhalker/pingo-front-crm)     | Aplicação autenticada e rota privada do histórico        | Tipos, lint, formato, 121 testes, build, HTTP privado          | Servidor Node/Nitro: .output/server/index.mjs     |
| [pingo-back-crm](https://github.com/Improhalker/pingo-back-crm)       | API, domínio, autenticação, MySQL/Redis e infraestrutura | Composer, Pint, 158 testes em MySQL descartável e worker Redis | Laravel/PHP 8.5, MySQL, Redis, worker e scheduler |
| [pingo-landingpage](https://github.com/Improhalker/pingo-landingpage) | Site público, mídia e mascote 3D                         | Tipos, formatação, build                                       | Arquivos estáticos em dist/                       |
| [pingo-doc](https://github.com/Improhalker/pingo-doc)                 | Produto, arquitetura, decisões e evidências              | JSONs versionados e referência do histórico                    | Documentação; não precisa de servidor             |

Os workflows respondem a push em main, pull request e acionamento manual. Actions fixadas por SHA, token com contents:read e checkout sem persistência de credenciais. Os serviços do CI são descartáveis; suas senhas de exemplo pertencem exclusivamente ao ambiente efêmero de testes.

O frontend exige servidor Node: a rota /api/platform/agent-changes verifica a sessão master na API Laravel e responde com cache privado/no-store. Nunca publicar a aplicação autenticada como exportação estática. O JSON do histórico continua único e privado no frontend; os demais repositórios guardam apenas ID/SHA de referência.

Comandos para os próximos clones: npm ci no frontend e na landing; composer install no backend. Os runtimes portáteis de Windows e os arquivos .env ficam ignorados. Ativar core.hooksPath=.githooks e manter o frontend irmão para os commits coordenados. CI não usa segredos de produção nem acesso cruzado a repositórios privados.

## Validação local desta entrega

Resultado estruturado em [local-validation.json](./local-validation.json). Todos os comandos foram executados na nova estrutura. Frontend: typecheck, lint, format:check, 121 testes, build e test:access passaram. Landing: typecheck, format:check e build passaram. Backend: composer validate --strict, check-platform-reqs, Pint e 158 testes/2.096 assertions passaram.

O teste integrado usou Laravel em modo local com DB_DATABASE=pingofin_test, CSRF ativo, cookie próprio e portas 3001/8001. Login sem token retornou 419; visitante 401; histórico como ADMIN 403 e master 200; empresa alheia 404; master sem acesso ao financeiro 403. Venda de 1.000,00, recebimento parcial de 400,00 e pagamento de 100,00 produziram resultado de 300,00 e restante de 600,00. Repetição da baixa com a mesma chave não duplicou registros; recebimento acima do restante retornou 422.

Navegador: login real, cadastro de cliente pela interface e confirmação no MySQL; dashboard desktop/mobile a 320 px, menu e tema escuro. Landing a 1440/320 px, imagens carregadas, abas, menu e Escape. Não houve overflow do documento nem erros de console observados. As capturas locais contêm somente dados sintéticos e ficam fora do Git.

MySQL 8.4.11 e Redis 8.2.10 ficaram healthy; consulta SQL confirmou banco pingofin_test e sessão UTC. Um worker real processou o job técnico no Redis. Não foram apagados volumes. Ao concluir, removi somente as duas empresas e quatro contas identificadas desta fixture. O banco de desenvolvimento foi preservado.

Os primeiros checks HTTP esperavam 403 em uma tentativa de empresa alheia; o contrato correto preserva sua existência com 404. O harness foi ajustado. A continuação conferiu os registros existentes sem repetir lançamentos. A rota privada do frontend retorna JSON direto, diferentemente do envelope data da API Laravel.

## Estado para hospedagem oficial

O npm audit do frontend reportou 14 entradas: 8 high e 6 critical, incluindo propagação de avisos transitivos. Landing: zero avisos; Composer: zero avisos e zero pacotes abandonados na consulta executada. Não foi aplicada atualização forçada nem downgrade sugerido pelo npm. A auditoria é resultado desta data, não garantia permanente.

Antes de hospedar, resolver os avisos aplicáveis do frontend e definir ambiente, domínios, HTTPS, CORS e cookies da sessão. Backend requer APP_DEBUG=false, chave própria, usuário de banco restrito, estratégia de backup/restauração e supervisão de worker/scheduler. APP_KEY, credenciais e .env nunca entram nos repositórios. A confirmação desses itens dependerá do host escolhido; DNS sozinho não hospeda a API ou o servidor Nuxt.

As pastas antigas permanecem para recuperação até a descontinuação autorizada. Nenhum código de negócio ou identidade visual foi alterado nesta etapa.

Referências oficiais das Actions: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [setup-php](https://github.com/shivammathur/setup-php).
