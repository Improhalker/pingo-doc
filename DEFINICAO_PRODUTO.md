# Definição de Produto — MVP v0.1

**Versão:** 0.1  
**Status:** Planejamento inicial  
**Produto:** PingoFin  
**Mercado inicial:** Autoescolas  
**Modelo:** SaaS de gestão financeira simplificada

---

## 1. Visão do produto

O produto será uma plataforma de **gestão financeira simples para pequenos negócios**, inicialmente validada e comercializada para autoescolas.

O problema central não é apenas registrar entradas e saídas.

Pequenos negócios frequentemente mantêm suas informações financeiras distribuídas entre:

- WhatsApp;
- planilhas desatualizadas;
- anotações;
- comprovantes;
- memória dos funcionários;
- diferentes meios de pagamento.

Isso dificulta responder perguntas básicas como:

- Quanto entrou este mês?
- Quanto saiu?
- Quanto ainda temos para receber?
- Quais contas estão vencendo?
- Quem ainda precisa pagar?
- Quanto realmente temos disponível?
- O negócio teve resultado positivo ou negativo?

O produto deverá centralizar essas informações em uma interface extremamente simples.

### Proposta central

> Organizar o financeiro do pequeno negócio sem depender de planilhas complicadas.

---

# 2. Estratégia inicial

## 2.1 Mercado de entrada

O primeiro nicho será **autoescolas**.

A primeira validação ocorrerá em uma autoescola real, permitindo observar:

- como lançamentos são realizados;
- quais informações são esquecidas;
- quais tarefas consomem mais tempo;
- quais relatórios realmente são utilizados;
- onde acontecem erros;
- quais funcionalidades realmente geram valor.

A estratégia comercial inicial poderá, portanto, posicionar o produto como:

> Controle financeiro simples para autoescolas.

Entretanto, a arquitetura não deverá tornar o produto dependente desse segmento.

---

## 2.2 Arquitetura horizontal

Internamente, o sistema deverá trabalhar com conceitos genéricos:

- Organização;
- Usuário;
- Cliente;
- Receita;
- Despesa;
- Recebimento;
- Pagamento;
- Categoria;
- Conta;
- Parcela.

Por exemplo, uma autoescola poderá visualizar a entidade `Customer` como **Aluno**, enquanto outro segmento poderá visualizá-la simplesmente como **Cliente**.

A estratégia será:

> **Vertical na aquisição. Horizontal na arquitetura.**

Isso permitirá futuramente atender outros pequenos negócios sem reconstruir o produto.

---

# 3. Usuários iniciais

O usuário principal não será necessariamente um contador ou profissional financeiro.

O sistema deverá ser projetado para pessoas com conhecimento financeiro básico.

No piloto inicial, os lançamentos são realizados principalmente por:

- proprietária/administradora;
- funcionária administrativa.

Portanto, facilidade de uso terá prioridade sobre quantidade de funcionalidades.

O sistema não deverá exigir conhecimento de termos contábeis para operações básicas.

---

# 4. Cenário financeiro que o sistema precisa suportar

Uma mesma venda pode possuir múltiplas formas e datas de recebimento.

Exemplo:

### Venda

**Cliente:** João Silva  
**Serviço:** Serviço contratado  
**Valor total:** R$ 1.000

### Recebimentos

| Valor | Forma | Status |
|---|---|---|
| R$ 500 | Dinheiro | Recebido |
| R$ 250 | Cartão | A receber |
| R$ 250 | Cartão | A receber |

Portanto:

**Valor vendido:** R$ 1.000  
**Valor recebido:** R$ 500  
**Valor a receber:** R$ 500

O sistema nunca deverá considerar automaticamente uma venda como dinheiro disponível em caixa.

Essa separação é uma regra fundamental do produto.

---

# 5. Conceitos financeiros fundamentais

O sistema deverá distinguir pelo menos três conceitos.

## 5.1 Receita/Venda

Representa o valor total de uma operação comercial.

Exemplo:

> Venda de R$ 1.500.

---

## 5.2 Recebimento

Representa dinheiro que efetivamente entrou ou está previsto para entrar.

Uma receita poderá possuir um ou vários recebimentos.

Exemplo:

> Venda: R$1.500  
> R$500 recebidos em dinheiro  
> R$500 previstos no cartão  
> R$500 previstos no cartão

---

## 5.3 Despesa

Representa uma obrigação financeira da empresa.

Também poderá ser:

- paga imediatamente;
- pendente;
- parcelada;
- recorrente.

---

# 6. Dashboard

O dashboard deverá responder às principais perguntas financeiras em poucos segundos.

Indicadores principais:

### Saldo atual

Valor efetivamente disponível considerando movimentações registradas.

### Entradas do mês

Dinheiro efetivamente recebido durante o período.

