# Pesquisa profunda: estruturação da jornada de leads em CRM
## Benchmark de mercado com foco em agências digitais B2B

**Data da pesquisa:** 3 de setembro de 2026  
**Foco:** empresas B2B, serviços recorrentes, vendas consultivas e agências digitais/marketing/performance.

---

# 1. Executive Summary

### Os principais achados

1. **Lifecycle e pipeline são estruturas diferentes e devem permanecer separadas.** Lifecycle responde "em que estágio do relacionamento essa pessoa/empresa está?", enquanto pipeline responde "em que etapa desta oportunidade comercial estamos?". O próprio HubSpot implementa esses conceitos separadamente.

2. **Empresas maduras não tratam "Lead" como uma etapa comercial suficientemente precisa.** O lead pode estar apenas convertido, em tentativa de contato, conectado, qualificado ou já associado a uma oportunidade.

3. **O pipeline deve representar eventos verificáveis, não sentimentos do vendedor.** Salesforce recomenda definir, para cada estágio, o que precisa acontecer antes de uma oportunidade avançar e associar probabilidades às etapas.

4. **O modelo mais robusto para uma agência B2B é híbrido:** Lifecycle + Lead Status + Pipeline + Scoring + atividades/cadências + pós-venda.

5. **Lead scoring funciona melhor quando separa Fit de Engagement/Intent.** O RD Station utiliza exatamente essa lógica: Perfil/fit e Interesse.

6. **MQL não deveria significar simplesmente "lead que converteu".** A definição madura é: lead que atende critérios previamente estabelecidos para ser considerado pronto para atuação comercial.

7. **SQL é uma validação comercial, não apenas uma pontuação.** Salesforce define SQL como lead que é bom fit e está pronto para comprar.

8. **Velocidade de resposta é uma variável operacional crítica para inbound de alta intenção.** O estudo clássico de Oldroyd/InsideSales encontrou grande deterioração nas probabilidades de contato e qualificação à medida que aumenta o tempo de resposta. Entretanto, o famoso "21x em cinco minutos" é frequentemente atribuído incorretamente ao HBR; são estudos diferentes.

9. **O problema não é apenas velocidade: qualidade da pré-qualificação também importa.** Pesquisa publicada no *Journal of Marketing*, com 461 vendedores em quatro empresas, identificou o chamado "sales lead black hole": cerca de 70% dos leads gerados por marketing não eram perseguidos pelos vendedores. A pesquisa também encontrou relação importante entre qualidade da pré-qualificação e acompanhamento.

10. **Agências que profissionalizaram CRM frequentemente conseguiram migrar de projetos pontuais para receita recorrente.** Isso aparece em cases como Hüify, Latigid, Posizionate, Sales Communications e The Kingdom.

11. **O CRM precisa registrar o motivo pelo qual uma oportunidade não avançou.** "Closed Lost" não deveria ser o fim da informação. HubSpot recomenda categorizar os motivos de perda para permitir análise posterior.

12. **Agências têm uma particularidade importante:** a venda não termina no contrato. O modelo econômico depende de onboarding, retenção, expansão, renovação e indicação.

13. **Cases de agências mostram uma forte associação entre processos comerciais estruturados e crescimento**, mas esses números devem ser tratados como evidência de caso, não como prova causal generalizável.

14. **Mais etapas não significam necessariamente mais maturidade.** A maturidade está na existência de critérios objetivos, ownership, automações adequadas, dados confiáveis e capacidade de medir conversões.

15. **A arquitetura recomendada para uma agência digital B2B não deve copiar integralmente HubSpot, Salesforce ou qualquer outro CRM.** Deve combinar seus princípios em uma estrutura operacional mais simples.

---

# 2. O primeiro princípio: separar Lifecycle, Lead Status e Pipeline

Esse é provavelmente o achado conceitual mais importante da pesquisa.

## 2.1 Lifecycle

O Lifecycle representa o **estado do relacionamento com a empresa**.

O HubSpot possui, por padrão:

> Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist

e também "Other".

A lógica é:

| Lifecycle | Significado |
|---|---|
| Subscriber | Optou por receber conteúdo/comunicação |
| Lead | Demonstrou algum interesse além da simples assinatura |
| MQL | Marketing considera pronto para vendas |
| SQL | Vendas validou como potencial cliente |
| Opportunity | Está associado a uma oportunidade comercial |
| Customer | Possui negócio fechado |
| Evangelist | Cliente que advoga pela empresa |

O ponto fundamental é:

**Lifecycle não deve ser usado para representar cada movimento operacional do vendedor.**

---

# 3. Lead Status: o nível operacional entre Lead e Opportunity

O HubSpot possui uma estrutura separada para o Lead Status.

