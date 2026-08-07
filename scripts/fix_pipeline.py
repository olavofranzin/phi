import json, copy

SRC = '/root/.claude/projects/-home-user-phi/229b5aa7-29ad-4f6b-91a3-c9d3765ffe8f/tool-results/toolu_01PVoqrSwNh1bjgQ6vvo6VBF.txt'
DST = '/home/user/phi/phi_pipeline_v2_fixed.json'

with open(SRC) as f:
    data = json.load(f)

wf = copy.deepcopy(data['workflow'])
nm = {n['name']: i for i, n in enumerate(wf['nodes'])}

def node(name):
    return wf['nodes'][nm[name]]

# ══════════════════════════════════════════════════════
# NB-9: Buscar ID de Sucesso Hoje — COALESCE + alwaysOutputData
# ══════════════════════════════════════════════════════
n = node('Buscar ID de Sucesso Hoje')
n['alwaysOutputData'] = True
n['parameters']['sqlQuery'] = (
    "SELECT\n"
    "  COALESCE(\n"
    "    (SELECT execution_id\n"
    "     FROM `phi_prod.workflow_execution_log`\n"
    "     WHERE DATE(started_at) = CURRENT_DATE()\n"
    "       AND status = 'SUCCESS'\n"
    "       AND phase = 'INGESTION'\n"
    "     ORDER BY started_at DESC\n"
    "     LIMIT 1),\n"
    "    CONCAT('FALLBACK-', FORMAT_DATE('%Y%m%d', CURRENT_DATE()), '-', GENERATE_UUID())\n"
    "  ) AS execution_id"
)

print("✓ NB-9: Buscar ID de Sucesso Hoje")

# ══════════════════════════════════════════════════════
# NB-10: Get All Current Scores (Sync) — remove broken JOIN
# ══════════════════════════════════════════════════════
n = node('Get All Current Scores (Sync)')
n['parameters']['sqlQuery'] = (
    'SELECT\n'
    '  phi_value,\n'
    '  phi_classification,\n'
    '  campaign_id,\n'
    '  client_id,\n'
    '  execution_id,\n'
    '  priority_score,\n'
    '  miv,\n'
    '  mas, tss, fis, es, rs, os,\n'
    '  threshold_used,\n'
    '  mas_janela\n'
    'FROM `phi_prod.phi_score_current`\n'
    "WHERE execution_id = '{{ $(\"Buscar ID de Sucesso Hoje\").item.json.execution_id }}'"
)

print("✓ NB-10: Get All Current Scores (Sync)")

# ══════════════════════════════════════════════════════
# NB-10b: Enrich for Sync — lookup notion_page_id from Code Clean
# ══════════════════════════════════════════════════════
n = node('Enrich for Sync')
n['parameters']['jsCode'] = (
    "// Enrich sync data with Notion page info from Code Clean Campanhas F3\n"
    "const campaignId = $json.campaign_id;\n"
    "const allCleaned = $('Code Clean Campanhas F3').all();\n"
    "const match = allCleaned.find(item => item.json.clean_campaing_id === campaignId);\n"
    "\n"
    "return [{\n"
    "  json: {\n"
    "    ...$json,\n"
    "    notion_page_id: match?.json.clean_notion_page_id ?? null,\n"
    "    client_slug:    match?.json.clean_client_slug    ?? null,\n"
    "  }\n"
    "}];\n"
)

print("✓ NB-10b: Enrich for Sync")

