/**
 * NORMALIZADOR T28  —  substituto do nó "Calculate KPIs & Campaign Insights"
 * Workflow: Unified marketing reports (4sdG2UKMCBuFq8xn)  |  Code node, modo "Run Once for All Items".
 *
 * O QUE FAZ: transforma a coleta crua (Google Ads 3 níveis, Meta, GA4) em registros NORMALIZADOS
 * por ENTIDADE × NÍVEL × JANELA, no schema §3 de docs/spec-contrato-agregador-t28.md.
 * NÃO interpreta (sem campo "insight"/"recommendation") — conclusão é dos agentes T28, ancorada no substrato.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * CONTRATO DE ENTRADA (o upstream deve entregar UM item por conta/run com esta forma):
 *
 *   {
 *     ctx: {                                   // contexto de negócio (Notion clientes/campanhas) + identidade
 *       client_id, conta,
 *       objetivo, modelo_negocio, metrica_mae, // metrica_mae: "CPA"|"CPL"|"ROAS"|"CPC"|"Taxa de Conversão"
 *       margem_contribuicao, ticket_ltv, meta_cpa, meta_roas,
 *       custos_aquisicao_extra,                // opcional: custos não-mídia p/ CAC (total no período). null => CAC fica null
 *       mudancas_recentes: { verba, criativo, oferta, pagina }   // opcional
 *     },
 *     windows: { period:"weekly"|"monthly", date_start, date_end, panorama_30d:{start,end}, n_days },
 *     google: { campaigns:[Ent], adsets:[Ent], ads:[Ent] },      // qualquer nível pode vir vazio/ausente
 *     meta:   { campaigns:[Ent], adsets:[Ent], ads:[Ent] },
 *     ga4:    { sessions, users, engagement_rate, conversions, revenue }  // nível conta/site (contexto)
 *   }
 *
 *   Ent (Google): { id, name, notion_id, id_padrao, impressions, clicks, cost_micros,
 *                   conversions, conversions_value, search_impression_share, budget_lost_is }
 *   Ent (Meta):   { id, name, notion_id, id_padrao, impressions, clicks, spend,
 *                   conversions, leads, revenue, frequency }
 *
 * SAÍDA: 1 item por entidade, no schema §3. Campos sem fonte vêm como null (nunca NaN/Infinity).
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---- helpers ----
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round = (n, d = 2) => (n === null || n === undefined ? null : Number(n.toFixed(d)));
const div = (a, b) => (num(b) > 0 ? num(a) / num(b) : null); // guarda de divisão por zero -> null

// Janela estatística (substrato: ≥30 conversões E ≥14 dias)
const MIN_CONV = 30;
const MIN_DIAS = 14;

// modelo de negócio lead-gen => métrica de volume é "lead"; senão "purchase"
const isLeadGen = (ctx) => /lead/i.test(String(ctx.modelo_negocio || '')) ||
                           /CPL/i.test(String(ctx.metrica_mae || ''));

function normalizeEntity(ent, platform, level, ctx, win, ga4) {
  const impressions = num(ent.impressions);
  const clicks      = num(ent.clicks);
  const cost_brl    = platform === 'google_ads'
    ? round(num(ent.cost_micros) / 1e6)            // micros -> R$
    : round(num(ent.spend));
  const leadGen     = isLeadGen(ctx);
  const conversions = num(ent.conversions);
  const leads       = num(ent.leads);
  const revenue     = round(num(ent.conversions_value ?? ent.revenue));

  // métrica de volume usada no gate e em CPA/CPL
  const volume_conv = leadGen ? (leads || conversions) : conversions;

  // derivadas (mapa do substrato; null quando denominador = 0)
  const cpm     = round(div(cost_brl, impressions) === null ? null : div(cost_brl, impressions) * 1000);
  const cpc     = round(div(cost_brl, clicks));
  const ctr_pct = round(div(clicks, impressions) === null ? null : div(clicks, impressions) * 100);
  const cvr_pct = round(div(volume_conv, clicks) === null ? null : div(volume_conv, clicks) * 100);
  const cpa     = round(div(cost_brl, conversions));
  const cpl     = leadGen ? round(div(cost_brl, leads || conversions)) : null;
  const roas    = round(div(revenue, cost_brl), 4);

  // CAC / LTV:CAC — só quando há base honesta (CAC ≠ CPA: inclui custos não-mídia).
  // Sem custos de aquisição modelados, mantemos null (não conflar CPA com CAC — regra do substrato).
  let cac = null, ltv_cac = null;
  const extra = ctx.custos_aquisicao_extra;
  if (extra !== null && extra !== undefined && volume_conv > 0) {
    cac = round((cost_brl + num(extra)) / volume_conv);
    if (cac && ctx.ticket_ltv) ltv_cac = round(num(ctx.ticket_ltv) / cac, 2);
  }

  const n_days = num(win.n_days);
  const volume_suficiente = volume_conv >= MIN_CONV && n_days >= MIN_DIAS;

  return {
    // identidade & janela
    client_id: ctx.client_id ?? null,
    conta: ctx.conta ?? null,
    platform, level,
    entity_id: ent.id ?? null,
    entity_name: ent.name ?? null,
    notion_id: ent.notion_id ?? null,
    id_padrao: ent.id_padrao ?? null,
    period: win.period ?? null,
    date_start: win.date_start ?? null,
    date_end: win.date_end ?? null,
    panorama_30d: win.panorama_30d ?? null,

    // contexto de negócio
    objetivo: ctx.objetivo ?? null,
    modelo_negocio: ctx.modelo_negocio ?? null,
    metrica_mae: ent.metrica_mae ?? ctx.metrica_mae ?? null,
    margem_contribuicao: ctx.margem_contribuicao ?? null,
    ticket_ltv: ctx.ticket_ltv ?? null,
    meta_cpa: ctx.meta_cpa ?? null,
    meta_roas: ctx.meta_roas ?? null,
    mudancas_recentes: ctx.mudancas_recentes ?? { verba: null, criativo: null, oferta: null, pagina: null },

    // métricas cruas
    impressions, clicks, cost_brl,
    conversions, conversion_type: leadGen ? 'lead' : 'purchase',
    revenue, leads, frequency: ent.frequency ?? null,
    search_impression_share: ent.search_impression_share ?? null,
    budget_lost_is: ent.budget_lost_is ?? null,

    // derivadas
    cpm, cpc, ctr_pct, cvr_pct, cpa, cpl, roas, cac, ltv_cac,

    // gate estatístico (ESPERAR)
    n_conversions: volume_conv, n_days, volume_suficiente,

    // secundárias / diagnóstico (contexto, não conclusão)
    ga4: ga4 ?? {}, gbp: ent.gbp ?? {}, clarity: ent.clarity ?? {}, search_terms_resumo: ent.search_terms_resumo ?? {}
  };
}

// ---- main ----
const out = [];
for (const item of $input.all()) {
  const run = item.json || {};
  const ctx = run.ctx || {};
  const win = run.windows || {};
  const ga4 = run.ga4 || {};
  const platforms = { google_ads: run.google || {}, meta_ads: run.meta || {} };

  for (const [platform, levels] of Object.entries(platforms)) {
    for (const level of ['campaign', 'adset', 'ad']) {
      const key = level === 'campaign' ? 'campaigns' : (level === 'adset' ? 'adsets' : 'ads');
      const arr = Array.isArray(levels[key]) ? levels[key] : [];
      for (const ent of arr) {
        out.push({ json: normalizeEntity(ent, platform, level, ctx, win, ga4) });
      }
    }
  }
}

return out;