Atualmente, seus status incluem:

- New
- Open
- In Progress
- Open Deal
- Unqualified
- Attempted to Contact
- Connected
- Bad Timing.

No objeto Lead, o pipeline padrão do HubSpot também apresenta:

> New → Attempting → Connected → Qualified → Disqualified.

Isso é extremamente relevante para uma agência.

Em vez de:

> Lead → Reunião → Proposta

podemos ter:

**Lifecycle**

Lead → MQL → SQL → Opportunity

e, paralelamente:

**Lead Status**

New → Attempting → Connected → Qualified / Disqualified

Isso evita transformar o Lifecycle em um gigantesco pipeline operacional.

---

# 4. Pipeline comercial

O pipeline representa o **processo de transformação de uma oportunidade em receita**.

O Salesforce recomenda definir cada etapa com:

- evento de entrada;
- condições para avançar;
- probabilidade;
- critérios de qualificação.

O pipeline padrão do HubSpot possui:

| Stage | Probabilidade padrão |
|---|---:|
| Appointment Scheduled | 20% |
| Qualified to Buy | 40% |
| Presentation Scheduled | 60% |
| Decision Maker Bought-In | 80% |
| Contract Sent | 90% |
| Closed Won | 100% |
| Closed Lost | 0% |

Esses valores são defaults do software, não benchmarks universais.

### Insight

Não devemos copiar essas probabilidades para uma agência.

A probabilidade deve ser calibrada com o **histórico real de conversão da própria empresa**.

---

# 5. O benchmark mais interessante: agências digitais

A pesquisa encontrou vários casos públicos particularmente úteis.

## 5.1 Hüify

A Hüify é um dos casos mais interessantes.

Antes do CRM, utilizava uma espécie de planilha para controlar contatos. Leads acabavam sem follow-up.

Depois, a empresa:

- implementou um processo de vendas inbound;
- incorporou o processo ao CRM;
- criou maior previsibilidade de pipeline;
- eliminou projetos pontuais;
- passou a depender mais de contratos recorrentes;
- reduziu o ciclo de vendas de 9 meses para 4 semanas.

A agência também adotou uma regra de follow-up de cinco minutos para determinados leads inbound.

### Insight para agência

O valor do CRM não estava simplesmente em "guardar leads".

O ganho veio da combinação:

**Processo + CRM + velocidade + follow-up + modelo comercial recorrente.**

---

# 6. CreativeRace

A CreativeRace é uma agência integrada de marketing do Reino Unido.

Antes do Pipedrive, havia dificuldade para entender:

- geração de leads;
- movimentação dos prospects;
- onde os negócios estavam parando;
- diferença entre geração e vendas.

A agência criou pipelines separados e passou a utilizar campos personalizados e dashboards.

O case reporta:

- +600% em aquisição de clientes;
- +42% na velocidade de conversão de lead para oportunidade.



### O detalhe mais importante

A própria agência relata que os campos personalizados permitiram construir listas segmentadas e alimentar dashboards.

Isso reforça que:

**dados estruturados → segmentação → automação → gestão → previsibilidade**

é mais importante do que simplesmente possuir um CRM sofisticado.

---

# 7. SoMe Connect

A agência digital SoMe Connect passou por mais de 20 CRMs antes de adotar Pipedrive.

Os dados estavam espalhados entre:

- Dropbox;
- Basecamp;
- Outlook;
- documentos;
- anotações.

Com o Pipedrive, centralizou:

- leads;
- referrals;
- atividades;
- pipeline;
- dados comerciais.

O case reporta:

- +133% de receita;
- +60% na taxa de fechamento;
- redução de 90 para 45 dias no ciclo de vendas.

### Insight

A maturidade não veio de "ter muitos dados".

Veio de:

**uma fonte central + processo visual + atividades registradas + pipeline.**

---

# 8. TransFunnel

A TransFunnel é outro benchmark muito interessante porque tinha uma estrutura de agência com funções diversas:

- vendas;
- consultores;
- inbound marketing;
- escritores;
- desenvolvedores;
- freelancers.

A empresa utilizou:

- Meetings;
- Tasks;
- Forms;
- Workflows;
- Lists.

O case reporta que a automação contribuiu para que 95% das inquiries chegassem a reuniões.

### Insight

Em uma agência, o CRM precisa funcionar como sistema de coordenação entre departamentos, não apenas como ferramenta do vendedor.

---

# 9. Six & Flow

A Six & Flow utilizou o próprio CRM como mecanismo de construção de relacionamento.

O processo descrito é particularmente interessante:

**free tools → workshop → Marketing Hub → Sales Hub → retainer**

A empresa identificava oportunidades de expansão depois de gerar valor inicial.

