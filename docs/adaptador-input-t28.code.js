/**
 * ADAPTADOR T28  —  monta o "input contract" para o Normalizador (docs/normalizador-t28.code.js).
 * Workflow: Unified marketing reports (4sdG2UKMCBuFq8xn)  |  Code node, "Run Once for All Items".
 * Posição: roda 1x por CAMPANHA (dentro do Loop), DEPOIS das chamadas GAQL/Meta e ANTES do Normalizador.
 *
 * Lê os nós existentes via $('...') e produz UM item = objeto contract { ctx, windows, google, meta, ga4 }.
 *
 * RESOLVIDO (vs. versão inicial):
 *  - margem_contribuicao / ticket_ltv: lidos de "Get database clientes" (campos novos na base Clientes).
 *  - notion_id/id_padrao da Meta: mapas próprios por adset_id_meta / ad_id_meta.
 *  - ga4: normalizado (orgânico + pago) somando linhas do runReport.
 * TODO restante:
 *  - confirmar camelCase dos campos GAQL na 1ª execução real (fallback snake_case já incluso).
 *  - GA4 não consulta receita => ga4.*.revenue = null.
 */

// ---------- helpers ----------
const N = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const g = (o, ...keys) => { for (const k of keys) { if (o && o[k] !== undefined && o[k] !== null) return o[k]; } return undefined; };

function gMetrics(r) {
  const m = r.metrics || {};
  return {
    impressions: N(g(m, 'impressions')),
    clicks: N(g(m, 'clicks')),
    cost_micros: N(g(m, 'costMicros', 'cost_micros')),
    conversions: N(g(m, 'conversions')),
    conversions_value: N(g(m, 'conversionsValue', 'conversions_value')),
    sis: N(g(m, 'searchImpressionShare', 'search_impression_share')),
    blis: N(g(m, 'searchBudgetLostImpressionShare', 'search_budget_lost_impression_share')),
  };
}

function accGoogle(acc, m) {
  acc.impressions += m.impressions; acc.clicks += m.clicks;
  acc.cost_micros += m.cost_micros; acc.conversions += m.conversions;
  acc.conversions_value += m.conversions_value;
  acc._sisNum += m.sis * m.impressions; acc._blisNum += m.blis * m.impressions;
  return acc;
}
function freshGoogle() {
  return { impressions: 0, clicks: 0, cost_micros: 0, conversions: 0, conversions_value: 0, _sisNum: 0, _blisNum: 0 };
}
function finalizeGoogle(acc, ident) {
  const imp = acc.impressions || 0;
  return {
    ...ident,
    impressions: acc.impressions, clicks: acc.clicks, cost_micros: acc.cost_micros,
    conversions: acc.conversions, conversions_value: acc.conversions_value,
    search_impression_share: imp > 0 ? acc._sisNum / imp : null,
    budget_lost_is: imp > 0 ? acc._blisNum / imp : null,
  };
}

// Notion property pickers
const pStr = (p) => p ? (p.formula?.string ?? p.rich_text?.[0]?.text?.content ?? p.rich_text?.[0]?.plain_text ?? p.title?.[0]?.plain_text ?? null) : null;
const pNum = (p) => p ? (p.number ?? p.formula?.number ?? null) : null;
const pSel = (p) => p ? (p.select?.name ?? p.multi_select?.[0]?.name ?? null) : null;
const pUid = (p) => p && p.unique_id ? `${p.unique_id.prefix ?? ''}-${p.unique_id.number ?? ''}` : null;

// mapa <id> -> { notion_id, id_padrao } a partir de itens Notion (idProp pode ser google ou meta)
function buildMap(items, idProp, notionIdProp, padraoProp) {
  const map = {};
  for (const it of (items || [])) {
    const props = it.json?.properties || {};
    const id = pNum(props[idProp]);
    if (id === null || id === undefined) continue;
    map[String(id)] = { notion_id: pStr(props[notionIdProp]), id_padrao: pUid(props[padraoProp]) };
  }
  return map;
}

