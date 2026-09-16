# [BRIEF sub-chat] Análise estratégica do PHI·Mídia Score (Pipeline_v2) — o keystone

> **Como usar:** abra uma **sessão nova** (sub-chat dedicado) e cole este arquivo
> como primeira mensagem. É auto-contido: dá o diagnóstico já feito na fonte (o JSON
> do workflow), as evidências, as perguntas em aberto e o plano. O objetivo é
> **decidir o que o PHI·Mídia Score deve ser e consertar o que o impede de ter sinal**
> — antes de qualquer camada (análise L3, framework §4, loop de alertas) ser
> construída em cima dele.
> **Frente:** Saúde Digital · **Objeto:** `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`) —
> autoridade única do score (ADR-003). **Branch:** `claude/agentic-agency-planning-KwJEw`.
> **Data do diagnóstico:** 2026-07-01 · **Artefato lido:** `docs/audits/PHI - Pipeline_v2.json` (56 nós, dump real do live).

---

## 0. Por que isto é o keystone (a aposta estratégica)

O **PHI·Mídia** é o número do qual **tudo** na Saúde Digital depende:

```
sw metricas campanhas (raw_campaign_data, 04:00)
        │
        ▼
PHI - Pipeline_v2  ──►  phi_prod.phi_score_history  ──►  VIEW phi_score_current   ◄── ADR-003 (autoridade única)
        │                                                          │
        │                                                          ├──► Camada 2 / L3.0 (WF-T28-Orquestrador + Analise-Campaign)  ← já validei o plumbing
        │                                                          ├──► Framework §4 (o LLM vai raciocinar sobre phi_value + 6 componentes)
        │                                                          └──► Loop Operacional / Alertas (ADR-22: CRITICAL/WARNING → Tarefa → Log → Telegram)
```

Se o score não tem sinal, **as três camadas acima estão analisando ruído** — por
mais bem-feitas que sejam. O smoke do L3.0 já bateu nisso: a CLI-4 voltou
`phi_value=50` com **os 6 componentes = 50.0**. Este sub-chat existe pra responder,
com rigor: **o score está quebrado, incompleto, ou os dois? E o que ele deve ser?**

**Regra de ouro deste sub-chat:** não confiar em nenhuma hipótese sem **evidência de
BigQuery**. O diagnóstico abaixo foi lido do JSON (código), mas o comportamento
(quantas linhas o MERGE escreve, o histórico da CLI-4, os pesos do modelo) só se
confirma **consultando as tabelas**.

---

## 1. Ler primeiro (autoridade de design)

**Git (design canônico — ADR-012):**
- `docs/audits/PHI - Pipeline_v2.json` — **o dump real** (fonte de tudo abaixo).
- `docs/handoff/2026-07-01-saude-digital-workflows-priorizacao-revisao.md` §P2 — o brief que originou a revisão.
- `docs/handoff/2026-07-01-saude-digital-workflows-priorizacao-revisao-codex-report.md` §P2 — o que o Codex apurou (bate com este diagnóstico).
- **Linhagem do `execution_id`/`source_execution_id`** (é o coração do bug crítico): `docs/handoff/2026-05-09-A5-auditoria-execution-id.md`, `2026-05-09-A7-refactor-source-execution-id.md`, `2026-05-09-A7b-DDL-VIEW.md`, `2026-05-10-A6-pipeline-execution-id-fix.md`, `2026-05-11-A6c-implementation-adr010.md`.
- `docs/strategic-planning/ESTADO-DO-PROJETO.md` §3.8 + a linha de pendência da auditoria em §5.

**Notion (IP do modelo — a fórmula "oficial" pode divergir do live):**
- **ADR-21 — PHI Índice de Saúde Digital / PHI·Mídia** (`37db65e5-c72b-814b-b3c1-eb6b8ceab705`): definição conceitual do índice + **guardas cognitivas** (volume, ruído vs problema, não otimizar 1 KPI). **Confrontar a fórmula live com o que o ADR-21 diz que o score deveria ser.**
- **ADR-004 v2** (fórmula MIV/MAS/TSS/FIS/ES/RS/OS) — buscar no DB de ADRs; é a especificação da fórmula. **Se ADR-004 define es/rs/os e o live hardcoda 50, isso é a lacuna a nomear.**
- **PHI™ — SOP/Glossário** (`328b65e5-c72b-81d8-a25b-c83921610282`): o que cada componente significa (MAS, TSS, FIS, ES, RS, OS) e os níveis de classificação.