# ══════════════════════════════════════════════════════
# NB-2 + NB-12: Calcular PHI Score — real formula + GOOD classification
# ══════════════════════════════════════════════════════
n = node('Calcular PHI Score')
n['parameters']['sqlQuery'] = """\
-- PHI™ v1.3 — Core Score Calculation (v2: real formula, GOOD classification)
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
  WHERE r.execution_id = '{{ $("Buscar ID de Sucesso Hoje").item.json.execution_id }}'
    AND r.ingestion_status = 'SUCCESS'
),
portfolio_cost AS (
  SELECT client_id, SUM(cost_7d) AS total_cost_7d
  FROM campanhas_exec
  GROUP BY client_id
),
calc_components AS (
  SELECT
    c.*, pc.total_cost_7d,
    -- MAS: Metric Achievement Score (CPA-type: goal/actual * 100)
    CASE
      WHEN c.conversions_7d > 0 AND c.primary_metric_goal > 0
        THEN LEAST(100.0, GREATEST(0.0,
          (c.primary_metric_goal / (c.cost_7d / c.conversions_7d)) * 100.0
        ))
      WHEN c.conversions_7d = 0 THEN 0.0
      ELSE 50.0
    END AS mas,
    -- TSS: Trend Stability Score (3d vs 7d CPA deviation)
    CASE
      WHEN c.conversions_7d > 0 AND c.conversions_3d > 0
        THEN LEAST(100.0, GREATEST(0.0,
          100.0 - ABS(
            (c.cost_3d / c.conversions_3d) - (c.cost_7d / c.conversions_7d)
          ) / (c.cost_7d / c.conversions_7d) * 100.0
        ))
      ELSE 50.0
    END AS tss,
    -- FIS: Financial Impact Score (inverse of portfolio cost share)
    CASE
      WHEN pc.total_cost_7d > 0
        THEN GREATEST(0.0, 100.0 - (c.cost_7d / pc.total_cost_7d * 100.0))
      ELSE 50.0
    END AS fis,
    50.0 AS es,
    50.0 AS rs,
    50.0 AS os,
    -- MIV: Monetary Impact Value
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
  phi_value_raw AS phi_value,
  ROUND(mas, 2) AS mas, ROUND(tss, 2) AS tss, ROUND(fis, 2) AS fis,
  ROUND(es, 2) AS es, ROUND(rs, 2) AS rs, ROUND(os, 2) AS os,
  threshold_used,
  ROUND(miv, 2) AS miv,
  ROUND(miv_normalizado, 2) AS miv_normalizado,
  ROUND((100.0 - phi_value_raw) * 0.60 + miv_normalizado * 0.40, 2) AS priority_score,
  CASE
    WHEN phi_value_raw >= 80 THEN 'EXCELLENT'
    WHEN phi_value_raw >= 60 THEN 'GOOD'
    WHEN phi_value_raw >= 40 THEN 'WARNING'
    ELSE 'CRITICAL'
  END AS phi_classification,
  'SUCCESS' AS calculation_status,
  'CORE' AS calculation_last_step,
  '7d' AS mas_janela,
  FALSE AS rs_data_insufficient,
  FALSE AS os_data_unavailable,
  plataforma,
  primary_metric_type,
  conversions_7d
FROM calc_phi;"""

print("✓ NB-2+NB-12: Calcular PHI Score")

# ══════════════════════════════════════════════════════
# NB-12b: Check Auto-Close — 'OK' → 'GOOD'
# ══════════════════════════════════════════════════════
n = node('Check Auto-Close')
for cond in n['parameters']['conditions'].get('conditions', []):
    if cond.get('rightValue') == 'OK':
        cond['rightValue'] = 'GOOD'

print("✓ NB-12b: Check Auto-Close GOOD")

# ══════════════════════════════════════════════════════
# Code Clean Campanhas F3 — add clean_plataforma + clean_notion_id_pro
# ══════════════════════════════════════════════════════
n = node('Code Clean Campanhas F3')
old_code = n['parameters']['jsCode']
# Inject new fields before the closing } of the push call
# Find the insertion point: before "clean_orcamento_diario"
old_snip = "clean_orcamento_diario: props['Orçamento Diário']?.number ?? 0 } });"
new_snip = (
    "clean_orcamento_diario: props['Orçamento Diário']?.number ?? 0,\n"
    "        clean_plataforma: props['Fonte']?.multi_select?.[0]?.name || '',\n"
    "        clean_notion_id_pro: props['Projeto']?.relation?.[0]?.id || ''\n"
    "      } });"
)
n['parameters']['jsCode'] = old_code.replace(old_snip, new_snip)
assert 'clean_plataforma' in n['parameters']['jsCode'], "injection failed"

