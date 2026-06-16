import json, copy, uuid

SRC = '/home/user/phi/phi_pipeline_v2_fixed.json'
DST = '/home/user/phi/phi_pipeline_v2.json'

with open(SRC) as f:
    base = json.load(f)

# Work on a deep copy
wf = copy.deepcopy(base)
wf['name'] = 'PHI - Pipeline_v2'
# Remove id so n8n assigns a new one on import
del wf['id']
del wf['versionId']
del wf['activeVersionId']
del wf['createdAt']
del wf['updatedAt']
wf['active'] = False

# ── Index nodes by name ──────────────────────────────────────────
nm = {n['name']: i for i, n in enumerate(wf['nodes'])}

def get_node(name):
    return wf['nodes'][nm[name]]

# ════════════════════════════════════════════════════════════════
# 1. Create new single-node: "Calcular e Persistir PHI Score"
#    Replaces: Calcular PHI Score + Loop Campanhas Cálculo + MERGE phi_score_history + If Calculo OK?
# ════════════════════════════════════════════════════════════════
MERGE_SQL = """\
-- PHI™ v1.3 — Calcular e Persistir PHI Score
-- v2: MERGE único no BQ — elimina o loop N×MERGE do n8n
MERGE `phi_prod.phi_score_history` AS target
USING (
  WITH campanhas_exec AS (
    SELECT DISTINCT
      r.execution_id, r.client_id, r.campaign_id,
      r.primary_metric_goal, r.date AS reference_date,
      r.cost_7d, r.cost_3d,
      r.conversions_7d, r.conversions_3d,
      r.plataforma,
      cc.primary_metric_type,
      mc.model_id, mc.business_model, mc.model_version,
      mc.mas AS peso_mas, mc.tss AS peso_tss, mc.fis AS peso_fis,
      mc.es AS peso_es, mc.rs AS peso_rs, mc.os AS peso_os,
      mc.threshold AS threshold_used
    FROM `phi_prod.raw_campaign_data` r
    INNER JOIN `phi_prod.client_config` cc
      ON r.client_id = cc.client_id AND cc.is_active = TRUE
    INNER JOIN `phi_prod.model_config` mc
      ON cc.model_id = mc.model_id AND mc.valid_until IS NULL
    WHERE r.execution_id = '{{ $("Buscar ID de Sucesso Hoje").first().json.execution_id }}'
      AND r.ingestion_status = 'SUCCESS'
  ),
  portfolio_cost AS (
    SELECT client_id, SUM(cost_7d) AS total_cost_7d
    FROM campanhas_exec GROUP BY client_id
  ),
  calc_components AS (
    SELECT c.*, pc.total_cost_7d,
      CASE
        WHEN c.conversions_7d > 0 AND c.primary_metric_goal > 0
          THEN LEAST(100.0, GREATEST(0.0,
            (c.primary_metric_goal / (c.cost_7d / c.conversions_7d)) * 100.0))
        WHEN c.conversions_7d = 0 THEN 0.0
        ELSE 50.0
      END AS mas,
      CASE
        WHEN c.conversions_7d > 0 AND c.conversions_3d > 0
          THEN LEAST(100.0, GREATEST(0.0,
            100.0 - ABS(
              (c.cost_3d / c.conversions_3d) - (c.cost_7d / c.conversions_7d)
            ) / (c.cost_7d / c.conversions_7d) * 100.0))
        ELSE 50.0
      END AS tss,
      CASE
        WHEN pc.total_cost_7d > 0
          THEN GREATEST(0.0, 100.0 - (c.cost_7d / pc.total_cost_7d * 100.0))
        ELSE 50.0
      END AS fis,
      50.0 AS es, 50.0 AS rs, 50.0 AS os,
      CASE
        WHEN c.conversions_7d > 0 AND c.primary_metric_goal > 0
          THEN (c.cost_7d / c.conversions_7d - c.primary_metric_goal) * c.conversions_7d
        ELSE 0.0
      END AS miv
    FROM campanhas_exec c
    INNER JOIN portfolio_cost pc ON c.client_id = pc.client_id
  ),
  calc_phi AS (
    SELECT *,
      ROUND(
        (mas * peso_mas) + (tss * peso_tss) + (fis * peso_fis) +
        (es * peso_es) + (rs * peso_rs) + (os * peso_os), 2
      ) AS phi_value_raw,
      CASE
        WHEN total_cost_7d > 0 AND miv > 0
          THEN LEAST(100.0, GREATEST(0.0, miv / total_cost_7d * 100.0))
        ELSE 0.0
      END AS miv_normalizado
    FROM calc_components
  )
  SELECT
    execution_id, client_id, campaign_id,
    reference_date AS calculated_date,
    business_model, model_id, model_version,
    phi_value_raw               AS phi_value,
    ROUND(mas, 2) AS mas, ROUND(tss, 2) AS tss, ROUND(fis, 2) AS fis,
    ROUND(es,  2) AS es,  ROUND(rs,  2) AS rs,  ROUND(os,  2) AS os,
    threshold_used,
    ROUND(miv, 2)              AS miv,
    ROUND(miv_normalizado, 2)  AS miv_normalizado,
    ROUND((100.0 - phi_value_raw) * 0.60 + miv_normalizado * 0.40, 2) AS priority_score,
    CASE
      WHEN phi_value_raw >= 80 THEN 'EXCELLENT'
      WHEN phi_value_raw >= 60 THEN 'GOOD'
      WHEN phi_value_raw >= 40 THEN 'WARNING'
      ELSE 'CRITICAL'
    END AS phi_classification,
    'SUCCESS'     AS calculation_status,
    'CORE'        AS calculation_last_step,
    '7d'          AS mas_janela,
    FALSE         AS rs_data_insufficient,
    FALSE         AS os_data_unavailable,
    plataforma,
    primary_metric_type,
    conversions_7d,
    CURRENT_TIMESTAMP()         AS snapshot_timestamp,
    FALSE                       AS reprocessed,
    CAST(NULL AS TIMESTAMP)     AS reprocessed_at,
    CAST(NULL AS STRING)        AS reprocessed_by
  FROM calc_phi
) AS source
ON  target.client_id       = source.client_id
AND target.campaign_id     = source.campaign_id
AND target.calculated_date = source.calculated_date
WHEN MATCHED AND target.reprocessed = FALSE THEN
  UPDATE SET
    execution_id          = source.execution_id,
    business_model        = source.business_model,
    model_id              = source.model_id,
    model_version         = source.model_version,
    phi_value             = source.phi_value,
    mas = source.mas, tss = source.tss, fis = source.fis,
    es  = source.es,  rs  = source.rs,  os  = source.os,
    threshold_used        = source.threshold_used,
    miv                   = source.miv,
    miv_normalizado       = source.miv_normalizado,
    priority_score        = source.priority_score,
    phi_classification    = source.phi_classification,
    calculation_status    = source.calculation_status,
    calculation_last_step = source.calculation_last_step,
    mas_janela            = source.mas_janela,
    rs_data_insufficient  = source.rs_data_insufficient,
    os_data_unavailable   = source.os_data_unavailable,
    snapshot_timestamp    = source.snapshot_timestamp
WHEN NOT MATCHED THEN
  INSERT (
    execution_id, client_id, campaign_id, calculated_date,
    business_model, model_id, model_version,
    phi_value, mas, tss, fis, es, rs, os, threshold_used,
    miv, miv_normalizado, priority_score, phi_classification,
    calculation_status, calculation_last_step, mas_janela,
    rs_data_insufficient, os_data_unavailable,
    snapshot_timestamp, reprocessed, reprocessed_at, reprocessed_by
  )
  VALUES (
    source.execution_id, source.client_id, source.campaign_id, source.calculated_date,
    source.business_model, source.model_id, source.model_version,
    source.phi_value, source.mas, source.tss, source.fis,
    source.es, source.rs, source.os, source.threshold_used,
    source.miv, source.miv_normalizado, source.priority_score, source.phi_classification,
    source.calculation_status, source.calculation_last_step, source.mas_janela,
    source.rs_data_insufficient, source.os_data_unavailable,
    source.snapshot_timestamp, source.reprocessed, source.reprocessed_at, source.reprocessed_by
  );"""