// GA4 runReport -> totais normalizados
function ga4Norm(resp) {
  const headers = (resp && resp.metricHeaders) ? resp.metricHeaders.map((h) => h.name) : [];
  const idx = (name) => headers.indexOf(name);
  const rows = (resp && resp.rows) ? resp.rows : [];
  const iS = idx('sessions'), iE = idx('engagedSessions'), iU = idx('totalUsers'), iK = idx('keyEvents');
  let sessions = 0, engaged = 0, users = 0, keyEvents = 0;
  for (const r of rows) {
    const mv = r.metricValues || [];
    if (iS >= 0) sessions += N(mv[iS]?.value);
    if (iE >= 0) engaged += N(mv[iE]?.value);
    if (iU >= 0) users += N(mv[iU]?.value);
    if (iK >= 0) keyEvents += N(mv[iK]?.value);
  }
  return {
    sessions, users, conversions: keyEvents,
    engagement_rate: sessions > 0 ? Number((engaged / sessions).toFixed(4)) : null,
    revenue: null, // GA4 não consulta receita nesta query
  };
}

// Meta: extrai conversões/receita de actions/action_values
const META_PURCHASE = ['offsite_conversion.fb_pixel_purchase', 'purchase', 'omni_purchase'];
const META_LEAD = ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped'];
function metaSum(arr, types) {
  const map = Object.fromEntries((arr || []).map((e) => [e.action_type, N(e.value)]));
  for (const t of types) if (map[t]) return map[t];
  return 0;
}

// ---------- construção do contract (pura, testável) ----------
function buildContract(R) {
  const { campProps, cliProps, ids, windows, gCamp, gAdset, gAd, meta, adsetMap, adMap, adsetMapMeta, adMapMeta, ga4 } = R;

  // contexto de negócio: economia (Clientes) + objetivo/modelo/métrica (Campanhas)
  const ctx = {
    client_id: ids.id_client ?? null,
    conta: pStr(cliProps['Nome do Cliente']) ?? pStr(campProps['client_slug']) ?? ids.id_client ?? null,
    objetivo: pSel(campProps['Objetivo']),
    modelo_negocio: pSel(campProps['Modelo de Negócio']),
    metrica_mae: pSel(campProps['Métrica-Mãe']),
    margem_contribuicao: pNum(cliProps['Margem de Contribuição']),
    ticket_ltv: pNum(cliProps['Ticket/LTV']),
    meta_cpa: pNum(campProps['CPA Alvo']),
    meta_roas: null, // TODO opcional: derivar de margem (1/margem) se quiser break-even
    custos_aquisicao_extra: null,
    mudancas_recentes: { verba: null, criativo: null, oferta: null, pagina: null },
  };

  // ---- Google: agrega por entidade em cada nível ----
  const campAgg = {};
  for (const it of gCamp) { const r = it.json; const id = String(r.campaign?.id ?? ids.id_google_campanha);
    campAgg[id] = accGoogle(campAgg[id] || freshGoogle(), gMetrics(r)); campAgg[id]._name = r.campaign?.name; }
  const googleCampaigns = Object.entries(campAgg).map(([id, acc]) => finalizeGoogle(acc, {
    id, name: acc._name ?? null, notion_id: ids.notion_id_camp ?? null, id_padrao: null,
  }));

  const adsetAgg = {};
  for (const it of gAdset) { const r = it.json; const id = String(r.adGroup?.id ?? '');
    if (!id) continue; adsetAgg[id] = accGoogle(adsetAgg[id] || freshGoogle(), gMetrics(r)); adsetAgg[id]._name = r.adGroup?.name; }
  const googleAdsets = Object.entries(adsetAgg).map(([id, acc]) => finalizeGoogle(acc, {
    id, name: acc._name ?? null, notion_id: adsetMap[id]?.notion_id ?? null, id_padrao: adsetMap[id]?.id_padrao ?? null,
  }));

  const adAgg = {};
  for (const it of gAd) { const r = it.json; const id = String(r.adGroupAd?.ad?.id ?? '');
    if (!id) continue; adAgg[id] = accGoogle(adAgg[id] || freshGoogle(), gMetrics(r)); adAgg[id]._name = r.adGroupAd?.ad?.name; }
  const googleAds = Object.entries(adAgg).map(([id, acc]) => finalizeGoogle(acc, {
    id, name: acc._name ?? null, notion_id: adMap[id]?.notion_id ?? null, id_padrao: adMap[id]?.id_padrao ?? null,
  }));

  // ---- Meta: agrega por ad (dias), rola para adset e campanha; ids mapeados por id_meta ----
  const mAd = {};
  for (const it of meta) {
    const r = it.json; const id = String(r.ad_id ?? '');
    if (!id) continue;
    const a = mAd[id] || { id, name: r.ad_name, adset_id: r.adset_id, campaign_id: r.campaign_id,
      impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0, leads: 0, revenue: 0 };
    a.impressions += N(r.impressions); a.clicks += N(r.clicks); a.spend += N(r.spend); a.reach += N(r.reach);
    a.conversions += metaSum(r.actions, META_PURCHASE); a.leads += metaSum(r.actions, META_LEAD);
    a.revenue += metaSum(r.action_values, META_PURCHASE);
    mAd[id] = a;
  }
  const metaAds = Object.values(mAd).map((a) => ({
    id: a.id, name: a.name, notion_id: adMapMeta[a.id]?.notion_id ?? null, id_padrao: adMapMeta[a.id]?.id_padrao ?? null,
    impressions: a.impressions, clicks: a.clicks, spend: a.spend,
    conversions: a.conversions, leads: a.leads, revenue: a.revenue,
    frequency: a.reach > 0 ? Number((a.impressions / a.reach).toFixed(2)) : null,
  }));
  const rollMeta = (groupKey) => {
    const grp = {};
    for (const a of Object.values(mAd)) { const k = String(a[groupKey] ?? ''); if (!k) continue;
      const x = grp[k] || { id: k, impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0, leads: 0, revenue: 0 };
      x.impressions += a.impressions; x.clicks += a.clicks; x.spend += a.spend; x.reach += a.reach;
      x.conversions += a.conversions; x.leads += a.leads; x.revenue += a.revenue; grp[k] = x; }
    return Object.values(grp).map((x) => ({ ...x, frequency: x.reach > 0 ? Number((x.impressions / x.reach).toFixed(2)) : null }));
  };
  const metaAdsets = rollMeta('adset_id').map((x) => ({ ...x, notion_id: adsetMapMeta[x.id]?.notion_id ?? null, id_padrao: adsetMapMeta[x.id]?.id_padrao ?? null }));
  const metaCampaigns = rollMeta('campaign_id').map((x) => ({ ...x, notion_id: ids.notion_id_camp ?? null, id_padrao: null }));

  return {
    ctx,
    windows: {
      period: windows.reportType === 'Monthly' ? 'monthly' : 'weekly',
      date_start: windows.date_start ?? null, date_end: windows.date_end ?? null,
      panorama_30d: { start: windows.panorama_start ?? null, end: windows.panorama_end ?? null },
      n_days: windows.reportType === 'Monthly' ? 30 : 7,
    },
    google: { campaigns: googleCampaigns, adsets: googleAdsets, ads: googleAds },
    meta: { campaigns: metaCampaigns, adsets: metaAdsets, ads: metaAds },
    ga4: ga4 || { organic: {}, paid: {} },
  };
}