No case publicado:

- 75% dos clientes que começaram com ferramentas gratuitas fizeram upgrade;
- 40% da receita HubSpot da empresa tinha origem nas ferramentas gratuitas.

### Insight

A jornada comercial de uma agência pode ser desenhada para:

**entrada → prova de valor → serviço inicial → expansão → contrato recorrente**

e não simplesmente:

**lead → proposta → contrato.**

---

# 10. Latigid

A Latigid, agência de marketing portuguesa, apresenta outro padrão interessante.

O case informa:

- 40% dos leads vinham de inbound;
- 80% dos clientes estavam em contratos recorrentes;
- média de 15 leads qualificados/mês.

A agência também relata que projetos inicialmente pontuais frequentemente evoluíam para retainers.

### Insight

Para agência:

**projeto inicial pode ser uma etapa de aquisição do cliente recorrente.**

Isso sugere que o CRM deveria registrar a possibilidade de expansão já no momento da venda inicial.

---

# 11. Posizionate

A Posizionate é uma agência espanhola especializada em SEO, conteúdo e Google Ads.

O case registra:

- 100% dos clientes em retainer;
- 1,7x de aumento nas vendas;
- geração recorrente de leads.

A empresa relaciona previsibilidade de receita aos contratos recorrentes.

---

# 12. Sales Communications

A Sales Communications, agência finlandesa, é outro caso extremo de modelo recorrente:

- 100% do negócio vindo de inbound;
- 100% da receita através de retainers;
- crescimento de receita de 3x.



---

# 13. Síntese dos benchmarks de agências

| Empresa | Mercado | Principal padrão observado |
|---|---|---|
| Hüify | Agência marketing/vendas | Processo comercial + CRM + follow-up rápido + retainer |
| CreativeRace | Agência integrada | Pipelines + campos + reporting |
| SoMe Connect | Agência digital | Centralização + pipeline |
| TransFunnel | Agência/inbound | Automação + handoff + reuniões |
| Six & Flow | Growth agency | Entrada → prova de valor → expansão |
| Latigid | Agência inbound | Inbound → projeto → retainer |
| Posizionate | Agência digital | Retainer + previsibilidade |
| Sales Communications | Agência inbound | Inbound + receita recorrente |
| The Kingdom | Agência/professional services | Conversão para retainer |

Os cases são úteis para identificar **padrões operacionais**, mas não devem ser tratados como estudos controlados. Os resultados foram publicados pelos próprios fornecedores/empresas.

---

# 14. O modelo de Lifecycle recomendado

Para uma agência digital B2B, recomendo:

```text
Subscriber
    ↓
Lead
    ↓
MQL
    ↓
SQL
    ↓
Opportunity
    ↓
Customer
    ↓
Expansion / Renewal
    ↓
Advocate
```

Porém, acrescentaria dois conceitos fora do Lifecycle principal:

```text
Lead Status
+
Deal Pipeline
```

---

# 15. Arquitetura recomendada

## Camada 1 — Lifecycle

| Stage | Critério |
|---|---|
| Lead | Capturado e identificado |
| MQL | Fit + intenção suficientes para avaliação comercial |
| SQL | Vendas validou necessidade e potencial |
| Opportunity | Existe oportunidade comercial concreta |
| Customer | Primeiro contrato fechado |
| Advocate | Cliente que gera referência/advocacy |

---

# 16. Camada 2 — Lead Status

Recomendação:

| Status | Definição |
|---|---|
| New | Lead ainda não trabalhado |
| Attempting Contact | Tentativas realizadas sem conexão |
| Connected | Houve contato |
| Qualified | Critérios mínimos comerciais atendidos |
| Nurture | Não está pronto agora |
| Disqualified | Não possui fit |
| Bad Timing | Existe fit, mas timing inadequado |

Isso é uma adaptação baseada na estrutura de Lead Status observada no HubSpot.

---

# 17. Camada 3 — Pipeline comercial da agência

Minha recomendação para uma agência digital B2B:

```text
1. Opportunity Created
        ↓
2. Discovery Scheduled
        ↓
3. Discovery Completed
        ↓
4. Qualified Opportunity
        ↓
5. Diagnosis / Solution
        ↓
6. Proposal Presented
        ↓
7. Negotiation / Decision
        ↓
8. Contract Sent
        ↓
9. Closed Won / Closed Lost
```

Não recomendo utilizar:

> Lead → Contato → Reunião → Proposta

como pipeline completo.

Isso é pouco informativo.

---

# 18. Critérios de entrada e saída