print("✓ Code Clean Campanhas F3")

# ══════════════════════════════════════════════════════
# Code Enriquecer Campanha — enrich with Notion data from Code Clean F3
# ══════════════════════════════════════════════════════
n = node('Code Enriquecer Campanha')
n['parameters']['jsCode'] = """\
// PHI v1.3 - Code Enriquecer Campanha (v2: enriched with Notion data from Code Clean F3)
const campaignId = $json.campaign_id;

if (!campaignId) {
  return [{ json: { ...$json, _aviso: 'campaign_id ausente' } }];
}

// Look up Notion data for this campaign from Code Clean Campanhas F3
const allCleaned = $('Code Clean Campanhas F3').all();
const cleanMatch = allCleaned.find(item => item.json.clean_campaing_id === campaignId);

return [{
  json: {
    execution_id:        $json.execution_id,
    client_id:           $json.client_id,
    campaign_id:         $json.campaign_id,
    phi_value:           $json.phi_value,
    phi_classification:  $json.phi_classification,
    priority_score:      $json.priority_score,
    miv:                 $json.miv,
    mas:                 $json.mas,
    tss:                 $json.tss,
    fis:                 $json.fis,
    es:                  $json.es,
    rs:                  $json.rs,
    os:                  $json.os,
    threshold_used:      $json.threshold_used,
    mas_janela:          $json.mas_janela,
    primary_metric_type: $json.primary_metric_type,
    business_model:      $json.business_model,
    plataforma:          $json.plataforma,
    conversions_7d:      $json.conversions_7d ?? null,
    // Notion enrichment from Code Clean Campanhas F3
    notion_page_id:  cleanMatch?.json.clean_notion_page_id  ?? null,
    notion_id_camp:  cleanMatch?.json.clean_notion_id_camp  ?? null,
    notion_id_pro:   cleanMatch?.json.clean_notion_id_pro   ?? null,
    client_slug:     cleanMatch?.json.clean_client_slug     ?? $json.client_slug ?? null,
    nome_campanha:   cleanMatch?.json.clean_nome_campanha   ?? null,
    otimizacao_ativa: cleanMatch?.json.clean_periodo_otimizacao_aberto ?? false,
    meta_metrica_mae: cleanMatch?.json.clean_meta_metrica_mae ?? null,
    metrica_mae:      cleanMatch?.json.clean_metrica_mae      ?? null,
    orcamento_diario: cleanMatch?.json.clean_orcamento_diario ?? null,
    plataforma_notion: cleanMatch?.json.clean_plataforma      ?? null,
  }
}];
"""

print("✓ Code Enriquecer Campanha")

# ══════════════════════════════════════════════════════
# NB-5: Get tasks para Escalada — fix dead campaign_id ref
# ══════════════════════════════════════════════════════
n = node('Get tasks para Escalada')
for cond in n['parameters']['filters']['conditions']:
    if cond.get('key') == 'campaign_id|rich_text':
        cond['richTextValue'] = "={{ $('Code Enriquecer Campanha').item.json.campaign_id }}"

print("✓ NB-5: Get tasks para Escalada")

# ══════════════════════════════════════════════════════
# NB-6: Update a database page — add propertiesUi
# ══════════════════════════════════════════════════════
n = node('Update a database page')
n['parameters']['propertiesUi'] = {
    "propertyValues": [
        {
            "key": "Status|status",
            "statusValue": "Em Andamento"
        },
        {
            "key": "Gravidade Detectada|select",
            "selectValue": "={{ $('Code Enriquecer Campanha').item.json.phi_classification === 'CRITICAL' ? 'Crítica' : 'Alta' }}"
        },
        {
            "key": "Data Programada|date",
            "includeTime": False,
            "date": "={{ $today }}",
            "timezone": "America/Sao_Paulo"
        },
        {
            "key": "Observação|rich_text",
            "textContent": "=🔄 Atualizado automaticamente PHI™ — PHI Score: {{ $('Code Enriquecer Campanha').item.json.phi_value }} ({{ $('Code Enriquecer Campanha').item.json.phi_classification }}). Priority Score: {{ $('Code Enriquecer Campanha').item.json.priority_score }}."
        }
    ]
}

