# NFS-e — planejamento arquivado

Status: PAUSADO. Arquivado em 15/10/2026 por pedido do usuário, a partir da análise apresentada na conversa em 13/10/2026. Este documento contém propostas, não implementação nem decisões aprovadas.

## Situação real e ponto de retomada

Nos repositórios canônicos em E:\Projects\PingoFin não foram encontrados código, migrations, telas ou integrações fiscais em 15/10/2026. Começamos o planejamento; não começamos uma implementação fiscal. Não afirmar que o módulo está pronto ou que emitiu notas.

A branch paused/nfse existe em pingo-doc, pingo-front-crm e pingo-back-crm. No frontend e backend, marca a base financeira; somente a documentação possui este plano adicional. Main permanece dedicada ao financeiro. O lembrete curto fica em docs/PAUSA_NFSE.md na main de pingo-doc.

Bases ao iniciar o arquivo:

- Frontend: 73a8d2a93df3c041525c350595cdd2f64421d0c9.
- Backend: e988060b8f0952cd872b1781309e02d2bfc8f693.
- Documentação: 8be80dea195ceeb56c9036bbaa543aa373db760e.

Antes de retomar, comparar com main atual: ela pode ter evoluído. Não sobrescrever alterações financeiras nem mesclar esta branch automaticamente.

## Direção arquitetural proposta

- Monólito modular incremental no Laravel, com Nuxt integrado à experiência existente.
- Preservar o financeiro em seus caminhos atuais; não mover tudo por uniformidade.
- Core: organização, sessão, vínculos, capacidades, habilitação de módulos e identidade central de Customer.
- Financeiro: receitas, obrigações, parcelas, recebimentos, despesas, pagamentos, correções, dashboard, lembretes e relatórios.
- Fiscal: emissor, complementos fiscais, serviço fiscal, snapshots, emissão, operações posteriores, histórico e arquivos.
- Fiscal lê uma projeção pequena da receita. Financeiro não depende do adaptador fiscal.
- Um adaptador por piloto, separado do domínio por contrato pequeno. Sem plugins dinâmicos, microserviços ou barramento genérico.
- Não criar CRM, Lead, cadastro duplicado de aluno ou motor tributário automático.

## Modelo proposto, sujeito a revisão

- organization_modules: habilitação persistente com unicidade por organização e chave do módulo.
- nfse_issuers: um estabelecimento/CNPJ por organização no piloto; ambientes e credenciais separados.
- nfse_customer_profiles: complemento opcional do Customer central, sem exigir dados fiscais no financeiro básico.
- nfse_documents: documento/processo, situação fiscal, identificadores e snapshot consolidado.
- nfse_operations: intenção durável, confirmação/revisão, referência externa, estado técnico, execução e reconciliação.
- nfse_events: auditoria fiscal e tentativas relevantes, com ator humano ou sistema e correlação.
- nfse_files: metadados e hashes dos arquivos privados, sem depender só de URLs do fornecedor.
- nfse_revenue_links: somente se o vínculo opcional com receita for aprovado; impedir processos concorrentes para a mesma origem.

Todas essas tabelas são propostas. Não existem nesta base. Usar constraints compostas por organização, índices de acompanhamento, unicidade no escopo externo correto e retenção sem exclusões em cascata do acervo fiscal.

## Acesso proposto

Separar organização ativa, módulo habilitado, emissor apto e capacidade do usuário. Ocultar menu não autoriza API, job ou download.

Sugestão ainda não aprovada: master habilita somente metadados; ADMIN configura, emite e solicita cancelamento; OPERATOR inicialmente consulta e baixa. Master não acessa notas, certificados ou dados financeiros. Poder de emissão para operador exige decisão explícita.

Desabilitação bloqueia novas emissões, preservando histórico, documentos, retornos e reconciliação. Operações já enviadas ou de resultado desconhecido não são descartadas. Acesso fiscal após suspensão e encerramento exige política própria: o comportamento atual bloqueia o contexto empresarial.

## Clientes, serviço e vínculo financeiro

Customer continua central dentro da organização. Documento genérico atual não é validação fiscal. Complementar identificação no formato vigente e endereço estruturado no fluxo fiscal.

Aluno, responsável financeiro, contratante e tomador podem ser diferentes. Não assumir o aluno como tomador. Se necessário, escolher outro Customer da mesma organização, sem duplicar identidade.

Proposta de MVP: emissão pelo cliente sem receita ou vínculo opcional aprovado; um processo por receita e uma nota autorizada vigente. Sem rateio, emissão parcial ou várias notas simultâneas sobre a receita. Preservar revisões e documentos anteriores. Categoria financeira não determina código fiscal.

Snapshots confirmados preservam emissor, tomador, serviço, competência e valores usados. Alterações posteriores em cliente, empresa ou receita não reescrevem nota autorizada. Rejeição exige correção, nova revisão e confirmação, preservando a anterior.

## Invariantes financeiras

- Emitir ou autorizar NFS-e não registra recebimento.
- Cancelar NFS-e não estorna dinheiro.
- Corrigir baixa não cancela ou reemite nota.
- Parcelas não determinam o cronograma fiscal.
- Venda, competência, vencimento e recebimento são conceitos distintos.
- Valor financeiro não define automaticamente valor fiscal, especialmente com taxas e repasses.
- Arquivamento de cliente e exclusão lógica de receita preservam histórico fiscal.