| Etapa | Entrada | Saída | Responsável |
|---|---|---|---|
| New | Lead recebido | Primeira tentativa | SDR/Comercial |
| Attempting | Tentativa iniciada | Conexão ou limite de tentativas | SDR |
| Connected | Contato estabelecido | Reunião ou nurture | SDR |
| Qualified | Fit + necessidade mínima | Discovery | SDR/Closer |
| Discovery | Reunião marcada | Discovery realizada | Comercial |
| Diagnosis | Problema identificado | Solução definida | Closer/Especialista |
| Proposal | Solução validada | Proposta apresentada | Closer |
| Negotiation | Proposta em avaliação | Won/Lost | Closer |
| Contract Sent | Contrato enviado | Assinado/recusado | Comercial |
| Won | Contrato assinado | Onboarding | Comercial + CS |
| Lost | Oportunidade encerrada | Nurture/reativação | Comercial |

---

# 19. O critério mais importante para avançar uma oportunidade

Uma etapa não deveria avançar porque:

> "o vendedor acha que está quente."

Deveria avançar porque um **evento observável aconteceu**.

Exemplo:

### Discovery Completed

Não significa:

> "falei com o cliente."

Significa:

- problema identificado;
- necessidade confirmada;
- serviço potencial identificado;
- timing conhecido;
- próximo passo acordado.

Esse princípio está alinhado à recomendação do Salesforce de definir claramente o que precisa acontecer antes de uma oportunidade passar para o próximo estágio.

---

# 20. Lead Scoring

A melhor arquitetura encontrada é:

## Fit

"Queremos esse cliente?"

+

## Intent

"Esse cliente está demonstrando intenção?"

O RD Station trabalha explicitamente com:

**Perfil + Interesse**

e utiliza essa combinação para definir quais leads devem ser encaminhados a vendas e quais devem continuar em nutrição.

---

# 21. Fit recomendado para uma agência

Sugestão:

| Critério | Peso relativo |
|---|---|
| Segmento/ICP | Alto |
| Faturamento | Alto |
| Potencial de investimento | Alto |
| Serviço necessário | Alto |
| Localização/mercado atendido | Médio |
| Estrutura de marketing | Médio |
| Maturidade digital | Médio |
| Cargo do contato | Médio |
| Tamanho da empresa | Médio |
| Complexidade operacional | Médio |

---

# 22. Intent recomendado

| Comportamento | Intensidade |
|---|---|
| Visitou site | Baixa |
| Consumiu conteúdo | Baixa |
| Abriu email | Baixa |
| Clicou email | Média |
| Visitou página de serviço | Média |
| Visitou página de preço | Alta |
| Preencheu formulário comercial | Alta |
| Pediu diagnóstico | Muito alta |
| Agendou reunião | Muito alta |
| Respondeu abordagem comercial | Muito alta |

### Regra importante

Não recomendo construir o scoring apenas pela soma de pontos.

Uma combinação:

**Fit alto + Intent médio**

pode ser mais valiosa que:

**Fit baixo + Intent muito alto.**

Isso é justamente o problema que a separação Perfil/Interesse do RD Station procura resolver.

---

# 23. Modelo de qualificação comercial

Para uma agência, não recomendo começar com MEDDPICC completo.

MEDDIC/MEDDPICC é mais adequado para vendas complexas, de maior valor e com múltiplos stakeholders. Salesforce e HubSpot reconhecem essa diferença em relação a frameworks mais simples como BANT.

### Recomendo inicialmente:

**FIT + NEED + BUDGET + AUTHORITY + TIMING**

com perguntas adicionais:

- Qual problema precisa ser resolvido?
- Por que agora?
- Quanto esse problema está custando?
- Qual resultado seria considerado sucesso?
- Quem participa da decisão?
- Existe orçamento?
- Existe prazo?
- O que acontece se nada for feito?

Depois, para contas maiores:

**BANT → MEDDIC/MEDDPICC**

---

# 24. Régua de interação inbound

Para leads de alta intenção:

| Momento | Ação | Canal |
|---|---|---|
| 0–5 min | Confirmação + tentativa de contato | Email/telefone/WhatsApp |
| 15–30 min | Nova tentativa se necessário | Telefone |
| Mesmo dia | Segundo contato | Email/WhatsApp |
| Dia 1 | Follow-up contextualizado | Email |
| Dia 2–3 | Nova tentativa | Telefone |
| Dia 5 | Conteúdo/prova social | Email |
| Dia 7 | Nova abordagem | Email/telefone |
| Dia 10–14 | Última tentativa da cadência | Email |
| Depois | Nurture/reativação | Automação |

A recomendação de resposta rápida encontra suporte em pesquisas clássicas de lead response. O HBR encontrou que a maioria das empresas demorava muito para responder leads online; entretanto, o famoso número de "21x" pertence a outra pesquisa e deve ser apresentado com essa ressalva metodológica.

