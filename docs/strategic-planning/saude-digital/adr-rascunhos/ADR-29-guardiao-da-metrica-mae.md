# [RASCUNHO] ADR-29 — Guardião da Métrica-Mãe (Portão de Qualidade de Dado)

> **STATUS:** RASCUNHO (git, design-canônico). Aprovado em princípio por Olavo
> 2026-07-31 (sessão pós-teste da campanha Salão). Vira `Aceito` quando o portão
> determinístico (Camadas 0 + 2) rodar em produção.
>
> **ESCOPO:** deliberadamente **separado** do refino dos agentes (Extrator / pedido de
> dado — futuro ADR-30) e da frente Planejamento, para não empilhar muitas mudanças de
> uma vez. Este ADR trata só de **garantir que a métrica-mãe é confiável antes de virar
> fato**.

## Contexto

Teste real (campanha Salão, PMax, `GADS-21116045403`, jan–jul/2026): o `Custo/conv.`
reportado foi **R$2,49 contra meta R$3,50** — parecia ótimo. Mas as 2.224,94
"conversões" eram dominadas por ações **soft** (Engajamento 4.488, Ver rotas 355,
Visualização 374), e o próprio Google marcava o status como **"Qualificado (limitado)"
— conversões com problema de configuração + estratégia de lances limitada**. A leitura
determinística deu `severidade: info, flags: []` ("tudo bem"). Só o agente cognitivo
pegou o problema — **na ponta, e a semana levaria dias**.

Isto **não é bug pontual** — é uma **falha de integridade de medição**, que tem a
propriedade perigosa de **propagar em silêncio, de baixo pra cima**: dado ruim na origem
→ `raw_campaign_data` → `phi_score` (tratado como fato) → análise → tarefas. É a mesma
família do incidente da credencial BigQuery (risco **T11**: 10 dias de score sem dado,
zero linhas/zero logs, sem erro visível). Hoje os **guardrails 8/9** (cpa:0;
source_status) só vivem **dentro do prompt de análise** — tarde e downstream demais.

## Decisão

**A métrica-mãe (CPA/ROAS) só é tratada como fato depois de passar por um Guardião
determinístico na origem.** Princípio: **falhar rápido, falhar barato, falhar na
origem.** O agente cognitivo (T28) é a **última** linha de defesa, não a primeira.

### Defesa em profundidade

| Camada | Onde | O que faz | Custo |
|---|---|---|---|
| **0 — Portão na ingestão** | Agregador / writers do `raw_campaign_data` | Checa sanidade do dado ao entrar (status, composição, source_status) | determinístico, diário |
| **1 — Selo de confiança no score** | Pipeline_v2 | Métrica-mãe suspeita ⇒ score carrega flag "baixa confiança"; **não é fato limpo** downstream | determinístico |
| **2 — Monitor da métrica-mãe** | job diário lendo o BQ | Compara valor atual vs histórico salvo no mesmo período ⇒ anomalia ⇒ **abre tarefa + alimenta a KB** | determinístico, diário |
| **3 — Agente cognitivo** | T28 | Pega o sutil/contextual que os determinísticos não veem | LLM, semanal |

O **Guardião** é um **sub-workflow reutilizável** (padrão ADR-25), chamado pelo Agregador
(ingestão), pelo Pipeline_v2 (score) e por um monitor diário. É a casa natural do
**agente QA** já previsto no roster (Camada Learn/transversal). Um lugar só, várias
portas — **resolve nos outros workflows, não só no T28**.

### Regras de detecção (os 6 checks) e automação via Google Ads API

| # | Regra | Como detecta | Automatável |
|---|---|---|---|
| 1 | **Status/config da plataforma** — "limitado", conversões com problema de config, bid limitada | `campaign.primary_status` / `primary_status_reasons` (confirmar nome exato em v23) | API |
| 2 | **Composição da conversão** — soft dominando vs metas declaradas | `segments.conversion_action_category` + `conversion_action.primary_for_goal` | **API ✅** |
| 3 | **source_status** error/missing ⇒ N/D (não 0) | campo `source_status` do Agregador | determinístico ✅ |
| 4 | **Zero-dado / flatline** — zero linhas/zero logs | contagem vs esperado no BQ/logs | ✅ (T11) |
| 5 | **Salto implausível vs histórico** — variação grande/rápida, nos dois sentidos ("bom demais" também é suspeito) | métrica-mãe atual vs `phi_score_history` no mesmo período | **BQ ✅** |
| 6 | **Integridade de definição** — `conversions=0 ⇒ CPA/ROAS indefinidos` | determinístico | ✅ (guardrail 8) |

