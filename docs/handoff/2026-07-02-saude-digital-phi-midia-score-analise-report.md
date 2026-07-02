# [REPORT sub-chat] Análise estratégica do PHI·Mídia Score (Pipeline_v2)

> **Origem:** brief `2026-07-01-saude-digital-phi-midia-score-analise-subchat-brief.md`.
> **Data:** 2026-07-02 · **Executor:** Claude Code (sessão remota, branch `claude/saude-digital-phi-midia-score-0ko12c`).
> **Artefatos lidos:** `docs/audits/PHI - Pipeline_v2.json` (56 nós, dump live), linhagem A.5/A.6/A.6b/A.6c/A.7/A.7b (git),
> ADR-004 v2 (`359b65e5-c72b-819c-981c-fc1eaf79555f`), ADR-21 (`37db65e5-c72b-814b-b3c1-eb6b8ceab705`) via Notion MCP.
> **Nenhum workflow foi tocado.** Nenhuma query BQ foi executada (ver §8 — bloqueio de tooling).

---

## 0. Sumário executivo

O diagnóstico do brief **se sustenta integralmente no código** — e a análise encontrou **um mecanismo de quebra
adicional, potencialmente mais grave** que o descrito na camada C:

1. **🔴 Camada C confirmada em código, com agravante:** no dump, **nenhum dos 16 nós BigQuery tem o prefixo `=`
   no `sqlQuery`**. Sem `=`, o n8n **não avalia** `{{ }}` — o texto literal `'{{ $("Buscar ID de Sucesso
   Hoje").first().json.source_execution_id }}'` é enviado ao BigQuery como valor. Em qualquer dos dois cenários
   (expressão não avaliada → literal; ou avaliada com campo inexistente → vazio/`undefined`), o filtro do MERGE
   **casa zero linhas do raw** e o score **não é recalculado**. Há um teste BQ decisivo para distinguir os
   cenários (§6, query Q0).