## Fluxo confiável proposto

Preparação → validação → revisão → confirmação → intenção persistida → envio → acompanhamento → autorização/rejeição → documentos e histórico.

Separar estado do documento e da tentativa técnica. Persistir identidade de operação, referência externa e numeração aplicável antes da chamada. Nenhuma transação MySQL desfaz uma nota autorizada externamente.

Reutilizar idempotência existente apenas na confirmação local; chamadas externas ficam fora de transações e locks longos. Duas chaves ou dois usuários não podem criar processos concorrentes sobre a mesma origem.

Após commit, fila publica a operação. Um recuperador periódico consulta operações persistidas para cobrir falha entre commit e publicação, Redis indisponível ou worker interrompido. Redis não é a única evidência da intenção.

Timeout pode significar nota já autorizada: reconciliar antes de reenviar. Não gerar nova referência apenas para tentar novamente. Uma reserva de execução expirada não prova que a chamada anterior terminou. Definir retries, timeouts, espera progressiva e intervenção humana conforme contrato comprovado.

Webhooks, quando disponíveis: autenticar, resolver a organização pela correlação registrada no servidor, deduplicar, persistir e processar idempotentemente. Não confiar em organization_id recebido. Não regredir estado por retorno antigo. Consultas continuam necessárias.

Cancelamento só após autorização conhecida, respeitando regras verificadas. Substituição e procedimentos externos precisam de escopo explícito; exclusão local de rascunho não é cancelamento fiscal.

## Integração e cenário ainda abertos

Município informado: Rio Claro/SP. Estabelecimento/CNPJ, regime, serviço, tomador, certificado, credenciamento e participação do contador ainda não foram fechados.

Foram estudadas API nacional direta, Focus NFe, Nuvem Fiscal e relevância do Giss municipal. Nenhum fornecedor foi escolhido, contratado ou cadastrado. Nenhuma emissão, inclusive de homologação, foi realizada nesta etapa.

Ao retomar, revalidar regras vigentes, transição municipal/nacional, versão ativa por ambiente, IBS/CBS, CPF/CNPJ vigente, cancelamento/substituição, cobertura do CNPJ, certificados, representação, idempotência e reconciliação. Datas e preços da conversa anterior são históricos, não garantias atuais.

Fontes iniciais para nova verificação:

- https://www.gov.br/nfse/pt-br
- https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual/documentacao-atual
- https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/apis-prod-restrita-e-producao
- https://rioclaro.giss.com.br/
- https://doc.focusnfe.com.br/reference/nfse-nacional
- https://focusnfe.com.br/guides/nfse/municipios-integrados/rio-claro-sp/
- https://dev.nuvemfiscal.com.br/docs/api/

O contador aprova enquadramento, códigos, competência e incidências. O sistema não decide por CNAE ou descrição comercial. Não usar scraping ou automação de login como integração padrão.

## Segurança, economia e operação

Segredos e certificados somente no backend, com criptografia, custódia, acesso mínimo e rotação. Arquivos privados com autorização antes de download. XML, uploads e URLs externas exigem tratamento seguro. Logs técnicos não carregam payloads pessoais completos.

Auditoria fiscal pertence ao domínio e banco; não ao JSON de agentes. Histórico de agentes permanece exclusivamente no frontend e deve ser atualizado em qualquer implementação futura.

Validar retenção, exportação, encerramento, restauração de banco/arquivos e reconciliação depois de recuperação. Rollback de código não desfaz notas autorizadas.

Custo mensal precisa somar API, CNPJs, excedentes/operações, certificados, homologação, infraestrutura, arquivos, backups, manutenção, suporte e migração. Preços e condições comerciais devem ser pesquisados novamente; não implementar billing agora.

Antes de dados reais: HTTPS, sessão segura, workers/scheduler supervisionados, armazenamento privado, proteção de segredos, monitoramento, dependências revisadas e restauração testada.

## Fases e testes para uma futura aprovação

1. Confirmar base canônica, cenário e decisões do piloto.
2. Validar integração, condições fiscais e sustentabilidade econômica.
3. Habilitação e capacidades, com isolamento e limites do master.
4. Dados, revisão e fluxo com intenção durável; contratos simulados.
5. Integração homologada autorizada, reconciliação, falhas e documentos.
6. Preparação operacional e piloto controlado com nova autorização.

Testar acessos diretos sem módulo/capacidade, referências cruzadas, master, cadastro incompleto, concorrência, timeout após autorização, retomada de jobs, retornos repetidos/fora de ordem, snapshots, financeiro preservado, desabilitação, ambientes separados, certificado inválido e downloads. Testes simulados não comprovam emissão fiscal válida.

## Como lembrar o usuário

Ao pedir continuidade fiscal: lembrar que pausamos em 15/10/2026, que o planejamento já havia começado e está nesta branch, e que não foi encontrada implementação fiscal. Recuperar decisões pendentes antes de alterar código. Não retomar NFS-e por um continue genérico.

Durante a pausa, o foco solicitado é avaliar o MVP financeiro, conferir Kanban e próximas atividades e depois planejar IA. Essas atividades são futuras; não foram executadas nesta tarefa.
