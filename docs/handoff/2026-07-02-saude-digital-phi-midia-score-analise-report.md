# [REPORT sub-chat] Análise estratégica do PHI·Mídia Score (Pipeline_v2) — com evidências BQ

> **Origem:** brief `2026-07-01-saude-digital-phi-midia-score-analise-subchat-brief.md`.
> **Data:** 2026-07-02 · **Executor:** Claude Code (sessão remota, branch `claude/saude-digital-phi-midia-score-0ko12c`).
> **Fontes:** `docs/audits/PHI - Pipeline_v2.json` (dump), **read-back do live via MCP n8n**, linhagem A.5/A.6/A.6b/A.7/A.7b (git),
> ADR-004 v2 + ADR-21 (Notion MCP), e **kit de evidências Q0–Q10 executado em `phi_prod`** (read-only, via 2 workflows
> temporários `kC0zlUZO6YdbVRs4` e `OsMJazBXN0gj1oUt`, arquivados após uso — execuções n8n `13407`/`13408`).
> **Nenhum workflow de produção foi tocado.**

---

## 0. Sumário executivo — a resposta à pergunta do brief

**"O score está quebrado, incompleto, ou os dois?" → Os dois, mas de um jeito diferente do hipotetizado.**

O score **não está congelado**: o MERGE **escreve todos os dias** (Q1/Q7: 2 linhas hoje às 07:01). O que acontece é pior
de diagnosticar e mais simples de explicar:

1. **O pipeline pontua as linhas erradas do raw.** O join casa apenas as **linhas-esqueleto** escritas pelo próprio
   `PHI - Subworkflow Campanhas` (`ingestion_step='GADS_INSERT'`, **todas as janelas 3d/7d = NULL** — Q5/Q10). Com janelas
   NULL, todos os componentes caem nos fallbacks `ELSE 50.0` → **phi_value = 50.0 exato, todo dia, por construção**, com
   `calculation_status='SUCCESS'` e classificação WARNING. O "50 congelado" da CLI-4 é um **50 recalculado diariamente
   sobre dado vazio**.
2. **O cliente CLI-5 (IMPACTO WEB, ROAS) nunca é pontuado.** Suas linhas raw vêm só do `DAILY_ENTRY` (`EXEC-DE-*`), que o
   filtro por execution_id do run (`FALLBACK-*`) nunca casa. Dos 2 clientes ativos (Q6b), um é pontuado com constante 50
   e o outro é **excluído em silêncio**. E CLI-5 é ROAS — a decisão CPA×ROAS deixou de ser teórica.
3. **A CLI-4 não tem NENHUMA linha raw com janelas 7d/3d nos últimos dias** (Q10): o Daily Entry não escreveu para as
   campanhas dela; só existe o esqueleto do GADS_INSERT. Mesmo com o join perfeito, hoje não há dado para pontuar CLI-4.
4. **Gravidade-50 quantificada** (Q2/Q3/Q4): pesos `es+rs+os = 0.40` (0.15+0.15+0.10) → 40% do score é constante.
   Range teórico [20, 80] → **EXCELLENT (≥80) é matematicamente inalcançável**. Distribuição real: 100 WARNING (todos
   entre 40–50), 12 CRITICAL, 2 GOOD (máx histórico 68.74), 0 EXCELLENT. Em 115 linhas: `tss=50` em 112, `fis=50` em 90,
   `mas=50` em 64, `es/rs/os=50` em ~115.
5. **⚠️ ALERTA DE REGRESSÃO IMINENTE:** alguém publicou nova versão do Pipeline_v2 **hoje às 17:19Z**
   (`activeVersionId 4b723285`, ≠ do active `15b91f10` e do draft `a09f6e35` registrados no brief). A versão ativa agora
   filtra o raw por `source_execution_id` — **que o upstream não emite**. A rodada de hoje 07:01 ainda era a versão
   antiga (escreveu com `source_execution_id=NULL`); **na rodada de amanhã 07:00 o MERGE tende a escrever ZERO linhas**
   (de "50 constante" para "nada"). Confirmar com Olavo quem publicou e se foi intencional.
