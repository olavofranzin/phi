# [BOOTSTRAP sub-chat] Framework de Análise de Campanha (L3.0 §4 — o IP)

> **Como usar:** abra uma **sessão nova** (sub-chat dedicado) e cole este arquivo
> como primeira mensagem. Ele é auto-contido: dá todo o contexto do plumbing já
> pronto, aponta o que ler, e lista as decisões de IP a travar. O objetivo é
> definir **o critério de análise/otimização de campanha** — a parte que a gente
> deliberadamente adiou pra tratar com calma.
> **Frente:** Saúde Digital · **Lote:** L3.0 (Camada 2 — Análise), peça final (§4).
> **Branch:** `claude/agentic-agency-planning-KwJEw`.

---

## 1. Missão do sub-chat

Definir o **framework de análise de campanha** que substitui o nó **placeholder**
determinístico do L3.0 pelo **LLM real (Claude)** + a taxonomia final de flags +
os thresholds de severidade. É o **IP de domínio**: o critério de como avaliar a
saúde/performance de uma campanha e o que recomendar.

**NÃO é greenfield de encanamento** — o plumbing já está pronto, validado e
idempotente (smoke phi_dev PASS 2026-07-01). Este sub-chat só preenche o "cérebro".

## 2. Ler primeiro (nesta ordem)

**Git (design/estado — canônico por ADR-012):**
- `docs/strategic-planning/saude-digital/L3.0-orquestrador-campaign-design.md` — §4 é o strawman do framework (input/output/flags/severidade).
- `docs/handoff/2026-06-30-saude-digital-l3.0-codex-plumbing-brief.md` — o que foi construído (nós, payload, regras placeholder).
- `docs/handoff/2026-06-30-saude-digital-l3.0-execution-log.md` — smoke real + o que os dados reais mostraram.
- `docs/strategic-planning/ESTADO-DO-PROJETO.md` §3.8 (L3.0) + §13 v0.1.44/45.

**Notion (SOPs/ADRs — o critério de domínio pode já existir em parte):**
- **[SOP v1.0] Time de Agentes de Análise de Campanhas (Managed Agents)** — `378b65e5-c72b-813a-a8d3-dbe01bc8310d`. **Provavelmente já tem o prompt/critério dos agentes de análise** — reusar, não reinventar.
- **PHI™ — SOP, Glossário e Definições Conceituais** — `328b65e5-c72b-81d8-a25b-c83921610282` (níveis de alerta, phi_classification, temas cognitivos).
- **ADR-21 — PHI Índice de Saúde Digital / PHI·Mídia** — `37db65e5-c72b-814b-b3c1-eb6b8ceab705` (guardas cognitivas: volume, ruído vs problema, não otimizar 1 KPI).
- **PHI — Especificação do Loop Operacional (Alerta→Tarefa→Log)** — `37db65e5-c72b-81a0-a4a3-e47bd562f91e` (gate cognitivo, quando vira alerta/demanda).

## 3. Onde o framework encaixa (ponto de inserção técnico)

Sub-WF **`WF-T28-Analise-Campaign`** (`fhYmJH0o9BW1IO4i`, draft). Grafo atual:
```
Execute Workflow Trigger
  → Build Deterministic Flags   ← [PLACEHOLDER — SUBSTITUIR/AUMENTAR aqui]
  → Build Notion Page
  → Lookup Existing Analysis → IF → Update/Create (upsert idempotente)
```
- Hoje `Build Deterministic Flags` computa flags por **regras** + um insight
  templated. O framework **híbrido** (decisão travada) = manter as regras
  determinísticas + adicionar um **nó LLM (Claude)** que gera o `insight`, as
  `recomendacoes`, prioriza/explica as flags e ajusta a narrativa.
- O `Build Notion Page` já mapeia `insight`→body, `recomendacoes`→body,
  `flags_ativas`/`severidade`/`leitura`→properties. **A estrutura do DB
  (`PHI - ANÁLISES`) já recebe tudo** — o sub-chat ajusta **conteúdo**, não schema.

## 4. Input disponível pro LLM (o payload já montado pelo Orquestrador)

O `Build Analysis Payload` (no Orquestrador) já entrega, por campanha:
- **identidade:** client_id (`CLI-4`), campaign_id (`GADS-...`), campaign_name, janela (`D-7`), business_date, tenant_id.
- **score (canônico, lido de `phi_score_current`):** `phi_value` (0-100), `phi_classification` (CRITICAL/WARNING/GOOD/EXCELLENT), + componentes `mas/tss/fis/es/rs/os`, `model_version`, `calculated_date`.
- **metricas (t28_campaign):** impressions, clicks, cost, conversions, conv_value, impression_share, budget_lost_is, cpm, cpc, ctr, cvr, cpa, cpl, roas.
- **contexto de negócio:** objetivo, modelo_negocio, metrica_mae (CPA|ROAS), meta_metrica_mae, margem_contribuicao_pct, ticket_ltv, landing_page, pct_brand/problem/competitor/other_terms.
- **qualidade:** volume_suficiente, source_status (quais fontes degradaram).
- **rel:** cliente_page_id, campanha_page_id (ambas resolvem — relations OK).