### Saídas do mês

Dinheiro efetivamente pago durante o período.

### Resultado do mês

**Entradas - Saídas**

### A receber

Total de recebimentos pendentes.

### A pagar

Total de despesas pendentes.

---

## 6.1 Alertas financeiros

O dashboard também deverá destacar situações que exigem atenção.

Exemplos:

> 4 recebimentos atrasados  
> R$1.320 pendentes

> 7 recebimentos previstos nos próximos 7 dias  
> R$2.480

> 3 contas vencem esta semana  
> R$890

Esses alertas devem priorizar informação acionável em vez de excesso de gráficos.

---

# 7. Clientes

O sistema deverá possuir cadastro simples de clientes.

Informações iniciais:

- Nome;
- Telefone;
- E-mail opcional;
- Documento opcional;
- Observações;
- Status.

No contexto de autoescolas, a interface poderá apresentar essa entidade como **Aluno**.

O cadastro deverá permitir consultar:

- vendas relacionadas;
- valores recebidos;
- valores pendentes;
- histórico financeiro.

O MVP não será um CRM completo.

---

# 8. Receitas

O usuário deverá conseguir registrar uma nova receita/venda.

Campos mínimos:

- Cliente;
- Descrição;
- Categoria;
- Valor total;
- Data;
- Observações.

Durante o cadastro, será possível configurar a forma de recebimento.

---

# 9. Recebimentos

Uma receita poderá possuir um ou vários recebimentos.

Formas inicialmente suportadas:

- Dinheiro;
- Pix;
- Boleto;
- Cartão;
- Transferência;
- Outro.

Cada recebimento deverá possuir:

- Valor;
- Forma;
- Data prevista;
- Data efetiva;
- Status;
- Observações.

### Status possíveis

- Recebido;
- Pendente;
- Atrasado;
- Cancelado.

O status **Atrasado** poderá ser calculado automaticamente quando:

`data prevista < data atual`

e o recebimento continuar pendente.

---

# 10. Parcelamento de receitas

O sistema deverá facilitar parcelamentos.

Exemplo:

**Valor:** R$1.200  
**Entrada:** R$400  
**Restante:** R$800  
**Parcelamento:** 4x

Resultado:

> R$400 — recebido  
> R$200 — parcela 1  
> R$200 — parcela 2  
> R$200 — parcela 3  
> R$200 — parcela 4

O usuário deverá poder alterar individualmente:

- valor;
- data;
- forma;
- status.

O sistema não deverá assumir que todas as parcelas possuem necessariamente o mesmo valor.

---

# 11. Despesas

O sistema deverá permitir cadastrar despesas.

Campos mínimos:

- Descrição;
- Categoria;
- Valor;
- Data de vencimento;
- Data de pagamento;
- Forma de pagamento;
- Status;
- Observações.

Status:

- Pago;
- Pendente;
- Atrasado;
- Cancelado.

---

# 12. Parcelamento de despesas

Despesas também poderão ser parceladas.

Exemplo:

**Manutenção de veículo**  
R$1.200  
3x R$400

O sistema deverá gerar as parcelas correspondentes e permitir editar cada uma individualmente.

---

# 13. Despesas recorrentes

O sistema deverá permitir indicar despesas recorrentes.

Exemplos:

- aluguel;
- software;
- internet;
- serviços;
- salários;
- mensalidades.

Recorrências mais complexas poderão ser desenvolvidas posteriormente.

No MVP, prioridade para recorrência mensal simples.

---

# 14. Categorias

Cada organização poderá possuir suas próprias categorias.

Para facilitar o onboarding, poderão existir templates por segmento.

### Exemplo — Autoescola

Despesas:

- Combustível;
- Manutenção de veículos;
- Instrutores;
- Salários;
- Aluguel;
- Marketing;
- Material;
- Taxas;
- Software;
- Outros.

Receitas:

- Serviços;
- Aulas;
- Cursos;
- Taxas;
- Outros.

O usuário poderá criar, editar e arquivar categorias.

---

# 15. Fluxo de caixa

O sistema deverá apresentar uma visão cronológica das movimentações financeiras.

O usuário deverá conseguir visualizar:

- dinheiro recebido;
- dinheiro pago;
- recebimentos futuros;
- despesas futuras.

Filtros mínimos:

- período;
- categoria;
- tipo;
- status;
- forma de pagamento.

---

# 16. Relatórios

O MVP deverá possuir relatórios simples.

Não é necessário construir inicialmente um sistema avançado de BI.

Relatórios prioritários:

### Resultado mensal

Entradas versus saídas.

### Despesas por categoria

Identificar onde o dinheiro está sendo gasto.

### Receitas por categoria

Identificar origem das receitas.

### Contas a receber

Valores:

- recebidos;
- pendentes;
- atrasados.

### Contas a pagar

Valores:

- pagos;
- pendentes;
- atrasados.

### Comparação mensal

Exemplo:

> Setembro  
> Entradas: R$18.400  
> Saídas: R$13.100  
> Resultado: R$5.300

> Agosto  
> Entradas: R$16.200  
> Saídas: R$12.800  
> Resultado: R$3.400

---

# 17. Assistente financeiro com IA

A IA deverá possuir função prática dentro do produto.

Ela não será apenas um chatbot genérico.

O assistente deverá utilizar os dados financeiros da própria organização para responder perguntas.

Exemplos:

> Quanto gastei com combustível nos últimos três meses?

> Quanto tenho para receber esta semana?

> Quais são minhas maiores despesas?

> Quem possui pagamentos atrasados?

> Compare setembro com agosto.

> Faça um resumo financeiro deste mês.

---

# 18. Regras da IA

A IA nunca deverá inventar informações financeiras.

As respostas deverão ser construídas utilizando dados existentes no sistema.

Quando não existirem informações suficientes, o assistente deverá informar isso claramente.

Exemplo:

> Não existem dados suficientes para calcular esse resultado.

Em operações que alterem informações financeiras, a IA deverá solicitar confirmação antes da execução.

---

# 19. Lançamento utilizando IA

Uma das principais experiências experimentais do MVP será o lançamento através de linguagem natural.

Exemplo:

Usuário:

> João pagou 500 em dinheiro hoje e os outros 600 ficaram em duas parcelas no cartão.

O sistema interpreta:

**Cliente:** João  
**Total:** R$1.100

**Recebimentos:**

> R$500 — Dinheiro — recebido hoje  
> R$300 — Cartão — pendente  
> R$300 — Cartão — pendente

Antes de salvar:

> **Confirmar lançamento?**

O usuário deverá poder revisar e editar a interpretação.

A IA nunca deverá registrar movimentações silenciosamente.

---

# 20. Limites da IA

O produto poderá utilizar limites mensais de utilização para controlar custos.

O usuário não deverá precisar compreender tokens ou custos técnicos de modelos de IA.

Exemplo de interface:

> **Assistente financeiro**  
> 37 de 50 análises disponíveis neste mês.

Os limites e preços definitivos serão determinados posteriormente com base em:

- custo real da API;
- frequência de utilização;
- preço comercial;
- margem desejada.

---

# 21. Usuários e organizações

O produto será multiempresa desde sua estrutura inicial.

Estrutura conceitual:

`Organization`

→ `Users`  
→ `Customers`  
→ `Revenues`  
→ `Receivables`  
→ `Expenses`  
→ `Categories`

Todo dado financeiro deverá pertencer explicitamente a uma organização.

Nenhuma consulta poderá retornar informações pertencentes a outra organização.

---

# 22. Perfis de acesso

No MVP deverão existir pelo menos:

### Administrador

Pode:

- visualizar tudo;
- criar lançamentos;
- editar lançamentos;
- excluir/cancelar;
- gerenciar usuários;
- configurar organização.

### Operador

Pode:

- visualizar financeiro;
- criar lançamentos;
- atualizar recebimentos;
- atualizar pagamentos.

Permissões mais granulares poderão ser adicionadas posteriormente.

---

# 23. Histórico e auditoria

Como o sistema manipulará informações financeiras, alterações relevantes deverão possuir histórico.

Registrar pelo menos:

- usuário;
- ação;
- entidade alterada;
- data/hora;
- valor anterior quando relevante;
- novo valor quando relevante.

Exemplos:

> Funcionária marcou parcela #142 como recebida.

> Administrador alterou valor de R$300 para R$350.

> Administrador cancelou despesa #81.

Idealmente movimentações financeiras não deverão simplesmente desaparecer sem registro.

---

# 24. Busca

O usuário deverá conseguir localizar rapidamente informações.

Busca por:

- cliente;
- descrição;
- valor;
- categoria.

A velocidade para encontrar um lançamento será parte importante da experiência.

---

# 25. Experiência mobile

Embora o produto seja administrativo, o sistema deverá ser completamente utilizável pelo celular.

Operações prioritárias no mobile:

- visualizar dashboard;
- lançar receita;
- lançar despesa;
- marcar pagamento;
- consultar cliente;
- utilizar assistente de IA.

O sistema não deverá depender de desktop para tarefas cotidianas.

---

# 26. Princípios de UX

### Simplicidade acima de quantidade de recursos

O usuário deverá conseguir compreender o sistema sem treinamento financeiro.

### Informação antes de gráficos

Não adicionar visualizações apenas para preencher dashboards.

### Ações frequentes devem exigir poucos passos

Especialmente:

- adicionar entrada;
- adicionar saída;
- marcar como pago;
- consultar pendências.

