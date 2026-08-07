import { workflow, node, trigger, splitInBatches, nextBatch } from '@n8n/workflow-sdk';

// ─── 1. SCHEDULE TRIGGER ──────────────────────────────────────────────────────
const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Schedule — Segunda 02:00',
    parameters: {
      rule: {
        interval: [{
          field: 'weeks',
          triggerAtDay: [1],
          triggerAtHour: 2,
          triggerAtMinute: 0
        }]
      }
    },
    position: [240, 300]
  },
  output: [{}]
});

// ─── 2. CONFIG ────────────────────────────────────────────────────────────────
const configNode = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Config',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'a1', name: 'developer_token', value: 'o0hGRr2vcX3jGF6aI3a_0w', type: 'string' },
          { id: 'a2', name: 'login_customer_id', value: '7595536100', type: 'string' },
          { id: 'a3', name: 'date_from', value: "={{ $today.minus({days: 7}).toFormat('yyyy-MM-dd') }}", type: 'string' },
          { id: 'a4', name: 'date_to', value: "={{ $today.minus({days: 1}).toFormat('yyyy-MM-dd') }}", type: 'string' },
          { id: 'a5', name: 'month_start', value: "={{ $today.startOf('month').toFormat('yyyy-MM-dd') }}", type: 'string' }
        ]
      }
    },
    position: [460, 300]
  },
  output: [{ developer_token: 'o0hGRr2vcX3jGF6aI3a_0w', login_customer_id: '7595536100', date_from: '2025-01-06', date_to: '2025-01-12', month_start: '2025-01-01' }]
});

// ─── 3. BUSCAR CAMPANHAS (BigQuery) ───────────────────────────────────────────
const buscarCampanhas = node({
  type: 'n8n-nodes-base.googleBigQuery',
  version: 2.1,
  config: {
    name: 'Buscar Campanhas',
    parameters: {
      operation: 'executeQuery',
      projectId: { __rl: true, mode: 'id', value: 'phi-prod' },
      sqlQuery: "SELECT DISTINCT\n  c.id AS client_id,\n  CAST(c.google_ads_customer_id AS STRING) AS customer_id,\n  CAST(r.campaign_id AS STRING) AS campaign_id,\n  r.campaign_name\nFROM `phi_prod.clients` c\nJOIN `phi_prod.raw_campaign_data` r\n  ON CAST(c.google_ads_customer_id AS STRING) = CAST(r.customer_id AS STRING)\nWHERE c.ativo = TRUE\n  AND r.data >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)\nORDER BY c.id, r.campaign_id",
      options: { returnAsNumbers: true }
    },
    credentials: { googleBigQueryOAuth2Api: { id: '1', name: 'Google BigQuery' } },
    position: [680, 300]
  },
  output: [{ client_id: 'kil', customer_id: '1234567890', campaign_id: '111', campaign_name: 'Campanha Teste KIL' }]
});

// ─── 4. LOOP CAMPANHAS ────────────────────────────────────────────────────────
const loopCampanhas = splitInBatches({
  version: 3,
  config: {
    name: 'Loop Campanhas',
    parameters: { batchSize: 1 },
    position: [900, 300]
  }
});