> Business context extra disponível nas DBs Notion (resolver se o LLM precisar):
> Clientes Database (`Margem de Contribuição`, `Ticket/LTV`, `id_ga4_property`,
> `Segmento`, `Serviços Prestados`); Campanhas (`Estratégia`, `Estágio do Funil`,
> `Públicos-alvo`, `Score Diário`, `Status Geral da Campanha`).

## 5. Output esperado (estruturado — o LLM NÃO emite score)

Strawman a confirmar/refinar:
```
{
  "insight": "diagnóstico do estado da campanha (pt-BR, 2-4 frases)",
  "recomendacoes": [ { "acao", "racional", "esforco": "baixo|medio|alto", "impacto_esperado" } ],
  "flags": ["cpa_acima_meta", ...],          // taxonomia final a definir
  "severidade": "info|atencao|critico",       // qualitativa, ≠ score
  "evidencias": ["métricas que sustentam o diagnóstico"]
}
```

## 6. Decisões de IP a travar (a pauta do sub-chat)

1. **Reuso vs zero:** partir do SOP dos Managed Agents (§2) — o prompt/critério já existe? Adaptar pro contract T28.
2. **Prompt do LLM (Claude):** system + user template. Persona (analista de tráfego sênior), instruções, como usar o score canônico + os 6 componentes, como pesar métrica-mãe vs vetor de KPIs.
3. **Taxonomia final de flags + gatilhos** (refina §4.3): quais flags, condição determinística exata de cada, severidade base. (Híbrido: regras geram; LLM prioriza/explica.)
4. **Thresholds de severidade** info/atenção/crítico.
5. **Recomendações:** formato, quantidade máx, nível de acionabilidade, ligação com o loop de Demandas (ADR-22)?
6. **Guardas cognitivas (ADR-21):** `volume_suficiente=false` → sem rec agressiva; distinguir ruído de leilão/sazonalidade de problema real; não otimizar 1 KPI isolado. Confirmar como codificar.
7. **Modelo Claude exato** (Opus/Sonnet) + **configurar a credencial Anthropic no n8n** (bloqueante pro LLM).
8. **Tendência:** incluir delta D-7 vs D-7 anterior? (Precisa 2ª leitura t28 — decidir se entra agora.)

## 7. Bug a corrigir junto (herdado do placeholder)

No `Build Deterministic Flags` o helper `numeric(null)` retorna `0` (pois
`Number(null)===0` é finito) → gera `impression_share_baixo` espúrio quando
`impression_share=null`. Ao reescrever as regras, usar guard `value==null → null`.

## 8. Fluxo de entrega (reusa o plumbing)

1. Sub-chat define o framework (decisões §6) → escreve o **prompt do LLM** + a
   **taxonomia determinística** final.
2. Configurar credencial **Claude/Anthropic** no n8n.
3. **Codex** implementa: adiciona o nó **Claude** no `WF-T28-Analise-Campaign`
   (entre `Build Deterministic Flags` e `Build Notion Page`), com Structured
   Output; ajusta as regras determinísticas; corrige o bug §7. Draft, sem PUT.
4. **Pré-revisão Claude** → **smoke real** (Olavo) reusando o Orquestrador
   (`8Q5ofmAZju0hTN08`, phi_dev). As 2 pages de smoke atuais (`390b...d28f`,
   `390b...5553`, insight `[PLACEHOLDER]`) serão **atualizadas** (idempotente).
5. Depois: ativar schedule + flip pra phi_prod (L3.0 fecha); então L3.1 (ad/adset).

## 9. Âncoras técnicas (IDs)
- Orquestrador: `8Q5ofmAZju0hTN08` · Sub-WF Análise: `fhYmJH0o9BW1IO4i`
- DB `PHI - ANÁLISES`: databaseId `38fb65e5-c72b-80db-a425-e5939fc35c7a` (ds `38fb65e5-c72b-80ff-9543-000b9a7468af`)
- Score canônico: `phi_prod.phi_score_current` (VIEW; chave client_id+campaign_id; ADR-003)
- t28: `phi_dev`/`phi_prod`.`t28_campaign` (D-7/D-30 materializadas)
- Cliente exemplo do smoke: CLI-4 = KILDARE & BRUNA BECKER (`19fb65e5-c72b-81dd-b7a0-f295fe304d60`)