6. **FALLBACK-* é o caminho único, não a exceção** (Q0): TODOS os execution_id do `workflow_execution_log` são
   `FALLBACK-*`. Motivo estrutural: às 07:00:00 o `Buscar ID de Sucesso Hoje` procura um `INGESTION SUCCESS` de hoje que
   só o próprio pipeline escreverá às 07:00:53 — o COALESCE **sempre** cai no fallback. (Daily Entry não loga fase
   INGESTION nesse log.) De positivo: as expressões `{{ }}` **renderizam** no live — a ausência do prefixo `=` no
   dump/read-back é artefato de serialização, não bug.

---

## 1. Veredito camada a camada (brief §3) — agora com evidência BQ

| Camada | Hipótese do brief | Veredito | Evidência |
|---|---|---|---|
| 🔴 C | Join quebrado → MERGE não escreve → score congelado | **REFORMULADA** | O MERGE **escreve** (Q1/Q7). Na versão que rodou até hoje 07:01, o filtro efetivo casava o id do run (`FALLBACK-*`) — que é exatamente o id que o Subworkflow grava nas linhas-esqueleto. O join "funciona", mas **acopla o cálculo ao esqueleto sem janelas**, ignorando os dados reais do `DAILY_ENTRY`. O 50 é recalculado, não congelado. A parte "upstream não emite `source_execution_id`" **confirma-se** (read-back + Q1 com `source_execution_id=NULL`) e vira **regressão iminente** com a versão publicada hoje 17:19Z (item 5 do §0). |
| 🟠 A | es/rs/os = 50 fixos + pesos > 0 comprimem o range | **CONFIRMADA** | Q2: modelo único `MODEL-VAREJO-001 v1.1`, pesos 0.20/0.20/0.20/0.15/0.15/0.10 (soma 1.0), `threshold=0.75` (ignorado na classificação). 40% do score constante; range [20,80]; Q3: zero EXCELLENT na história; máx 68.74. Flags `rs_data_insufficient`/`os_data_unavailable` FALSE fixas. |
| 🟡 B | mas/tss/fis colapsam para 50 em dado ralo, silenciosamente | **CONFIRMADA — e é o mecanismo dominante** | Q4: em 115 linhas, tss=50 em 112 (97%), fis=50 em 90, mas=50 em 64. Q10: linhas GADS_INSERT da CLI-4 com `cost_3d/7d/conversions_3d/7d = NULL` e `calculation_status='SUCCESS'` mesmo assim. Um "50" hoje significa "sem janela de dados", não "mediano". |
| 🟢 D | FALLBACK-*, FQN, CPA×ROAS, mojibake | **CONFIRMADA + agravada** | Q0: 100% dos logs com `FALLBACK-*` (chicken-and-egg estrutural). Q6b: **CLI-5 é ROAS e está ativo** → mas nunca é pontuado (exclusão silenciosa; Q1/Q3 só têm CLI-4 recente). FQN inconsistente em 2 nós; mojibake em 3; `threshold_used`/`phi_threshold_override` carregados e ignorados. |

**Achados fora do brief:**
- **`client_config` NÃO tem `primary_metric_goal`** (Q9 — a query do brief §5.6 falha). A meta vive **por campanha** em
  `raw_campaign_data` (Q10: 3.5 e 5.2 para as 2 campanhas da CLI-4). O CLAUDE.md descreve `primary_metric_goal` como
  campo de config — atualizar a documentação.
- `client_config` tem `phi_threshold_override` (FLOAT64, NULL nos 2 clientes) — mais um mecanismo de threshold nunca usado.
- Q8: a VIEW `phi_score_current` já projeta `source_execution_id` (A.7b foi aplicada na VIEW) e filtra
  `calculation_status='SUCCESS'` + último `calculated_date` por campanha — ou seja, **a VIEW já está pronta para a
  semântica INSUFFICIENT_DATA** (basta o MERGE parar de rotular dado vazio como SUCCESS).
- Existe 1 linha histórica com classificação legada `'OK'` (Q3) — resíduo de esquema antigo; tratar no backfill.

---

## 2. Confronto fórmula live × design (ADR-004 v2 / ADR-21)