print("✓ NB-6: Update a database page")

# ══════════════════════════════════════════════════════
# NB-11: Create a database page — fix broken .properties. refs + add priority_score
# ══════════════════════════════════════════════════════
n = node('Create a database page')
props = n['parameters']['propertiesUi']['propertyValues']
for p in props:
    k = p.get('key', '')
    if k == 'campaign_id|rich_text':
        p['textContent'] = "={{ $('Code Enriquecer Campanha').item.json.campaign_id }}"
    elif k == 'Métrica Afetada|select':
        p['selectValue'] = "={{ ($('Code Enriquecer Campanha').item.json.metrica_mae || '').split(', ')[0] || '' }}"
    elif k == 'Plataforma|multi_select':
        p['multiSelectValue'] = "={{ $('Code Enriquecer Campanha').item.json.plataforma_notion || $('Code Enriquecer Campanha').item.json.plataforma || '' }}"
    elif k == 'Projeto|relation':
        p['relationValue'] = ["={{ $('Code Enriquecer Campanha').item.json.notion_id_pro }}"]

# Add priority_score field
props.append({
    "key": "priority_score|number",
    "numberValue": "={{ $('Code Enriquecer Campanha').item.json.priority_score }}"
})

print("✓ NB-11: Create a database page")

# ══════════════════════════════════════════════════════
# Update otimização ativa — fix dead Buscar Campanha Notion ref
# ══════════════════════════════════════════════════════
n = node('Update otimização ativa')
n['parameters']['pageId'] = {
    "__rl": True,
    "value": "={{ $('Code Enriquecer Campanha').item.json.notion_page_id }}",
    "mode": "id"
}

print("✓ Update otimização ativa")