### Linguagem humana

Preferir:

> Dinheiro recebido

em vez de termos contábeis desnecessariamente técnicos.

Preferir:

> Ainda falta receber R$2.400

quando isso for mais compreensível do que nomenclaturas financeiras complexas.

---

# 27. Navegação inicial

Estrutura preliminar:

**Visão geral**

**Financeiro**
- Receitas
- Despesas
- Fluxo de caixa

**Clientes**

**Relatórios**

**Assistente IA**

**Configurações**
- Empresa
- Usuários
- Categorias
- Formas de pagamento

Não é uma estrutura definitiva. Deverá ser validada durante prototipação.

---

# 28. O que NÃO faz parte do MVP v0.1

Para evitar expansão prematura de escopo, inicialmente ficam fora:

- gestão de aulas;
- agenda de instrutores;
- controle de veículos;
- processos de CNH;
- CRM comercial completo;
- folha de pagamento;
- emissão de nota fiscal;
- emissão de boleto;
- contabilidade completa;
- Open Finance;
- integração bancária automática;
- conciliação bancária automática;
- aplicativo nativo;
- integração automática com WhatsApp;
- cobrança automática de clientes;
- gestão de estoque;
- ERP completo.

Essas funcionalidades poderão ser analisadas posteriormente de acordo com utilização e demanda.

---

# 29. Possível evolução: WhatsApp

A desorganização financeira originada em conversas de WhatsApp é uma dor identificada.

Uma evolução futura poderá detectar mensagens relacionadas a pagamentos.

Exemplo:

Cliente envia:

> Fiz o Pix dos R$300 que faltavam.

O sistema poderia sugerir:

> **Possível pagamento identificado**  
> João Silva  
> R$300 via Pix

> Existe um recebimento pendente de R$300 para este cliente.

> **Associar pagamento?**

Nenhuma movimentação deverá ser confirmada automaticamente sem regras explícitas.

Essa integração NÃO pertence ao MVP v0.1.

---

# 30. Hipótese comercial

Preço máximo inicialmente imaginado:

**até aproximadamente R$190/mês.**

Esse valor ainda não representa o preço definitivo.

O piloto deverá ajudar a determinar:

- valor percebido;
- frequência de uso;
- economia de tempo;
- custo de infraestrutura;
- custo de IA;
- suporte necessário;
- disposição real a pagar.

Planos e preços deverão ser definidos posteriormente.

---

# 31. Métricas de validação do piloto

O MVP não será considerado validado apenas porque funciona tecnicamente.

Durante o piloto deverão ser observadas métricas como:

### Uso

Quantos dias por semana o sistema é utilizado?

### Atualização

Os lançamentos permanecem atualizados ou voltam para a planilha/WhatsApp?

### Velocidade

Quanto tempo leva para registrar uma movimentação?

### Pendências

O sistema ajuda a identificar pagamentos que anteriormente seriam esquecidos?

### Confiança

Os usuários confiam nos números apresentados?

### IA

O assistente realmente reduz trabalho ou é apenas uma funcionalidade interessante?

### Retenção

Depois de algumas semanas, os usuários continuam utilizando o sistema espontaneamente?

---

# 32. Principal critério de sucesso do MVP

A pergunta principal não será:

> “Quantas funcionalidades construímos?”

Será:

> **“A empresa conseguiu manter o financeiro organizado utilizando este sistema?”**

Se após algumas semanas os usuários conseguirem abandonar ou reduzir significativamente:

- planilhas desatualizadas;
- anotações paralelas;
- procura por informações em conversas;
- cálculos manuais;

o MVP terá demonstrado valor real.

---

# 33. Princípio de desenvolvimento

Toda nova funcionalidade deverá responder pelo menos uma destas perguntas:

1. Isso reduz trabalho manual?
2. Isso reduz a chance de esquecer dinheiro?
3. Isso torna a situação financeira mais fácil de entender?
4. Isso substitui alguma parte do processo desorganizado atual?

Caso não responda positivamente a nenhuma delas, provavelmente não pertence ao MVP.

---

## Resumo do MVP v0.1

O primeiro produto deverá entregar cinco capacidades centrais:

**Registrar.**  
Entradas e saídas sem depender de planilhas.

**Controlar.**  
Saber o que foi pago, recebido, está pendente ou atrasado.

**Entender.**  
Visualizar rapidamente a situação financeira.

**Perguntar.**  
Consultar os próprios dados através de linguagem natural.

**Simplificar.**  
Usar IA para transformar informações informais em lançamentos estruturados.

O objetivo não é substituir um contador.

O objetivo não é construir um ERP.

O objetivo é fazer com que um pequeno negócio consiga finalmente **manter seu financeiro organizado de maneira simples e consistente.**
