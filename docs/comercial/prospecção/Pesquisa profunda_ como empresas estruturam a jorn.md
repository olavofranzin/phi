
# Relatório Executivo: Arquitetura de CRM para Agência Digital B2B

## 1. Executive Summary

Principais aprendizados da pesquisa:

- **Lifecycle ≠ Pipeline**: Empresas maduras separam claramente o estágio do relacionamento (Lifecycle: Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist) do estágio do deal no pipeline comercial (Prospecting → Qualification → Discovery → Proposal → Negotiation → Closed Won/Lost).[^1_1][^1_2][^1_3]
- **Handoff Marketing → Vendas exige SLA explícito**: Benchmarks mostram que MQLs devem ser aceitas por vendas em até 24h, com definição clara de critérios de fit (ICP) e intent (comportamento).[^1_4][^1_5][^1_6]
- **Lead scoring combina fit + intent**: Modelos eficazes usam duas dimensões independentes — fit (demográfico/firmográfico) e intent (comportamental) — com pontuação mínima em ambas para MQL.[^1_7][^1_8][^1_9]
- **Cadência de follow-up: 8–12 toques em 17–21 dias**: Sequências outbound de alta performance combinam e-mail, ligação, LinkedIn e vídeo, com intervalo de 2–4 dias entre toques.[^1_10][^1_11]
- **Velocidade de resposta impacta conversão**: Contatar leads inbound em até 5 minutos aumenta drasticamente a chance de qualificação; após 30 minutos, a probabilidade cai mais de 20x.[^1_11][^1_12]
- **Closed-Lost deve ter categorias estruturadas**: Motivos como "preço", "concorrente", "sem budget", "timing", "sem fit" e "sem resposta" alimentam inteligência de marketing, produto e estratégia.[^1_13][^1_14][^1_15][^1_16]
- **Agências digitais exigem pipeline consultivo**: Estruturas típicas incluem Lead → Qualificação → Discovery → Diagnóstico → Proposta → Negociação → Fechamento → Onboarding → Expansão/Renovação.[^1_17][^1_18][^1_19][^1_20]
- **Pós-venda é parte do pipeline de receita**: Onboarding, kickoff, expansão (upsell/cross-sell), renovação e indicação devem ser rastreados como oportunidades separadas no CRM.[^1_21][^1_22][^1_23]
- **Automações essenciais**: Atualização automática de lifecycle, criação de tarefas para SDR, cadências de nurture, alertas de inatividade, reciclagem de leads e notificações de renovação.[^1_24][^1_25][^1_26]
- **Métricas críticas para agências**: Lead → MQL, MQL → SQL, SQL → Won, velocidade de resposta, ciclo de vendas, win rate, ticket médio, churn, expansão (NRR), LTV e motivos de perda.[^1_22][^1_27][^1_28]

______________________________________________________________________

## 2. Benchmark de Mercado

A tabela abaixo resume empresas e modelos identificados na pesquisa:


| Empresa / Fonte | Segmento | CRM | Lifecycle | Pipeline | Automação | Scoring | Observações |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **HubSpot (documentação oficial)** | SaaS / CRM | HubSpot | Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist [^1_1][^1_2] | Prospecting → Qualification → Meeting/Demo → Proposal → Negotiation → Closed [^1_29][^1_27] | Workflows automáticos de lifecycle, tarefas, nurture [^1_24][^1_30] | Fit + Intent (demográfico, firmográfico, comportamental) [^1_7][^1_9] | Padrão de mercado para SMB/mid-market. |
| **Salesforce (documentação)** | SaaS / CRM | Salesforce | Lead → MQL → SAL → SQL → SAO → Opportunity → Customer [^1_31][^1_6] | Prospecting → Discovery → Proposal → Negotiation → Closed [^1_19][^1_32] | Flow, Apex, alertas de renovação [^1_23] | Account scoring (fit + intent + technographic) [^1_33] | Usado por empresas enterprise; customizável. |
| **ZoomInfo / Demandbase** | Data / RevOps | Integrado | MQL → SAL → SQL → Opportunity → Customer [^1_22][^1_6] | 6–7 etapas padrão [^1_32][^1_34] | Intent data, alertas de buying signals [^1_33][^1_7] | Fit (ICP) + Intent (web, conteúdo, demo) [^1_33][^1_8] | Foco em account-based scoring. |
| **Agência digital (case OnTheFuze)** | Agência | HubSpot | Customizado (Lead → MQL → SQL → Customer) [^1_35] | Lead → Qualificação → Discovery → Proposta → Fechamento [^1_35][^1_28] | Workflows de overload, dashboards [^1_35] | Não divulgado publicamente | Implementação real de agência. |
| **Hotpipe (Brasil)** | Consultoria Vendas B2B | RD Station / HubSpot | Lead → MQL → SQL → Opportunity [^1_36] | Qualificar → Apresentar → Follow-up → Fechado [^1_37][^1_36] | Automação de cadência, SLA [^1_36] | BANT / ICP [^1_38][^1_36] | Foco em processo comercial previsível. |
| **Vida.io (outbound)** | SaaS / Outbound | HubSpot / Salesforce | MQL → SQL → Opportunity [^1_10] | 8–12 toques em 17–21 dias [^1_10] | Sequências automáticas (email, call, LinkedIn) [^1_10][^1_11] | Fit + Engagement [^1_10] | Cadência outbound best-in-class. |
| **Revenue Operations Alliance** | RevOps | Genérico | MAL → MQL → SAL → SQL → SAO → Customer [^1_4][^1_39] | 5–7 etapas [^1_4][^1_27] | Recycling rules, nurture pathways [^1_25] | Fit + Intent [^1_4][^1_8] | Framework de referência para RevOps. |


______________________________________________________________________

## 3. Arquitetura Recomendada de CRM

Com base nos benchmarks, a arquitetura de referência para uma agência digital B2B deve incluir:

### 3.1. Objetos/Registros

- **Lead/Contato**: Pessoa física (decisor, influenciador).
- **Empresa/Account**: Pessoa jurídica (cliente potencial ou ativo).
- **Deal/Oportunidade**: Negócio comercial com valor, estágio e data de fechamento.
- **Ticket/Atendimento**: Solicitações pós-venda (suporte, onboarding).
- **Produto/Serviço**: Catálogo de serviços da agência (ex: gestão de tráfego, SEO, conteúdo).
- **Contrato**: Registro de termos, vigência, valor, renovação.


### 3.2. Propriedades Essenciais

| Categoria | Campos | Prioridade |
| :-- | :-- | :-- |
| **Origem** | Origem do lead, campanha, canal, utm_source, utm_medium | Obrigatório |
| **Fit (ICP)** | Segmento, porte (funcionários), faturamento, maturidade de marketing, budget estimado | Obrigatório |
| **Intent** | Interesse declarado, serviço desejado, urgência, próxima ação | Recomendado |
| **Qualificação** | BANT (Budget, Authority, Need, Timeline), fit cultural, complexidade | Obrigatório |
| **Deal** | Valor potencial, probabilidade, data de fechamento, estágio do pipeline | Obrigatório |
| **Pós-venda** | Data de onboarding, CSM responsável, próxima renovação, satisfação (NPS) | Recomendado |


______________________________________________________________________

## 4. Jornada Completa do Lead

A jornada mapeada a partir dos benchmarks:

```
Aquisição (Inbound/Outbound)
  ↓
Lead (Contato registrado)
  ↓
Qualificação (Fit + Intent)
  ↓
MQL (Marketing Qualified Lead)
  ↓
SAL (Sales Accepted Lead)
  ↓
SQL (Sales Qualified Lead)
  ↓
Discovery / Diagnóstico
  ↓
Oportunidade (Deal criado)
  ↓
Proposta Enviada
  ↓
Negociação
  ↓
Closed Won → Onboarding → Customer → Expansão/Renovação
  ↓
Closed Lost → Reciclagem / Nutrição / Reativação
```

**Diferenciação crítica**: Lifecycle (estágio do contato) e Pipeline (estágio do deal) são objetos separados no CRM.[^1_2][^1_1][^1_24]

______________________________________________________________________

## 5. Régua de Interação

Matriz de automações e cadências:


| Momento | Gatilho | Canal | Ação | Timing | Responsável | Automação |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Lead convertido | Formulário preenchido | E-mail | E-mail de confirmação + próximo passo | Imediato | Marketing | Workflow HubSpot [^1_24] |
| Lead recebido | Novo lead no CRM | Tarefa | Criar tarefa para SDR | 5 minutos | SDR | Automação de atribuição [^1_25] |
| Lead sem contato | Lead sem atividade | E-mail/Call | Primeira tentativa de contato | 1 dia | SDR | Cadência outbound [^1_10][^1_11] |
| Lead inativo | Sem resposta em 7 dias | E-mail | Conteúdo educativo (case, webinar) | 7 dias | Marketing | Nutrição automática [^1_40][^1_41] |
| MQL aceita | Vendas aceita lead | Call/LinkedIn | Agendar discovery | 24h | SDR/AE | SLA de handoff [^1_4][^1_5] |
| Proposta enviada | Deal em "Proposta" | E-mail | Follow-up de proposta | 3 dias | AE | Lembrete automático [^1_29] |
| Closed Won | Deal fechado | E-mail/Call | Kickoff + onboarding | 24–48h | CS/Operação | Handoff automático [^1_42][^1_43] |
| Closed Lost | Deal perdido | E-mail | Pesquisa de motivo + nurture | 7 dias | Marketing | Reciclagem para campanha [^1_44][^1_16] |
| Cliente inativo | Sem interação em 60 dias | E-mail/Call | Campanha de reativação | 60 dias | CS/AE | Alerta de churn [^1_23] |


______________________________________________________________________

## 6. Modelo Específico para Agência Digital

### 6.1. Pipeline Comercial (7 etapas)

1. **Lead Recebido** (inbound/outbound)
2. **Qualificação** (fit + BANT inicial)
3. **Discovery / Diagnóstico** (reunião de entendimento)
4. **Estratégia / Pré-proposta** (alinhamento de escopo)
5. **Proposta Enviada** (formalização)
6. **Negociação** (ajustes de escopo, preço, prazo)
7. **Fechamento** (Won/Lost)

**Pós-venda como pipeline separado**:

- **Onboarding / Kickoff**
- **Entrega / Operação**
- **Expansão (Upsell/Cross-sell)**
- **Renovação**
- **Indicação / Evangelist**


### 6.2. Critérios de Qualificação para Agências

| Critério | Descrição | Peso |
| :-- | :-- | :-- |
| **Segmento** | Indústria, nicho, maturidade digital | Alto |
| **Faturamento** | Mínimo para sustentar fee da agência | Alto |
| **Investimento em mídia** | Budget para ads, conteúdo, ferramentas | Alto |
| **Maturidade de marketing** | Equipe interna, processos, CRM | Médio |
| **Budget para agência** | Fee mensal ou projeto | Alto |
| **Fit cultural** | Alinhamento de valores, comunicação | Médio |
| **Potencial de recorrência** | Contrato de longo prazo, expansão | Alto |


______________________________________________________________________

## 7. Campos Essenciais do CRM

| Campo | Tipo | Prioridade | Justificativa |
| :-- | :-- | :-- | :-- |
| Origem do lead | Picklist | Obrigatório | Atribuição de ROI de marketing [^1_29][^1_28] |
| Campanha | Texto | Obrigatório | Rastreamento de performance |
| Canal | Picklist | Obrigatório | Inbound, outbound, indicação, evento |
| Segmento | Picklist | Obrigatório | ICP e fit [^1_33][^1_7] |
| Porte (funcionários) | Número | Recomendado | Firmográfico |
| Faturamento anual | Moeda | Recomendado | Potencial de contrato |
| Cargo | Texto | Obrigatório | Autoridade (BANT) [^1_38] |
| Interesse / Serviço desejado | Picklist | Obrigatório | Roteamento para especialista |
| Budget estimado | Moeda | Recomendado | Qualificação BANT [^1_38] |
| Urgência / Timeline | Data | Recomendado | Priorização |
| Fit score | Número | Recomendado | Scoring de fit [^1_8][^1_9] |
| Intent score | Número | Recomendado | Scoring de comportamento [^1_7][^1_45] |
| Lead Status | Picklist | Obrigatório | New, Attempted, Connected, Qualified, Unqualified [^1_4][^1_2] |
| Lifecycle Stage | Picklist | Obrigatório | Subscriber, Lead, MQL, SQL, Opportunity, Customer [^1_1][^1_2] |
| Deal Stage | Picklist | Obrigatório | Pipeline comercial [^1_29][^1_27] |
| Motivo de perda | Picklist | Obrigatório | Análise de Closed-Lost [^1_13][^1_14][^1_15] |
| CSM responsável | Usuário | Recomendado | Pós-venda [^1_23][^1_43] |
| Data de renovação | Data | Recomendado | Retenção e expansão [^1_23] |


