/**
 * ADAPTADOR T28  —  monta o "input contract" para o Normalizador (docs/normalizador-t28.code.js).
 * Workflow: Unified marketing reports (4sdG2UKMCBuFq8xn)  |  Code node, "Run Once for All Items".
 * Posição: roda 1x por CAMPANHA (dentro do Loop), DEPOIS das chamadas GAQL/Meta e ANTES do Normalizador.
 *
 * Lê os nós existentes via $('...') e produz UM item = objeto contract { ctx, windows, google, meta, ga4 }.
 *
 * PREMISSAS / TODO (ajustar após 1 execução real):
 *  - GAQL REST devolve camelCase: metrics.costMicros, metrics.conversionsValue,
 *    metrics.searchImpressionShare, metrics.searchBudgetLostImpressionShare. (fallback snake_case incluso)
 *  - GAQL traz segments.date => várias linhas por entidade => somamos numeradores na janela;
 *    impression share é ponderado por impressões.
 *  - Meta: level=ad, time_increment=1 => somamos por ad e rolamos para adset/campanha.
 *  - Contexto de negócio: objetivo/modelo_negocio/metrica_mae/meta_cpa vêm de "Get database campanhas".
 *    margem_contribuicao, ticket_ltv, meta_roas NÃO existem no schema atual do Notion => null (TODO).
 *  - notion_id/id_padrao por adset/ad: via mapas de "Get database conjuntos"/"Get database anuncios"
 *    chaveados por adset_id_google / ad_id_google. Sem entrada => null (métrica ainda flui).
 */

// ---------- helpers ----------
const N = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const g = (o, ...keys) => { for (const k of keys) { if (o && o[k] !== undefined && o[k] !== null) return o[k]; } return undefined; };

// extrai métricas de uma linha GAQL (camelCase com fallback snake_case)
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

// soma linhas (por-dia) em uma entidade; IS ponderado por impressões
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

// mapa google_id -> { notion_id, id_padrao } a partir de itens Notion
function buildMap(items, googleProp, notionIdProp, padraoProp) {
  const map = {};
  for (const it of (items || [])) {
    const props = it.json?.properties || {};
    const gid = pNum(props[googleProp]);
    if (gid === null || gid === undefined) continue;
    map[String(gid)] = { notion_id: pStr(props[notionIdProp]), id_padrao: pUid(props[padraoProp]) };
  }
  return map;
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
  const { campProps, ids, windows, gCamp, gAdset, gAd, meta, adsetMap, adMap } = R;

  // contexto de negócio (do Notion campanhas)
  const ctx = {
    client_id: ids.id_client ?? null,
    conta: pStr(campProps['client_slug']) ?? ids.id_client ?? null,
    objetivo: pSel(campProps['Objetivo']),
    modelo_negocio: pSel(campProps['Modelo de Negócio']),
    metrica_mae: pSel(campProps['Métrica-Mãe']),
    margem_contribuicao: null, // TODO: não existe no schema atual
    ticket_ltv: null,          // TODO: idem
    meta_cpa: pNum(campProps['CPA Alvo']),
    meta_roas: null,           // TODO: idem
    custos_aquisicao_extra: null,
    mudancas_recentes: { verba: null, criativo: null, oferta: null, pagina: null },
  };

  // ---- Google: agrega por entidade em cada nível ----
  const campAgg = {};
  for (const it of gCamp) { const r = it.json; const id = String(r.campaign?.id ?? ids.id_google_campanha);
    campAgg[id] = accGoogle(campAgg[id] || freshGoogle(), gMetrics(r));
    campAgg[id]._name = r.campaign?.name; }
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

  // ---- Meta: agrega por ad (dias), rola para adset e campanha ----
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
    id: a.id, name: a.name, notion_id: adMap[a.id]?.notion_id ?? null, id_padrao: adMap[a.id]?.id_padrao ?? null,
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
  const metaAdsets = rollMeta('adset_id').map((x) => ({ ...x, notion_id: adsetMap[x.id]?.notion_id ?? null, id_padrao: adsetMap[x.id]?.id_padrao ?? null }));
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
    ga4: R.ga4 || {},
  };
}

// ---------- main (lê os nós do workflow) ----------
const safe = (fn, dflt) => { try { return fn(); } catch (e) { return dflt; } };

const ids = safe(() => $('Set dados').item.json, {});
const campProps = safe(() => $('Get database campanhas').item.json.properties, {});
const windows = safe(() => $('Code prepara datas para extração').item.json, {});
const gCamp = safe(() => $('Google Ads Campanhas (GAQL)').first().json.results?.map((r) => ({ json: r })), []) || [];
const gAdset = safe(() => $('Google Ads Conjuntos (GAQL)').first().json.results?.map((r) => ({ json: r })), []) || [];
const gAd = safe(() => $('Google Ads Anúncios (GAQL)').first().json.results?.map((r) => ({ json: r })), []) || [];
const meta = safe(() => $('Fetch Meta Ads').first().json.data?.map((r) => ({ json: r })), []) || [];
const adsetMap = buildMap(safe(() => $('Get database conjuntos').all(), []), 'adset_id_google', 'notion_id_adset', 'id_adset_padrao');
const adMap = buildMap(safe(() => $('Get database anuncios').all(), []), 'ad_id_google', 'notion_id_ad', 'id_ad_padrao');
const ga4 = safe(() => $('HTTP Request GA4 Orgânico').first().json, {}); // TODO: normalizar campos GA4 reais

const contract = buildContract({ campProps, ids, windows, gCamp, gAdset, gAd, meta, adsetMap, adMap, ga4 });
return [{ json: contract }];
