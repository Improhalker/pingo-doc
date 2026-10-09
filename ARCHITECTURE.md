# Arquitetura técnica inicial — MVP v0.1

**Status:** exemplo e referência de arquitetura para orientar evolução técnica. Propostas e módulos planejados não representam implementação existente. Consultar `README.md` e `AGENTS.md` para o estado atual e o escopo autorizado.

**Data:** 05/10/2026.

**Referência de produto:** [DEFINICAO_PRODUTO.md](./DEFINICAO_PRODUTO.md).

**Direção visual:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md); produto PingoFin e assistente Pingo, definidos em 05/10/2026.

**Convenção:** requisitos definidos são tratados como decisões; detalhes técnicos propostos são identificados como recomendações. `TBD` indica uma decisão ainda aberta.

## 1. Visão geral e escopo

SaaS de gestão financeira simplificada para pequenos negócios. Autoescolas são o primeiro mercado de validação e aquisição, mas o domínio permanece genérico: **vertical na aquisição, horizontal na arquitetura**. A interface poderá chamar `Customer` de “Aluno”, sem criar entidades específicas de autoescola.

O MVP inclui clientes, receitas, recebimentos, despesas, pagamentos, parcelas, recorrência mensal simples, categorias, dashboard, fluxo de caixa, relatórios básicos, usuários e assistente de IA. A prioridade é manter informações financeiras confiáveis e compreensíveis, inclusive no celular.

Esta arquitetura é um monólito Laravel com frontend Nuxt separado. Não pressupõe microserviços, múltiplos bancos por empresa ou contabilidade de partidas dobradas.

### Coerência com o documento do produto

- `Payable` explicita a obrigação individual de uma despesa; `Receipt` e `Payment`, propostos abaixo, detalham baixas efetivas para atender pagamentos parciais. São refinamentos técnicos dos fluxos pedidos.
- Pagamento parcial de uma parcela está explícito no pedido técnico; o MVP descreve principalmente recebimentos múltiplos e parcelamentos. Não deve ser confundido com uma parcela integralmente quitada.
- O mascote foi acrescentado pelo pedido técnico como apresentação futura. A direção visual posterior definiu o assistente Pingo e sua referência oficial; sua presença não altera as regras financeiras do MVP.
- O MVP menciona `Conta`, mas não especifica gestão de contas nem saldo inicial. Essas decisões continuam `TBD`, sem acrescentar transferências ou conciliação ao escopo.
- A IA faz parte do MVP nos dois documentos. Despesas recorrentes mensais continuam no escopo, mesmo sem destaque equivalente no pedido técnico.

## 2. Stack e implantação

| Camada | Tecnologia e responsabilidade |
| --- | --- |
| Frontend | Nuxt, Vue 3, TypeScript e Tailwind CSS; apresentação e interação |
| Backend | Laravel; API REST `/api/v1`, autenticação, autorização e regras financeiras |
| Autenticação | Laravel Sanctum; sessão por cookies para o frontend próprio |
| Persistência | MySQL em infraestrutura própria; fonte de verdade dos dados |
| Infraestrutura auxiliar | Redis, Laravel Queue e worker; cache, tarefas assíncronas e rate limiting |
| Servidor inicial | VPS próprio, Nginx e PHP-FPM; frontend, API e serviços operados com simplicidade |

Laravel realiza todo acesso ao banco. O navegador e o provider de IA não recebem credenciais MySQL. Supabase não será utilizado.

**TBD:** versões compatíveis de Laravel/PHP, Nuxt/Node, MySQL e Redis. Avaliar suporte de segurança, requisitos das bibliotecas e facilidade operacional antes de iniciar a aplicação. As referências técnicas deste documento não fixam versões do projeto.

### Diagrama textual

```text
Navegador / celular
        |
        | HTTPS
        v
Nginx no VPS
        |
        +--> app.<dominio> --> Nuxt / Vue
        |                         |
        |                         | REST + cookies + CSRF
        +--> api.<dominio> <-------+
                    |
                    v
             Laravel / PHP-FPM
                    |
         Auth + OrganizationContext + Policies
                    |
             Requests / Controllers
                    |
           Actions / regras de domínio
                    |
              Eloquent / Queries
                    |
                    v
                MySQL / InnoDB
                    ^
                    |
          Laravel Queue Worker / Scheduler
                    |
                  Redis

Laravel --> AIProviderInterface --> provider externo de IA
          FinancialAnalystService / TransactionParserService
```

Redis é auxiliar. A criação de uma receita, suas parcelas, baixas e auditoria termina de forma consistente no MySQL antes de qualquer processamento secundário.

## 3. Responsabilidades das camadas

| Camada | Responsabilidade |
| --- | --- |
| Nuxt/Vue | Formulários, previews, navegação, acessibilidade, estados de carregamento e mensagens humanas |
| Middleware Laravel | Autenticar e estabelecer contexto autorizado da organização |
| Form Requests | Validar formato, campos permitidos e referências no contexto da organização |
| Policies | Autorizar a ação conforme vínculo, perfil e entidade |
| Controllers | Coordenar Request, autorização, Action/consulta e Resource; permanecer pequenos |
| Actions/Services | Aplicar regras, transactions, baixas, parcelamentos, cancelamentos e auditoria |
| Queries/Eloquent | Persistir e agregar dados com escopo explícito da organização |
| API Resources | Serializar apenas contratos públicos autorizados |
| MySQL | Garantir persistência, integridade referencial e atomicidade |
| Redis/Queue | Apoiar cache e trabalho assíncrono recuperável |
| Serviços de IA | Interpretar e explicar informações por contratos restritos; não executar movimentações |

Validações no frontend melhoram a experiência, mas toda regra crítica é repetida e aplicada pelo backend. Não criar uma camada genérica de repositories apenas para envolver Eloquent; introduzir abstrações quando houver uma necessidade concreta.

## 4. Organização do frontend

Estrutura conceitual, a adaptar à versão escolhida do Nuxt; por exemplo, sob `app/` quando aplicável:

```text
frontend/
  pages/        # Dashboard, financeiro, clientes, relatórios, IA, configurações
  components/   # Elementos visuais e formulários reutilizáveis
  composables/  # Sessão, organização atual e coordenação de dados/telas
  layouts/      # Estrutura autenticada e acesso
  middleware/   # Navegação conforme sessão; não substitui autorização da API
  services/     # Cliente HTTP único e serviços por recurso
  types/        # DTOs, filtros, respostas e erros públicos da API
  utils/        # Formatação, datas e funções puras de apresentação
  design-core/  # Tokens de marca/semânticos, tipografia e aliases de componentes
  assets/styles/ # Variáveis de tema e estilos globais mínimos
```

`services/` centraliza URL da API, credentials, CSRF, contexto da organização, tratamento de erros e cancelamento de requests. Componentes consomem composables/serviços; não espalhar chamadas HTTP diretamente nos componentes. Tipos TypeScript refletem os DTOs da API, e não os modelos internos do banco.

### Estado

- **Local:** campos de formulários, modal aberto e preview em revisão; usar `ref`/`reactive`.
- **Compartilhado:** usuário autenticado e organização atual; recomendar `useState` do Nuxt em composables. Evitar estado mutável no escopo global de módulos que possa ser compartilhado entre requests SSR.
- **Dados da API:** usar recursos de carregamento do Nuxt, como `useAsyncData`, chamando a camada de serviços. Chaves devem incluir organização e filtros. Após mutações, invalidar/refazer as consultas afetadas.
- Não adicionar Pinia inicialmente. Avaliar apenas se fluxos compartilhados crescerem além dos composables; não usar um store para duplicar o banco no navegador.