______________________________________________________________________

## 8. Regras de Automação

1. **Lead → MQL**: Quando fit score ≥ 40 E intent score ≥ 60, atualizar lifecycle para MQL e notificar SDR.[^1_8][^1_9]
2. **MQL → SAL**: Quando SDR aceita lead, criar tarefa de discovery em 24h.[^1_5][^1_4]
3. **SQL → Opportunity**: Quando reunião de discovery é realizada, criar deal automaticamente.[^1_6][^1_30]
4. **Closed Won → Customer**: Quando deal é fechado, atualizar lifecycle para Customer e criar tarefa de onboarding.[^1_30][^1_2]
5. **Closed Lost → Nutrição**: Quando deal é perdido, mover lead para campanha de nurture com intervalo de 30 dias.[^1_16][^1_44]
6. **Inatividade → Reativação**: Quando lead não interage em 60 dias, disparar e-mail de reativação.[^1_25][^1_26]
7. **Renovação próxima**: Quando data de renovação ≤ 30 dias, notificar CSM e AE.[^1_23]
8. **No-show**: Quando reunião é agendada mas não realizada, criar tarefa de follow-up em 24h.[^1_27]
9. **Proposta sem resposta**: Quando proposta enviada e sem resposta em 5 dias, disparar follow-up automático.[^1_29]
10. **Evangelist**: Quando cliente fornece case ou indicação, atualizar lifecycle para Evangelist e notificar marketing.[^1_2][^1_30]

______________________________________________________________________

## 9. SLAs Sugeridos

| Etapa | SLA | Fonte / Justificativa |
| :-- | :-- | :-- |
| Lead → Primeiro contato (inbound) | 5–30 minutos | Benchmarks de velocidade de resposta [^1_12][^1_11] |
| MQL → Aceite de vendas (SAL) | 24 horas | SLA padrão de handoff Marketing → Vendas [^1_4][^1_5] |
| SAL → Primeira reunião (Discovery) | 2–3 dias | Cadência outbound típica [^1_10][^1_11] |
| Proposta → Follow-up | 3–5 dias | Evitar deal estagnado [^1_29][^1_32] |
| Closed Won → Onboarding | 24–48 horas | Handoff vendas → CS [^1_42][^1_43] |
| Closed Lost → Nutrição | 7 dias | Reciclagem para campanha [^1_44][^1_16] |
| Cliente → Renovação | 30 dias antes do vencimento | Retenção e expansão [^1_23] |


______________________________________________________________________

## 10. Métricas (KPIs) Essenciais

| Métrica | Fórmula / Definição | Relevância para Agência |
| :-- | :-- | :-- |
| **Lead → MQL** | % de leads que viram MQL | Qualidade da geração de leads [^1_22][^1_27] |
| **MQL → SQL** | % de MQLs aceitas por vendas | Eficácia do handoff [^1_4][^1_6] |
| **SQL → Won** | Win rate de oportunidades | Eficiência comercial [^1_22][^1_27] |
| **Velocidade de resposta** | Tempo médio Lead → Primeiro contato | Impacto direto na conversão [^1_12][^1_11] |
| **Ciclo de vendas** | Dias médios Lead → Closed Won | Previsibilidade de receita [^1_46][^1_27] |
| **Ticket médio** | Valor médio de deal fechado | Planejamento de capacidade [^1_28] |
| **CAC** | Custo de aquisição de cliente | Sustentabilidade do modelo [^1_22] |
| **Churn** | % de clientes perdidos / mês | Retenção e saúde do negócio [^1_22][^1_23] |
| **NRR (Net Revenue Retention)** | (Receita de renovação + expansão) / Receita anterior | Crescimento orgânico [^1_22][^1_23] |
| **LTV** | Ticket médio × (1 / Churn) × Margem | Valor do cliente no tempo [^1_21][^1_22] |
| **Motivos de perda** | Distribuição % por categoria | Inteligência de mercado [^1_13][^1_14][^1_15][^1_16] |
| **Taxa de reativação** | % de Closed-Lost reativados | Eficiência de win-back [^1_44][^1_16] |