---

## 2. A fórmula REAL (extraída do nó `Calcular e Persistir PHI Score`)

O nó é um `MERGE` em `phi_prod.phi_score_history`. Núcleo do cálculo (por campanha,
janela D-1 sobre métricas 7d/3d):

```sql
-- componentes
mas = CASE
        WHEN conversions_7d > 0 AND primary_metric_goal > 0
          THEN LEAST(100, GREATEST(0, (primary_metric_goal / (cost_7d/conversions_7d)) * 100))   -- = goal_CPA / CPA_real
        WHEN conversions_7d = 0 THEN 0.0
        ELSE 50.0                                                                                  -- ⚠️ fallback
      END
tss = CASE
        WHEN conversions_7d > 0 AND conversions_3d > 0
          THEN 100 - ABS(CPA_3d - CPA_7d)/CPA_7d * 100                                             -- estabilidade 3d vs 7d
        ELSE 50.0                                                                                  -- ⚠️ fallback
      END
fis = CASE
        WHEN total_cost_7d > 0
          THEN 100 - (cost_7d / total_cost_7d * 100)                                               -- inverso da concentração de budget no portfólio
        ELSE 50.0                                                                                  -- ⚠️ fallback
      END
es  = 50.0     -- ⚠️ HARDCODED (constante)
rs  = 50.0     -- ⚠️ HARDCODED (constante)
os  = 50.0     -- ⚠️ HARDCODED (constante)
miv = CASE WHEN conversions_7d>0 AND goal>0 THEN (CPA_real - goal_CPA) * conversions_7d ELSE 0 END -- desperdício monetário

-- agregação (pesos vêm de model_config)
phi_value = ROUND( mas*peso_mas + tss*peso_tss + fis*peso_fis + es*peso_es + rs*peso_rs + os*peso_os , 2)
priority_score = (100 - phi_value)*0.60 + miv_normalizado*0.40

-- classificação
phi_classification = phi_value>=80 EXCELLENT | >=60 GOOD | >=40 WARNING | else CRITICAL

-- flags de qualidade de dado (persistidas)
rs_data_insufficient = FALSE   -- ⚠️ HARDCODED
os_data_unavailable  = FALSE   -- ⚠️ HARDCODED
calculation_status   = 'SUCCESS'  -- ⚠️ sempre SUCCESS, mesmo com tudo em fallback
```

---

## 3. Diagnóstico em 4 camadas (da mais grave pra menos)

### 🔴 C — O join com o raw está QUEBRADO (a causa provável do "50 congelado")

O nó de score filtra o raw assim:
```sql
FROM phi_prod.raw_campaign_data r ...
WHERE r.execution_id = '{{ $("Buscar ID de Sucesso Hoje").first().json.source_execution_id }}'
```
Mas o nó `Buscar ID de Sucesso Hoje` retorna **UMA única coluna, `execution_id`** (via
`COALESCE(último INGESTION SUCCESS de hoje, 'FALLBACK-...')`) — **ele nunca produz
`source_execution_id`.** Logo `$json.source_execution_id` é **undefined** → o template
renderiza vazio → o filtro vira `WHERE r.execution_id = ''` → **zero linhas do raw
casam** → `campanhas_exec` vazio → **o MERGE não escreve/atualiza nada**.

**Consequência:** em rodada normal, o score **não é recalculado**; o `phi_score_current`
(VIEW = último SUCCESS) devolve uma **linha velha/congelada**. Isso explica o `phi_value=50`
da CLI-4 com `calculated_date=2026-06-30` melhor do que "fallback de cálculo": pode ser
um registro antigo que **nunca mais foi sobrescrito**. Bate com o Codex: "o SQL grande não
persistiu / source_execution_id não é persistido / divergência A.7b vs draft live".

> Isto é a **dívida A.7b não terminada**: o design A.7 introduziu `source_execution_id`
> (o id do raw que originou o cálculo) separado do `execution_id` (o id do run de cálculo),
> mas o `Buscar ID de Sucesso Hoje` **nunca foi atualizado pra SELECIONAR os dois**. O nó de
> score já referencia os dois; o upstream só entrega um.