// ---------- main (lê os nós do workflow) ----------
const safe = (fn, dflt) => { try { return fn(); } catch (e) { return dflt; } };

const ids = safe(() => $('Set dados').item.json, {});
const campProps = safe(() => $('Get database campanhas').item.json.properties, {});
const cliProps = safe(() => $('Get database clientes').item.json.properties, {});
const windows = safe(() => $('Code prepara datas para extração').item.json, {});
const gCamp = safe(() => $('Google Ads Campanhas (GAQL)').first().json.results?.map((r) => ({ json: r })), []) || [];
const gAdset = safe(() => $('Google Ads Conjuntos (GAQL)').first().json.results?.map((r) => ({ json: r })), []) || [];
const gAd = safe(() => $('Google Ads Anúncios (GAQL)').first().json.results?.map((r) => ({ json: r })), []) || [];
const meta = safe(() => $('Fetch Meta Ads').first().json.data?.map((r) => ({ json: r })), []) || [];
const conjuntosItems = safe(() => $('Get database conjuntos').all(), []);
const anunciosItems = safe(() => $('Get database anuncios').all(), []);
const adsetMap = buildMap(conjuntosItems, 'adset_id_google', 'notion_id_adset', 'id_adset_padrao');
const adMap = buildMap(anunciosItems, 'ad_id_google', 'notion_id_ad', 'id_ad_padrao');
const adsetMapMeta = buildMap(conjuntosItems, 'adset_id_meta', 'notion_id_adset', 'id_adset_padrao');
const adMapMeta = buildMap(anunciosItems, 'ad_id_meta', 'notion_id_ad', 'id_ad_padrao');
const ga4 = {
  organic: safe(() => ga4Norm($('HTTP Request GA4 Orgânico').first().json), {}),
  paid: safe(() => ga4Norm($('HTTP Request GA4 Pago (LPs)').first().json), {}),
};

const contract = buildContract({ campProps, cliProps, ids, windows, gCamp, gAdset, gAd, meta, adsetMap, adMap, adsetMapMeta, adMapMeta, ga4 });
return [{ json: contract }];