______________________________________________________________________

## 11. Anti-Patterns (Erros Comuns)

- **Excesso de etapas no pipeline**: Mais de 8 etapas gera complexidade e baixa adoção.[^1_34][^1_27]
- **Etapas sem critérios objetivos**: Ex: "Em negociação" sem definição de o que significa.[^1_32][^1_47]
- **CRM usado apenas como agenda**: Sem registro de interações, motivos de perda ou handoffs.[^1_48][^1_49]
- **Campos demais**: Complexidade desnecessária reduz qualidade dos dados.[^1_50][^1_24]
- **Automações excessivas**: Workflows conflitantes geram ruído e erros.[^1_35][^1_50]
- **Ausência de SLA**: Leads ficam sem dono ou demoram para ser contactados.[^1_4][^1_5][^1_25]
- **Ausência de motivos de perda**: Impossível aprender com deals perdidos.[^1_14][^1_15][^1_13][^1_16]
- **Mistura entre lifecycle e pipeline**: Confusão entre estágio do contato e estágio do deal.[^1_1][^1_24][^1_2]
- **Leads esquecidos**: Sem reciclagem ou nurture para leads não prontos.[^1_40][^1_41][^1_25]
- **Falta de ownership**: Leads sem dono claro no CRM.[^1_51][^1_25]

______________________________________________________________________

## 12. Blueprint Final: CRM para Agência Digital B2B