**Confirmar com BQ (obrigatório):**
- `SELECT calculated_date, execution_id, source_execution_id, snapshot_timestamp, phi_value FROM phi_prod.phi_score_history WHERE client_id='CLI-4' ORDER BY calculated_date DESC, snapshot_timestamp DESC` — os `snapshot_timestamp` **pararam de avançar**? `source_execution_id` está vazio/`undefined`?
- `SELECT DISTINCT execution_id, date, ingestion_status FROM phi_prod.raw_campaign_data WHERE client_id='CLI-4' ORDER BY date DESC LIMIT 10` — qual o `execution_id` real das linhas raw recentes? (é um `FALLBACK-*`? é o mesmo que o INGESTION log registra?)
- `SELECT * FROM phi_prod.workflow_execution_log WHERE phase='INGESTION' ORDER BY started_at DESC LIMIT 5` — o `execution_id` do ingestion **casa** com o `execution_id` das linhas do raw?

### 🟠 A — 3 de 6 componentes são stub fixo (es/rs/os = 50) + flags mentem

`es`, `rs`, `os` são constantes `50.0`. Eles **entram na média ponderada** multiplicados
por `peso_es/peso_rs/peso_os` (de `model_config`). Matematicamente, isso cria uma
**gravidade em direção a 50**: a fração do score presa em 50 é `(peso_es+peso_rs+peso_os)`.
Se esses pesos somam, digamos, 0.5, **metade do score é constante** e o `phi_value` só
consegue variar num range comprimido (~25–75) — quase nunca cruza 80 (EXCELLENT) ou <40
(CRITICAL). Além disso `rs_data_insufficient` e `os_data_unavailable` são **hardcoded FALSE**
→ as flags de qualidade de dado **mentem**.

**Decisão de IP (não é só bug):** es/rs/os devem ser (i) **calculados** (fechar a fórmula
ADR-004), (ii) **mantidos neutros de propósito** numa v1.1 MVP com **peso 0** (aí o stub é
inerte e honesto), ou (iii) **removidos** do modelo até existirem? Hoje é o pior dos mundos:
**constante 50 com peso possivelmente > 0**.

**Confirmar com BQ (decide o impacto):**
- `SELECT model_id, model_version, business_model, mas, tss, fis, es, rs, os, threshold, valid_until FROM phi_prod.model_config` — **quais os pesos?** Somam 1.0? `peso_es/rs/os` são > 0? Qual `model_version` vigente (`valid_until IS NULL`)?
- `SELECT phi_classification, COUNT(*) FROM phi_prod.phi_score_history WHERE calculation_status='SUCCESS' GROUP BY 1` — a distribuição está **comprimida** em WARNING/GOOD (quase sem EXCELLENT/CRITICAL)? Isso confirmaria a hipótese da gravidade-50.

### 🟡 B — mas/tss/fis colapsam pra 50 em dado ralo (degradação silenciosa)

Cada componente calculado tem um `ELSE 50.0`: sem `primary_metric_goal` → mas=50;
sem `conversions_3d` → tss=50; sem `total_cost_7d` → fis=50. Para clientes de **baixo
volume** (o caso exato da guarda cognitiva do ADR-21), o score **neutraliza pra ~50 em
silêncio** — indistinguível de um 50 "genuinamente mediano" lá na frente. Um 50 hoje pode
significar "campanha ok", "sem meta configurada" ou "sem dado" — e ninguém downstream sabe
diferenciar. `calculation_status` continua `'SUCCESS'` mesmo assim.

**Ponto de IP:** o score deveria **sinalizar insuficiência de dado** (ex.: `phi_value=NULL`
+ `calculation_status='INSUFFICIENT_DATA'` + flag) em vez de emitir 50 confiante? (Alinha
com ADR-21: não tratar ruído/volume como problema — e vice-versa.)

**Confirmar com BQ:**
- `SELECT client_id, primary_metric_goal, primary_metric_type FROM phi_prod.client_config WHERE is_active` — quantos clientes têm `primary_metric_goal` NULL/0? (cada um → mas=50).
- Amostra de `raw_campaign_data` recente: quantas campanhas têm `conversions_3d` NULL ou `conversions_7d=0`?

### 🟢 D — Linhagem execution_id (FALLBACK-*) + qualificação de projeto inconsistente

- `Buscar ID de Sucesso Hoje` cai em `CONCAT('FALLBACK-', data, GENERATE_UUID())` quando não
  acha INGESTION SUCCESS de **hoje** — mas o raw é escrito às 04:00 pelo `operador unico
  metricas` com o **seu** execution_id; se os dois não conversam, o join morre (ver C). É a
  dívida **A.6** ("parar de usar FALLBACK").