Sem divergência live×ADR-004 v2: o ADR documenta exatamente o live, placeholders inclusos — a lacuna é **decisão de
modelo nunca tomada** (candidata a ADR-008: CPA-only × polimorfismo). Já o **ADR-21 é violado na prática**: a guarda
cognitiva "nenhum pilar emite leitura com volume insuficiente — responde VOLUME INSUFICIENTE em vez de pontuar" é
exatamente o oposto do comportamento atual (50 confiante + SUCCESS sobre janelas NULL). A semântica `INSUFFICIENT_DATA`
não é opção de design; é alinhamento com ADR vigente.

| Ponto | ADR-004 v2 (design) | Live (verificado) | Lacuna |
|---|---|---|---|
| MAS/TSS/FIS/MIV | fórmulas CPA-only com fallback 50 | idem | decisão CPA×ROAS (agora obrigatória — CLI-5 é ROAS) |
| ES/RS/OS | placeholders 50.0 "NÃO implementado" | idem, pesos 0.15/0.15/0.10 | decisão: calcular / **peso 0 (recomendado)** / remover |
| Classificação | 80/60/40 hardcoded; `threshold` ignorado | idem (Q2 confirma threshold=0.75 ignorado) | usar ou remover |
| Flags de qualidade | FALSE fixas | idem | corrigir junto com sem-dado |

---

## 3. Recomendações para as 7 decisões (brief §4) — a travar com Olavo

1. **Modelo-alvo:** v1.1 MVP = **es/rs/os com peso 0** e mas/tss/fis renormalizados (nova `model_version` em
   `model_config`, `valid_until` na anterior). Roadmap explícito para componentes reais na fase 2. Registrar como ADR.
2. **Semântica sem-dado:** `calculation_status='INSUFFICIENT_DATA'` + `phi_value=NULL` + flags verdadeiras quando
   janelas/meta ausentes. A VIEW já filtra SUCCESS (Q8) — downstream fica limpo de graça. Decidido em essência pelo ADR-21.
3. **Join (revisado pela evidência):** a ideia original "emitir os dois IDs" é insuficiente — há **múltiplos**
   `EXEC-DE-*` por dia (um por cliente), então um único `source_execution_id` não cobre o portfólio. **Recomendação:
   abandonar o filtro por execution_id no MERGE** e filtrar por **data de negócio + writer canônico**:
   `WHERE r.date = D-1 AND r.ingestion_status='SUCCESS' AND r.ingestion_step='DAILY_ENTRY'`, persistindo `r.execution_id`
   como `source_execution_id` **por linha** (linhagem preservada, sem plumbing frágil). O `execution_id` do run continua
   vindo do nó de ID (para log/rastreio), sem participar do join.
4. **CPA × ROAS:** **obrigatório** — 1 dos 2 clientes ativos é ROAS (CLI-5) e hoje está fora do score. Ramificar
   `mas`/`miv` por `primary_metric_type` (ROAS: `revenue/cost`, maior=melhor; campo `revenue` existe no raw — Q10).
5. **FALLBACK-*:** eliminar. Está provado (Q0) que é o caminho único por design (o log INGESTION SUCCESS que ele procura
   é escrito pelo próprio pipeline minutos depois). Sem raw D-1 do writer canônico → `CALCULATION FAILED (no data)` e
   parar, em vez de pontuar esqueleto.
6. **Subworkflow Campanhas / writer canônico:** decisão que **destrava tudo**. Hoje o GADS_INSERT (esqueleto sem
   janelas) domina o raw da CLI-4 e o Daily Entry não cobre as campanhas dela (Q10). Ou o Daily Entry passa a cobrir
   100% das campanhas ativas (e o subworkflow para de escrever `raw_campaign_data`), ou o subworkflow passa a escrever
   as janelas completas. Sem isso, o fix do join só muda o tipo de vazio.
7. **Backfill:** após fixes, recalcular por `calculated_date` respeitando `reprocessed=TRUE`; limpar a linha legada
   `'OK'`; usar Q3/Q4 como baseline de comparação antes/depois (descompressão da distribuição).

**Ordem sugerida:** (a) confirmar com Olavo a publicação de hoje 17:19Z e mitigar a regressão de amanhã; (b) travar
decisões 6+3 (writer + join) e 2 (sem-dado) — são o sinal; (c) 1+4 (modelo/ROAS) — são a qualidade do sinal; (d) smoke
`phi_dev` com CLI-4 e CLI-5; (e) backfill; (f) só então liberar framework §4 e Camada 2 (L3.0).

