# [BRUTO v0.1] Agregador T28 — Destino canônico do contract + governança

> **STATUS:** Strawman v0.1, 2026-06-21. 3 decisões travadas via AskUserQuestion (Olavo).
> Nada aqui tocou Notion canônico (DB Decisões) nem BigQuery (sem DDL). Pronto pra red-line
> e, após aprovação, virar **ADR formal "Destino canônico do contract T28 + governança"**.
>
> **FONTE DE VERDADE:** BigQuery (per ADR-010 — camada analítica canônica). Notion =
> cadastro de contexto. Git canônico para design (este doc, ADR-012).
>
> **Origem:** página Notion `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`,
> sob "Registro de Workflows n8n") + análise do schema BQ atual (`phi_prod.*`, per
> handoffs A.0/A.5/A.7/A.7b) + decisões 2026-06-21.

---

## 0. Decisões travadas 2026-06-21

| # | Item | Decisão |
|---|---|---|
| **Q1** | Papel do Notion vs BQ | **Notion = só cadastro de contexto** (Clientes/Campanhas/Conjuntos/Anúncios com objetivo, metas, modelo, ticket/LTV, margem). **BQ = único dono dos dados de métrica**. Display de métricas pra humanos vai via dashboard (Lovable/Looker) lendo do BQ. Zero drift; alinhado com ADR-010 e ADR-012. |
| **Q2** | Janelas temporais canônicas | **D-1, D-3, D-7, D-30 do PHI·Mídia** unificadas para todo o T28. Agregador semanal (D-7→D-1) materializa **D-7**. Mensal + panorama 30d materializam **D-30**. Coerente com PHI·Mídia (ADR-004 v2 + ADR-21); evita duas semânticas de "semanal". |
| **Q3** | Granularidade adset/ad | **Adset materializado como entidade.** Ad/criativo vai como **JSON aninhado** dentro da linha de adset (top-N criativos com headlines, descriptions, URLs finais). Economiza storage; agente acessa via SQL JSON functions. |

Decisões implícitas (consequência direta):
- 7 tabelas T28 em `phi_prod.*` (não 8 — ad colapsa em adset.criativos_json)
- Janela vira **dimensão** das tabelas T28 (coluna `janela ∈ {D-1, D-3, D-7, D-30}`)
- Particionamento por `business_date` + clustering por `client_id`
- Audit per ADR-009: `execution_id = EXEC-T28-*` + `source_execution_id` (link pro Daily Entry consumido)

---

## 1. Posicionamento

**Agregador T28 = camada de extração + normalização multi-fonte** que entrega contract padronizado por entidade para a camada de agentes IA do PHI.

**Relação com artefatos vigentes:**

| Artefato | Papel | Relação com T28 |
|---|---|---|
| **Daily Entry v4** | Writer canônico de `phi_prod.raw_campaign_data` (Google Ads + Meta Ads, nível campanha; per ADR-010 Daily Entry) | T28 **consome** raw_campaign_data como input cru; **não substitui** o Daily Entry |
| **PHI-Pipeline_v2** | Decision Engine — calcula PHI·Mídia (6 componentes MIV/MAS/TSS/FIS/ES/RS) | T28 **alimenta** entidades de campanha pro Pipeline_v2 consumir (hoje ele lê direto de raw_campaign_data; futuro pode ler de t28_campaign) |
| **ADR-21 (PHI = Índice Saúde Digital)** | PHI·Mídia = motor do pilar Mídia Paga (peso 35) | T28 é o **dado bruto** que alimenta o cálculo de PHI·Mídia; pode também alimentar pilares Funil/Orgânico/Social/Reputação/Dados via tabelas T28 dedicadas |
| **ADR Eventos canônicos** | Modelo de evento transversal | T28 emite `campaign_metrics.normalized` em `PHI - Eventos` quando termina; agentes downstream escutam |
| **ADR-22 (Loop alerta→tarefa)** | Detecção PHI → tarefa DB Tasks → Log de Otimizações | Agentes leem T28 pra decidir: PHI·Mídia caiu **E** `volume_suficiente=true` **E** sinal vs ruído → abre tarefa |