// ─── 5. CODE PREP (monta queries GAQL) ───────────────────────────────────────
const codePrep = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code Prep',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const c = $('Loop Campanhas').first().json;\nconst cfg = $('Config').first().json;\nconst cid = c.campaign_id;\nconst df = cfg.date_from;\nconst dt = cfg.date_to;\nconst ms = cfg.month_start;\nconst yd = new Date(Date.now() - 86400000).toISOString().slice(0, 10);\nreturn [{ json: {\n  customer_id: c.customer_id,\n  campaign_id: cid,\n  campaign_name: c.campaign_name,\n  client_id: c.client_id,\n  query_grupos: \"SELECT ad_group.id, ad_group.name, campaign.id, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion FROM ad_group WHERE campaign.id = '\" + cid + \"' AND segments.date BETWEEN '\" + df + \"' AND '\" + dt + \"' AND ad_group.status = 'ENABLED' ORDER BY metrics.cost_micros DESC LIMIT 50\",\n  query_termos: \"SELECT search_term_view.search_term, segments.keyword.match_type, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion FROM search_term_view WHERE campaign.id = '\" + cid + \"' AND segments.date BETWEEN '\" + df + \"' AND '\" + dt + \"' ORDER BY metrics.cost_micros DESC LIMIT 20\",\n  query_schedule: \"SELECT segments.day_of_week, segments.hour, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = '\" + cid + \"' AND segments.date BETWEEN '\" + df + \"' AND '\" + dt + \"' ORDER BY segments.day_of_week, segments.hour\",\n  query_publicos: \"SELECT ad_group_audience_view.resource_name, user_list.name, user_list.type, ad_group_criterion.bid_modifier, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM ad_group_audience_view WHERE campaign.id = '\" + cid + \"' AND segments.date BETWEEN '\" + df + \"' AND '\" + dt + \"' ORDER BY metrics.cost_micros DESC LIMIT 30\",\n  query_pacing: \"SELECT campaign.id, campaign.name, campaign_budget.amount_micros, metrics.cost_micros FROM campaign WHERE campaign.id = '\" + cid + \"' AND segments.date BETWEEN '\" + ms + \"' AND '\" + yd + \"'\"\n} }];"
    },
    position: [1120, 300]
  },
  output: [{ customer_id: '1234567890', campaign_id: '111', client_id: 'kil', query_grupos: 'SELECT ...' }]
});

// ─── HTTP helper: headers comuns ─────────────────────────────────────────────
const commonHeaders = {
  sendHeaders: true,
  specifyHeaders: 'keypair',
  headerParameters: {
    parameters: [
      { name: 'developer-token', value: "={{ $('Config').first().json.developer_token }}" },
      { name: 'login-customer-id', value: "={{ $('Config').first().json.login_customer_id }}" }
    ]
  }
};

// ─── 6. HTTP GRUPOS ───────────────────────────────────────────────────────────
const httpGrupos = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP Grupos',
    parameters: {
      method: 'POST',
      url: "={{ 'https://googleads.googleapis.com/v23/customers/' + $('Code Prep').first().json.customer_id + '/googleAds:search' }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleAdsOAuth2Api',
      ...commonHeaders,
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ query: $('Code Prep').first().json.query_grupos }) }}"
    },
    credentials: { googleAdsOAuth2Api: { id: '1', name: 'Google Ads' } },
    position: [1340, 300]
  },
  output: [{ results: [] }]
});

// ─── 7. HTTP TERMOS ───────────────────────────────────────────────────────────
const httpTermos = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP Termos',
    parameters: {
      method: 'POST',
      url: "={{ 'https://googleads.googleapis.com/v23/customers/' + $('Code Prep').first().json.customer_id + '/googleAds:search' }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleAdsOAuth2Api',
      ...commonHeaders,
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ query: $('Code Prep').first().json.query_termos }) }}"
    },
    credentials: { googleAdsOAuth2Api: { id: '1', name: 'Google Ads' } },
    position: [1560, 300]
  },
  output: [{ results: [] }]
});

// ─── 8. HTTP SCHEDULE ─────────────────────────────────────────────────────────
const httpSchedule = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP Schedule',
    parameters: {
      method: 'POST',
      url: "={{ 'https://googleads.googleapis.com/v23/customers/' + $('Code Prep').first().json.customer_id + '/googleAds:search' }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleAdsOAuth2Api',
      ...commonHeaders,
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ query: $('Code Prep').first().json.query_schedule }) }}"
    },
    credentials: { googleAdsOAuth2Api: { id: '1', name: 'Google Ads' } },
    position: [1780, 300]
  },
  output: [{ results: [] }]
});

// ─── 9. HTTP PUBLICOS ─────────────────────────────────────────────────────────
const httpPublicos = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP Publicos',
    parameters: {
      method: 'POST',
      url: "={{ 'https://googleads.googleapis.com/v23/customers/' + $('Code Prep').first().json.customer_id + '/googleAds:search' }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleAdsOAuth2Api',
      ...commonHeaders,
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ query: $('Code Prep').first().json.query_publicos }) }}"
    },
    credentials: { googleAdsOAuth2Api: { id: '1', name: 'Google Ads' } },
    position: [2000, 300]
  },
  output: [{ results: [] }]
});

