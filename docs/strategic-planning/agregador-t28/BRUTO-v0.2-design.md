# [BRUTO v0.2] Agregador T28 — delta v0.1→v0.2 (decisões 2026-06-21)

> **STATUS:** v0.2 travada 2026-06-21. 4 decisões confirmadas + 1 nova (Search Terms).
> Delta sobre v0.1 (`BRUTO-v0.1-design.md`); pré-leitura obrigatória.
>
> **FONTE DE VERDADE:** BigQuery (per ADR-010 — analítico canônico). Notion = cadastro
> de contexto. Git canônico para design (ADR-012).

---

## 1. Decisões travadas (delta v0.1→v0.2)

| # | Item | Decisão v0.2 |
|---|---|---|
| **D1** | `volume_suficiente` — regra concreta | Campanha **nova** (idade ≤ 14 dias desde início na plataforma): `volume_suficiente = (conversoes_na_janela ≥ 50) AND (dias_da_janela ≥ 7)`. Campanha **madura** (idade > 14 dias): `volume_suficiente = true` sempre (qualquer janela, inclusive D-1) — sem mínimo de conversões. Vira SOP "Critério Estatístico volume_suficiente v1.0" no DB SOPs. |
| **D2** | Ambiente sandbox no BQ | **`phi_dev`** (mesmo projeto do `phi_prod`) é o ambiente de testes. DDL roda em `phi_dev` primeiro, smoke valida 1 cliente × 1 semana com dados reais, depois promove pra `phi_prod`. Workflow do agregador ganha env var `BQ_DATASET` (`phi_dev` \| `phi_prod`) injetada per ADR-19 build-time. |
| **D3** | Materialização das janelas | Materializar **D-7 e D-30** (alto valor analítico + histórico). **D-1 e D-3 ficam como VIEW** computada em runtime sobre `t28_*` materializado (granularidade alta, pouco valor histórico). **Economiza ~50% de storage** nas tabelas campaign/adset/meta. |
| **D4** | Papel do Daily Entry vs T28 | **Coexistência opção (b) — T28 = camada de enriquecimento sobre Daily Entry.** Daily Entry continua dono de `raw_campaign_data` (ADR-010 preservado). T28 **lê `raw_campaign_data`** em vez de chamar Google Ads GAQL direto (zero drift) + chama APIs externas só pras fontes que Daily Entry não cobre (GA4, GBP, Clarity, Meta). Resultado: menos código no agregador, sem race de writers, sem refator forçado do Pipeline_v2. |
| **D5** | **Search Terms fora do BQ T28** | **Tabela `t28_search_terms` removida do schema BQ.** Search Terms são sensíveis (podem conter informações estratégicas/pessoais) — não persistem em camada analítica. `Search Terms Checker (Gemini)` continua existindo e classificando em runtime; output consumido pelo próprio agregador (pra computar features derivadas que entram em `t28_campaign`, ex: % termos brand vs non-brand) **mas sem persistência histórica**. Se aparecer necessidade futura de histórico (ex: agente reativo precisar comparar termos novos vs antigos): abrir ADR + criar `phi_search_terms` em **Supabase** (transacional, per ADR-001) — não em BQ. |

---

## 2. Schema BQ atualizado — **6 tabelas** (era 7)

`t28_search_terms` removida (D5). 6 tabelas restantes:

| Tabela | Granularidade | Materialização |
|---|---|---|
| `t28_campaign` | (client_id, campaign_id, business_date, janela) — Google Ads + KPIs + contexto | **D-7, D-30 materializadas** · D-1, D-3 via VIEW |
| `t28_adset` | (client_id, adset_id, business_date, janela) + `criativos_json` (top-3) | **D-7, D-30 materializadas** · D-1, D-3 via VIEW |
| `t28_ga4_landing` | (client_id, business_date, janela, canal, landing_page, source) | **D-7, D-30 materializadas** |
| `t28_gbp_daily` | (client_id, business_date, janela) | **D-7, D-30 materializadas** |
| `t28_clarity_daily` | (client_id, business_date, janela) | **D-7, D-30 materializadas** |
| `t28_meta_campaign` | (client_id, campaign_id_meta, business_date, janela) | **D-7, D-30 materializadas** · D-1, D-3 via VIEW |