2. **🟠 Camada A confirmada — e é decisão, não spec faltante:** o ADR-004 v2 (Aceito, 2026-05-07, reconfirmado
   2026-06-18) **já documenta** ES/RS/OS como *placeholders sem implementação* ("não são Engagement/Recovery/
   Optimization Scores"). Não existe fórmula oficial a implementar; existe uma decisão de modelo em aberto
   (candidata a ADR-008). O caminho de menor risco é **v1.1 com peso 0** (stub inerte) + roadmap.
3. **🟡 Camada B confirmada — e é estrutural, não só "dado ralo":** a discovery A.6b provou que o
   `PHI - Subworkflow Campanhas` é **writer efetivo** de `raw_campaign_data` (`GADS_INSERT`, 42 linhas vs 14 do
   `DAILY_ENTRY` na época) e **não escreve** `cost_3d/cost_7d/conversions_3d/conversions_7d`. Ou seja: mesmo com
   o join corrigido, as linhas dominadas pelo `GADS_INSERT` derrubam MAS/TSS no fallback 50.
4. **🟢 Camada D confirmada** (FQN inconsistente, mojibake, CPA-only, FALLBACK-*) + 2 achados novos: o
   `threshold_used` é persistido mas **ignorado** na classificação (hardcoded 80/60/40), e o nó
   `Get All Current Scores (Sync)` — que alimenta o Notion — tem o mesmo problema de expressão não avaliada,
   o que explicaria o **`Score Diário` congelado no Notion** de forma independente do MERGE.

**O que falta para fechar:** o kit de evidências BQ (§6) — bloqueado nesta sessão por ausência de credenciais
BigQuery e de autenticação no MCP n8n (§8). Todo o SQL está pronto para colar e rodar.

---

## 1. Veredito camada a camada (brief §3)

| Camada | Hipótese do brief | Veredito | Evidência |
|---|---|---|---|
| 🔴 C | Join do MERGE quebrado: upstream só emite `execution_id`, score filtra por `source_execution_id` | **CONFIRMADA em código** (falta réplica BQ) | Nó `Buscar ID de Sucesso Hoje`: `SELECT COALESCE(...) AS execution_id` — **uma coluna só**. Nó `Calcular e Persistir PHI Score`: `WHERE r.execution_id = '{{ ...source_execution_id }}'`. Linhagem: A.6 aplicou o patch de dois IDs e **foi revertido** ("rollback aplicado", doc A.6); o nó de score manteve as referências órfãs. |
| 🔴 C+ (novo) | — | **NOVO ACHADO** | **Todos os 16 nós BQ estão sem prefixo `=` no `sqlQuery`** no dump. Se o dump for fiel, *nenhuma* expressão `{{ }}` renderiza em nó BQ nenhum (inclusive os logs de fase). Uniformidade sugere possível normalização do export do MCP — **verificar com Q0 (§6) e/ou read-back na UI antes de qualquer fix**. |
| 🟠 A | ES/RS/OS = 50 hardcoded entram na média ponderada; flags mentem | **CONFIRMADA em código + design** | SQL do MERGE: `50.0 AS es, 50.0 AS rs, 50.0 AS os`; `FALSE AS rs_data_insufficient, FALSE AS os_data_unavailable`; `'SUCCESS' AS calculation_status` incondicional. ADR-004 v2 já registrava como "problema estrutural 3". Impacto (compressão do range) depende dos pesos em `model_config` → Q2/Q3 (§6). |
| 🟡 B | MAS/TSS/FIS colapsam para 50 em dado ralo, silenciosamente | **CONFIRMADA em código + agravante estrutural** | `ELSE 50.0` nos 3 componentes. Agravante (A.6b): o `GADS_INSERT` do Subworkflow **não popula janelas 3d/7d** e domina as linhas recentes do raw — o fallback não é exceção, é o caminho comum para linhas dessa origem. Quantificar com Q4/Q6 (§6). |
| 🟢 D | FALLBACK-*, FQN inconsistente, direção CPA/ROAS, mojibake | **CONFIRMADA** | FALLBACK-* no `COALESCE` do `Buscar ID de Sucesso Hoje`. FQN dentro do SQL em 2 nós (`Log INGESTION SUCCESS`, `Log CALCULATION SUCCESS`). Mojibake em 3 nós (`Log INGESTION FAILED`, `Buscar Campanhas Alertas`, `Execute SQL Verificar Escalada`). CPA-only: `primary_metric_type` carregado no CTE e **nunca usado** (ADR-004 problema 4); MAS/MIV usam semântica CPA (menor=melhor) para todos. |
| 🟢 D+ (novos) | — | **NOVOS ACHADOS** | (i) `threshold_used` (de `model_config.threshold`) é persistido mas a classificação usa 80/60/40 hardcoded — já capturado no ADR-004 (Aprendizado #9), segue vivo no dump. (ii) `Get All Current Scores (Sync)` filtra `phi_score_current` por `execution_id` com `{{ }}` sem `=` → o sync de score para o Notion provavelmente retorna 0 linhas → **Notion congelado por caminho próprio**, independente do MERGE. (iii) INNER JOIN com `client_config`/`model_config` exclui campanhas sem config **sem trilha** (ADR-004 problema 5). |

### Como os dois mecanismos da camada C se distinguem (importa para o fix)

- **Cenário 1 — expressões não avaliadas (sem `=`):** o `execution_id` gravado em `workflow_execution_log`
  pelos nós de log conteria o **texto literal** `{{ ... }}`. O fix passa por adicionar `=` em todos os nós BQ
  com template **além** de corrigir os dois IDs.
- **Cenário 2 — dump normalizado, expressões avaliadas no live:** os logs teriam IDs reais; o problema fica
  restrito a `source_execution_id` inexistente (render vazio/`undefined`) → filtro vazio → zero linhas.
- Em **ambos** os cenários o MERGE não escreve nada em rodada normal, o que é consistente com o smoke do L3.0
  (CLI-4 com `phi_value=50` e `calculated_date=2026-06-30` estagnado). **Q0 e Q1 (§6) decidem o cenário.**

---

## 2. Confronto fórmula live × design (ADR-004 v2 / ADR-21)

**Conclusão central: não há divergência entre o live e o ADR-004 v2 — o ADR documenta exatamente o live,
placeholders inclusos.** A lacuna do PHI·Mídia não é "implementação que fugiu da spec"; é **decisão de modelo
nunca tomada** (o próprio ADR-004 lista os 5 problemas estruturais como pendentes e nomeia o ADR-008 como
candidato para a decisão CPA-only × polimorfismo).

| Ponto | ADR-004 v2 (design) | Live (dump) | Lacuna |
|---|---|---|---|
| MAS | `(goal / CPA_real) × 100`, capped; 0 se conv=0; 50 fallback; **CPA-only** | idem | Nenhuma — decisão CPA×ROAS em aberto (ADR-008) |
| TSS | estabilidade CPA 3d vs 7d; 50 fallback | idem | Nenhuma |
| FIS | `100 − share de custo no portfólio`; 50 fallback | idem | Semântica é *exposição*, não saúde — revisar se deve compor média de "saúde" |
| ES/RS/OS | **placeholders 50.0, "NÃO implementado"** | idem | Decisão: calcular / peso 0 / remover. Sem spec para "implementar" |
| Classificação | 80/60/40 hardcoded; `threshold_used` ignorado (Aprendizado #9) | idem | Usar `model_config.threshold` ou remover o campo |
| Flags de qualidade | `rs_data_insufficient`/`os_data_unavailable` FALSE fixos | idem | Flags mentem — corrigir junto com semântica sem-dado |
| `priority_score` | `(100−phi)×0.60 + miv_norm×0.40`, pesos hardcoded | idem | Aceitável (priorização ≠ saúde), documentado |

**ADR-21 (guardas cognitivas) → implicação direta no modelo:** o ADR-21 declara que **nenhum pilar do PHI emite
leitura com volume insuficiente — responde "VOLUME INSUFICIENTE" em vez de pontuar** (Tema 10), e que alertas
devem distinguir ruído de problema (Tema 19). O comportamento atual (50 confiante + `calculation_status='SUCCESS'`
em qualquer cenário de dado ralo) **viola a guarda**. Isso resolve a decisão 2 do brief pelo design já aceito:
a semântica `INSUFFICIENT_DATA` não é opção, é **alinhamento com ADR vigente**.

---

## 3. Recomendações para as 7 decisões (brief §4) — a travar com Olavo

1. **Modelo-alvo:** **v1.1 MVP = ES/RS/OS com peso 0 em `model_config`** (stub inerte e honesto; `phi_value`
   passa a ser média de MAS/TSS/FIS com pesos renormalizados) + roadmap explícito de fase 2 para componentes
   reais. Registrar como novo ADR (ou revisão do ADR-004) — evita inventar fórmula sem dado e descomprime o
   range imediatamente. Pré-requisito: Q2 (pesos atuais).
2. **Semântica sem-dado:** adotar `calculation_status='INSUFFICIENT_DATA'` + `phi_value=NULL` + flags
   verdadeiras quando (goal ausente/zero) ou (janelas 3d/7d ausentes). **Já decidido em essência pelo ADR-21**
   (guarda "VOLUME INSUFICIENTE"). Downstream (L3, loop de alertas, VIEW) deve filtrar `SUCCESS`.
3. **Join (camada C):** corrigir `Buscar ID de Sucesso Hoje` para emitir **os dois IDs** (proposta de SQL em §5),
   MERGE filtrar o raw por `source_execution_id`, persistir ambos no history. **Condicional ao resultado de Q0:**
   se cenário 1, incluir o prefixo `=` em todos os nós BQ com template no mesmo lote.
4. **CPA × ROAS:** decisão ADR-008. Recomendação: ramificar `mas`/`miv` por `primary_metric_type` (ROAS usa
   `conv_value/cost`, maior=melhor) **somente se** Q6 mostrar clientes ROAS ativos; senão, declarar CPA-only
   formal e validar `primary_metric_type='CPA'` na ingestão (falha explícita, não silêncio).
5. **FALLBACK-*:** eliminar. Sem `INGESTION SUCCESS` de hoje → **abortar a fase de cálculo com log
   `CALCULATION FAILED (no ingestion)`** em vez de inventar um ID que nunca casará com o raw. Um ID falso
   "rastreável" continua produzindo MERGE vazio — não há caso de uso legítimo.
6. **Subworkflow Campanhas:** A.6b provou que é **writer concorrente** do raw com snapshot reduzido (sem janelas
   3d/7d, sem campos v23), sobrescrevendo o estado do `Daily Entry`/`operador unico metricas` para CLI-4. Decidir
   **um writer canônico** do raw (recomendação: `sw metricas campanhas` 04:00; o subworkflow deixa de escrever
   raw ou passa a escrever tabela própria de staging). Sem isso, a camada B reaparece mesmo com tudo corrigido.
7. **Backfill:** após fix C+B, recalcular o history por janela retroativa (respeitando `reprocessed=TRUE`),
   por lote de `calculated_date`, comparando distribuição de classificação antes/depois (Q3 como baseline).
   Detalhar em doc próprio depois do smoke em `phi_dev`.

---

## 4. Mapa do fluxo do score no Pipeline_v2 (como está no dump)

```
Schedule 07:00
  → Buscar ID de Sucesso Hoje        [BQ]  emite: execution_id (só)  ← COALESCE(log INGESTION SUCCESS de hoje, FALLBACK-*)
  → Log INGESTION RUNNING            [BQ]
  → Buscar Clientes Ativos           [BQ]
  → Code INSERT execution_id         [code] injeta execution_id em cada cliente
  → Loop Clientes → Call Subworkflow Campanhas  (passa execution_id, client_id e source_execution_id=undefined)
        └── Subworkflow ESCREVE raw_campaign_data (MERGE, GADS_INSERT, sem janelas 3d/7d)  ← A.6b
  → Log INGESTION SUCCESS/FAILED     [BQ]
  → Log CALCULATION RUNNING          [BQ]
  → Calcular e Persistir PHI Score   [BQ MERGE]  filtro: r.execution_id = source_execution_id (inexistente) → 0 linhas
  → Log CALCULATION SUCCESS/FAILED   [BQ]
  → Fase 3 (Fechamento → Escalada → Abertura) usa Buscar Campanhas Alertas (mesmo padrão de filtro)
  → Get All Current Scores (Sync)    [BQ]  filtro por execution_id com {{ }} sem '=' → sync Notion suspeito
```

---

## 5. Fixes propostos (draft-only — NÃO aplicados; guardrails do brief §6 respeitados)

### 5.1 `Buscar ID de Sucesso Hoje` — emitir os dois IDs

```sql
WITH ingestion AS (
  SELECT execution_id AS source_execution_id
  FROM `phi_prod.workflow_execution_log`
  WHERE DATE(started_at, 'America/Sao_Paulo') = CURRENT_DATE('America/Sao_Paulo')
    AND status = 'SUCCESS'
    AND phase  = 'INGESTION'
  ORDER BY started_at DESC
  LIMIT 1
)
SELECT
  CONCAT('EXEC-PHI-', FORMAT_TIMESTAMP('%Y%m%d%H%M%S', CURRENT_TIMESTAMP()), '-',
         SUBSTR(GENERATE_UUID(), 1, 8))            AS execution_id,          -- id do RUN de cálculo
  (SELECT source_execution_id FROM ingestion)      AS source_execution_id    -- id do raw que origina o cálculo (NULL se não houver)
```

Com regra downstream: se `source_execution_id IS NULL` → branch de erro → `Log CALCULATION FAILED` (mata o
FALLBACK-*; decisão 5). **Atenção à lição da A.6:** o `execution_id` `EXEC-PHI-*` NÃO pode ser repassado ao
Subworkflow como id de ingestão (foi isso que quebrou a A.6 e forçou o rollback) — o Subworkflow deve receber
`source_execution_id` ou parar de escrever o raw (decisão 6).

### 5.2 `Calcular e Persistir PHI Score` — mudanças mínimas de plumbing

- Prefixar `sqlQuery` com `=` (se Q0 confirmar cenário 1 — e nesse caso, em **todos** os nós BQ com `{{ }}`).
- Filtro do raw permanece `WHERE r.execution_id = '{{ ...source_execution_id }}'` — passa a funcionar com 5.1.
- Persistência de `execution_id` + `source_execution_id` já está no MERGE (nada a mudar).
- FQN: padronizar `phi_prod.tabela` (sem project id) nos 2 nós divergentes (regra 1 do CLAUDE.md).
- Mojibake: corrigir strings nos 3 nós afetados, no mesmo lote.

### 5.3 Mudanças de modelo (após decisões 1/2/4)

- `model_config`: nova `model_version` com `peso_es=peso_rs=peso_os=0` e `peso_mas/tss/fis` renormalizados
  (somando 1.0); `valid_until` na versão anterior (histórico auditável, sem UPDATE destrutivo).
- CTE `calc_components`: substituir `ELSE 50.0` por `ELSE NULL` + coluna de status; SELECT final emite
  `calculation_status = CASE WHEN <insuficiente> THEN 'INSUFFICIENT_DATA' ELSE 'SUCCESS' END`, `phi_value=NULL`
  quando insuficiente, e flags reais. VIEW `phi_score_current` e consumidores filtram `SUCCESS` (verificar
  definição da VIEW — pendência A.7b: é VIEW, `ALTER TABLE` não se aplica).
- Ramo ROAS (se decisão 4 = polimorfismo): `mas_roas = LEAST(100, (roas_real / roas_goal) * 100)` com
  `roas_real = conv_value_7d / cost_7d` — **depende de `conv_value` existir no raw** (verificar schema; o
  snapshot do GADS_INSERT tem `revenue`).

### 5.4 Canal de aplicação

Guardrail do brief mantido: MCP `update_workflow` **não persistiu** o nó grande na tentativa do Codex
(retornou `appliedOperations` sem efeito). Qualquer aplicação exige **read-back** (`get_workflow_details`)
comparando o SQL byte a byte; se não persistir, aplicar via UI manual com o SQL exato deste report.
**Nada disso sem OK do Olavo e smoke em `phi_dev`.**

---

## 6. Kit de evidências BigQuery — pronto para rodar (read-only, `phi_prod`)

> **Q0 é o teste decisivo do mecanismo da camada C** — rodar primeiro.

```sql
-- Q0 · Expressões renderizam? (cenário 1 × 2)
-- Se execution_id contiver '{{' → cenário 1 (sem '='); se contiver IDs reais → cenário 2 (dump normalizado).
SELECT execution_id, phase, status, started_at
FROM `phi_prod.workflow_execution_log`
ORDER BY started_at DESC
LIMIT 20;

-- Q1 · History da CLI-4: congelou? source_execution_id vazio/literal?
SELECT calculated_date, snapshot_timestamp, execution_id, source_execution_id,
       phi_value, mas, tss, fis, es, rs, os, calculation_status, phi_classification
FROM `phi_prod.phi_score_history`
WHERE client_id = 'CLI-4'
ORDER BY calculated_date DESC, snapshot_timestamp DESC
LIMIT 30;

-- Q2 · Pesos do modelo vigente (impacto da gravidade-50 = es+rs+os)
SELECT model_id, model_version, business_model, mas, tss, fis, es, rs, os,
       (mas+tss+fis+es+rs+os) AS soma_pesos, threshold, valid_until
FROM `phi_prod.model_config`
ORDER BY model_id, model_version;

-- Q3 · Distribuição de classificação (comprimida em GOOD/WARNING?)
SELECT phi_classification, COUNT(*) n,
       ROUND(AVG(phi_value),1) media, MIN(phi_value) min, MAX(phi_value) max
FROM `phi_prod.phi_score_history`
WHERE calculation_status = 'SUCCESS'
GROUP BY 1 ORDER BY 2 DESC;

-- Q4 · % de componentes presos em 50 (fallback silencioso)
SELECT COUNT(*) total,
       COUNTIF(mas = 50) mas_50, COUNTIF(tss = 50) tss_50, COUNTIF(fis = 50) fis_50,
       COUNTIF(es = 50) es_50, COUNTIF(rs = 50) rs_50, COUNTIF(os = 50) os_50
FROM `phi_prod.phi_score_history`;

-- Q5 · Frescor do raw × linhagem de execution_id (+ writer efetivo por origem)
SELECT date, execution_id, ingestion_status, ingestion_step, COUNT(*) linhas,
       COUNTIF(cost_7d IS NULL OR cost_7d = 0) sem_cost7d,
       COUNTIF(conversions_7d IS NULL) sem_conv7d
FROM `phi_prod.raw_campaign_data`
WHERE date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 10 DAY)
GROUP BY 1,2,3,4 ORDER BY date DESC;

-- Q6 · Clientes sem meta / clientes ROAS
SELECT client_id, client_slug, primary_metric_type, primary_metric_goal, model_id, is_active
FROM `phi_prod.client_config`
ORDER BY is_active DESC, client_id;

-- Q7 · O MERGE escreveu algo na última rodada? (provável: 0)
SELECT COUNT(*) linhas_escritas_hoje
FROM `phi_prod.phi_score_history`
WHERE calculated_date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
  AND snapshot_timestamp >= TIMESTAMP(CURRENT_DATE('America/Sao_Paulo'));

-- Q8 · Definição da VIEW phi_score_current (pendência A.7b)
SELECT table_name, view_definition
FROM `phi_prod.INFORMATION_SCHEMA.VIEWS`
WHERE table_name = 'phi_score_current';
```

**Apêndice de evidências:** a preencher com os resultados (tabela por query) na próxima sessão com acesso BQ.

---

## 7. Ordem de execução recomendada (revisão do plano do brief §7)

1. **Evidência:** rodar Q0–Q8 (bloqueado nesta sessão — §8). Q0 decide o escopo do fix C.
2. **Design:** travar decisões 1–7 (§3) com Olavo; registrar ADR novo (v1.1 do modelo) + ADR-008 (CPA×ROAS).
3. **Fix plumbing (draft + read-back):** 5.1 + 5.2 (+ `=` global se cenário 1) + fix do `Get All Current
   Scores (Sync)` — este último destrava o Notion mesmo antes do backfill.
4. **Fix modelo:** 5.3 (peso 0, INSUFFICIENT_DATA, ramo ROAS se aprovado).
5. **Decisão do writer do raw** (Subworkflow × Daily Entry) — sem ela, B volta.
6. **Smoke `phi_dev`** (1 cliente, CLI-4, componentes antes/depois) → OK Olavo → aplicar → **backfill**.
7. Só então liberar framework §4 e reavaliar Camada 2 (L3.0).

---

## 8. Bloqueios desta sessão (tooling)

- **BigQuery:** ambiente remoto sem `bq`/`gcloud` e sem credenciais GCP → kit §6 não executado. Alternativas:
  rodar na próxima sessão local, ou via n8n (workflow temporário read-only), ou conceder credencial de leitura.
- **MCP n8n:** requer autenticação (OAuth) não disponível em sessão não-interativa → sem read-back do draft
  live (`a09f6e35-...`) para confirmar coerência pós-Codex, e sem verificação do prefixo `=` no live. O dump
  em git foi usado como fonte, com o caveat de fidelidade registrado em §1.
- **Consequência:** este report cobre Fase 1 (parcial — código e linhagem, sem BQ) e Fase 2 (design) do plano
  do brief. Nenhuma alteração foi aplicada em workflow.