---

# 25. Cadência outbound

Para outbound B2B, a literatura operacional mais recente converge para uma faixa aproximada de **6–12 touchpoints em 2–4 semanas**, embora isso varie com ticket, complexidade e intenção.

Para uma agência:

### SMB

6–8 touchpoints / 10–14 dias.

### Mid-market

8–12 touchpoints / 3–5 semanas.

### Enterprise

10–18 touchpoints / ciclos mais longos.

Não considero esses números "leis". São pontos de partida para testes.

---

# 26. Multicanal é preferível a email-only

Uma cadência moderna deveria combinar:

```text
Email
+
Telefone
+
LinkedIn
+
Conteúdo
+
Eventos/sinais
```

A Salesforce define cadência justamente como uma sequência estruturada de canais, tentativas, espaçamento e mensagens.

---

# 27. Handoff Marketing → SDR → Closer

Recomendação:

```text
MARKETING
    ↓
Lead
    ↓
Scoring
    ↓
MQL
    ↓
SDR
    ↓
SQL
    ↓
Closer / AE
    ↓
Opportunity
    ↓
Closed Won
    ↓
CS / Atendimento
```

### O handoff deve transportar:

- origem;
- campanha;
- serviço de interesse;
- ICP;
- score;
- comportamento relevante;
- contexto da conversão;
- necessidade;
- informações coletadas;
- histórico de interações.

O vendedor não deveria receber simplesmente:

> "Lead novo."

Deveria receber:

> "Empresa X, segmento Y, faturamento Z, veio da campanha A, demonstrou interesse em serviço B, visitou página C, possui score X e solicitou diagnóstico."

---

# 28. O "Sales Lead Black Hole"

Esse é um dos achados mais importantes para a arquitetura.

A pesquisa de Sabnis et al. encontrou que aproximadamente 70% dos leads gerados por marketing não eram perseguidos pelos vendedores. O estudo analisou 461 vendedores em quatro empresas e foi publicado no *Journal of Marketing*.

O resultado é especialmente importante porque mostra que:

**gerar lead ≠ trabalhar lead.**

E:

**CRM ≠ processo comercial.**

O CRM precisa transformar automaticamente um lead em:

**owner + tarefa + prazo + prioridade + contexto.**

---

# 29. SLA

## SLA recomendado para inbound de alta intenção

### MQL de alta prioridade

**≤ 5 minutos**

quando operacionalmente possível.

### MQL normal

**≤ 30 minutos durante horário comercial.**

### Lead de baixa intenção

**≤ 1 dia útil.**

Esses valores são minha recomendação operacional, não um benchmark universal.

A pesquisa sustenta fortemente a importância da velocidade, mas a meta de cinco minutos deve ser adaptada à capacidade operacional da agência.

---

# 30. O que fazer quando o lead não está pronto

Esse ponto não deve resultar em:

> "perdido."

Existem pelo menos quatro estados diferentes:

### 1. Sem fit

→ Disqualified

### 2. Sem orçamento

→ Nurture / Requalificação

### 3. Sem timing

→ Bad Timing + data de reativação

### 4. Sem resposta

→ Cadência → Nurture → Reativação

Essa distinção é extremamente importante.

---

# 31. Closed Lost

Recomendo que toda oportunidade perdida tenha:

**Lost Reason**

e:

**Lost Detail**

### Lost Reason

Lista controlada:

- Bad Fit
- Price
- Competitor
- No Budget
- Bad Timing
- No Priority
- Project Cancelled
- No Decision
- No Response
- Internal Decision
- Service Not Suitable

### Lost Detail

Campo livre para contexto.

HubSpot recomenda justamente transformar o motivo de perda em categorias estruturadas para que a informação possa ser analisada posteriormente.

---

# 32. Lost não significa necessariamente morto

Uma oportunidade:

> "sem orçamento agora"

é diferente de:

> "empresa inadequada."

Por isso recomendo:

```text
CLOSED LOST
      ↓
   motivo
      ↓
 ┌────┴─────┐
 Fit ruim   Timing ruim
    ↓           ↓
 Arquivar    Reativação
```

---

# 33. Pós-venda

Para uma agência, o CRM deve continuar depois do Closed Won.

Recomendo:

```text
Closed Won
    ↓
Onboarding
    ↓
Kickoff
    ↓
First Value
    ↓
Ongoing Customer
    ↓
Health Check
    ↓
Renewal
    ↓
Expansion
    ↓
Advocacy
```

---

# 34. Expansão

Uma agência tem várias possibilidades:

**Cliente**
→ Tráfego Pago

↓

→ Google Ads

