/**
 * Motor de Scoring GBP — porte JS do protótipo Python (scripts/gbp_scoring_prototype.py).
 * Especificação: docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md
 * Módulos 02_normalizer + 03_scoring_engine + 04_benchmark_engine, preservando as fórmulas.
 * Usado dentro dos Code nodes do n8n (colado inline) e testado aqui via Node puro
 * contra scripts/gbp_scoring_prototype.py no mesmo dataset (teste de aceitação do port).
 */

const SOCIAL_RE = /instagram|facebook|linktr|linktree|wa\.me|api\.whatsapp|t\.me|tiktok|twitter|x\.com|youtu/i;

// ---------- 02_normalizer -------------------------------------------------
function classifyWebsite(url) {
  if (!url) return "none";
  return SOCIAL_RE.test(url) ? "social" : "site";
}

function ownerResponseRate(reviews) {
  const scr = reviews || [];
  if (!scr.length) return null;
  const resp = scr.filter((r) => r && r.responseFromOwnerText).length;
  return resp / scr.length;
}

function normalize(p) {
  const reviews = p.reviews || [];
  const ai = p.additionalInfo || {};
  return {
    name: p.title,
    placeId: p.placeId,
    rank: p.rank,
    category: p.categoryName,
    nCategories: (p.categories || []).length,
    // null->0 (edge case real: negócio sem review devolve null, não 0)
    score: p.totalScore || 0,
    reviews: p.reviewsCount || 0,
    images: p.imagesCount || 0,
    hasHours: (p.openingHours || []).length > 0,
    nAttrGroups: Object.keys(ai).length,
    hasPayments: Object.prototype.hasOwnProperty.call(ai, "Pagamentos"),
    // claimThisBusiness True == perfil NÃO reivindicado
    claimed: !p.claimThisBusiness,
    unclaimed: !!p.claimThisBusiness,
    websiteType: classifyWebsite(p.website),
    hasBooking: (p.bookingLinks || []).length > 0,
    nPosts: (p.ownerUpdates || []).length,
    ownerResponseRate: ownerResponseRate(reviews),
    nReviewsTags: (p.reviewsTags || []).length,
    closed: !!p.permanentlyClosed || !!p.temporarilyClosed,
    // peers extras que o próprio JSON entrega (para engrossar o benchmark)
    pas: (p.peopleAlsoSearch || []).filter((x) => (x.reviewsCount || 0) > 0),
  };
}

// ---------- 04_benchmark_engine ------------------------------------------
function pct(v, arr) {
  // Percentil de v no segmento (fração de pares <= v). Robusto a outliers.
  if (!arr || !arr.length) return 0.0;
  return arr.filter((a) => a <= v).length / arr.length;
}

function buildBenchmark(norms) {
  const revs = [];
  const imgs = [];
  const scs = [];
  for (const n of norms) {
    revs.push(n.reviews);
    imgs.push(n.images);
    if (n.score > 0) scs.push(n.score);
    for (const x of n.pas) {
      revs.push(x.reviewsCount || 0);
      if ((x.totalScore || 0) > 0) scs.push(x.totalScore);
    }
  }
  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  const frac = (cond) => (norms.length ? norms.filter(cond).length / norms.length : 0);
  const attrs = norms.map((n) => n.nAttrGroups).sort((a, b) => a - b);
  const attrP75 = attrs.length ? attrs[Math.floor((attrs.length * 3) / 4)] : 4;
  return {
    avgReviews: avg(revs),
    avgImages: avg(imgs),
    avgScore: avg(scs),
    revsList: revs,
    imgsList: imgs,
    prevSite: frac((n) => n.websiteType === "site"),
    prevBooking: frac((n) => n.hasBooking),
    prevPosts: frac((n) => n.nPosts > 0),
    prevSecondary: frac((n) => n.nCategories >= 2),
    attrRef: Math.max(attrP75, 4),
    maxPosts: Math.max(...norms.map((n) => n.nPosts), 8),
  };
}

// ---------- 03_scoring_engine --------------------------------------------
function clamp(x, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, x));
}
function volConf(reviews, k = 25) {
  return Math.min(reviews / k, 1.0);
}
// Python 3 round() is round-half-to-even, not round-half-up like Math.round.
// Needed to reproduce scripts/gbp_scoring_prototype.py bit-for-bit on ties (e.g. 42.5).
function pyRound(x, ndigits = 0) {
  const m = Math.pow(10, ndigits);
  const scaled = x * m;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const EPS = 1e-9;
  let r;
  if (diff < 0.5 - EPS) r = floor;
  else if (diff > 0.5 + EPS) r = floor + 1;
  else r = floor % 2 === 0 ? floor : floor + 1;
  return r / m;
}

function dimensions(n, bm) {
  const saude =
    20 * n.hasHours + 20 * n.claimed + 20 * Math.min(n.nAttrGroups / 6, 1) + 10 + 10 * (n.websiteType !== "none") + 10 + 10 * !n.closed;
  const seo = 25 + 25 * Math.min((n.nCategories - 1) / 2, 1) + 30 * Math.min(n.nAttrGroups / 6, 1) + 20 * (n.websiteType === "site");
  const rel = bm.avgReviews ? n.reviews / bm.avgReviews : 0;
  const autoridade = 100 * (0.6 * (n.score / 5) * volConf(n.reviews) + 0.4 * Math.min(rel, 1));
  const conv = 30 * n.hasBooking + 25 * (n.websiteType === "site") + 15 + 15 * n.hasPayments + 15 * n.hasHours;
  const orr = n.ownerResponseRate;
  const engaj = 100 * (0.7 * (orr !== null ? orr : 0) + 0.3 * Math.min(n.nPosts / 8, 1));
  const relimg = bm.avgImages ? n.images / bm.avgImages : 0;
  const conteudo = 100 * (0.7 * Math.min(relimg, 1) + 0.3 * Math.min(n.nPosts / 8, 1));
  const raw = { saude, seo, autoridade, conversao: conv, engajamento: engaj, conteudo };
  const out = {};
  for (const k of Object.keys(raw)) out[k] = pyRound(clamp(raw[k]));
  return out;
}