**T28 NÃO é:**
- substituto do Daily Entry (continua sendo writer canônico de raw_campaign_data)
- agente IA (é só o pipeline ETL + contract; agentes consomem o output)
- camada de apresentação (dashboards leem o BQ)

---

## 2. Princípios herdados

1. **`tenant_id` + `client_id` lógicos** em toda linha T28 (default `tenant_id=phi-agencia`)
2. **Notion = interface humana / cadastro**, BQ = analytical canônico (ADR-010)
3. **Versionamento explícito** da regra de cálculo: cada linha grava `versao_contract_aplicada` (semver). Mudança de schema/regra = nova versão (igual `versao_sop_aplicada` da Execução)
4. **Audit trail per ADR-009:** `execution_id = EXEC-T28-*` (próprio) + `source_execution_id` (link pro Daily Entry consumido), assimétrico com PHI-Pipeline_v2 que também propaga
5. **Idempotência por chave de negócio:** `(client_id, entity_id, business_date, janela, versao_contract_aplicada)` → MERGE em vez de INSERT puro

---

## 3. Schema BigQuery proposto — 7 tabelas em `phi_prod`

### 3.1. Convenções comuns

Toda tabela T28 tem o **bloco de audit + qualidade**:

```sql
client_id                STRING NOT NULL,
business_date            DATE   NOT NULL,
janela                   STRING NOT NULL,   -- 'D-1' | 'D-3' | 'D-7' | 'D-30'
execution_id             STRING NOT NULL,   -- 'EXEC-T28-{n8n_exec_id}'
source_execution_id      STRING,            -- link pro Daily Entry consumido (ADR-009)
versao_contract_aplicada STRING NOT NULL,   -- semver, ex: 'v1.0'
source_status            JSON   NOT NULL,   -- {google_ads:'ok', ga4:'cred_missing', gbp:'error', clarity:'rate_limit'}
volume_suficiente        BOOLEAN NOT NULL,  -- per SOP critério estatístico
ingested_at              TIMESTAMP NOT NULL,
```

Particionamento: `PARTITION BY business_date` · Clustering: `CLUSTER BY client_id, janela`.

### 3.2. As 7 tabelas

| Tabela | Granularidade | Chave de negócio |
|---|---|---|
| `t28_campaign` | 1 linha por (client_id, campaign_id, business_date, janela). Métricas Google Ads campanha + KPIs derivados + contexto Notion. | `(client_id, campaign_id, business_date, janela)` |
| `t28_adset` | 1 linha por (client_id, adset_id, business_date, janela). Métricas Google Ads conjunto + **`criativos_json`** (array dos top-N ads: headlines, descriptions, urls, métricas resumo). | `(client_id, adset_id, business_date, janela)` |
| `t28_search_terms` | 1 linha por (client_id, campaign_id, term, business_date, janela). Cliques/conversões + classificação Gemini. | `(client_id, campaign_id, term, business_date, janela)` |
| `t28_ga4_landing` | 1 linha por (client_id, business_date, janela, canal, landing_page, source). Sessões/usuários/conversões/engagement. | `(client_id, business_date, janela, canal, landing_page, source)` |
| `t28_gbp_daily` | 1 linha por (client_id, business_date, janela). Impressões locais, cliques no site, ligações, rotas. | `(client_id, business_date, janela)` |
| `t28_clarity_daily` | 1 linha por (client_id, business_date, janela). UX behavior (rage clicks, dead clicks, scrolls). | `(client_id, business_date, janela)` |
| `t28_meta_campaign` | 1 linha por (client_id, campaign_id_meta, business_date, janela). Espelho de `t28_campaign` para Meta Ads (gasto, impressões, cliques, leads, ações/valores). | `(client_id, campaign_id_meta, business_date, janela)` |

### 3.3. Esqueleto `t28_campaign` (referência pras outras)