↓

→ Meta Ads

↓

→ Landing Pages

↓

→ CRM

↓

→ SEO

↓

→ Automação

↓

→ Consultoria

O CRM deveria permitir identificar:

- serviços atuais;
- serviços potenciais;
- maturidade;
- necessidades futuras;
- oportunidade de upsell;
- oportunidade de cross-sell.

O case da Six & Flow é particularmente interessante porque demonstra uma jornada de expansão de ferramentas/serviços após a geração de valor inicial.

---

# 35. Renovação

Para contratos recorrentes, recomendo criar um processo específico.

```text
90 dias antes
↓
Health Check

60 dias antes
↓
Review de resultados

45 dias antes
↓
Plano de renovação

30 dias antes
↓
Negociação

Renovação
↓
Expansion Opportunity
```

Esse é um modelo recomendado, não uma cadência encontrada como padrão universal nos benchmarks.

---

# 36. Campos essenciais do CRM

## Obrigatórios

| Campo | Importância |
|---|---|
| Company | Essencial |
| Contact | Essencial |
| Owner | Essencial |
| Lead Source | Essencial |
| Lifecycle Stage | Essencial |
| Lead Status | Essencial |
| Service Interest | Essencial |
| ICP/Fit | Essencial |
| Deal Stage | Essencial para Opportunity |
| Deal Amount | Essencial |
| Expected Close Date | Essencial |
| Next Activity | Essencial |
| Lost Reason | Essencial em Lost |

## Recomendados

- Industry;
- Company Size;
- Revenue Range;
- Marketing Investment;
- Current Agency;
- Current Solution;
- Main Pain;
- Buying Timeline;
- Decision Maker;
- Budget;
- Lead Score;
- Intent Score;
- Acquisition Campaign;
- Landing Page;
- First Touch Source;
- Last Touch Source.

## Opcionais

- detalhes comportamentais;
- informações complementares;
- interesses secundários;
- notas extensas.

---

# 37. Não transformar CRM em banco de dados infinito

Um erro recorrente é criar:

> 80 campos obrigatórios.

Isso diminui a adoção.

A regra recomendada:

**Se o campo não altera uma decisão, automação, segmentação ou relatório, questione sua existência.**

---

# 38. Modelo de automações

## Automação 1 — Novo inbound

```text
Lead criado
↓
Deduplicação
↓
Identificação da origem
↓
Scoring
↓
Owner
↓
SLA
↓
Task
↓
Notificação
```

---

## Automação 2 — MQL

```text
Score ≥ threshold
↓
Lifecycle = MQL
↓
Lead Status = New
↓
Owner definido
↓
Task criada
↓
SLA iniciado
```

---

## Automação 3 — Sem resposta

```text
Attempting
↓
Tentativa 1
↓
Espera
↓
Tentativa 2
↓
Espera
↓
Tentativa 3
↓
Cadência
↓
Nurture
```

---

## Automação 4 — Discovery realizada

```text
Meeting completed
↓
Task "Qualification"
↓
Campos obrigatórios
↓
Qualified?
 ├─ Não → Nurture/Disqualified
 └─ Sim → Opportunity
```

---

# 39. Automação de proposta

```text
Proposal Sent
↓
Task +2 dias
↓
Engagement?
 ├─ Sim → Follow-up prioritário
 └─ Não → Follow-up normal
↓
+5 dias
↓
Follow-up
↓
+10 dias
↓
Decision
```

---

# 40. Automação Closed Lost

```text
Closed Lost
↓
Lost Reason obrigatório
↓
Classificação
↓
Fit?
 ├─ Não → Arquivo
 └─ Sim
      ↓
Timing?
      ↓
Data de reativação
      ↓
Nurture
```

---

# 41. Modelo de métricas

A agência deveria acompanhar o funil inteiro.

## Marketing

- Leads;
- CPL;
- MQL rate;
- MQL volume;
- source conversion.

## SDR

- Speed-to-lead;
- Contact rate;
- Attempts;
- Connection rate;
- MQL → SQL.

## Vendas

- SQL → Opportunity;
- Opportunity → Won;
- Win rate;
- Average deal size;
- Sales cycle;
- Pipeline velocity;
- Days in stage.

## Negócio

- CAC;
- LTV;
- MRR;
- ARR;
- Retention;
- Churn;
- Expansion;
- Net Revenue Retention.

---

# 42. Métricas especialmente importantes para agência

Eu priorizaria:

### 1. Lead → Opportunity

Indica qualidade da aquisição.

### 2. Opportunity → Won

Indica eficiência comercial.

### 3. Win Rate por serviço

Permite descobrir quais serviços são mais vendáveis.

### 4. Ticket médio