---

## 4. Fixes propostos (draft-only — NÃO aplicados)

### 4.1 `Calcular e Persistir PHI Score` — plumbing (decisão 3)

No CTE `campanhas_exec`, substituir:
```sql
WHERE r.execution_id = '{{ $("Buscar ID de Sucesso Hoje").first().json.source_execution_id }}'
  AND r.ingestion_status = 'SUCCESS'
  AND r.date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
```
por:
```sql
WHERE r.ingestion_status = 'SUCCESS'
  AND r.ingestion_step = 'DAILY_ENTRY'          -- writer canônico (decisão 6)
  AND r.date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
```
e no SELECT do CTE, trocar a constante template de `source_execution_id` por `r.execution_id AS source_execution_id`
(linhagem por linha). Manter o `execution_id` do run via template (esse renderiza — Q0).

### 4.2 Semântica sem-dado (decisão 2) — no mesmo MERGE

`ELSE NULL` nos componentes + no SELECT final:
```sql
CASE WHEN conversions_7d IS NULL OR cost_7d IS NULL THEN 'INSUFFICIENT_DATA' ELSE 'SUCCESS' END AS calculation_status
```
com `phi_value=NULL` e flags reais quando insuficiente. A VIEW (Q8) já filtra SUCCESS — nada a mudar nela.

### 4.3 Modelo (decisão 1) — `model_config`

Nova row `MODEL-VAREJO-001 v1.2`: `mas=0.34, tss=0.33, fis=0.33, es=0, rs=0, os=0`; `valid_until=CURRENT_TIMESTAMP()`
na v1.1. (Valores exatos a travar com Olavo.)

### 4.4 Higiene no mesmo lote

FQN `phi_prod.tabela` nos 2 nós divergentes; mojibake em 3 nós; decidir destino de `threshold_used`/`phi_threshold_override`
(usar na classificação ou remover); corrigir o filtro do `Get All Current Scores (Sync)` conforme novo desenho.

### 4.5 Canal de aplicação

Guardrail mantido: MCP `update_workflow` já falhou silenciosamente no nó grande (Codex) → aplicar com **read-back
byte a byte** ou via UI com o SQL exato. **Smoke em `phi_dev` + OK do Olavo antes de publicar.**

---

## 5. Apêndice de evidências (Q0–Q10, executadas 2026-07-02 ~18:37Z em `phi_prod`)

### Q0 — `workflow_execution_log` (20 mais recentes)
100% dos `execution_id` são `FALLBACK-YYYYMMDD-<uuid>`. Padrão diário: INGESTION SUCCESS ~07:00:53 → CALCULATION
SUCCESS ~07:01:32 → 4× OPERATIONAL ~07:01:49. Rodada manual extra em 2026-07-01 10:45–10:46. Dias 2026-06-29/30 sem
rodada do pipeline (gap no cron ou execução falha). **Expressões renderizam; FALLBACK é o caminho único.**

### Q1 — `phi_score_history` CLI-4 (30 mais recentes)
2 linhas/dia (2 campanhas), snapshots diários novos (ex.: `2026-07-02T07:01:34`), `execution_id=FALLBACK-*` do dia,
`source_execution_id=NULL`, **todas as linhas com phi_value=50.0 e mas=tss=fis=es=rs=os=50.0**, status SUCCESS,
WARNING. Série contínua desde pelo menos 2026-06-14 (com buracos nos dias sem rodada: 06-20, 06-28/29).

### Q2 — `model_config`
| model_id | version | mas | tss | fis | es | rs | os | threshold | valid_until |
|---|---|---|---|---|---|---|---|---|---|
| MODEL-VAREJO-001 | v1.1 | 0.20 | 0.20 | 0.20 | 0.15 | 0.15 | 0.10 | 0.75 | NULL |

Modelo único. Soma 1.0. `es+rs+os=0.40` fixos em 50 → contribuição constante de 20 pts; parte variável máx 60 pts.

### Q3 — Distribuição de `phi_classification` (status SUCCESS)
| classificação | n | média | min | max |
|---|---|---|---|---|
| WARNING | 100 | 47.2 | 40.0 | 50.0 |
| CRITICAL | 12 | 31.6 | 26.62 | 33.51 |
| GOOD | 2 | 65.0 | 61.27 | 68.74 |
| OK (legado) | 1 | 68.0 | 68.0 | 68.0 |