Bloco audit comum (§3.1 do v0.1) preservado em todas.

### VIEWs derivadas (D-1, D-3)

Pra `t28_campaign`, `t28_adset` e `t28_meta_campaign`:

```sql
CREATE OR REPLACE VIEW phi_prod.t28_campaign_d1 AS
SELECT * FROM phi_prod.t28_campaign
WHERE janela = 'D-7' AND business_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
-- D-1 derivada agregando últimas 24h da D-7 materializada
-- (implementação real: janela rolante computada via agregador em VIEW)
```

(Detalhe técnico final fica pro Lote 0 do agregador; o princípio é "não materializar D-1/D-3 — derivar em runtime sobre D-7".)

---

## 3. Posicionamento Daily Entry vs T28 (esclarecimento de D4)

### Camada de coleta
| Quem coleta o quê | Cadência |
|---|---|
| **Daily Entry** → Google Ads + Meta Ads (nível campanha) → `phi_prod.raw_campaign_data` (per ADR-010) | Diário (cron) |
| **T28** → GA4 (orgânico+pago, por landing) + GBP + Clarity → `phi_prod.t28_*` | Diário (D-1) / Semanal (D-7) / Mensal (D-30) |

### Camada de enriquecimento
| Quem transforma o quê |
|---|
| **T28 lê `raw_campaign_data`** + suas próprias coletas → normaliza tudo em contract padronizado → escreve `t28_campaign/adset/ga4_landing/gbp_daily/clarity_daily/meta_campaign` |

### O que muda no workflow `4sdG2UKMCBuFq8xn` (refator do Lote 1)

| Hoje | Pós-Lote 1 |
|---|---|
| `Google Ads Campanhas (GAQL)` chama API direta | **Removido.** Substituído por query BQ em `phi_prod.raw_campaign_data` |
| `Google Ads Conjuntos (GAQL)` chama API direta | **Mantido por enquanto** (raw_campaign_data não cobre adset; Lote 4+ avalia estender Daily Entry) |
| `Google Ads Anúncios (GAQL)` chama API direta | **Mantido por enquanto** (idem) |
| `Extracting Search Terms (janela)` + `Search Terms Checker (Gemini)` | **Mantido**, mas output NÃO escreve em BQ (D5). Classificações entram como features agregadas em `t28_campaign` (ex: `pct_brand_terms`, `pct_problem_solving_terms`) |
| `HTTP Request GA4 Orgânico / Pago / GBP / Clarity / Meta` | **Mantido**, ganha `onError: continueRegularOutput` (resiliência) |
| `Adaptador Input T28` → `Normalizador T28` | **Mantido**, ganha output em BQ (não mais Sheet) |

### Consumidor downstream — quem lê o quê

| Consumidor | Hoje | Após Lote 4 |
|---|---|---|
| PHI-Pipeline_v2 | Lê `raw_campaign_data` direto | **Lê `t28_campaign`** (Lote 4 refatora; derivação de raw é fiel, sem perda de dados) |
| Dashboard (Lovable, scoping) | — | Lê `t28_*` direto via BQ ou via API agregadora |
| Agentes IA (T28 readers, ADR-22 alerta-tarefa) | — | Padrão (a/b/c) §4 do v0.1 — query direta / MCP n8n / evento |

---

## 4. Estimativa de storage atualizada

Aplicando **D3 (D-1/D-3 como VIEW)** + **D5 (sem search_terms)**:

### Por cliente / ano (não comprimido)

| Tabela | v0.1 | v0.2 | Mudança |
|---|---|---|---|
| `t28_campaign` | 0,022 GB | **0,011 GB** | -50% (só D-7, D-30) |
| `t28_adset` | 0,087 GB | **0,044 GB** | -50% (só D-7, D-30) |
| `t28_search_terms` | 0,073 GB | **0 GB** | removido (D5) |
| `t28_ga4_landing` | 0,015 GB | **0,008 GB** | -50% |
| `t28_gbp_daily` | 0,002 GB | **0,001 GB** | -50% |
| `t28_clarity_daily` | 0,002 GB | **0,001 GB** | -50% |
| `t28_meta_campaign` | 0,022 GB | **0,011 GB** | -50% |
| **Total/cliente/ano** | 0,22 GB | **≈ 0,08 GB** | **-64%** |