- **Qualificação de projeto inconsistente:** alguns nós usam `project-0e7c58d4-656f-49e8-807.phi_prod.<tabela>`
  (FQN hardcoded) e outros só `phi_prod.<tabela>` (projeto default). Padronizar — FQN divergente
  entre ambientes (dev/prod) é bug latente.
- **Direção da métrica-mãe:** `mas` calcula sempre `goal / CPA_real` (semântica **CPA**, menor=melhor).
  Para clientes **ROAS** (maior=melhor) a razão está **invertida** e usa `conversions` (contagem) em vez
  de `conv_value`. O nó **não ramifica** por `primary_metric_type`. Campanhas ROAS podem estar mal
  pontuadas. **Verificar** quantos clientes ativos são ROAS.
- **Mojibake** em comentários/labels SQL (`CORRE��O`, `n�o`) — preexistente; corrigir no lote.

---

## 4. Decisões estratégicas a travar (a pauta do sub-chat)

1. **Modelo-alvo do PHI·Mídia:** completar a fórmula (calcular es/rs/os de verdade — o quê,
   com que dado?), OU assumir v1.1 = MVP com es/rs/os **peso 0** e roadmap explícito pra fase 2?
   → precisa do ADR-004 + ADR-21 pra decidir com base no design, não no acaso.
2. **Semântica do "sem dado":** score confiante (50) vs `INSUFFICIENT_DATA` explícito. Alinhar
   com as guardas cognitivas do ADR-21. Impacta o que a Camada 2 e o loop recebem.
3. **Correção do join (C):** atualizar `Buscar ID de Sucesso Hoje` pra emitir **os dois** ids
   (`execution_id` do run + `source_execution_id` = o execution_id do raw fresco de D-1), e o
   MERGE ler o raw por `source_execution_id`. Persistir `source_execution_id` no history.
4. **Direção da métrica (mas):** ramificar por CPA vs ROAS (usar `conv_value` no ROAS).
5. **A.6 (FALLBACK):** eliminar o FALLBACK-* ou torná-lo rastreável/sinalizado.
6. **Dependência legacy:** `Pipeline_v2` chama `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`,
   active) via `Call Subworkflow Campanhas` — mapear o que esse sub-WF faz no caminho do score
   (é parte da ingestão? é redundante com o `operador unico metricas`?).
7. **Reprocessamento:** o MERGE respeita `reprocessed=TRUE` (não sobrescreve manual). Definir o
   procedimento de **backfill** pós-fix (recalcular o histórico com a fórmula/join corrigidos).

---

## 5. Perguntas de BigQuery a rodar primeiro (kit de evidências)

> Rodar tudo em **`phi_prod`** (read-only). Consolidar num apêndice de evidências antes de propor fix.

1. **History da CLI-4** (congelou?): `phi_score_history WHERE client_id='CLI-4'` — série de
   `calculated_date`, `snapshot_timestamp`, `execution_id`, `source_execution_id`, `phi_value`, componentes.
2. **Pesos do modelo:** `model_config` completo (`peso_*`, `model_version`, `valid_until`).
3. **Distribuição de classificação:** `GROUP BY phi_classification` no history (comprimida?).
4. **Distribuição de componentes:** `COUNTIF(es=50), COUNTIF(mas=50), COUNTIF(tss=50), COUNTIF(fis=50)` — quantos % em 50?
5. **Frescor do raw vs execution_id:** `raw_campaign_data` recente (execution_id, date, ingestion_status) × `workflow_execution_log` (INGESTION) — os ids conversam?
6. **Clientes sem meta / ROAS:** `client_config` — `primary_metric_goal` NULL/0 e `primary_metric_type='ROAS'`.
7. **O MERGE escreve algo?** contar linhas escritas hoje: `phi_score_history WHERE calculated_date=CURRENT_DATE()-1 AND snapshot_timestamp>=CURRENT_DATE()` (provável: **0**).

---

## 6. Guardrails (lições já pagas — herdadas da casa)