# ══════════════════════════════════════════════════════
# NB-4: Code Criar Checklist — fix dead Buscar Campanha Notion refs + #7b learning warning
# ══════════════════════════════════════════════════════
n = node('Code Criar Checklist')
n['parameters']['jsCode'] = """\
// ============================================================
// PHI™ v1.3 — Node Code: Montar Lista Checklist SOP
// v5: fixed Buscar Campanha Notion dead refs → Code Clean F3
//     #7b: learning phase warning when conversions_7d < 50
// ============================================================

const campaignItem   = $('Loop Campanhas').item.json;
const classification = campaignItem.phi_classification;
const taskPageId     = $('Create a database page').first().json.id;

// ── Componentes PHI ──────────────────────────────────────────
const mas    = parseFloat(campaignItem.mas   ?? 0);
const tss    = parseFloat(campaignItem.tss   ?? 0);
const fis    = parseFloat(campaignItem.fis   ?? 0);
const es     = parseFloat(campaignItem.es    ?? 50);
const miv    = parseFloat(campaignItem.miv   ?? 0);
const metric = campaignItem.primary_metric_type ?? 'CPA';
const model  = campaignItem.business_model ?? 'LEAD_GEN';

// ── Gerar Hipótese ────────────────────────────────────────────
const gerarHipotese = (mas, tss, fis, es, miv, metric) => {
  const linhas = [];

  if (mas < 20)       linhas.push(`${metric} muito acima da meta (MAS=${mas.toFixed(0)}). Diagnóstico urgente necessário.`);
  else if (mas < 40)  linhas.push(`${metric} acima da meta (MAS=${mas.toFixed(0)}). Revisar estrutura e segmentação.`);

  if (tss < 30)       linhas.push(`Tendência instável (TSS=${tss.toFixed(0)}). CPA 3d diverge da média 7d — verificar criativos e lance.`);
  else if (tss < 50)  linhas.push(`Tendência em deterioração (TSS=${tss.toFixed(0)}). Monitorar nos próximos dias.`);

  if (fis < 30)  linhas.push(`Alto impacto financeiro (FIS=${fis.toFixed(0)}). Campanha representa parcela significativa do investimento — priorizar resolução.`);
  if (es  < 30)  linhas.push(`Alta variabilidade de eficiência diária (ES=${es.toFixed(0)}). Investigar dias sem conversão e spend spikes.`);
  if (miv > 0)   linhas.push(`Impacto financeiro estimado: R$ ${miv.toFixed(2)} acima do esperado no período.`);

  const acoes = [];
  if (mas < 40)  acoes.push('1. Validar eventos de conversão e rastreamento');
  if (tss < 40)  acoes.push('2. Analisar criativos com queda de CTR ou aumento de frequência');
  if (mas < 40)  acoes.push('3. Revisar segmentação e qualidade do público');
  if (fis < 30)  acoes.push('4. Avaliar redistribuição de orçamento entre campanhas');
  if (es  < 30)  acoes.push('5. Identificar e remover dias anômalos da análise');
  acoes.push('Registrar hipótese, ação e resultado esperado no Log de Otimizações.');

  return [...linhas, '', 'Sequência SOP recomendada:', ...acoes].join('\\n');
};

// ── #7b: Aviso de fase de aprendizado ─────────────────────────
const conversions7d = parseFloat(campaignItem.conversions_7d ?? -1);
const warningAprendizado = (conversions7d >= 0 && conversions7d < 50)
  ? `⚠️ Fase de aprendizado: apenas ${conversions7d.toFixed(0)} conversões nos últimos 7 dias. Dados insuficientes para análise estatística robusta. Evitar ajustes agressivos até atingir volume mínimo de 50 conversões.\\n\\n`
  : '';

const hipotese = warningAprendizado + gerarHipotese(mas, tss, fis, es, miv, metric);

// ── Notion IDs via Code Clean Campanhas F3 ────────────────────
const allCleaned = $('Code Clean Campanhas F3').all();
const cleanMatch = allCleaned.find(item => item.json.clean_campaing_id === campaignItem.campaign_id);

const notionIdCamp = cleanMatch?.json.clean_notion_page_id ?? null;
const notionIdPro  = cleanMatch?.json.clean_notion_id_pro  ?? null;
const clientSlug   = cleanMatch?.json.clean_client_slug    ?? campaignItem.client_slug ?? '';
const notionIdCliente = '19fb65e5-c72b-81dd-b7a0-f295fe304d60';

// ── Checklists base ───────────────────────────────────────────
const base_3_1 = [
  'Tipo de campanha validado',
  'Métrica-mãe comparada com meta',
  'Volume mínimo de dados disponível',
  'CTR analisado',
  'CPM ou CPC analisado',
  'Conversão da página analisada',
  'Congruência anúncio → página validada',
  'Público segmentado corretamente',
  'Criativos saturados identificados',
  'Causa provável documentada',
];
const base_3_2 = [
  'Ajuste de criativos',
  'Revisão de copy',
  'Ajuste de público',
  'Revisão da página de destino',
  'Revisão da estratégia de lance',
  'Revisão da estrutura de campanha',
  'Ajuste de orçamento (última etapa)',
  'Registro das alterações',
];
const base_3_3 = [
  'Alterações realizadas registradas',
  'Responsável registrado',
  'Data registrada',
  'Métrica que motivou a decisão',
  'Hipótese documentada',
  'Resultado esperado definido',
  'Classificação da alteração (teste, correção, escala)',
  'Registro no log de otimização',
];

// ── Adicionais por plataforma e modelo ───────────────────────
const isGoogle = (campaignItem.plataforma ?? '').includes('GOOGLE');
const isMeta   = (campaignItem.plataforma ?? '').includes('META');
const isEcom   = model.includes('ECOMMERCE') || model.includes('E_COMMERCE') || model.includes('E-COMMERCE');
const isLead   = model.includes('LEAD') || model.includes('VAREJO');
const isInfo   = model.includes('INFO');

let itens_3_1 = [...base_3_1];
if (isGoogle) itens_3_1.push('Termos de busca analisados (Google Ads)', 'Índice de qualidade analisado (Google)');
if (isMeta)   itens_3_1.push('Frequência (Meta Ads) analisada');
if (isEcom)   itens_3_1.push('Taxa de abandono de carrinho analisada', 'Valor médio de pedido comparado com meta de ROAS');
if (isLead)   itens_3_1.push('Qualidade dos leads verificada (taxa de conversão pós-lead)');
if (isInfo)   itens_3_1.push('Taxa de conversão da página de vendas analisada', 'Qualidade do tráfego (tempo na página, scroll depth)');

let itens_3_2 = [...base_3_2];
if (isGoogle) itens_3_2.push('Negativação de palavras irrelevantes', 'Ajuste de intenção de busca');
if (isEcom)   itens_3_2.push('Revisão do feed de produtos (título, imagem, preço)', 'Verificação de estoque e disponibilidade');
if (isLead)   itens_3_2.push('Revisão do formulário de captura', 'Ajuste da oferta de isca digital');

// ── Montar lista final ────────────────────────────────────────
const toItem = (cat) => (nome) => ({ nome, categoria: cat });
const itens = [
  ...itens_3_1.map(toItem('Identificação de Causa Raiz')),
  ...(classification === 'CRITICAL' ? itens_3_2.map(toItem('Correção de Problema')) : []),
  ...base_3_3.map(toItem('Documentação da Decisão')),
];

return itens.map(entry => ({
  json: {
    task_page_id:      taskPageId,
    notion_id_camp:    notionIdCamp,
    notion_id_pro:     notionIdPro,
    notion_id_cliente: notionIdCliente,
    client_slug:       clientSlug,
    nome:              entry.nome,
    categoria:         entry.categoria,
    subcategoria:      'Otimização de Campanha',
    concluido:         false,
    hipotese:          hipotese,
  }
}));
"""