### Cenários acumulados

| Cenário | Clientes | Ano 1 | Ano 3 (acumulado) |
|---|---|---|---|
| Hoje (operação solo) | 10 | **~0,8 GB** | ~2,4 GB |
| Crescimento médio | 50 | **~4 GB** | ~12 GB |
| Meta agressiva | 100 | **~8 GB** | ~24 GB |

**Resultado:** todos os cenários **dentro do BQ free tier (10 GB)** até ~100 clientes ano 1. Aos 100 clientes ano 3 (~24 GB), custo ≈ $0,30/mês de storage. Trivial.

---

## 5. Plano de lotes atualizado

| Lote | Entrega |
|---|---|
| **Lote 0 — Fundação** | ADR formal Aceito (com decisões v0.2) + SOP "volume_suficiente v1.0" Vigente + DDL **das 6 tabelas** em **`phi_dev`** + VIEWs D-1/D-3 |
| **Lote 1 — Sink T28 em `phi_dev` (campaign + adset + ga4_landing + meta_campaign) + refactor agregador** | Adaptador/Normalizador T28 passa a escrever em `phi_dev.t28_*`. Refactor #1: remover GAQL Campanhas + ler `raw_campaign_data` (D4-b). Refactor #2: Search Terms vira só features agregadas em `t28_campaign` (D5). Smoke: 1 cliente × 1 semana × comparar `t28_campaign` vs `raw_campaign_data`. |
| **Lote 1.5 — Promoção `phi_dev` → `phi_prod`** | DDL produção + re-import do workflow com `BQ_DATASET=phi_prod`. Smoke novamente em prod. |
| **Lote 2 — GBP + Clarity** | Resolver credenciais GBP + mover Clarity pra fora do Loop + `onError: continueRegularOutput` em todos os extratores. |
| **Lote 3 — Meta Ads** | Reativar Meta + popular `t28_meta_campaign`. |
| **Lote 4 — Pipeline_v2 lê T28 + Loop ADR-22 fechado** | PHI-Pipeline_v2 refatora pra ler `t28_campaign` (não `raw_campaign_data`); emite `alerta.phi_midia_degradou` em `PHI - Eventos`; criar `WF-EXEC-Intake-PHI-Mídia` (sub-WF Execução) que consome alerta e abre Demanda. |
| **Lote 5+ — Sink BQ dos Eventos (per ADR Eventos Fase 2)** | Workflow agregador batch lê `PHI - Eventos` e materializa em `phi_prod.eventos_operacao`. |

---

## 6. Tensões registradas (delta sobre v0.1)

- **T4 (nova) — Adset/Ad em raw_campaign_data:** Daily Entry hoje só cobre campanha-nível. T28 ainda precisa chamar GAQL pra adset/ad — não elimina chamadas Google Ads completamente. **Decisão pra revisitar (Lote 4+):** estender Daily Entry pra cobrir adset/ad, ou T28 continua dual (BQ para campanha + GAQL para adset/ad)?
- **T5 (nova) — Search Terms sem histórico:** D5 elimina persistência. Se o roadmap precisar de "termo novo que apareceu" ou "termo que sumiu", o sinal terá que ser computado em runtime ou via ADR futuro (Supabase). Risco: feature de IA de copy/criativo dedicada (Lote 3+ Execução) pode pedir.

---

## 7. Próximos passos pós aprovação v0.2

1. Olavo aprova v0.2 (ou red-line final).
2. ADR formal "Destino canônico do contract T28 + governança" criado como `Aceito` no DB Decisões (com decisões v0.2 cristalizadas).
3. SOP "Critério Estatístico volume_suficiente v1.0" criado como `Vigente` no DB SOPs (regra D1 §1).
4. DDL das **6 tabelas** + VIEWs D-1/D-3 em **`phi_dev`**.
5. Brief Codex `agregador-t28-l1` (refactor do agregador: ler `raw_campaign_data` + escrever `phi_dev.t28_*` + Search Terms só como features).
6. Smoke 1 cliente × 1 semana em `phi_dev`.
7. Promoção `phi_dev` → `phi_prod` (Lote 1.5).