// ─── 10. HTTP PACING ──────────────────────────────────────────────────────────
const httpPacing = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP Pacing',
    parameters: {
      method: 'POST',
      url: "={{ 'https://googleads.googleapis.com/v23/customers/' + $('Code Prep').first().json.customer_id + '/googleAds:search' }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleAdsOAuth2Api',
      ...commonHeaders,
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ query: $('Code Prep').first().json.query_pacing }) }}"
    },
    credentials: { googleAdsOAuth2Api: { id: '1', name: 'Google Ads' } },
    position: [2220, 300]
  },
  output: [{ results: [] }]
});

// ─── 11. CODE MERGER ──────────────────────────────────────────────────────────
const codeMerger = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code Merger',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const campanha = $('Code Prep').first().json;\nconst config = $('Config').first().json;\nconst gruposRaw = ($('HTTP Grupos').first().json.results || []);\nconst termosRaw = ($('HTTP Termos').first().json.results || []);\nconst scheduleRaw = ($('HTTP Schedule').first().json.results || []);\nconst publicosRaw = ($('HTTP Publicos').first().json.results || []);\nconst pacingRaw = ($('HTTP Pacing').first().json.results || []);\nconst adGroups = gruposRaw.map(r => ({ ad_group_id: r.adGroup?.id, ad_group_name: r.adGroup?.name, impressions: parseInt(r.metrics?.impressions || 0), clicks: parseInt(r.metrics?.clicks || 0), ctr: parseFloat(r.metrics?.ctr || 0), avg_cpc: parseInt(r.metrics?.averageCpc || 0) / 1000000, cost: parseInt(r.metrics?.costMicros || 0) / 1000000, conversions: parseFloat(r.metrics?.conversions || 0), cpa: parseInt(r.metrics?.costPerConversion || 0) / 1000000 }));\nconst searchTerms = termosRaw.map(r => ({ search_term: r.searchTermView?.searchTerm, match_type: r.segments?.keyword?.matchType, impressions: parseInt(r.metrics?.impressions || 0), clicks: parseInt(r.metrics?.clicks || 0), ctr: parseFloat(r.metrics?.ctr || 0), avg_cpc: parseInt(r.metrics?.averageCpc || 0) / 1000000, cost: parseInt(r.metrics?.costMicros || 0) / 1000000, conversions: parseFloat(r.metrics?.conversions || 0), cpa: parseInt(r.metrics?.costPerConversion || 0) / 1000000 }));\nconst scheduleHeatmap = scheduleRaw.map(r => ({ day_of_week: r.segments?.dayOfWeek, hour_of_day: parseInt(r.segments?.hour || 0), impressions: parseInt(r.metrics?.impressions || 0), clicks: parseInt(r.metrics?.clicks || 0), cost: parseInt(r.metrics?.costMicros || 0) / 1000000, conversions: parseFloat(r.metrics?.conversions || 0) }));\nconst audiences = publicosRaw.map(r => ({ audience_name: r.userList?.name, audience_type: r.userList?.type, bid_modifier: parseFloat(r.adGroupCriterion?.bidModifier || 0), impressions: parseInt(r.metrics?.impressions || 0), clicks: parseInt(r.metrics?.clicks || 0), cost: parseInt(r.metrics?.costMicros || 0) / 1000000, conversions: parseFloat(r.metrics?.conversions || 0) }));\nconst pacingItem = pacingRaw[0] || {};\nconst budgetTotal = parseInt(pacingItem.campaignBudget?.amountMicros || 0) / 1000000;\nconst budgetConsumed = pacingRaw.reduce((s, r) => s + parseInt(r.metrics?.costMicros || 0), 0) / 1000000;\nconst today = new Date();\nconst daysElapsed = Math.max(1, today.getDate() - 1);\nconst daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();\nconst daysRemaining = daysInMonth - daysElapsed;\nconst budgetRemaining = budgetTotal - budgetConsumed;\nconst dailyAvgActual = budgetConsumed / daysElapsed;\nconst dailyAvgRequired = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;\nconst pacingRatio = dailyAvgRequired > 0 ? dailyAvgActual / dailyAvgRequired : 1;\nlet pacingStatus = 'ON_TRACK';\nif (pacingRatio > 1.15) pacingStatus = 'AHEAD';\nelse if (pacingRatio < 0.65) pacingStatus = 'CRITICAL';\nelse if (pacingRatio < 0.85) pacingStatus = 'BEHIND';\nconst crypto = require('crypto');\nconst recordId = crypto.createHash('sha256').update(campanha.client_id + campanha.campaign_id + config.date_from).digest('hex');\nreturn [{ json: { id: recordId, client_id: campanha.client_id, campaign_id: campanha.campaign_id, campaign_name: campanha.campaign_name, customer_id: campanha.customer_id, semana_inicio: config.date_from, semana_fim: config.date_to, ad_groups: JSON.stringify(adGroups), search_terms: JSON.stringify(searchTerms), schedule_heatmap: JSON.stringify(scheduleHeatmap), audiences: JSON.stringify(audiences), budget_total: budgetTotal, budget_consumed: budgetConsumed, budget_remaining: budgetRemaining, days_elapsed: daysElapsed, days_remaining: daysRemaining, daily_avg_actual: dailyAvgActual, daily_avg_required: dailyAvgRequired, pacing_ratio: pacingRatio, pacing_status: pacingStatus, has_errors: false } }];"
    },
    position: [2440, 300]
  },
  output: [{ id: 'abc123', client_id: 'kil', pacing_status: 'ON_TRACK', semana_inicio: '2025-01-06' }]
});