Essencial para avaliar qualidade do ICP.

### 5. Ciclo de vendas

Fundamental para planejamento de caixa e capacidade.

### 6. Receita recorrente adquirida

Mais importante que simplesmente contar novos clientes.

### 7. Churn

Porque uma agência pode crescer comercialmente e perder dinheiro por retenção ruim.

### 8. Expansion Revenue

Indica capacidade de crescer dentro da base.

---

# 43. Quatro modelos comparados

| Modelo | Estrutura | Complexidade | Indicação |
|---|---|---:|---|
| CRM simples | Lead → Won/Lost | Baixa | Operações pequenas |
| Funil tradicional | Lead → MQL → SQL → Opportunity → Customer | Média | Inbound estruturado |
| RevOps | Lifecycle + pipeline + scoring + automation + CS | Alta | Empresas maduras |
| Agência B2B | Lifecycle + Lead Status + Discovery + Diagnosis + Proposal + Retainer | Média/Alta | Recomendado |

---

# 44. O modelo que eu NÃO recomendo

```text
Lead
↓
Contato
↓
Qualificação
↓
Reunião
↓
Proposta
↓
Negociação
↓
Cliente
```

Não porque seja "errado", mas porque falta informação operacional.

Não sabemos:

- houve conexão?
- por que não respondeu?
- foi qualificado?
- possui fit?
- está em nurture?
- quem é responsável?
- quando deve ser reativado?
- por que perdeu?
- qual serviço?
- qual potencial?

---

# 45. Blueprint recomendado

A arquitetura final que emerge da pesquisa é:

```text
                    AQUISIÇÃO
                       │
       ┌───────────────┼────────────────┐
       │               │                │
     Inbound         Outbound         Referral
       │               │                │
       └───────────────┼────────────────┘
                       ↓
                     LEAD
                       │
                  Lead Scoring
                 Fit + Intent
                       │
             ┌─────────┴─────────┐
             │                   │
          MQL                    Não MQL
             │                   │
             ↓                Nurture
          SDR/BDR                 │
             │                    │
      Lead Status                Reativação
             │
      ┌──────┼───────┐
      │      │       │
     New  Attempting Connected
                    │
                    ↓
                 Qualified
                    │
                    ↓
                 DISCOVERY
                    │
                    ↓
                 DIAGNOSIS
                    │
                    ↓
                OPPORTUNITY
                    │
                    ↓
                PROPOSAL
                    │
                    ↓
               NEGOTIATION
                    │
              ┌─────┴─────┐
              ↓           ↓
           WON           LOST
              │             │
              ↓             ↓
          ONBOARDING    Lost Reason
              │             │
              ↓       ┌─────┴─────┐
           CUSTOMER   Nurture    Archive
              │
        ┌─────┼──────┐
        ↓     ↓      ↓
    Renewal Expansion Referral
```

---

# 46. A arquitetura de dados

A estrutura ideal não é um único funil.

É:

```text
CONTACT
   │
   └── LIFECYCLE

LEAD
   │
   └── LEAD STATUS

COMPANY
   │
   └── ICP / ACCOUNT DATA

DEAL
   │
   └── PIPELINE

ACTIVITIES
   │
   ├── Calls
   ├── Emails
   ├── Meetings
   └── Tasks

MARKETING
   │
   ├── Source
   ├── Campaign
   ├── Content
   └── Intent

CUSTOMER
   │
   ├── Onboarding
   ├── Health
   ├── Renewal
   └── Expansion
```

---

# 47. O CRM como máquina de estados

O maior insight da pesquisa é que um CRM maduro não deve ser entendido como:

> "uma lista de leads."

Ele é melhor entendido como uma **máquina de estados comerciais**.

Cada registro possui:

**Estado atual + condição de entrada + condição de saída + responsável + próxima ação + prazo.**

Por exemplo:

```text
Estado:
MQL

Entrada:
Fit ≥ A
+
Intent ≥ X

Responsável:
SDR

SLA:
5 minutos

Próxima ação:
Contato

Saída:
Connected
ou
Nurture
ou
Disqualified
```

Essa lógica permite transformar o CRM em um sistema operacional comercial.

---

# 48. Anti-patterns

## 1. Misturar Lifecycle e Pipeline

Erro:

> "Proposta" como Lifecycle.

---

## 2. Ter etapas sem critérios

Erro:

> "Negociação"

sem definir o que caracteriza negociação.

---

## 3. Pipeline baseado em opinião

Erro:

> "Acho que está 80%."

---

## 4. CRM como agenda

O CRM não pode apenas registrar reuniões.

---

## 5. Muitos campos

Mais dados não significam melhor CRM.

---

## 6. Automação sem processo