### Como a API entrega composição + config (base do check #1 e #2)

- **Composição:** GAQL segmentando por `segments.conversion_action[_name|_category]` com
  `metrics.conversions` → conversões por ação e por categoria (hard-lead vs soft).
- **Config:** recurso `conversion_action`, campo **`primary_for_goal`** (o
  `include_in_conversions_metric` está **DEPRECIADO** — usar `primary_for_goal`).
  `primary_for_goal=true` ⇒ a ação **conta em "Conversões" e é biddable**. Ação de
  categoria soft (PAGE_VIEW/STORE_VISIT/ENGAGEMENT/…) marcada como primary ⇒ **red flag**.
- **Fato que fecha:** sem segmento, `metrics.conversions` = **soma só das ações PRIMARY**.
  Logo, "Conversões" inflada por soft ⇒ soft configurada como primary (a API **prova** a
  má config).
- **Ressalva (regra 13, CLAUDE.md):** `cost_per_conversion` é **incompatível** com o
  segmento por ação de conversão. O custo não é atribuível por ação → puxar **custo total**
  (sem segmento) e calcular o **CPA-real na mão** = custo ÷ soma das ações-meta hard.

### Ação ao detectar (severidade crítica)

1. **Selo de confiança no score** — marca a métrica-mãe como baixa-confiança; downstream
   não trata como fato limpo (complementa ADR-003).
2. **Abre tarefa com checklist** de correção na DB de Tasks/Demandas (**loop ADR-22**).
   Ex. (config-limitada): revisar ações primárias · confirmar só Chamada/Contato/WhatsApp
   como `primary_for_goal` · verificar disparo das tags · confirmar bid não-limitada ·
   re-medir CPA sobre lead-meta.
3. **Grava o padrão** numa base "Padrões de Falha de Medição" (KB) → vira **substrato dos
   agentes** + aprendizado (Camada Learn). Padrão recorrente **gradua** para um novo check
   determinístico.

## Alternativas consideradas

1. **Deixar a detecção no agente cognitivo (semanal).** Rejeitado: tarde demais, caro,
   não escala; é o problema que motivou este ADR.
2. **Manter só nos guardrails 8/9 do prompt.** Rejeitado: downstream; não protege o score
   nem os outros workflows.
3. **Portão determinístico reutilizável na origem + monitor diário + selo no score
   (escolhida).** Pega no mesmo dia, sem LLM, e serve todas as frentes.

## Consequências

- (+) A métrica-mãe deixa de virar "fato" em silêncio; problema pego **no mesmo dia**.
- (+) **Reutilizável por todos os WFs** (Agregador, Pipeline_v2, monitor), não só o T28.
- (+) Alimenta a KB → agentes ficam mais afiados; o loop de tarefa (ADR-22) já existe.
- (−) Mais um sub-WF + chamadas de API extras (query de segmento por ação); respeitar
  rate limit — a query de config (`conversion_action`) é barata e cacheável.
- (−) `campaign.primary_status_reasons`: confirmar disponibilidade/nome exato em v23 na
  implementação.

## Reavaliar quando

- Padrões recorrentes na KB → promover a novos checks determinísticos.
- Field names da API v23 confirmados na implementação.
- O selo de confiança do score estabilizar → decidir se vira componente do próprio score.

## Conexões com ADRs vigentes

- **Guardrails 8/9** (promovidos de regra-no-prompt a **portão que roda em todo lugar**).
- **ADR-003** (autoridade do score): agora com **selo de confiança** — score suspeito não
  é fato limpo.
- **ADR-21** (degradação do score em dado ralo): mesma família; estender a "métrica-mãe
  suspeita".
- **ADR-22** (loop alerta → tarefa → otimização): o disparo da tarefa corretiva.
- **ADR-25** (sub-WFs reutilizáveis): o Guardião é um deles.
- **ADR-28** (E1): o agente cognitivo é a última linha, não a primeira.
- **Risco T11** (falha silenciosa de credencial): o check #4 o generaliza.
- **Roster:** agente **QA** (Camada Learn/transversal) é a casa do Guardião.