// ─── 12. BIGQUERY INSERT ──────────────────────────────────────────────────────
const bqInsert = node({
  type: 'n8n-nodes-base.googleBigQuery',
  version: 2.1,
  config: {
    name: 'BQ Insert',
    parameters: {
      operation: 'insert',
      projectId: { __rl: true, mode: 'id', value: 'phi-prod' },
      datasetId: { __rl: true, mode: 'id', value: 'phi_prod' },
      tableId: { __rl: true, mode: 'id', value: 'google_ads_insights' },
      dataMode: 'autoMap',
      options: { ignoreUnknownValues: true }
    },
    credentials: { googleBigQueryOAuth2Api: { id: '1', name: 'Google BigQuery' } },
    position: [2660, 300]
  },
  output: [{}]
});

// ─── 13. CODE MONTAR NOTION ───────────────────────────────────────────────────
const codeMontarNotion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Code Montar Notion',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const d = $('Code Merger').first().json;\nconst adGroups = JSON.parse(d.ad_groups || '[]');\nconst searchTerms = JSON.parse(d.search_terms || '[]');\nconst audiences = JSON.parse(d.audiences || '[]');\nconst fmt = n => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(n || 0);\nconst fmtPct = n => ((n || 0) * 100).toFixed(2) + '%';\nconst fmtN = n => (n || 0).toFixed(2);\nconst pacingColors = {AHEAD:'🟡', ON_TRACK:'🟢', BEHIND:'🟠', CRITICAL:'🔴'};\nconst emoji = pacingColors[d.pacing_status] || '⚪';\nlet agTable = '| Grupo | Impr | Cliques | CTR | CPC | Custo | Conv | CPA |\\n|-------|------|---------|-----|-----|-------|------|-----|\\n';\nadGroups.slice(0, 10).forEach(g => { agTable += '| ' + (g.ad_group_name||'—') + ' | ' + g.impressions + ' | ' + g.clicks + ' | ' + fmtPct(g.ctr) + ' | ' + fmt(g.avg_cpc) + ' | ' + fmt(g.cost) + ' | ' + fmtN(g.conversions) + ' | ' + fmt(g.cpa) + ' |\\n'; });\nlet stTable = '| Termo | Tipo | Impr | Cliques | CTR | Custo | Conv |\\n|-------|------|------|---------|-----|-------|------|\\n';\nsearchTerms.slice(0, 10).forEach(t => { stTable += '| ' + (t.search_term||'—') + ' | ' + (t.match_type||'—') + ' | ' + t.impressions + ' | ' + t.clicks + ' | ' + fmtPct(t.ctr) + ' | ' + fmt(t.cost) + ' | ' + fmtN(t.conversions) + ' |\\n'; });\nlet audTable = '| Público | Tipo | Impr | Custo | Conv | Modif |\\n|---------|------|------|-------|------|-------|\\n';\naudiences.slice(0, 10).forEach(a => { audTable += '| ' + (a.audience_name||'—') + ' | ' + (a.audience_type||'—') + ' | ' + a.impressions + ' | ' + fmt(a.cost) + ' | ' + fmtN(a.conversions) + ' | ' + (a.bid_modifier||0) + 'x |\\n'; });\nconst pctBudget = d.budget_total > 0 ? ((d.budget_consumed / d.budget_total) * 100).toFixed(1) + '%' : '—';\nconst title = 'Semana ' + d.semana_inicio.slice(5,7) + '/' + d.semana_inicio.slice(8) + ' – ' + d.campaign_name;\nconst body = '## 📅 Semana de ' + d.semana_inicio + ' a ' + d.semana_fim + '\\n\\n' + '### 💰 Pacing de Investimento\\n' + emoji + ' **Status: ' + d.pacing_status + '**\\n' + '- Orçamento mensal: ' + fmt(d.budget_total) + '\\n' + '- Gasto até agora: ' + fmt(d.budget_consumed) + ' (' + pctBudget + ')\\n' + '- Ritmo atual: ' + fmt(d.daily_avg_actual) + '/dia | Necessário: ' + fmt(d.daily_avg_required) + '/dia\\n\\n' + '### 🎯 Grupos de Anúncios\\n' + agTable + '\\n' + '### 🔍 Termos de Busca (Top 10)\\n' + stTable + '\\n' + '### 👥 Públicos\\n' + audTable + '\\n' + '---\\n📌 _PHI Analytics — ' + new Date().toISOString() + '_';\nreturn [{ json: {...d, notion_title: title, notion_body: body, pacing_emoji: emoji} }];"
    },
    position: [2880, 300]
  },
  output: [{ notion_title: 'Semana 01/06 – KIL Campanha', notion_body: '...' }]
});