```sql
CREATE TABLE phi_prod.t28_campaign (
  -- chave + contexto
  client_id                STRING NOT NULL,
  campaign_id              STRING NOT NULL,
  business_date            DATE   NOT NULL,
  janela                   STRING NOT NULL,
  -- contexto de negócio (vem do Notion via Adaptador)
  campaign_name            STRING,
  objetivo                 STRING,          -- ex: 'Conversões', 'Leads', 'Tráfego'
  modelo_negocio           STRING,          -- ex: 'B2C-ecommerce', 'B2B-leads'
  metrica_mae              STRING NOT NULL, -- 'CPA' | 'ROAS'
  meta_metrica_mae         FLOAT64,
  margem_contribuicao_pct  FLOAT64,
  ticket_ltv               FLOAT64,
  landing_page             STRING,
  -- métricas brutas Google Ads
  impressions              INT64,
  clicks                   INT64,
  cost                     FLOAT64,
  conversions              FLOAT64,
  conv_value               FLOAT64,
  impression_share         FLOAT64,
  budget_lost_is           FLOAT64,
  -- KPIs derivados (materializados pra evitar recálculo)
  cpm                      FLOAT64,
  cpc                      FLOAT64,
  ctr                      FLOAT64,
  cvr                      FLOAT64,
  cpa                      FLOAT64,
  cpl                      FLOAT64,
  roas                     FLOAT64,
  -- audit + qualidade (bloco comum, ver §3.1)
  execution_id             STRING NOT NULL,
  source_execution_id      STRING,
  versao_contract_aplicada STRING NOT NULL,
  source_status            JSON   NOT NULL,
  volume_suficiente        BOOLEAN NOT NULL,
  ingested_at              TIMESTAMP NOT NULL
)
PARTITION BY business_date
CLUSTER BY client_id, janela;
```

---

## 4. Como agentes consomem (3 padrões coexistentes)

| Padrão | Quando usar | Implementação |
|---|---|---|
| **(a) Query direta BQ** | Análise analítica, diagnóstico, relatório | Agente IA (Gemini Pro ou cron job) roda SQL filtrando por `(client_id, janela)`. Cache TTL configurável. |
| **(b) MCP n8n agregador** | Orquestração / contract isolado | Workflow n8n com Schedule expõe `t28_campaign` filtrado via MCP n8n; agente recebe JSON normalizado. Adiciona indireção mas isola schema. |
| **(c) Evento de "pronto"** | Loop reativo (ADR-22 — alerta → tarefa) | T28 emite `campaign_metrics.normalized` em `PHI - Eventos` ao fim de cada run. Workflow `WF-EXEC-Intake-PHI-Mídia` (a criar) escuta; quando PHI·Mídia degrada + `volume_suficiente=true` + sinal vs ruído → abre Demanda. |

### Loop ADR-22 fechado com T28

```
T28 roda (semanal/mensal)
  → escreve t28_* em phi_prod
  → emite campaign_metrics.normalized em PHI - Eventos
PHI-Pipeline_v2 lê t28_campaign
  → recalcula PHI·Mídia (componentes)
  → escreve phi_score_history + phi_score_current (VIEW)
  → SE degradação detectada + gate cognitivo (sinal vs ruído + volume_suficiente=true)
     → emite alerta.phi_midia_degradou em PHI - Eventos
WF-EXEC-Intake-PHI-Mídia (sub-WF Execução, Lote 3+)
  → escuta alerta.phi_midia_degradou
  → cria Demanda em PHI - Demandas (tipo='PHI Score degradacao', classe_sla='Crítica')
  → cria registro vinculado em Log de Otimizações (per ADR-22)
```

---

## 5. Governança de `volume_suficiente` (crítico — bloqueia produção)

Critério atual do agregador: `MIN_CONV=30` + `MIN_DIAS=14`. **Janela semanal (D-7) sempre cai como insuficiente** (não atinge MIN_DIAS=14). Status: **em revisão**.

**Decisão pendente** (vai virar **SOP unificado** entre PHI + agregador + workflows futuros de extração):