new_merge_node = {
    "parameters": {
        "projectId": {
            "__rl": True,
            "value": "project-0e7c58d4-656f-49e8-807",
            "mode": "list",
            "cachedResultName": "phi-production",
            "cachedResultUrl": "https://console.cloud.google.com/bigquery?project=project-0e7c58d4-656f-49e8-807"
        },
        "sqlQuery": MERGE_SQL,
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "Calcular e Persistir PHI Score",
    "type": "n8n-nodes-base.googleBigQuery",
    "typeVersion": 2.1,
    "position": [1200, 2016],
    "alwaysOutputData": True
}

# ════════════════════════════════════════════════════════════════
# 2. Remove obsolete nodes
# ════════════════════════════════════════════════════════════════
REMOVE_NODES = {
    'Calcular PHI Score',
    'Loop Campanhas Cálculo',
    'MERGE phi_score_history',
    'If Calculo OK?',
    'Code Receber 1 Item',
}
wf['nodes'] = [n for n in wf['nodes'] if n['name'] not in REMOVE_NODES]
wf['nodes'].append(new_merge_node)

# Rebuild index after node changes
nm = {n['name']: i for i, n in enumerate(wf['nodes'])}

# ════════════════════════════════════════════════════════════════
# 3. Rebuild connections (clean slate from the connection map)
# ════════════════════════════════════════════════════════════════
# Remove all connections involving removed nodes
old_conns = wf['connections']
new_conns = {}

# Filter out sources that are removed
for src, targets in old_conns.items():
    if src in REMOVE_NODES:
        continue
    new_branches = []
    for branch in targets.get('main', []):
        new_branch = [c for c in branch if c['node'] not in REMOVE_NODES]
        new_branches.append(new_branch)
    new_conns[src] = {'main': new_branches}

wf['connections'] = new_conns

def conn(src, branch, dst, idx=0):
    if src not in wf['connections']:
        wf['connections'][src] = {'main': []}
    while len(wf['connections'][src]['main']) <= branch:
        wf['connections'][src]['main'].append([])
    wf['connections'][src]['main'][branch].append({
        'node': dst, 'type': 'main', 'index': idx
    })

def remove_conn(src, branch, dst):
    if src not in wf['connections']:
        return
    branches = wf['connections'][src].get('main', [])
    if branch < len(branches):
        branches[branch] = [c for c in branches[branch] if c['node'] != dst]

# ── CALCULATION: Log CALCULATION RUNNING → new MERGE node ───────
conn('Log CALCULATION RUNNING', 0, 'Calcular e Persistir PHI Score')

# ── CALCULATION: new MERGE node → Log CALCULATION SUCCESS ────────
conn('Calcular e Persistir PHI Score', 0, 'Log CALCULATION SUCCESS')

# ── Log CALCULATION SUCCESS: remove Log OPERATIONAL RUNNING fan ──
remove_conn('Log CALCULATION SUCCESS', 0, 'Log OPERATIONAL RUNNING')
# Keep only: Log CALCULATION SUCCESS → Get many database Campanhas
# (already present after filtering)

# ── SEQUENTIAL SYNC: Code Clean F3 → Get All Current Scores ──────
# Code Clean F3 previously went to Code Receber 1 Item (removed)
# Now it should go to Get All Current Scores (Sync)
remove_conn('Code Clean Campanhas F3', 0, 'Code Receber 1 Item')
conn('Code Clean Campanhas F3', 0, 'Get All Current Scores (Sync)')

# ── SEQUENTIAL OPERATIONAL: Loop Sync & Close[0] → Log OPERATIONAL RUNNING ──
# Previously: Loop Sync & Close[0] → Buscar Campanhas Alertas
remove_conn('Loop Sync & Close', 0, 'Buscar Campanhas Alertas')
conn('Loop Sync & Close', 0, 'Log OPERATIONAL RUNNING')

# ── Remove orphaned If Calculo OK? fan on Get All Current Scores ──
# Already gone since If Calculo OK? was removed

# ── Log CALCULATION FAILED: connect from Calcular e Persistir (continueOnFail) ──
# Keep Log CALCULATION FAILED orphaned for now — error handling is separate scope

print("✓ Nodes rebuilt:", len(wf['nodes']))
print("✓ Connections rebuilt")

# ════════════════════════════════════════════════════════════════
# 4. Verify critical connection paths
# ════════════════════════════════════════════════════════════════
conns = wf['connections']
assert 'Calcular e Persistir PHI Score' in conns, "MERGE node has no outgoing conns"
assert any(c['node'] == 'Log CALCULATION SUCCESS'
           for c in conns['Calcular e Persistir PHI Score']['main'][0]), "MERGE → Log CALC SUCCESS missing"

assert 'Log CALCULATION RUNNING' in conns
assert any(c['node'] == 'Calcular e Persistir PHI Score'
           for c in conns['Log CALCULATION RUNNING']['main'][0]), "Log RUNNING → MERGE missing"

# Log CALCULATION SUCCESS should NOT connect to Log OPERATIONAL RUNNING
calc_succ_targets = [c['node'] for b in conns['Log CALCULATION SUCCESS']['main'] for c in b]
assert 'Log OPERATIONAL RUNNING' not in calc_succ_targets, "Log CALC SUCCESS still fans to Log OP RUNNING"
assert 'Get many database Campanhas' in calc_succ_targets, "Get many database Campanhas disconnected"
print("✓ Log CALCULATION SUCCESS targets:", calc_succ_targets)

# Code Clean F3 should connect to Get All Current Scores
clean_targets = [c['node'] for b in conns['Code Clean Campanhas F3']['main'] for c in b]
assert 'Get All Current Scores (Sync)' in clean_targets, "Code Clean → Sync missing"
assert 'Code Receber 1 Item' not in clean_targets, "Dead sink still connected"
print("✓ Code Clean Campanhas F3 targets:", clean_targets)

# Loop Sync & Close[0] should go to Log OPERATIONAL RUNNING (not Buscar Campanhas Alertas)
sync_done = [c['node'] for c in conns['Loop Sync & Close']['main'][0]]
assert 'Log OPERATIONAL RUNNING' in sync_done, "Sync done → Log OP RUNNING missing"
assert 'Buscar Campanhas Alertas' not in sync_done, "Sync done still goes direct to Buscar Alertas"
print("✓ Loop Sync & Close[0] targets:", sync_done)

# Buscar Campanhas Alertas should have only ONE upstream (Log OPERATIONAL RUNNING)
incoming_buscar = []
for src, tgts in conns.items():
    for branch in tgts.get('main', []):
        for c in branch:
            if c['node'] == 'Buscar Campanhas Alertas':
                incoming_buscar.append(src)
assert incoming_buscar == ['Log OPERATIONAL RUNNING'], f"Buscar Alertas has multiple upstreams: {incoming_buscar}"
print("✓ Buscar Campanhas Alertas has exactly 1 upstream:", incoming_buscar)

# ════════════════════════════════════════════════════════════════
# 5. Save
# ════════════════════════════════════════════════════════════════
with open(DST, 'w', encoding='utf-8') as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"\n✅  {DST} salvo")
print(f"    Nodes total: {len(wf['nodes'])}")
print(f"    Removidos: {REMOVE_NODES}")