Zero EXCELLENT na história. Compressão confirmada.

### Q4 — Componentes presos em 50 (115 linhas totais)
mas: 64 · tss: **112** · fis: 90 · es: **114** · rs: **115** · os: **115**.

### Q5 — `raw_campaign_data` últimos 10 dias (por date × execution_id × step)
Duas famílias por dia: `GADS_INSERT` (2 linhas/dia, `execution_id=FALLBACK-*` do pipeline do dia seguinte,
**sem_cost7d=2, sem_conv7d=2** — esqueleto) e `DAILY_ENTRY` (1–2 execs/dia `EXEC-DE-*`, janelas populadas).
O id que o MERGE casa é o da família esqueleto.

### Q6b — `client_config` (completa)
| client_id | nome | model | metric_type | threshold_override | ativo |
|---|---|---|---|---|---|
| CLI-4 | KILDARE & BRUNA BECKER | MODEL-VAREJO-001 | CPA | NULL | ✔ |
| CLI-5 | IMPACTO WEB CURSOS | MODEL-VAREJO-001 | **ROAS** | NULL | ✔ |

**Sem coluna `primary_metric_goal`** (a query do brief falha com "Unrecognized name"). Meta vive no raw, por campanha.

### Q7 — MERGE escreveu na última rodada?
`linhas_escritas_hoje = 2` (calculated_date 2026-07-01, snapshot ≥ hoje). **Escreve — refuta o "MERGE não escreve".**
(As 2 linhas são da CLI-4; CLI-5 = 0.)

### Q8 — Definição da VIEW `phi_score_current`
Último `calculated_date` por (client, campaign) com `calculation_status='SUCCESS'`; já projeta `source_execution_id`.

### Q9 — Schemas
`client_config`: client_id, client_name, model_id, phi_threshold_override, primary_metric_type, is_active, created_at,
updated_at, client_slug. `raw_campaign_data`: inclui cost/conversions/revenue diários + janelas cost_3d/7d,
conversions_3d/7d + primary_metric_goal (por linha).

### Q10 — Raw CLI-4, últimos 3 dias
Somente linhas `GADS_INSERT`: dados diários reais (ex.: 2026-07-01 Salão: cost 35.57, conv 10, goal 3.5) mas **todas as
janelas 3d/7d NULL**. Nenhuma linha `DAILY_ENTRY` para as campanhas da CLI-4 no período. (Nota: com goal 3.5 e CPA real
~3.56, a campanha Salão estaria ~no alvo — o dado bruto para pontuar de verdade existe, só não está janelado.)

---

## 6. Estado do live verificado (read-back MCP, 2026-07-02 ~18:30Z)

- `PHI - Pipeline_v2` ativo, `versionId = activeVersionId = 4b723285-dacb-4c96-9728-dcdf6a804421`,
  `updatedAt 2026-07-02T17:19:28Z` — **nova versão publicada hoje, autor a confirmar** (difere do estado do brief:
  active `15b91f10`, draft `a09f6e35`).
- Nó de score na versão ativa: filtro do raw por `source_execution_id` (template) — com upstream emitindo só
  `execution_id`, a rodada de amanhã tende a escrever 0 linhas (regressão vs. o "50 constante" atual).
- 16 nós BQ sem prefixo `=` na serialização (dump e API) — **não é bug**: Q0 prova que as expressões renderizam.

## 7. Pendências / próximos passos

1. **Olavo:** confirmar a publicação de 17:19Z de hoje (quem/por quê); decidir mitigação antes das 07:00 de amanhã.
2. Travar decisões §3 (writer canônico, join por data, sem-dado, peso-0, ROAS, fim do FALLBACK).
3. Registrar ADRs (v1.2 do modelo; revisão do desenho de linhagem — o A.7 de "um source_execution_id por run" morre
   em favor de linhagem por linha).
4. Aplicar fixes em draft com read-back; smoke `phi_dev` (CLI-4 **e** CLI-5); backfill; só então L3/framework §4.
5. Corrigir CLAUDE.md (`primary_metric_goal` não é campo de `client_config`).