- (a) Manter MIN_DIAS=14 → janela D-7 sempre `volume_suficiente=false` → agente nunca abre tarefa em janela semanal (só D-30) → conservador
- (b) Reduzir MIN_DIAS para janela semanal (ex: MIN_DIAS=7) → janela D-7 pode aceitar dados se MIN_CONV ok
- (c) Critério **por janela**: D-1: ignorar volume; D-3: MIN_CONV=10; D-7: MIN_CONV=20; D-30: MIN_CONV=30 — mais flexível, mais complexo

**Bloqueia:** o DDL (`source_status` e `volume_suficiente` viram colunas das 7 tabelas). Decidir antes de produção.

SOP vai pro DB `PHI - SOPs` (área = `Procedimentos cross` ou `Produto PHI`). Workflow do agregador grava `versao_sop_aplicada` (igual o padrão da Execução de Demandas).

---

## 6. Plano de lotes

| Lote | Entrega |
|---|---|
| **Lote 0 — Fundação (este doc → ADR + SOP volume_suficiente + DDL)** | ADR formal Aceito + SOP volume_suficiente Vigente + DDL das 7 tabelas em phi_prod + decisão de `volume_suficiente` (a/b/c §5) |
| **Lote 1 — Sink T28 funcional (campaign + adset + search_terms)** | Adaptador/Normalizador T28 do agregador passa a escrever em BQ. 3 tabelas alvo. PHI-Pipeline_v2 continua lendo de raw_campaign_data (não muda). Smoke: 1 cliente, 1 semana, valida que t28_campaign linha bate raw_campaign_data. |
| **Lote 2 — GA4 + GBP + Clarity** | Resolver credenciais GBP/GA4 + mover Clarity pra fora do Loop + popular 3 tabelas restantes. |
| **Lote 3 — Meta Ads** | Reativar Fetch Meta Ads + popular t28_meta_campaign. |
| **Lote 4 — Loop ADR-22 fechado** | PHI-Pipeline_v2 passa a ler t28_campaign (não raw); emite `alerta.phi_midia_degradou` em PHI - Eventos; cria `WF-EXEC-Intake-PHI-Mídia` (sub-WF Execução) que consome o alerta e abre Demanda. |
| **Lote 5+ — Sink BQ dos eventos (ADR Eventos Fase 2)** | Workflow agregador batch lê `PHI - Eventos` e materializa em `phi_prod.eventos_operacao`. |

---

## 7. Tensões registradas

- **T1 — Concorrência de writer:** Daily Entry escreve `raw_campaign_data`; agregador escreve `t28_*` (NÃO toca raw). Sem race. Mas o **Pipeline_v2** hoje lê `raw_campaign_data` direto — Lote 4 muda pra ler `t28_campaign` (mudança disruptiva no Pipeline_v2; planejar com cuidado).
- **T2 — Janelas dimensionais vs trigger:** o agregador hoje tem Schedule Semanal + Mensal. Janelas canônicas são D-1/D-3/D-7/D-30. Mapeamento: Semanal → materializa D-7; Mensal → materializa D-30. D-1 e D-3 ficam para Schedule diário (a criar) ou são derivados em VIEW.
- **T3 — Notion como cadastro:** Q1 deu "BQ dono das métricas". Mas Notion continua dono do contexto (objetivo/metas/landing). Pipeline T28 precisa ler Notion no início + escrever BQ no fim. Se Notion ficar fora do ar, agregador para. Vale considerar **snapshot semanal do contexto** em BQ (`phi_prod.t28_context`) pra reduzir acoplamento.

---

## 8. Próximos passos pós aprovação deste v0.1

1. Olavo red-line ou aprova este v0.1.
2. Decisão de `volume_suficiente` (a/b/c §5).
3. ADR formal "Destino canônico do contract T28" criado como `Aceito` no DB Decisões.
4. SOP "Critério estatístico volume_suficiente" criado como `Vigente` no DB SOPs.
5. DDL das 7 tabelas executada em `phi_prod`.
6. Brief Codex `agregador-t28-l1` para Adaptador/Normalizador T28 do n8n escrever em BQ.
7. Smoke isolado por tabela (campaign → adset → search_terms).
8. Catálogo +N entradas conforme cada artefato vai sendo criado.