const WEIGHTS = { saude: 0.15, seo: 0.2, autoridade: 0.2, conversao: 0.15, engajamento: 0.15, conteudo: 0.15 };
function technical(dims) {
  let s = 0;
  for (const k of Object.keys(WEIGHTS)) s += dims[k] * WEIGHTS[k];
  return pyRound(s);
}

function viability(n) {
  let v = 0.4 + 0.3 * n.hasHours + 0.2 * (n.reviews > 0) + 0.1 * (n.category !== null && n.category !== undefined);
  if (n.closed) v = 0.1;
  return pyRound(v, 2);
}

// ---------- v1: percentil + prevalência (gap = só o que os pares têm) ------
function ipcV1(n, bm) {
  const pr = pct(n.reviews, bm.revsList);
  const pi = pct(n.images, bm.imgsList);
  let gap = 0;
  gap += 22 * (1 - pr); // SVC-GBP: reviews (percentil)
  gap += 16 * (1 - pi); // SVC-GBP: fotos (percentil)
  gap += 12 * (1 - Math.min(n.nAttrGroups / bm.attrRef, 1)); // SEO: atributos vs p75 do segmento
  gap += 8 * bm.prevSecondary * (n.nCategories < 2 ? 1 : 0); // só se secundárias forem comuns no ramo
  gap += 6 * (n.hasHours ? 0 : 1);
  gap += 12 * n.unclaimed;
  gap += 14 * bm.prevSite * (n.websiteType !== "site" ? 1 : 0); // SVC-SITE: gap ∝ prevalência de site no ramo
  gap += 6 * bm.prevBooking * (n.hasBooking ? 0 : 1); // só penaliza booking se o ramo usa
  return pyRound(clamp(gap) * viability(n));
}

function leadOpportunityV1(n, bm) {
  const pr = pct(n.reviews, bm.revsList);
  const pi = pct(n.images, bm.imgsList);
  const g =
    25 * (1 - pr) +
    20 * (1 - 0.5 * pr - 0.5 * pi) +
    15 * (1 - pi) +
    10 * bm.prevSecondary * (n.nCategories < 2 ? 1 : 0) +
    5 * bm.prevSite * (n.websiteType !== "site" ? 1 : 0) +
    5 * (n.hasHours ? 0 : 1) +
    5 * (1 - Math.min(n.nAttrGroups / bm.attrRef, 1)) +
    (n.reviews >= 5 ? 5 * (1 - n.score / 5) : 2.5);
  return pyRound(g);
}

// ---------- roteamento de OFERTA (ponto Olavo 2026-07-10) ------------------
function weakGbp(n, bm, dims) {
  return dims.autoridade < 40 || dims.conteudo < 30 || n.unclaimed || n.nAttrGroups < bm.attrRef * 0.6;
}

function adsReadiness(n, dims) {
  if (n.websiteType !== "site" || n.unclaimed) return 0;
  const base = 0.55 * dims.autoridade + 0.35 * dims.conteudo + 10;
  return pyRound(clamp(base) * viability(n));
}

function recommendOffer(n, bm, dims) {
  const offers = [];
  if (n.websiteType !== "site") offers.push("SVC-SITE");
  if (weakGbp(n, bm, dims)) offers.push("SVC-GBP");
  if (n.websiteType === "site" && !weakGbp(n, bm, dims)) offers.push("SVC-ADS");
  return offers.length ? offers : ["SVC-GBP"];
}

function commercialPotential(n, bm, dims) {
  return Math.max(ipcV1(n, bm), adsReadiness(n, dims));
}

// ---------- runner (equivalente ao normalize->benchmark->score de todos) ---
function scoreDataset(rawPlaces) {
  const seen = new Set();
  const norms = [];
  for (const p of rawPlaces) {
    if (!p.placeId) continue; // pula saídas de comparação (LLM do actor)
    if (seen.has(p.placeId)) continue;
    seen.add(p.placeId);
    norms.push(normalize(p));
  }
  const bm = buildBenchmark(norms);
  const rows = norms.map((n) => {
    const dims = dimensions(n, bm);
    const tech = technical(dims);
    const ipc = ipcV1(n, bm);
    const leadOpp = leadOpportunityV1(n, bm);
    const ads = adsReadiness(n, dims);
    const pot = commercialPotential(n, bm, dims);
    const offers = recommendOffer(n, bm, dims);
    const flags = [];
    if (n.unclaimed) flags.push("não-reivind.");
    if (n.websiteType === "social") flags.push("site=rede");
    else if (n.websiteType === "none") flags.push("sem-site");
    if (n.reviews < 5) flags.push(`vol(${n.reviews})`);
    return { normalized: n, dimensions: dims, technical: tech, ipc, leadOpportunity: leadOpp, adsReadiness: ads, commercialPotential: pot, offers, flags };
  });
  rows.sort((a, b) => b.commercialPotential - a.commercialPotential);
  return { benchmark: bm, rows };
}

module.exports = {
  classifyWebsite,
  ownerResponseRate,
  normalize,
  pct,
  buildBenchmark,
  dimensions,
  technical,
  viability,
  ipcV1,
  leadOpportunityV1,
  weakGbp,
  adsReadiness,
  recommendOffer,
  commercialPotential,
  scoreDataset,
};