A recomendação de estado compartilhado e os cuidados com SSR seguem a [documentação de estado do Nuxt](https://nuxt.com/docs/4.x/getting-started/state-management); carregamento de dados segue seus [recursos de data fetching](https://nuxt.com/docs/4.x/getting-started/data-fetching).

Ao trocar organização ou encerrar sessão, limpar dados, drafts de IA e caches locais; cancelar requests anteriores e descartar respostas de um contexto antigo. Não persistir tokens de sessão ou históricos financeiros em `localStorage`.

**Recomendação:** área administrativa autenticada renderizada no cliente inicialmente, reduzindo complexidade de sessão SSR. **TBD:** confirmar esse modo ou adotar SSR/Nitro. Se houver SSR autenticado, encaminhar cookies/headers somente ao host confiável da API e impedir cache compartilhado de páginas/dados privados.

### Assistente e mascote

O produto se chama PingoFin e seu assistente/mascote oficial é o Pingo, personagem 2D inspirado em gota, com corpo roxo, detalhe amarelo e expressão amigável. Preservar a imagem fornecida, registrada em [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). Pode acompanhar atalhos, análises, empty states e previews, sem influenciar permissões, cálculos ou estados financeiros. Nenhuma tabela ou serviço financeiro próprio para o pet. Exemplos individuais substituíveis e gráficos editáveis estão em [docs/referencias-visuais](./docs/referencias-visuais/README.md). A etapa atual contempla somente o chatbox e a interface do Pingo, sem API de IA, inferência ou persistência de mensagens. Assets finais e animação continuam **TBD**.

### Design core e temas

O frontend deve nascer com tokens primitivos de marca e tokens semânticos compartilhados. Componentes consomem papéis como superfície, texto, ação e status; cada papel possui valores claro e escuro. Não espalhar hexadecimais pelas telas nem duplicar componentes para o dark mode.

A direção visual é roxo/amarelo, flat/2D, com fundos claros suaves e amarelo em detalhes. Tema escuro usa superfícies neutras com tendência roxa, preservando legibilidade de valores e status. Variáveis CSS e integração com Tailwind centralizam o tema; `useTheme` coordena preferência `light`, `dark` ou `system`, isolada dos estados financeiros e de sessão. O mapeamento inicial está em [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md); fonte final, assets e valores escuros definitivos continuam **TBD**. O design core está especificado nesta etapa, sem implementação.

## 5. Organização do backend

Estrutura conceitual dentro de uma única aplicação Laravel:

```text
backend/
  app/
    Http/Controllers/Api/V1/
    Http/Requests/
    Http/Resources/
    Http/Middleware/        # Organização atual
    Models/
    Policies/
    Actions/Financial/      # Criar receita, registrar baixa, cancelar
    Services/Financial/     # Parcelamento e regras compartilhadas
    Queries/                # Dashboard, fluxo de caixa e relatórios
    Services/AI/            # Analyst, Parser e validação de schemas
    Contracts/AI/           # AIProviderInterface
    Infrastructure/AI/      # Adaptadores concretos
    Jobs/
    Exceptions/
  routes/api.php
  tests/Unit/
  tests/Feature/
```

Actions representam casos de uso e controlam suas transactions. Services concentram regras reutilizadas quando necessário. Queries servem leituras e agregações. Models representam relações e persistência; não concentrar toda regra de negócio em observers. A auditoria crítica é gravada explicitamente pela operação financeira.

## 6. Modelo de domínio e relacionamentos

Proposta conceitual; não constitui migrations nem schema definitivo.

| Entidade/tabela | Dados e relações principais |
| --- | --- |
| `Organization` / `organizations` | Nome, timezone e configurações da empresa |
| `User` / `users` | Identidade de autenticação; pode participar de várias organizações |
| `organization_user` | `organization_id`, `user_id`, perfil `ADMIN`/`OPERATOR`; vínculo único por par |
| `Customer` / `customers` | Organização, nome, telefone, e-mail/documento opcionais, observações e status |
| `Category` / `categories` | Organização, nome, tipo receita/despesa e arquivamento |
| `Revenue` / `revenues` | Organização, cliente, categoria, descrição, valor total, data da venda, observações e cancelamento |
| `Receivable` / `receivables` | Organização, receita, valor previsto, vencimento, ordem da parcela, forma prevista e cancelamento |
| `Receipt` / `receipts` | Organização, recebível, valor efetivamente recebido, forma efetiva, `received_at` e autor |
| `Expense` / `expenses` | Organização, categoria, descrição, valor total, data de registro e observações |
| `Payable` / `payables` | Organização, despesa, valor previsto, vencimento, ordem da parcela, forma prevista e cancelamento |
| `Payment` / `payments` | Organização, obrigação, valor efetivamente pago, forma efetiva, `paid_at` e autor |
| `ExpenseRecurrence` / `expense_recurrences` | Proposta para regra mensal, próxima competência e configuração de geração |
| `AuditLog` / `audit_logs` | Organização, autor, ação, entidade, antes/depois e instante |
| `AIUsage` / `ai_usage` | Organização, usuário, operação, provider/modelo, uso técnico, custo estimado e instante |

```text
User N -- N Organization (organization_user: perfil por organização)
Organization 1 -- N Customer / Category / Revenue / Expense
Customer 1 -- N Revenue
Revenue 1 -- N Receivable 1 -- N Receipt
Expense 1 -- N Payable 1 -- N Payment
Category 1 -- N Revenue OU Expense (conforme tipo)
ExpenseRecurrence 1 -- N Expense (ocorrências mensais)
Organization 1 -- N AuditLog / AIUsage
```

### Obrigação prevista e baixa efetiva

No produto, “recebimento” abrange previsão e valor recebido. No armazenamento recomendado, `Receivable` representa a previsão/parcela e `Receipt` representa cada baixa efetiva. `Payable` e `Payment` seguem a mesma separação. Isso suporta uma parcela paga aos poucos, em datas e formas diferentes, sem sobrescrever seu histórico.

Exemplo de uma parcela de R$300: dois `Receipt`, de R$100 via Pix e R$200 em dinheiro. Antes do segundo recebimento, o saldo pendente é R$200; depois, zero. A API pode apresentar tudo na tela do recebível, sem exigir um novo módulo de navegação.

Formas iniciais: dinheiro, Pix, boleto, cartão, transferência e outro. Forma prevista não comprova entrada em caixa; a forma efetiva pertence à baixa. **TBD:** catálogo fixo inicial ou catálogo configurável por organização, já que o MVP prevê configurações de formas de pagamento.

**TBD — contas e saldo inicial:** avaliar saldo consolidado com referência inicial ou uma entidade `Account` com saldo de abertura. Não criar gestão bancária, transferências, saldos por conta ou múltiplas moedas por inferência. Exemplos e validação inicial usam BRL; suporte a outras moedas permanece `TBD` e não é um requisito do MVP.

## 7. Multi-tenancy lógico

Uma única base MySQL e tabelas compartilhadas. Todas as entidades da empresa, inclusive baixas, recorrências, auditoria e uso de IA, possuem `organization_id` obrigatório. `User` é global; seu perfil pertence ao vínculo `organization_user`.

### Contexto da organização

1. Sanctum autentica o usuário.
2. Middleware resolve a organização solicitada, por exemplo por header `X-Organization-Id`.
3. Backend verifica vínculo ativo e cria `OrganizationContext` com duração da request.
4. Policies e consultas operam nesse contexto. Sem contexto autorizado, a operação falha.

O header é um seletor, não uma prova de autorização. O backend atribui `organization_id` na criação e rejeita tentativas de alterá-lo pelo payload.

**Uma empresa por conta de cliente (ADR-028, 07/10/2026).** Cada conta de ADMIN/OPERATOR pertence a exatamente uma organização. O middleware resolve o contexto pelo vínculo único da conta: `X-Organization-Id` passou a ser opcional e, quando enviado, precisa coincidir com esse vínculo (senão 404, sem revelar existência). Conta sem vínculo, com empresa suspensa ou com mais de um vínculo (legado) recebe 403 com `ORGANIZATION_NONE`, `ORGANIZATION_SUSPENDED` ou `ORGANIZATION_AMBIGUOUS`, já no login (sem criar sessão) e em cada request. Vínculos legados nunca são resolvidos escolhendo a primeira empresa: ficam bloqueados até um ajuste explícito por `platform:legacy-memberships --email --keep`, que remove só os vínculos excedentes. Os cadastros da plataforma só criam contas novas, portanto sempre de empresa única. Uma constraint única em `organization_user.user_id` fica para depois da limpeza dos legados. Master continua sem vínculo e no fluxo da plataforma.

### Barreiras de isolamento

- Scopes por organização nas consultas tenant-owned, inclusive agregações, busca, relações e route model binding. Scopes devem falhar quando falta contexto, nunca retornar todos os tenants.
- Policies verificam vínculo, perfil e ownership. Não confiar apenas no scope nem em filtros do frontend.
- `customer_id`, `category_id`, `revenue_id`, `receivable_id` e demais referências precisam pertencer à organização atual. Validar também tipo e situação da categoria.
- Recomendar FKs compostas `(organization_id, parent_id)` referenciando chave única `(organization_id, id)` para relações entre tabelas tenant-owned. A FK simples por ID não garante igualdade de organização.
- Jobs recebem `organization_id`, estabelecem contexto explicitamente e o limpam no final. Revalidam vínculo do usuário para ações delegadas; tarefas do sistema usam capacidades delimitadas.
- Worker não mantém contexto do job anterior. Comandos administrativos globais devem ser explícitos e não acessíveis pela API pública.
- Cache, idempotência, resultados de IA e consultas no frontend incluem organização na chave. Um cache hit também exige autorização.
- Retornar `404` para entidade de outro tenant sem revelar sua existência; `403` para ação proibida sobre entidade visível.

MySQL não fornece isolamento automático dessas linhas para a aplicação. A proteção depende das barreiras acima e de testes que tentem atravessá-las.

## 8. Autenticação e autorização

### Sanctum entre subdomínios

Recomendar sessão por cookies do Sanctum para `app.<dominio>` e `api.<dominio>`, sob o mesmo domínio registrável:

1. Cliente solicita `/sanctum/csrf-cookie`.
2. Envia login com credentials e `X-XSRF-TOKEN` decodificado.
3. Requests seguintes enviam cookies; rotas privadas usam `auth:sanctum`.

Configurar origens stateful, incluindo portas locais, middleware stateful da API, domínio compartilhado dos cookies, HTTPS, cookie de sessão `HttpOnly`/`Secure` e CORS com origens exatas e credentials habilitados. O cookie XSRF precisa ser legível pelo cliente; não confundi-lo com a sessão. No cliente fetch, usar `credentials: include` e tratamento explícito do header XSRF. Não usar bearer tokens no `localStorage` para essa SPA. Essas convenções seguem a [documentação do Sanctum](https://laravel.com/framework/docs/13.x/sanctum#spa-authentication).

Regenerar sessão após login; invalidá-la no logout. Recomendar `SameSite=Lax` com os dois subdomínios em HTTPS no mesmo site; cross-origin não significa necessariamente cross-site. Tratar `401` e `419` sem repetir automaticamente mutações financeiras. Apenas subdomínios controlados poderão compartilhar o domínio dos cookies. **TBD:** domínio real, duração de sessão e ambientes locais. Domínios registráveis diferentes exigiriam reavaliar essa estratégia.

### Perfis por organização

| Capacidade | ADMIN | OPERATOR |
| --- | --- | --- |
| Consultar financeiro, dashboard e relatórios | Sim | Sim |
| Criar movimentações | Sim | Sim |
| Registrar recebimentos e pagamentos | Sim | Sim |
| Editar dados financeiros gerais e cancelar | Sim | Não, salvo atualização de baixa expressamente permitida |
| Gerenciar usuários e configurações | Sim | Não |

Policies usam capacidades nomeadas, como `revenue.create` e `receivable.settle`, mapeadas inicialmente aos dois perfis. Isso permite expansão posterior sem um motor complexo de permissões no MVP. `ADMIN` significa administrador daquela organização, sem acesso às demais.

### Administração da plataforma (extensão decidida em 05/10/2026 — ADR-026)

A operação do PingoFin precisa cadastrar empresas clientes sem cadastro público. Essa capacidade **não pertence a nenhum perfil por organização**. Ela é uma autorização de plataforma, independente de `organization_user`:

| Identidade | Origem do poder | Alcance |
| --- | --- | --- |
| Master (administrador da plataforma) | Linha em `platform_administrators` (uma por usuário), criada somente pelo comando `platform:create-master` | Gerir o cadastro das empresas: listar/buscar, provisionar empresa + primeiro ADMIN, ver quem tem acesso (nome, e-mail, papel), editar nome/fuso, incluir nova pessoa ADMIN, suspender/reativar e excluir. Nenhum acesso ao contexto, aos dados de negócio/financeiros ou às Policies tenant-owned das empresas |
| ADMIN | Vínculo `organization_user` | Administra somente a própria organização |
| OPERATOR | Vínculo `organization_user` | Atua conforme as capacidades dessa organização |

Regras: `PLATFORM_ADMIN` não é um papel do enum de vínculo; não há `Gate::before` global; a autorização é verificada no backend por middleware e Gate específicos (`platform.manage`), nunca pelo frontend; a existência da linha de plataforma não cria vínculos nem concede acesso a `X-Organization-Id`; nenhum payload público atribui essa autorização. Operações da plataforma ficam em `/api/v1/platform/*`, **sem** o middleware `organization`.

Suspensão (`organizations.suspended_at`) preserva dados e vínculos; enquanto suspensa, `ResolveOrganization` recusa o contexto a todos os membros (403 `ORGANIZATION_SUSPENDED`). Exclusão é permanente, exige o nome exato da empresa, roda em uma transação e remove vínculos e contas que só acessavam aquela empresa (contas com outros vínculos e masters são preservados). Futuras tabelas tenant-owned devem referenciar `organizations` com FK restritiva: havendo dados, a exclusão falha com 409 e a empresa deve ser suspensa. Política de retenção/backup antes de excluir empresas com dados reais continua **TBD**. Acesso excepcional de suporte aos dados de uma empresa (impersonação, vínculo temporário, leitura) **não** está decidido; exigirá decisão própria, com auditoria, antes de existir.

**Decidido em 06/10/2026 (ADR-027):** ADMIN mantém clientes e categorias (cadastrar, editar, arquivar e reativar); OPERATOR consulta. Ambos criam receitas e registram recebimentos (capacidades `customer.manage`, `category.manage`, `revenue.create` e `receivable.settle` em `App\Support\OrganizationAccess`). **TBD:** acesso às operações de IA. Toda confirmação de IA respeita a permissão financeira correspondente, independentemente do acesso ao assistente.

## 9. Valores monetários e datas

### Dinheiro

Recomendar `DECIMAL(19,2)` para valores financeiros no MySQL. É armazenamento decimal exato, adequado a centavos; não usar `FLOAT` ou `DOUBLE`. Referência: [tipos DECIMAL do MySQL](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html).

- API transporta dinheiro como string decimal canônica, por exemplo `"1100.00"`. Entrada localizada é normalizada antes do envio e validada novamente no servidor.
- PHP calcula com aritmética decimal exata ou centavos inteiros com limites verificados; a escolha da implementação é **TBD**. Cast decimal não torna operadores PHP de ponto flutuante seguros.
- TypeScript mantém strings monetárias nos DTOs. Cálculos de preview usam centavos inteiros dentro de faixa segura ou aritmética decimal; o servidor recalcula tudo.
- Valores de receitas, obrigações e baixas são positivos, têm no máximo duas casas e respeitam o limite aceito. Rejeitar precisão excedente em vez de arredondar silenciosamente um lançamento informado.
- Divisão de parcelas distribui o resto em centavos de modo determinístico e explícito no preview. R$100 em três parcelas pode resultar em R$33,33 + R$33,33 + R$33,34.
- Parcelas podem ter valores diferentes; sua soma deve ser exata. A política visual de distribuição do resto é **TBD**.

**Implementado em 06/10/2026 (ADR-027):** `App\Support\Money` usa bcmath com escala 2; a entrada aceita `^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$`, positiva e até `999999999.99`, e recusa números JSON. A interface normaliza a digitação pt-BR em centavos `BigInt` e só formata; o servidor calcula.

### Datas e timezone

| Campo | Semântica proposta |
| --- | --- |
| `due_date` | `DATE`, vencimento civil `YYYY-MM-DD` no timezone da organização; sem conversão UTC |
| Data da venda | `DATE`, data comercial independente de criação do registro |
| `received_at` | Instante efetivo de cada entrada, persistido em UTC |
| `paid_at` | Instante efetivo de cada saída, persistido em UTC |
| `created_at`, `updated_at` | Instantes técnicos UTC; não determinam quando dinheiro entrou/saiu |
| Auditoria e uso de IA | Instantes UTC |

Recomendar `DATETIME(6)` para instantes e conexão/aplicação em UTC. API recebe/devolve ISO 8601 com offset; apresentação usa timezone IANA da organização. Padrão proposto para o piloto: `America/Sao_Paulo`, sem fixar offset numérico.

Atraso significa saldo pendente positivo e `due_date` anterior ao dia atual da organização; um vencimento hoje ainda não está atrasado. Relatórios convertem os limites do período local para UTC e usam intervalos semiabertos `[início, próximo início)`.

Na primeira versão de recebimentos, `received_at` é obrigatório com data, hora e offset; a interface sugere o horário atual da organização. **TBD:** UX para registrar pagamento retroativo quando o usuário conhece somente o dia. Definir conversão explícita e preservar a data local informada, sem inventar hora exata. Mudanças futuras de timezone precisam de política para não reinterpretar histórico sem intenção.

## 10. Receitas, recebimentos e pagamentos parciais

### Criação de receita

1. Usuário informa cliente, descrição, categoria, total e data da venda.
2. Configura entrada/parcelas, valores, vencimentos e formas previstas.
3. Backend valida ownership, valores e somatório.
4. Action cria `Revenue` e todos os `Receivable` na mesma transaction.
5. Se houve entrada efetiva, cria `Receipt` com valor, forma e instante nessa transaction.
6. Grava auditoria e confirma o commit; API devolve o recurso atualizado.

Exemplo do MVP:

```text
Revenue.total_amount = 1000.00
Receivable A = 500.00; Receipt de 500.00 em dinheiro hoje
Receivable B = 250.00; sem baixa, cartão previsto
Receivable C = 250.00; sem baixa, cartão previsto

Vendido = 1000.00
Recebido = 500.00
A receber = 500.00
```

### Baixa de recebível

Para obrigação ativa: `saldo_pendente = valor_previsto - soma(baixas_válidas)`. Cada baixa nova deve ser positiva e não exceder esse saldo. Pagamento parcial mantém o restante pendente; múltiplas baixas preservam formas e datas individuais. Não substituir o valor integral da parcela pelo último pagamento.

**Primeira versão implementada (06/10/2026):** cada receita gera uma única obrigação (`sequence = 1`) com o valor total, sem entrada na criação nem parcelas; baixas parciais são explícitas. Status derivado `PENDING`/`OVERDUE`/`RECEIVED`; cancelamento ainda não existe.

Status público: recebido quando quitado, pendente enquanto há saldo, atrasado quando há saldo e vencimento passado, cancelado quando a obrigação foi cancelada. Recebimento parcial aparece por valores recebido/pendente, sem acrescentar obrigatoriamente um status de produto. `received_at` é de cada baixa; se o DTO da parcela expuser um único instante de quitação, deve identificá-lo como tal.

## 11. Despesas, pagamentos e recorrência

`Expense` representa a despesa total; `Payable` representa cada obrigação prevista. `Payment` registra uma saída efetiva. O cadastro simples cria uma obrigação; uma despesa de R$1.200 em três vezes cria três `Payable` de R$400, sem assumir valores iguais em todos os casos.

Criar despesa, parcelas, eventuais pagamentos imediatos e auditoria em uma transaction. Baixas parciais e múltiplas formas/datas seguem as mesmas validações dos recebíveis. Status públicos: pago, pendente, atrasado e cancelado. Criar uma despesa não significa saída de caixa.

### Recorrência mensal simples

Recomendar regra separada de suas ocorrências. Cada mês gerado cria uma `Expense` e sua obrigação; não criar `Payment` automaticamente. Scheduler e job podem materializar ocorrências com chave única `(organization_id, recurrence_id, competence)` para impedir duplicação em retries.

Em indisponibilidade da fila, a regra e a próxima competência permanecem no MySQL; a retomada recupera as ocorrências não geradas. É necessário mostrar falha/atraso de geração para que obrigações não desapareçam silenciosamente da visão financeira.

**TBD:** horizonte de geração, comportamento para dias 29–31, data inicial/final, edição de ocorrências já geradas e alcance de alteração de uma regra. Não projetar recorrências avançadas nesta etapa.

## 12. Consistência, concorrência e transactions

Usar MySQL/InnoDB e transactions nos casos em que registros precisam mudar juntos: criação de receita/despesa com parcelas, baixas, alterações de valores e cancelamentos com auditoria. O Laravel oferece commit/rollback pelo `DB::transaction`; referência: [transactions do Laravel](https://laravel.com/framework/docs/13.x/database#database-transactions).

Invariantes propostas:

- Em um lançamento sem cancelamentos, soma dos valores previstos das parcelas = total da receita/despesa.
- Soma das baixas válidas de uma obrigação ativa não excede seu valor; saldo não pode ficar negativo.
- Recebido/pago decorre de baixas persistidas, não de um status marcado isoladamente.
- Alterar valor de parcela exige revalidar o total e as demais parcelas na mesma transaction; nunca reduzi-lo abaixo do valor já baixado.
- Cancelamentos preservam valores históricos. Não forçar igualdade entre total original e parcelas ainda ativas apagando parcelas canceladas.
- Toda referência tenant-owned possui a mesma organização, incluindo o autor por vínculo autorizado.
- Auditoria obrigatória e mudança financeira são atômicas: falha no audit log reverte a operação.

Usar bloqueio de linha (`SELECT ... FOR UPDATE`) nas obrigações durante baixas e nas operações que revalidam somatórios, com ordem previsível de locks. Recalcular o saldo dentro da transaction; duas requests não podem consumir o mesmo saldo disponível.

Recomendar idempotência para criação e baixa financeira: chave única por organização, usuário e operação, hash do payload e resultado persistidos no MySQL na mesma transaction. Reenvio idêntico recupera o resultado; mesma chave com outro payload gera conflito.

**Implementado em 06/10/2026 (ADR-027):** cabeçalho `Idempotency-Key` (16 a 100 caracteres `[A-Za-z0-9_-]`) obrigatório em `POST /revenues` e `POST /receivables/{id}/receipts`; tabela `idempotency_keys` única por organização, usuário, operação e chave, com SHA-256 do payload canônico e resposta (status e corpo) gravados na mesma transaction da operação. Repetição devolve a resposta salva com `Idempotent-Replayed: true`; payload diferente gera 409 `IDEMPOTENCY_KEY_REUSED`; chave ainda sem resposta gera 409 `IDEMPOTENCY_IN_PROGRESS`; falha da operação desfaz a reserva. A baixa usa `lockForUpdate` na obrigação. **TBD:** TTL e limpeza das chaves.

Para edição, recomendar verificação de versão do registro, devolvendo `409` quando o preview estiver desatualizado. Cancelamento, edição e baixa devem compartilhar as mesmas barreiras de concorrência. Nunca manter transaction aberta durante chamada ao provider de IA.

## 13. Dashboard, fluxo de caixa e relatórios

Recomendar `GET /api/v1/dashboard` agregado com período e timezone aplicados pelo servidor. A resposta reúne saldo, entradas, saídas, resultado, a receber, a pagar, atrasos e próximos vencimentos; evita dezenas de requests para uma tela.

| Indicador | Base de cálculo |
| --- | --- |
| Entradas do período | Soma de `Receipt` válidos por `received_at` |
| Saídas do período | Soma de `Payment` válidos por `paid_at` |
| Resultado do período | Entradas menos saídas; resultado de caixa, sem afirmar lucro contábil |
| A receber / a pagar | Saldo restante das obrigações ativas, incluindo as atrasadas |
| Vencidos | Saldo restante com `due_date` anterior ao dia atual local |
| Próximos vencimentos | Saldo previsto dentro do horizonte solicitado |
| Saldo consolidado | Referência inicial definida + entradas acumuladas − saídas acumuladas |

Até definir a referência inicial, o acumulado registrado não deve ser apresentado como prova de todo dinheiro disponível da empresa. Saldo inicial/contas é um `TBD` necessário antes de implementar esse indicador.

Evitar somas duplicadas por joins entre parcelas e várias baixas: agregar baixas e obrigações separadamente ou usar subconsultas. Agregações da mesma resposta devem usar leitura consistente, sem misturar snapshots durante mudanças concorrentes.

Fluxo de caixa combina movimentos efetivos e obrigações futuras em uma visão cronológica, distinguindo realizado de previsto. Relatórios reutilizam as Queries do dashboard: resultado mensal, categorias, contas a receber/pagar e comparação mensal. Receita vendida usa data da venda; receita recebida usa data da baixa. **Implementado em 08/10/2026 (ADR-033, card 11):** categorias em base de caixa (recebida/paga); vendido pela data da venda e despesas pelo vencimento aparecem em colunas próprias e cada resultado identifica sua base. Escolha do agente, revisável pelo usuário.

Busca e filtros contemplam cliente, descrição, valor, categoria, período, tipo, status e forma de pagamento. Filtrar forma prevista em obrigações e efetiva em movimentos deve ter semântica explícita na API.

## 14. Convenções da API REST

Grupos conceituais, sem criar endpoints nesta etapa:

```text
/api/v1/auth
/api/v1/dashboard
/api/v1/customers
/api/v1/revenues
/api/v1/receivables
/api/v1/expenses
/api/v1/payables
/api/v1/categories
/api/v1/reports
/api/v1/ai
```

A administração da plataforma usa o grupo separado `/api/v1/platform` (ADR-026), fora do contexto de organização. Configurações de organização e usuários terão contratos próprios a definir. Baixas podem ser operações aninhadas aos recebíveis/obrigações; não precisam de endpoints públicos globais. Login/logout podem ficar no grupo de auth, mas `/sanctum/csrf-cookie` conserva sua função própria do Sanctum.

- Resources retornam DTOs com campos permitidos; dinheiro em strings, datas civis e instantes com semânticas distintas.
- Requests validam allowlists de campos, tipos, filtros, enumerações e referências tenant-owned. Regras financeiras finais ficam nas Actions.
- Controllers chamam Policies e Actions/Queries. Exceções de domínio são traduzidas em erros estáveis sem stack trace em produção.
- Sucesso: `data`; listas paginadas também `links` e `meta`. Erros: `message`, `code`, `errors` de campos quando aplicável e `request_id`.
- HTTP: `200` leitura/atualização, `201` criação, `202` tarefa assíncrona, `401` sem sessão, `403` ação negada, `404` recurso indisponível, `409` conflito, `422` validação, `429` limite e `503` dependência indisponível. Expiração CSRF pode retornar `419` conforme Laravel.
- Paginação proposta: 25 registros por página, limite máximo de 100, ordenação estável com desempate por ID. Não carregar todo histórico por padrão.
- Filtros e ordenação têm lista permitida; rejeitar nomes de colunas/SQL livres. Períodos e ranges devem ter limites para consultas previsíveis.
- Cancelamento é uma ação explícita autorizada, com motivo e auditoria; não um hard delete genérico.

**TBD:** contratos finais, convenção de IDs, filtros detalhados e limites máximos de período. Não incluir fornecedor de IA, credenciais ou estruturas internas nos contratos públicos.

## 15. Estratégia de IA desde o MVP

> A IA interpreta e analisa. Laravel valida e executa.

O assistente já faz parte do MVP: consultas financeiras e interpretação de lançamentos. Nenhum LLM acessa MySQL diretamente, recebe credenciais de infraestrutura ou executa SQL arbitrário.

### Financial Analyst

Fluxo recomendado:

1. Autenticar, estabelecer organização e autorizar a consulta.
2. Resolver intenção em operações permitidas, como resumo do período, gasto por categoria, pendências ou comparação mensal.
3. Se necessário, usar o modelo para sugerir intenção e parâmetros estruturados; o backend valida esse plano antes de consultar.
4. Executar Queries determinísticas no contexto da organização, com limites de período e volume.
5. Enviar apenas agregados ou registros estritamente necessários ao provider, com período, moeda, base de cálculo e timezone explícitos.
6. Receber a explicação e validar o contrato; números oficiais vêm dos resultados calculados.
7. Devolver resposta e dados estruturados que sustentam os valores apresentados.

O modelo explica e resume; totais, diferenças e saldos são calculados pela aplicação/banco. Para reduzir invenção de valores, respostas numéricas devem referenciar métricas fornecidas e ser renderizadas com valores oficiais; texto incoerente é rejeitado ou substituído por resposta determinística.

Ausência de dados deve ser distinguida de resultado zero. Categorias ambíguas e períodos indefinidos podem exigir esclarecimento. Não afirmar que um histórico incompleto descreve toda a realidade financeira.

### Transaction Parser

Fluxo obrigatório:

```text
Texto do usuário
  -> interpretação estruturada da IA
  -> validação estrutural e financeira no backend
  -> preview de campos e pendências no frontend
  -> revisão/edição pelo usuário
  -> confirmação explícita
  -> nova autorização e validação no Laravel
  -> Action financeira + transaction + auditoria
  -> persistência no MySQL
```

“João pagou 500 em dinheiro hoje e os outros 600 ficaram em duas parcelas no cartão” sugere total de `"1100.00"`, uma entrada de `"500.00"` e duas parcelas de `"300.00"`. O texto não informa vencimentos nem identifica inequivocamente o cliente. O backend não inventa datas e não escolhe automaticamente entre clientes chamados João.

Preview contém valores como strings, campos faltantes e candidatos autorizados à seleção. Pode ser apresentado incompleto para revisão, mas a confirmação exige todos os campos obrigatórios. O contexto servidor define organização, usuário e referência temporal para “hoje”; o modelo não escolhe esses dados.

Mesmo schema válido exige checagem de tipos, precisão monetária, datas, IDs, ownership, categorias, somatórios e regras de baixa. JSON válido não é autorização. Campos inesperados são rejeitados. O frontend pode editar a sugestão; a confirmação revalida o payload final e detecta contexto/versão desatualizados.

O parser não cria automaticamente cliente ou categoria ao interpretar nomes desconhecidos. Resolver seleção ou cadastro pelo fluxo autorizado correspondente. Repetição da confirmação usa idempotência para evitar duplicação.

### Structured Outputs e provider desacoplado

`AIProviderInterface` expõe operações de geração estruturada por schema e metadados de uso/erro. Adaptadores concretos traduzem o contrato para cada fornecedor; Services não dependem de formatos específicos de SDK.

- `FinancialAnalystService` coordena intenção, Queries autorizadas e explicação.
- `TransactionParserService` coordena extração, validação e preview.
- Schemas/DTOs pertencem à aplicação e têm versão; o backend sempre os valida.
- Se o provider não garantir schema, validar a resposta localmente e rejeitar violações. Nunca executar um comando a partir de texto livre ou JSON parcialmente recuperado.
- Timeout, recusa, indisponibilidade e resposta inválida são falhas explícitas. O lançamento manual continua disponível; não salvar uma interpretação incompleta em fallback.

**TBD:** provider/modelo inicial, biblioteca de integração, SLA de timeout, quantidade de retries e execução síncrona ou assíncrona da análise. Trocar provider não pode alterar regras financeiras nem o contrato de confirmação.

### Limites e usage tracking

Proposta simples: `ai_usage` registra `organization_id`, `user_id`, tipo (`financial_analysis`/`transaction_parse`), request lógico, provider/modelo, status, unidade consumida, tokens quando disponíveis, custo estimado/moeda e timestamp. Tokens e custos são metadados internos; o usuário vê análises/solicitações disponíveis.

Recomendar reserva de cota mensal no MySQL antes de chamar o provider, protegida por transaction/lock e identificador único. Finalizar ou liberar a reserva conforme resultado; retries compartilham a mesma operação lógica. Reservas abandonadas precisam de prazo e reconciliação. Redis não é a única fonte de verdade da cota.

O registro da operação lógica pode ter tentativas técnicas relacionadas, permitindo medir custos reais de retries sem cobrar unidades duplicadas por acidente. No MVP, limites podem ser configuração simples por organização/plano; não pressupor billing ou gestão comercial de planos.

**TBD:** limites mensais, unidade de consumo por operação, cobrança de falhas, política de retries, timezone da janela mensal e retenção de metadados. Não definir 50 análises nem preço de R$190 como decisões finais: são exemplos/hipóteses de produto.

## 16. Segurança e privacidade

- Autorização no backend em toda leitura/mutação; isolamento inclui dashboard, IA, jobs, logs de auditoria e cache.
- Contexto do provider minimizado: agregados sempre que suficientes; nomes/identificadores somente quando necessários à pergunta.
- Nenhum histórico completo é enviado por padrão. Dados de uma organização nunca entram no contexto de outra.
- Mensagens, descrições e respostas do modelo são conteúdo não confiável. Prompt injection não amplia ferramentas, acesso ou permissões.
- Ferramentas de consulta usam allowlist e parâmetros validados, sem SQL/nomes de tabela livres. Confirmação humana é obrigatória para qualquer alteração proposta pela IA.
- Sanitizar apresentação das respostas; não renderizar HTML do modelo sem tratamento.
- Segredos somente no backend, fora do repositório e logs. Validar entradas, restringir mass assignment e aplicar HTTPS.
- Rate limiting de login, IA e operações caras. Falha de Redis pode usar alternativa documentada para limites ou indisponibilizar somente a função protegida; nunca retirar a autorização ou corromper lançamentos.
- MySQL e Redis restritos à rede local/privada; conta do banco com permissões mínimas. Subdomínios e CORS sob controle.

**TBD:** política de retenção de prompts/respostas, requisitos de privacidade do provider e retenção de dados pessoais. Preferência inicial: não armazenar texto bruto de prompts/respostas sem necessidade definida. Auditoria autorizada pode conter dados financeiros necessários; logs técnicos não devem replicá-los.

## 17. Auditoria e exclusão

`audit_logs` armazena organização, usuário (ou ator de sistema identificado), ação, tipo/ID da entidade, `previous_data`, `new_data`, timestamp UTC e request ID quando aplicável. Dados antes/depois incluem somente campos relevantes, nunca senhas, cookies ou chaves de provider.

Registrar criação de lançamentos, baixas, alteração de parcela/valor, cancelamento e correções. Logs são append-only para os fluxos da aplicação e gravados na mesma transaction da alteração. Nenhum endpoint público permite editar/apagar auditoria. Não implementar Event Sourcing.

### Cancelamento e correções

**Implementado em 08/10/2026 (ADR-030, cards 07–08):** ADMIN/OPERATOR corrigem os dados completos de receitas/despesas sem alterar baixas. Total nunca fica abaixo do já recebido/pago; total aumentado pode reabrir um lançamento quitado. Data da venda alterada deve anteceder ou coincidir com todo recebimento existente, no fuso da empresa; a data original de legados pode ser mantida. Vencimento respeita a venda. Referências atuais arquivadas podem ser preservadas, mas outra referência arquivada não pode ser escolhida.

`DELETE` significa exclusão lógica do cadastro (`deleted_at`) e só é permitido sem baixas. Cadastro, obrigação e auditoria permanecem no banco; listas/detalhe e pendências excluem esse cadastro. IDs antigos da obrigação não permitem baixa. Não há estorno ou restauração pela interface. Caixa mensal continua baseado nas baixas efetivas e não muda ao corrigir metadados ou excluir um cadastro sem baixas.

`PATCH`/`DELETE` exigem `expected_version` e `Idempotency-Key`. Versão incrementa em edição/exclusão e em cada baixa; divergência gera 409 `FINANCIAL_ENTRY_CHANGED`. Actions travam obrigação, depois cadastro, recalculam baixas e auditam antes/depois na mesma transação da reserva idempotente. Replay de exclusão continua autorizado e possível com o cadastro já excluído; exclusão de outra empresa é 404. Políticas mantêm master separado. No dashboard, sinal exato em centavos determina cor, seta e texto; a seta não indica variação entre meses.

- Não fazer hard delete de movimentações ou baixa histórica.
- Cancelar uma obrigação ainda não quitada interrompe sua previsão de saldo a receber/pagar, preservando a rastreabilidade.
- Cancelar uma receita/despesa não prova que o dinheiro já recebido/pago foi devolvido. Não retirar automaticamente baixas reais dos cálculos de caixa.
- Soft delete/arquivamento pode servir a clientes ou categorias, preservando vínculos e histórico. Não permitir cascade delete de movimentos financeiros.
- Baixa efetiva não deve ter valor/data sobrescritos sem trilha: correção exige ação explícita, autorização, vínculo com registro original e auditoria.

**TBD:** regras comerciais e UX para cancelamento com pagamento parcial, correção de baixa, estorno e eventual devolução. Até defini-las, bloquear operações que eliminariam baixas ou mudariam o caixa por simples cancelamento. Uma correção de registro incorreto e uma devolução real têm efeitos e datas diferentes; não tratá-las como sinônimos. O mecanismo definitivo deve preservar tanto a linha original quanto o ajuste autorizado.

## 18. Filas e Redis

Redis apoia cache, filas e rate limiting. Worker executa tarefas como análise de IA quando assíncrona e geração de recorrências. Operações financeiras básicas, leitura de saldo e auditoria não dependem de jobs para completar sua integridade.

Recomendar sessão inicialmente persistida no MySQL para evitar que indisponibilidade de Redis impeça todo acesso autenticado. Cache financeiro é opcional e deve permitir consulta ao banco quando indisponível.

Jobs relacionados a alterações persistidas são publicados após commit (`after_commit`/`afterCommit`), para não observar dados ainda não confirmados. Isso não garante entrega se Redis falhar após o commit; tarefas necessárias devem poder ser reconstruídas a partir de estado persistente e reconciliadas. Referência: [filas e transactions no Laravel](https://laravel.com/framework/docs/13.x/queues#jobs-and-database-transactions).

Cada job é idempotente, possui contexto explícito de organização, timeout, retries limitados e registro de falha. Retry não duplica parcela, baixa nem consumo de IA. Supervisor/systemd ou equivalente reinicia workers; deploy reinicia processos para carregar código novo.

Não usar lock Redis como única garantia de consistência monetária: locks e restrições no MySQL protegem baixas e somatórios. Uma falha auxiliar posterior ao commit não deve devolver ao usuário a impressão de que um lançamento persistido falhou.

## 19. Performance

Começar com consultas previsíveis e medir antes de cache/agregação complexa:

- Índices compostos começando por `organization_id` nas consultas usuais, por exemplo `(organization_id, due_date)` e `(organization_id, created_at)`.
- Considerar `(organization_id, status, due_date)` onde status persistido participar realmente do filtro. Atrasado derivado usa saldo/vencimento e não depende de um job diário.
- Baixas: `(organization_id, received_at)` / `(organization_id, paid_at)` e índices pelos pais. FKs e unicidades sustentam integridade.
- Paginar listas; eager loading limitado evita N+1. Não retornar relações completas por padrão.
- Calcular dashboard com agregações no banco e sem multiplicar linhas em joins. Investigar planos com `EXPLAIN` e duração das consultas.
- Busca textual pode começar simples e restrita à organização; avaliar índice específico conforme volume real.

Se necessário, cache por organização, período, timezone e filtros, com TTL curto e invalidação após alterações relevantes. O MySQL continua fonte dos valores; leitura imediata após baixa não pode reutilizar cache antigo. Cache de HTTP não deve ser público para dados financeiros.

**TBD:** metas de latência, volume esperado, índices finais e estratégia de invalidação caso cache seja introduzido. Não criar materialized views ou infraestrutura distribuída antecipadamente.

## 20. Estratégia mínima de testes

Testar regras cujo erro pode alterar dinheiro ou expor dados. Não buscar cobertura artificial de 100%.

| Prioridade | Cenários necessários |
| --- | --- |
| Isolamento | Usuário A tenta ler/alterar dados B por ID, filtro, relação, dashboard, relatório, IA, cache e job; ausência de contexto falha |
| Cálculos | Venda não vira caixa; totais exatos; saldo pendente parcial; zero versus falta de histórico; joins não duplicam valores |
| Parcelamentos | Valores diferentes, resto em centavos, somatório inválido, alteração abaixo do já pago |
| Baixas parciais | Várias datas/formas; saldo restante; duas baixas concorrentes; retry idempotente |
| Autorização | Perfis por organização, vínculo revogado, ADMIN sem poderes globais e confirmação IA sem permissão |
| Atomicidade | Falha ao criar parcela/auditoria reverte tudo; sem sucesso parcial; job não observa transaction revertida |
| IA | JSON/schema inválido, precisão/datas inválidas, ID de outro tenant, cliente ambíguo, vencimentos faltantes e confirmação obrigatória |
| Datas | Vencimento hoje, dia anterior, limites mensais locais/UTC e lançamentos retroativos |
| Recorrência/cotas | Retry não duplica ocorrência; reservas concorrentes não excedem cota; tentativa técnica não duplica cobrança lógica |

Recomendar testes unitários de dinheiro, parcelamento e schemas; testes Feature de API/Policies e integração com MySQL/InnoDB para FKs, transactions e concorrência. SQLite sozinho não valida semântica de locks e constraints do MySQL.

Providers de IA são simulados nos testes determinísticos. Usar fixtures para respostas e contratos; avaliar um pequeno conjunto de frases reais sem depender de chamadas pagas em toda execução. Teste de interface/E2E deve cobrir o fluxo crítico de revisão/confirmação e sua utilização mobile.

**TBD:** ferramentas de teste frontend e harness de concorrência. Não há testes ou dependências a criar nesta etapa documental.

## 21. Observabilidade

Logs técnicos estruturados registram request ID, rota/operação, contexto mínimo de organização/usuário, duração, código de erro, job/tentativa e falha do provider. Não registrar payloads financeiros completos, prompts, respostas, cookies, senhas ou tokens por padrão.

Monitorar erros HTTP, latência, consultas lentas, backlog/falha de jobs, timeout de IA, uso/custo e sucesso de backups. Alertas operacionais devem permitir distinguir falha da API, do MySQL e de infraestrutura auxiliar.

`technical logs` ajudam a operar e depurar; `financial audit logs` explicam quem alterou o financeiro e quais dados mudaram. Um não substitui o outro. Rotacionar e limitar acesso aos logs.

**TBD:** ferramenta de coleta, retenção e destinos dos alertas. Pode começar com logs locais estruturados e monitoramento simples no VPS, sem stack complexa.

## 22. Operação e backups

Nginx termina HTTPS, serve/encaminha o frontend e envia a API ao PHP-FPM. Se Nuxt usar SSR/Nitro, haverá processo Node supervisionado; se a área administrativa usar build estático cliente, Nginx pode servi-lo. MySQL, Redis, workers e scheduler possuem processos supervisionados e acessos restritos.

Configurações variam por ambiente; segredos ficam fora do repositório. A aplicação deve operar com debug desabilitado em produção. Deploys futuros precisam de verificações de saúde, procedimento de rollback e cuidado com mudanças de schema; nenhum deploy está sendo realizado agora.

### Backup MySQL

- Automatizar backup consistente, com retenção definida e verificação de execução.
- Guardar cópia criptografada fora do servidor principal, com acesso restrito. Snapshot do mesmo VPS não é a única cópia.
- Testar restauração periodicamente em ambiente isolado e verificar integridade, relacionamentos e cálculos essenciais.
- Monitorar falhas, documentar recuperação e preservar configurações/segredos necessários à restauração em armazenamento seguro separado.
- Avaliar binlogs e recuperação para um ponto no tempo conforme a perda de dados tolerável. Redis não substitui backup MySQL.

**TBD:** RPO/RTO, frequência, retenção, destino externo, ferramenta de backup e periodicidade dos ensaios. Esses pontos precisam de definição antes do piloto com dados reais.

## 23. Itens explicitamente fora do escopo

- ERP, CRM completo, contabilidade completa e folha de pagamento.
- Gestão de aulas, instrutores, veículos, agenda e processos de CNH.
- Emissão fiscal/nota e emissão de boleto; registrar boleto como forma de pagamento continua permitido.
- Open Finance, integração bancária e conciliação automática.
- Integração WhatsApp, identificação automática de comprovantes e cobrança automática.
- Estoque e aplicativo nativo; interface web mobile permanece requisito.
- Microserviços, Kubernetes, banco por tenant e Event Sourcing.
- Billing completo, definições finais de preço/plano e sistema próprio de treinamento de modelos.
- Implementação de aplicação, migrations, componentes, endpoints, instalação de dependências e infraestrutura nesta entrega.

Pontos de extensão ficam nas Policies, Actions, contratos da API e adaptadores de IA. Não construir abstrações especulativas para as funcionalidades acima.

## 24. Pendências consolidadas — TBD

| Área | Decisão a avaliar |
| --- | --- |
| Runtime | Versões suportadas e compatíveis de stack |
| Frontend | Renderização cliente versus SSR/Nitro; organização final de diretórios |
| Autenticação | Domínios, ambientes e duração da sessão |
| Organização | Convenção única de seleção; capacidades de IA e demais capacidades abertas (clientes decididos no ADR-027) |
| Dinheiro | Distribuição visual do resto em parcelas (implementação decimal e limite decididos no ADR-027) |
| Caixa | Saldo inicial, referência temporal e necessidade de contas |
| Financeiro | Cancelamento parcial, correção de baixa, estorno/devolução e retroatividade |
| Recorrência | Horizonte, dias de fim de mês e alcance de edições |
| API | IDs, DTOs definitivos, filtros, TTL da idempotência e controle de versão |
| Relatórios | Card 11 adotou caixa por categoria (ADR-033); visão por categoria em base vendida/contratada, exportação e recorrência nos relatórios continuam abertas |
| IA | Provider/modelo, integração, timeout, retries, execução, cotas e reservas |
| Privacidade | Retenção de dados e política do provider |
| UX/visual | Fonte final, tokens escuros definitivos, assets/animação do Pingo, preferência de tema, adaptação responsiva/interativa da referência Figma, navegação e configuração de formas de pagamento |
| Operação | Capacidade/latência, monitoramento, retenção de logs e backups/RPO/RTO |

## Architecture Decision Log

Decisões fornecidas pelo pedido e recomendações deste documento são diferenciadas abaixo. `TBD` não é uma decisão fechada.

| ID | Situação | Decisão | Justificativa |
| --- | --- | --- | --- |
| ADR-001 | Definida | Domínio genérico; aquisição inicial em autoescolas | Atender outros pequenos negócios sem reconstruir entidades |
| ADR-002 | Definida | Nuxt/Vue 3/TypeScript/Tailwind e Laravel REST `/api/v1` | Separar apresentação de regras e contratos do backend |
| ADR-003 | Definida | Laravel é fonte de verdade financeira; MySQL é fonte persistente | Centralizar validação e consistência |
| ADR-004 | Definida | MySQL próprio; nenhum Supabase | Stack e infraestrutura escolhidas pelo projeto |
| ADR-005 | Definida | Multi-tenancy lógico com `organization_id` | Suportar múltiplas empresas no mesmo banco |
| ADR-006 | Definida | Sanctum; recomendação de sessão por cookies entre subdomínios | Autenticação adequada ao frontend próprio com proteção CSRF |
| ADR-007 | Definida | ADMIN/OPERATOR por vínculo; Policies no backend | Autorizar por organização e permitir expansão de capacidades |
| ADR-008 | Recomendada | Previsões separadas de baixas: Receivable/Receipt e Payable/Payment | Suportar pagamentos parciais, formas e datas distintas sem perder histórico |
| ADR-009 | Definida | Venda/despesa não movimenta caixa automaticamente | Dashboard considera somente dinheiro efetivamente recebido/pago |
| ADR-010 | Recomendada | `DECIMAL(19,2)` e dinheiro como string nos contratos | Evitar erros de ponto flutuante e preservar centavos |
| ADR-011 | Recomendada | Vencimento civil; instantes UTC e timezone por organização | Separar previsão, efetivação e período local dos relatórios |
| ADR-012 | Definida | Operações relacionadas e auditoria atômicas | Impedir criação parcial e mudanças sem rastreabilidade |
| ADR-013 | Recomendada | Locks MySQL e idempotência persistida para baixas/criações | Evitar saldo consumido duas vezes e duplicação por retry |
| ADR-014 | Definida | Auditoria própria; cancelamento e preservação de histórico | Manter rastreabilidade sem Event Sourcing |
| ADR-015 | Definida | IA no MVP; interpretação/análise com validação Laravel e confirmação | Oferecer assistência sem entregar integridade financeira ao modelo |
| ADR-016 | Definida | Provider desacoplado e schemas validados | Trocar fornecedor sem mudar regras ou confiar em texto livre |
| ADR-017 | Recomendada | Cota/usage duráveis no MySQL com reservas | Controlar concorrência/custo independentemente do cache |
| ADR-018 | Definida | Redis/Queue auxiliares; núcleo financeiro consistente no MySQL | Falhas assíncronas não deixam movimentações parcialmente persistidas |
| ADR-019 | Recomendada | Estado Nuxt local/compartilhado/API; sem Pinia inicial | Reduzir dependências e evitar duplicação de dados |
| ADR-020 | Recomendada | Dashboard agregado e Queries compartilhadas com relatórios/IA | Manter números consistentes e poucas requests |
| ADR-021 | Definida | VPS/Nginx/PHP-FPM; simplicidade operacional | Evitar infraestrutura distribuída prematura |
| ADR-022 | Definida | Backup automatizado, retenção, cópia externa e restauração testada | Tornar recuperável a persistência em infraestrutura própria |
| ADR-023 | Definida | Testes priorizam isolamento, cálculos, baixas e schemas de IA | Concentrar validação nos erros de maior impacto |
| ADR-024 | Definida | Produto PingoFin e mascote Pingo somente na apresentação | Preservar identidade oficial roxo/amarelo sem introduzir lógica financeira |
| ADR-025 | Definida | Design core com tokens semânticos para claro/escuro desde a base | Permitir dark mode consistente sem duplicar telas ou espalhar cores locais |
| ADR-026 | Definida | Autorização de plataforma (master) separada dos papéis por organização, representada pela tabela `platform_administrators`; poderes limitados ao cadastro das empresas (listar, provisionar com o primeiro ADMIN, ver acessos, editar, incluir ADMIN, suspender/reativar e excluir); sem acesso a dados de negócio das empresas, sem `Gate::before`, sem enum `PLATFORM_ADMIN`, sem promoção por API | Permitir cadastrar clientes sem cadastro público e sem transformar ADMIN em superadministrador. Acesso de suporte a dados de clientes fica para decisão futura própria |
| ADR-027 | Definida | Primeira versão de clientes, categorias, receitas e recebimentos: ADMIN mantém clientes/categorias e OPERATOR consulta; ambos criam receitas e registram baixas. Uma obrigação por venda, bcmath com limite `999999999.99`, `Idempotency-Key` persistida na transaction e lock da obrigação na baixa | Proposta do card 01 aprovada no pedido de 06/10/2026. Entrega o fluxo vendido/recebido/restante com integridade antes de parcelas, cancelamento e despesas |
| ADR-028 | Definida | Uma empresa por conta de cliente: contexto resolvido pelo vínculo único no servidor, `X-Organization-Id` opcional e conferido, login direto na Visão geral; sem vínculo, suspensa ou vínculos legados múltiplos → 403 explícito, sem escolher empresa automaticamente | Card 05 do Kanban: eliminar a etapa de seleção sem enfraquecer o isolamento. Legados exigem ajuste explícito pelo comando de plataforma; constraint no banco após a limpeza |
| ADR-029 | Definida | Quitação à vista opcional e explícita no cadastro de receita/despesa (`settlement`), registrada pelas Actions de baixa na mesma transação idempotente; a obrigação quitada vence no dia civil do instante efetivo, com a forma efetiva; pendentes têm vencimento livre | Card 06 do Kanban: concluir o lançamento em um envio sem presumir baixa pela data e sem duplicar regras de saldo, lock e auditoria |
| ADR-030 | Definida | Edição de dados de receitas/despesas preserva baixas e impõe total mínimo já baixado; exclusão lógica apenas sem baixas; versão, idempotência, lock e auditoria atômica. Resultado mensal tem cor, ícone e texto conforme o sinal exato | Cards 07–08: corrigir cadastro sem estornar caixa silenciosamente e deixar o resultado do período evidente; estorno e restauração continuam fora do recorte |
| ADR-031 | Definida | Correção de recebimento/pagamento por linha substituta vinculada (`corrects_id`) e original marcada `superseded_at`, nunca editada; totais e dashboard usam só baixas vigentes (data corrigida move o mês); motivo obrigatório; ADMIN e OPERATOR; versão, lock, idempotência e auditoria atômica | Card 09. Regras definidas com o usuário em 08/10/2026: corrigir erro de digitação preservando a evidência, sem confundir com devolução real (estorno continua futuro) |
| ADR-032 | Definida | Entrada e parcelas como várias obrigações por lançamento (`sequence`, `is_down_payment`, `reminder_date`); soma exata validada no servidor; só a entrada pode nascer baixada e só por indicação explícita; centavos excedentes na última parcela; dias 29–31 usam o último dia do mês; lembretes internos por parcela, sem baixa automática | Card 10. Decisões do usuário em 08/10/2026. Reaproveita Actions de baixa, lock e idempotência; legados viram cronogramas de uma parcela sem alterar valores |
| ADR-033 | Definida | Relatórios somente leitura (`report.view`, ADMIN/OPERATOR): resultado mensal em caixa igual ao dashboard, vendido por data da venda e despesas por vencimento rotulados à parte, categorias em caixa; extrato de baixas vigentes (corrigidas só para consulta) e previsto de parcelas em aberto; totais no MySQL para o conjunto filtrado, mesma leitura REPEATABLE READ, paginação estável, períodos limitados (12 meses / 366 dias) | Card 11. Base por categoria e limites escolhidos pelo agente em 08/10/2026, revisáveis; Queries independentes da requisição para reuso pelo Pingo; sem CSV, BI ou saldo disponível |