// ─── 14. HTTP NOTION UPSERT ───────────────────────────────────────────────────
const httpNotionUpsert = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'HTTP Notion Upsert',
    parameters: {
      method: 'POST',
      url: 'https://api.notion.com/v1/pages',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: "={{ 'Bearer ' + $vars.NOTION_TOKEN }}" },
          { name: 'Notion-Version', value: '2022-06-28' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ parent: { database_id: $vars.NOTION_DB_INSIGHTS }, properties: { Nome: { title: [{ text: { content: $json.notion_title } }] }, Pacing: { select: { name: $json.pacing_status } }, Investido: { number: $json.budget_consumed }, 'Orçamento': { number: $json.budget_total } }, children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: $json.notion_body.slice(0, 2000) } }] } }] }) }}"
    },
    position: [3100, 300]
  },
  output: [{}]
});

// ─── 15. CONCLUIDO ────────────────────────────────────────────────────────────
const concluido = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Concluído',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'b1', name: 'status', value: 'workflow_completed', type: 'string' }
        ]
      }
    },
    position: [1120, 500]
  },
  output: [{ status: 'workflow_completed' }]
});

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────
export default workflow('google-ads-insights-semanal', 'Google Ads Insights Semanal')
  .add(scheduleTrigger)
  .to(configNode)
  .to(buscarCampanhas)
  .to(loopCampanhas
    .onDone(concluido)
    .onEachBatch(
      codePrep
        .to(httpGrupos)
        .to(httpTermos)
        .to(httpSchedule)
        .to(httpPublicos)
        .to(httpPacing)
        .to(codeMerger)
        .to(bqInsert)
        .to(codeMontarNotion)
        .to(httpNotionUpsert)
        .to(nextBatch(loopCampanhas))
    )
  );