Automatizar um processo ruim apenas aumenta a velocidade do erro.

---

## 7. MQL sem definição

Se Marketing e Vendas possuem definições diferentes, o CRM perde valor.

---

## 8. Closed Lost sem motivo

Você perde a capacidade de aprender com o pipeline.

---

## 9. Leads sem owner

Lead sem responsável é, operacionalmente, lead abandonado.

---

## 10. Leads sem próxima atividade

O CRM deveria responder:

> "Qual é a próxima ação?"

---

# 49. Modelo recomendado de SLA

| Evento | SLA recomendado |
|---|---:|
| Lead inbound alta intenção | ≤ 5 min |
| MQL prioritário | ≤ 15 min |
| MQL normal | ≤ 30 min |
| Lead baixa intenção | ≤ 1 dia útil |
| Discovery realizada | Registro ≤ 24h |
| Proposta enviada | Follow-up ≤ 2 dias |
| Opportunity sem atividade | Alerta automático |
| Opportunity estagnada | Revisão automática |
| Closed Lost com timing | Reativação programada |

**Observação:** apenas o princípio da velocidade de resposta possui suporte empírico forte na literatura consultada; os demais tempos são recomendações operacionais para uma agência e devem ser calibrados com dados próprios.

---

# 50. Resposta à pergunta central

> **Se você tivesse que desenhar hoje, do zero, o CRM de uma agência digital B2B com inbound + outbound, vendas consultivas e contratos recorrentes, qual seria a arquitetura recomendada?**

Minha resposta é:

## Não construiria um único funil.

Construiria **cinco camadas integradas**:

### 1. Lifecycle

```text
Lead → MQL → SQL → Opportunity → Customer → Advocate
```

### 2. Lead Management

```text
New
→ Attempting
→ Connected
→ Qualified
→ Nurture / Disqualified
```

### 3. Sales Pipeline

```text
Discovery
→ Diagnosis
→ Qualified Opportunity
→ Proposal
→ Negotiation
→ Contract
→ Won/Lost
```

### 4. Revenue Automation

```text
Scoring
+
Routing
+
SLA
+
Cadence
+
Tasks
+
Nurture
+
Reactivation
```

### 5. Customer Revenue

```text
Won
→ Onboarding
→ Delivery
→ Health
→ Renewal
→ Expansion
→ Referral
```

---

# 51. A decisão estratégica mais importante

A evidência dos benchmarks sugere que a agência não deveria otimizar apenas:

> **"quantos leads estamos gerando?"**

O sistema deveria otimizar:

> **"quantos leads adequados estão avançando de forma previsível até gerar receita recorrente?"**

Portanto:

```text
Lead Generation
       ↓
Lead Quality
       ↓
Speed-to-Lead
       ↓
Qualification
       ↓
Opportunity Quality
       ↓
Win Rate
       ↓
Ticket
       ↓
Retention
       ↓
Expansion
       ↓
LTV
```

Esse é o verdadeiro funil econômico da agência.

---

# 52. Conclusão

O benchmark não aponta para um CRM "mais cheio de etapas".

Aponta para um CRM **mais explícito sobre estados, critérios e responsabilidades**.

A arquitetura mais sustentável para uma agência digital B2B é aquela em que:

**Lifecycle** responde onde o relacionamento está.

**Lead Status** responde o que está acontecendo com o lead.

**Pipeline** responde onde está a oportunidade.

**Scoring** responde quem merece prioridade.

**Automação** responde o que deve acontecer automaticamente.

**SLA** responde quando deve acontecer.

**Ownership** responde quem deve fazer.

**Closed Lost** responde por que não aconteceu.

**Customer Success** responde se o cliente continuará.

**Expansion** responde quanto mais receita pode ser gerada.

---

## Evidência central utilizada

- HubSpot — documentação oficial de Lifecycle Stages e pipelines.
- Salesforce — definição e desenho de Opportunity Stages.
- RD Station — Lead Scoring baseado em Perfil + Interesse.
- Sabnis et al., *Journal of Marketing* — estudo sobre follow-up de leads de marketing.
- Harvard Business Review — estudo sobre velocidade de resposta a leads online.
- Hüify, CreativeRace, SoMe Connect, TransFunnel, Six & Flow, Latigid, Posizionate e Sales Communications — benchmarks públicos de agências.

**Nota metodológica:** os cases de fornecedores são excelentes para descobrir estruturas e práticas reais publicamente divulgadas, mas seus resultados são *case evidence*, não experimentos controlados. Já as conclusões sobre arquitetura recomendada são sínteses/inferências feitas a partir desses padrões, e não afirmações de que todas as empresas pesquisadas utilizam exatamente esse desenho.