- **Draft only.** Editar via MCP `update_workflow` (mantém draft). **Nunca** API pública PUT (auto-ativa). Não publicar/ativar sem OK do Olavo.
- **⚠️ MCP não persiste nó grande.** O Codex viu `update_workflow` retornar `appliedOperations` para o nó `Calcular e Persistir PHI Score` **sem** a mudança persistir. **Sempre reler o nó (`get_workflow_details`) após todo update pra confirmar** — não confiar no retorno. Se o MCP não persistir o nó grande, o canal de aplicação tem que mudar (UI manual com o SQL exato, ou API com cuidado de não ativar). **Decidir isso com o Olavo antes de aplicar.**
- **MCP valida BQ com falso-positivo:** o validador do MCP acusa `parameters.sqlQuery` inválido em nós BQ live que funcionam. Ignorar esse warning específico; confiar no comportamento real.
- **Expressão n8n ≠ statements:** SQL usa template `=...{{ }}` (uma expressão). Corrigir de passagem os `{{ }}` **sem** prefixo `=` (há vários).
- **Refs cross-node:** `.first().json` só é determinístico em single-item / `executeOnce`.
- **Produção intacta hoje:** `activeVersionId=15b91f10-0036-4f14-bd37-3b2ff936c7cb`. O draft ficou em `a09f6e35-...` após as tentativas do Codex (reverteu; confirmar coerência). **Não mexer no active sem smoke + OK.**
- **BQ:** `executeQuery` + `useLegacySql:false`; MERGE (DML) idempotente, não streaming insert.

---

## 7. Plano de trabalho sugerido (fases)

1. **Evidência (read-only):** rodar o kit BQ §5 → apêndice de evidências. Confirmar/derrubar cada camada do §3. **Sem tocar em workflow ainda.**
2. **Design:** confrontar fórmula live × ADR-004/ADR-21 → travar as decisões §4 (modelo-alvo, semântica sem-dado, direção da métrica). Documentar como **atualização de ADR** (ou novo ADR) — git é canônico (ADR-012).
3. **Fix plumbing (o que destrava sinal):** corrigir C (os dois ids) + persistir `source_execution_id`; padronizar FQN de projeto; corrigir templates `=`. Em **draft**, com **read-back** obrigatório.
4. **Fix modelo (o IP):** implementar es/rs/os (ou peso 0 + roadmap) + ramificação CPA/ROAS + semântica INSUFFICIENT_DATA.
5. **Smoke real (Olavo):** rodar 1 cliente em `phi_dev`, comparar componentes da CLI-4 antes/depois; validar que o MERGE escreve e que a distribuição descomprime.
6. **Backfill:** recalcular history com a fórmula/join corrigidos (respeitando `reprocessed`).
7. **Só então:** liberar o framework §4 e reavaliar a Camada 2 (L3.0) sobre um score confiável.

**Formato do report (commitar em `docs/handoff/`):** apêndice de evidências BQ + tabela
"camada → confirmada/derrubada" + decisões de design travadas + fixes aplicados (com versionId
+ prova de read-back) vs recomendados + status. Não ativar; pré-revisão Claude + OK do Olavo.

---

## 8. Âncoras técnicas (IDs / tabelas / versões)

- **Workflow:** `PHI - Pipeline_v2` `ITWG3Ge0asXtUM8U` · dump `docs/audits/PHI - Pipeline_v2.json` (56 nós) · active `15b91f10-...` · draft atual `a09f6e35-...`.
- **Nós-chave:** `Buscar ID de Sucesso Hoje` (BQ, origem do id — **bug C aqui**), `Code INSERT execution_id`, `Calcular e Persistir PHI Score` (BQ MERGE — a fórmula), `Buscar Campanhas Alertas` (BQ, Fase 3 — também casa por execution_id), `Call Subworkflow Campanhas` → `PHI - Subworkflow Campanhas` `b1pbn8qmzCNTufTp`.
- **Tabelas BQ (`phi_prod`):** `raw_campaign_data`, `client_config`, `model_config`, `phi_score_history` (MERGE key: client_id+campaign_id+calculated_date), VIEW `phi_score_current` (último SUCCESS), `workflow_execution_log` (phases INGESTION/CALCULATION/OPERATIONAL).
- **Writer do raw:** `sw metricas campanhas` `W571K320aqIHsdtH` ← chamado por `operador unico metricas` `cLcimNoefTOnVVbd` (cron `0 4 * * *`).
- **Downstream que consome o score:** L3.0 `8Q5ofmAZju0hTN08`/`fhYmJH0o9BW1IO4i`; Loop Alerta `JqPwFD9udCq2hRPw`.
- **Cliente de referência:** CLI-4 = KILDARE & BRUNA BECKER (`19fb65e5-c72b-81dd-b7a0-f295fe304d60`).
- **ADR-003** (autoridade única do score) · **ADR-004 v2** (fórmula) · **ADR-21** (índice + guardas cognitivas) · **A.5/A.6/A.7/A.7b** (linhagem execution_id).