print("✓ NB-4: Code Criar Checklist")

# ══════════════════════════════════════════════════════
# Create a database page chklist — fix dead title ref
# ══════════════════════════════════════════════════════
n = node('Create a database page chklist')
n['parameters']['title'] = (
    "=[{{ $('Code Criar Checklist').item.json.client_slug }}] "
    "{{ $('Code Criar Checklist').item.json.nome }} - "
    "{{ new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) }}"
)

print("✓ Create a database page chklist title")

# ══════════════════════════════════════════════════════
# #4: Sync Scores to Notion — add Score Diário, Status Geral, phi_ultima_execucao
# ══════════════════════════════════════════════════════
n = node('Sync Scores to Notion')
n['parameters']['propertiesUi'] = {
    "propertyValues": [
        {
            "key": "phi_score",
            "numberValue": "={{ $json.phi_value }}"
        },
        {
            "key": "phi_classificacao",
            "selectValue": "={{ $json.phi_classification }}"
        },
        {
            "key": "Score Diário (0-100)|number",
            "numberValue": "={{ $json.phi_value }}"
        },
        {
            "key": "Status Geral da Campanha|select",
            "selectValue": "={{ $json.phi_classification }}"
        },
        {
            "key": "phi_ultima_execucao|date",
            "includeTime": False,
            "date": "={{ $today }}",
            "timezone": "America/Sao_Paulo"
        }
    ]
}

print("✓ #4: Sync Scores to Notion")

# ══════════════════════════════════════════════════════
# Save
# ══════════════════════════════════════════════════════
with open(DST, 'w', encoding='utf-8') as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"\n✅ Saved → {DST}")