### 12.1. Lifecycle → Pipeline → Critérios → Campos → Scoring → Automação → Régua → SLA → Métricas → Handoff → Pós-venda

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            JORNADA DO LEAD (LIFECYCLE)                      │
│  Subscriber → Lead → MQL → SAL → SQL → Opportunity → Customer → Evangelist  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PIPELINE COMERCIAL (DEAL)                          │
│  Lead Recebido → Qualificação → Discovery → Proposta → Negociação → Won/Lost│
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PÓS-VENDA (CS)                                 │
│  Onboarding → Operação → Expansão → Renovação → Indicação                   │
└─────────────────────────────────────────────────────────────────────────────┘
```


### 12.2. Critérios de Avanço/Retrocesso

| Etapa | Critério de Entrada | Critério de Saída | Responsável | SLA |
| :-- | :-- | :-- | :-- | :-- |
| Lead | Formulário, inbound, outbound | Fit + Intent ≥ threshold | Marketing | Imediato |
| MQL | Fit ≥ 40, Intent ≥ 60 | Aceite de vendas | SDR | 24h |
| SQL | Discovery agendada | Reunião realizada | AE | 2–3 dias |
| Opportunity | Deal criado | Proposta enviada | AE | 5 dias |
| Won | Contrato assinado | Onboarding iniciado | CS | 24–48h |
| Lost | Deal recusado | Nutrição iniciada | Marketing | 7 dias |

### 12.3. Campos Obrigatórios

- Origem, Campanha, Canal, Segmento, Cargo, Interesse, Budget, Timeline, Lead Status, Lifecycle Stage, Deal Stage, Motivo de Perda.


### 12.4. Scoring

- **Fit (0–100)**: Segmento (25), Porte (25), Faturamento (25), Maturidade (25).
- **Intent (0–100)**: Visita pricing (30), Demo request (40), Download case (20), Webinar (10).
- **MQL**: Fit ≥ 40 E Intent ≥ 60.[^1_9][^1_7][^1_8]


### 12.5. Automações-Chave

- Lead → MQL (scoring threshold).
- MQL → Tarefa SDR (24h).
- SQL → Deal criado (auto).
- Won → Onboarding (tarefa CS).
- Lost → Nutrição (30 dias).
- Renovação → Alerta (30 dias antes).


### 12.6. Régua de Interação

- Inbound: E-mail imediato + tarefa SDR em 5 min.
- Outbound: 8–12 toques em 17–21 dias (email, call, LinkedIn).[^1_10][^1_11]
- Nutrição: Conteúdo educativo a cada 7–14 dias.
- Reativação: Campanha a cada 60 dias de inatividade.


### 12.7. SLAs

- Lead → Contato: 5–30 min.
- MQL → Aceite: 24h.
- Proposta → Follow-up: 3–5 dias.
- Won → Onboarding: 24–48h.


### 12.8. Métricas

- Lead → MQL, MQL → SQL, SQL → Won, Velocidade, Ciclo, Win Rate, Ticket, CAC, Churn, NRR, LTV, Motivos de Perda.


### 12.9. Handoff

- **Marketing → SDR**: MQL com fit + intent documentados.
- **SDR → AE**: SQL com BANT preenchido.
- **AE → CS**: Closed Won com kickoff agendado.


### 12.10. Pós-venda

- Onboarding (kickoff, expectativas, cronograma).
- Operação (entregas, relatórios, NPS).
- Expansão (upsell, cross-sell).
- Renovação (30 dias antes).
- Indicação (Evangelist).

______________________________________________________________________

## Resposta à Pergunta Final

**Se eu tivesse que desenhar hoje, do zero, o CRM de uma agência digital B2B com geração de leads inbound + outbound, vendas consultivas e contratos recorrentes, qual seria a arquitetura recomendada — e quais evidências do mercado justificam cada decisão?**

**Arquitetura recomendada**:

1. **Separação clara entre Lifecycle (contato) e Pipeline (deal)**, usando os estágios padrão do HubSpot/Salesforce como referência.[^1_1][^1_2]
2. **Pipeline comercial de 6–7 etapas** (Qualificação → Discovery → Proposta → Negociação → Won/Lost), com critérios objetivos de avanço.[^1_27][^1_29][^1_32]
3. **Scoring de fit + intent**, com threshold duplo para MQL (ex: fit ≥ 40, intent ≥ 60).[^1_7][^1_8][^1_9]
4. **SLA de velocidade de resposta** (5–30 min para inbound, 24h para MQL → SAL).[^1_12][^1_5][^1_11]
5. **Cadência outbound de 8–12 toques em 17–21 dias**, combinando e-mail, call, LinkedIn.[^1_11][^1_10]
6. **Automações de handoff** (MQL → tarefa SDR, Won → onboarding CS, Lost → nurture).[^1_42][^1_43][^1_4]
7. **Closed-Lost com categorias estruturadas** para análise de padrões.[^1_15][^1_13][^1_14][^1_16]
8. **Pós-venda como pipeline separado** (onboarding, expansão, renovação, indicação).[^1_21][^1_22][^1_23]
9. **Métricas de ponta a ponta** (Lead → MQL → SQL → Won, ciclo, win rate, churn, NRR, LTV).[^1_28][^1_22][^1_27]

**Evidências de mercado**:

- HubSpot e Salesforce documentam lifecycle e pipeline como objetos separados.[^1_2][^1_1]
- Benchmarks de cadência outbound mostram 8–12 toques em 17–21 dias como padrão de alta performance.[^1_10][^1_11]
- Estudos de caso de agências (OnTheFuze, Hotpipe) validam pipeline consultivo com discovery, proposta e negociação.[^1_36][^1_28][^1_35]
- RevOps e ZoomInfo reforçam scoring fit + intent e handoff com SLA.[^1_33][^1_5][^1_4]
- Análise de Closed-Lost é citada como "maior growth hack" para B2B.[^1_16]

Essa arquitetura equilibra **complexidade operacional** (não exagera em etapas ou campos) com **previsibilidade de receita** (SLAs, métricas, automações), sendo sustentável para uma agência digital B2B em crescimento.

<span style="display:none">[^1_52][^1_53][^1_54][^1_55][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84]</span>

<div align="center">⁂</div>

[^1_1]: https://knowledge.hubspot.com/records/use-lifecycle-stages

[^1_2]: https://www.onthefuze.com/hubspot-insights-blog/hubspot-lifecycle-stages-explained

[^1_3]: https://www.campaigncreators.com/blog/how-hubspot-lifecycle-stages-guide-lead-nurturing

[^1_4]: https://www.revenueoperationsalliance.com/lead-stage-vs-lead-status-whats-the-difference/

[^1_5]: https://pipeline.zoominfo.com/sales/b2b-sales-team-structure

[^1_6]: https://www.salesforce.com/au/blog/what-is-a-sales-qualified-lead/

[^1_7]: https://pipeline.zoominfo.com/marketing/lead-scoring

[^1_8]: https://www.clariantcreative.com/blog/how-to-build-b2b-lead-scoring-model

[^1_9]: https://orbitforms.ai/blog/lead-scoring-models-for-b2b

[^1_10]: https://vida.io/blog/best-outbound-sales-cadence

[^1_11]: https://www.saber.app/glossary/lead-follow-up-cadence

[^1_12]: https://www.linkedin.com/posts/nexeradigitalsolutions_nexeradigital-b2bgrowth-marketingautomation-activity-7464977232147644416-ry2i

[^1_13]: https://spotio.com/blog/closed-lost-opportunities/

[^1_14]: https://saleshive.com/glossary/closed-lost

[^1_15]: https://firstsales.io/sales/glossary/closed-lost/

[^1_16]: https://directiveconsulting.com/blog/the-biggest-b2b-saas-growth-hack/

[^1_17]: https://monday.com/blog/crm-and-sales/b2b-sales/

[^1_18]: https://www.salesgenie.com/blog/b2b-sales-guide/

[^1_19]: https://www.captivateiq.com/blog/what-are-the-stages-of-a-sales-pipeline

[^1_20]: https://www.reddit.com/r/agency/comments/1p7o4hl/how_long_is_your_sales_cycle_from_first_contact/

[^1_21]: https://pipeline.zoominfo.com/sales/customer-lifecycle-management

[^1_22]: https://www.revpack.co/blog/revops-metrics-performance-growth

[^1_23]: https://www.crmsyntax.com/case-studies.html

[^1_24]: https://www.getgsi.com/blog/hubspot-leads-lifecycle-and-pipeline-stage-overview

[^1_25]: https://www.saber.app/glossary/sales-operations

[^1_26]: https://www.reddit.com/r/hubspot/comments/1neccsz/whats_the_most_satisfying_hubspot_automation/

[^1_27]: https://blog.hubspot.com/sales/sales-pipeline-stages-visual-guide

[^1_28]: https://blog.hubspot.com/marketing/9-of-the-best-crms-for-digital-agencies

[^1_29]: https://blog.hubspot.com/sales/sales-pipeline

[^1_30]: https://www.pedowitzgroup.com/blog/hubspot-lifecycle-stages-blog

[^1_31]: https://www.candyboxcrm.com/blog/hubspot-vs-salesforce-how-to-make-them-work-together

[^1_32]: https://salesmotion.io/blog/sales-pipeline-stages

[^1_33]: https://www.demandbase.com/blog/account-scoring/

[^1_34]: https://www.sapbwconsulting.com/blog/inbound-marketing/sales-pipeline-stages-optimization

[^1_35]: https://www.onthefuze.com/case-studies

[^1_36]: https://www.hotpipe.com.br/processo-de-vendas-b2b

[^1_37]: https://mardini.com.br/blog/71-das-empresas-nao-batem-meta-vamos-te-contar-o-motivo

[^1_38]: https://www.datamaticsbpm.com/blog/complete-guide-on-bant-qualified-leads/

[^1_39]: https://gtmsystemsacademy.com/glossary/

[^1_40]: https://www.linkedin.com/posts/stephen-chukwu-21536726b_leadnurturing-emailmarketing-activecampaign-activity-7498665970832699392-tzg8

[^1_41]: https://www.netsuite.com/portal/resource/articles/crm/marketing-lead-nurturing.shtml

[^1_42]: https://www.linkedin.com/posts/drew-kluender_the-csm-role-is-dying-in-the-age-of-ai-activity-7457464334596698112-P7Id

[^1_43]: https://firstsales.io/sales/glossary/account-executive/

[^1_44]: https://www.linkedin.com/posts/venkateshwara-rao-k-mba-0906512b3_corporatesales-activity-7402356725212733440-N2Q4

[^1_45]: https://popl.co/blogs/all/what-is-lead-scoring-a-comprehensive-guide-to-understanding-and-implementing

[^1_46]: https://www.highspot.com/blog/sales-cycle-stages/

[^1_47]: https://www.pipedrive.com/en/blog/sales-pipeline-fundamental-stages

[^1_48]: https://www.instagram.com/p/DYmnJe0mT69/

[^1_49]: https://www.instagram.com/p/DZqPgKZGlpF/

[^1_50]: https://satvasolutions.com/blog/hubspot-salesforce-integration-guide

[^1_51]: https://www.facebook.com/TomFerry/posts/the-next-level-of-your-business-may-not-require-more-hustleit-may-require-cleane/1553344929493153/

[^1_52]: https://www.hubspot.com/use-case/build-sales-pipeline

[^1_53]: https://www.highspot.com/blog/lead-qualification/

[^1_54]: https://pipeline.zoominfo.com/sales/hubspot-vs-salesforce

[^1_55]: https://www.vested.marketing/blog/mastering-your-hubspot-sales-pipeline

[^1_56]: https://forecastio.ai/blog/b2b-sales-process

[^1_57]: https://blog.plusyourbusiness.com/hubspot-crm-implementation-complex-sales-pipelines

[^1_58]: https://www.linkedin.com/posts/alex-lieberman_even-though-ive-run-exited-a-75m-business-activity-7388949429954822144-eMv1

[^1_59]: https://www.instagram.com/p/Daia9NeDALn/

[^1_60]: https://almcorp.com/pt/blog/how-to-build-7-figure-white-label-digital-agency/

[^1_61]: https://www.mo.agency/blog/what-is-hubspot-crm-an-overview

[^1_62]: https://leads360.com.br/regua-relacionamento-crm/

[^1_63]: https://forecastio.ai/blog/hubspot-sales-pipeline-stages

[^1_64]: https://www.thesmallbusinessexpo.com/blog/b2b-lead-scoring-examples/

[^1_65]: https://www.linkedin.com/posts/hartmannmanuel_after-3-years-on-salesforce-this-b2b-software-activity-7414931382864343040-XpCd

[^1_66]: https://dealhub.io/glossary/sales-specialization/

[^1_67]: https://aspireship.com/how-to-break-into-customer-success-without-experience/

[^1_68]: https://www.cleverly.co/blog/email-sequence

[^1_69]: https://www.elevatiq.com/post/hubspot-vs-salesforce-crm/

[^1_70]: https://www.jivochat.com.br/blog/marketing/agencias-de-marketing-digital.html

[^1_71]: https://ebq.com/sales-process-steps/

[^1_72]: https://www.amper.ag/post/agencia-marketing-digital-saude

[^1_73]: https://remotereps.com/services/sales-outsourcing/what-is-b2b-sales

[^1_74]: https://www.linkedin.com/in/matheus-bonsanto

[^1_75]: https://www.ohub.com.br/empresas/marketing-digital

[^1_76]: https://www.instagram.com/p/DZ0BJnIgdey/?\_\_d=1%E5%B1%81%E5%B1%81%E7%A4%BE%E5%B7%A5%E5%BA%93%E2%9C%94%EF%B8%8F+shegongi.com+%E2%9C%94%EF%B8%8F+%E5%9C%A8%E7%BA%BF%E7%A7%92%E6%9F%A5%E6%9F%A5%E8%AF%A2%E4%B8%AA%E4%BA%BA%E5%AE%BD%E5%B8%A6%E5%AE%89%E8%A3%85%E5%9C%B0%E5%9D%80%E5%8F%8AIP%E5%9C%B0%E5%9D%80%E4%BB%B7%E6%A0%BC%E6%9C%80%E4%BC%98%E7%9A%84%E7%BA%BF%E4%BA%BA

[^1_77]: https://marketplace.rdstation.com/parceiro/figi/

[^1_78]: https://www.instagram.com/reel/Dai-t0WglVE/

[^1_79]: https://blog.hubspot.com/sales/sales-qualified-lead

[^1_80]: https://automationstrategists.com/blog/hubspot-lifecycle-stages/

[^1_81]: https://www.linkedin.com/in/sagarganatra

[^1_82]: https://content.hubjoy.co/hubspot-lifecycle-stages-lead-status-8-proven-alignment-tips

[^1_83]: https://www.leadboxer.com/learn/ultimate-guide-to-demographic-lead-scoring-models

[^1_84]: https://scalarly.com/blog/b2b-lead-scoring-model/

