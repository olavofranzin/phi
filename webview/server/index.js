/**
 * PHI Webview — backend (VPS).
 *
 * Responsabilidades:
 *  - Guardar o SEGREDO da service account (GCP_SA_KEY) SÓ no servidor.
 *  - Ler o BigQuery (dataset phi_prod) via API REST, apenas SELECT (view-only).
 *  - Aplicar os guardrails de dado (conversions=0 => CPA/ROAS = null; erro/ausente => null).
 *  - Servir o build estático do React (../dist).
 *
 * NUNCA escreve no BigQuery. Score vem de phi_score_current (fato) — não recalcula.
 *
 * Variáveis de ambiente (ver .env.example):
 *  - GCP_SA_KEY          JSON completo da service account (string). OBRIGATÓRIO p/ dados reais.
 *  - BQ_BILLING_PROJECT  projeto de billing/execução do job (default: phi-production-488720)
 *  - BQ_DATA_PROJECT     projeto onde vive o dataset (default: project-0e7c58d4-656f-49e8-807)
 *  - PORT                porta HTTP (default: 8080)
 */

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { getNameMaps, getClients, clientNum, debugDatabase } = require("./notion");

const PORT = process.env.PORT || 8080;
// Projeto de billing/execução do job = projeto ao qual a service account pertence.
// Com a SA antigravity-agent (que vive no mesmo projeto do dataset), billing e
// dados são o MESMO projeto. Ambos podem ser sobrescritos por env no EasyPanel.
const BQ_BILLING_PROJECT = process.env.BQ_BILLING_PROJECT || "project-0e7c58d4-656f-49e8-807";
const BQ_DATA_PROJECT = process.env.BQ_DATA_PROJECT || "project-0e7c58d4-656f-49e8-807";
const DATASET = "phi_prod";

/* -------------------------------------------------------------------------- */
/*  Mapeamento de colunas (AJUSTE AQUI se o /debug mostrar nomes diferentes)   */
/*  Cada campo lista candidatos; o primeiro presente na linha é usado.        */
/* -------------------------------------------------------------------------- */
const COLS = {
  // phi_score_current
  campaignId: ["campaign_id", "campaignId", "id", "campaign", "campaign_key"],
  client: ["client_id", "client_slug", "client", "cliente", "client_name"],
  platform: ["platform", "plataforma", "source", "channel"],
  status: ["phi_classification", "status", "classification", "phi_status"],
  score: ["phi_value", "phi_score", "score", "current_score"],
  name: ["campaign_name", "name", "nome", "nome_da_campanha"],
  // datas (raw usa "date"; phi_score_history usa "calculated_date")
  date: ["date", "calculated_date", "day", "dt", "data"],
  investment: ["cost", "investment", "spend", "investimento", "custo"],
  conversions: ["conversions", "conversoes", "conv"],
  revenue: ["revenue", "receita"],
  impressions: ["impressions", "impressoes"],
  clicks: ["clicks", "cliques"],
  primaryMetricGoal: ["primary_metric_goal", "cpa_alvo", "target"],
  // colunas prontas (se existirem em alguma fonte)
  ctr: ["ctr"],
  cpa: ["cpa", "cost_per_conversion", "cpa_actual"],
  roas: ["roas"],
};

const STATUS_SET = ["EXCELLENT", "GOOD", "WARNING", "CRITICAL", "LEARNING"];

/* -------------------------------------------------------------------------- */
/*  Auth: service account JWT -> access token (cache ~55min)                   */
/* -------------------------------------------------------------------------- */
let _saCache = null;
function getServiceAccount() {
  if (_saCache) return _saCache;
  const raw = process.env.GCP_SA_KEY;
  if (!raw) throw new Error("GCP_SA_KEY não configurada no servidor.");
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (e) {
    throw new Error("GCP_SA_KEY não é um JSON válido.");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new Error("GCP_SA_KEY sem client_email/private_key.");
  }
  _saCache = sa;
  return sa;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let _token = { value: null, exp: 0 };
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_token.value && now < _token.exp - 60) return _token.value;

  const sa = getServiceAccount();
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/bigquery.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(sa.private_key)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Falha ao obter access token (${res.status}): ${t}`);
  }
  const json = await res.json();
  _token = { value: json.access_token, exp: now + (json.expires_in || 3600) };
  return _token.value;
}

/* -------------------------------------------------------------------------- */
/*  BigQuery: jobs.query -> array de objetos {coluna: valor}                   */
/* -------------------------------------------------------------------------- */
async function runBigQuery(sql) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${BQ_BILLING_PROJECT}/queries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql, useLegacySql: false, timeoutMs: 30000 }),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`BigQuery ${res.status}: ${t}`);
  }
  const data = await res.json();
  const fields = (data.schema && data.schema.fields) || [];
  const rows = (data.rows || []).map((r) => {
    const obj = {};
    fields.forEach((f, i) => {
      obj[f.name] = r.f[i] ? r.f[i].v : null;
    });
    return obj;
  });
  return rows;
}

function tbl(name) {
  return `\`${BQ_DATA_PROJECT}.${DATASET}.${name}\``;
}

/* -------------------------------------------------------------------------- */
/*  Helpers de mapeamento + guardrails                                        */
/* -------------------------------------------------------------------------- */
function pick(row, candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return null;
}
function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normStatus(v) {
  if (!v) return "LEARNING";
  const s = String(v).toUpperCase().trim();
  return STATUS_SET.includes(s) ? s : "LEARNING";
}
function round(n, d = 2) {
  if (n === null || n === undefined) return null;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
/** Plataforma pelo campo bruto ou pelo prefixo do id (GADS-... / META-...). */
function platformFrom(id, rawPlatform) {
  if (rawPlatform) {
    const p = String(rawPlatform).toLowerCase();
    if (p.includes("google") || p.includes("gads")) return "Google Ads";
    if (p.includes("meta") || p.includes("face") || p.includes("fb") || p.includes("insta"))
      return "Meta Ads";
  }
  const s = String(id || "").toUpperCase();
  if (s.startsWith("GADS") || s.startsWith("GOOG")) return "Google Ads";
  if (s.startsWith("META") || s.startsWith("MADS") || s.startsWith("FB") || s.startsWith("IG"))
    return "Meta Ads";
  return "N/D";
}

/** Monta o array de campaigns no shape do front (types.ts).
 *  `names` = { campaignName: Map, clientName: Map } vindo do Notion (opcional). */
function buildCampaigns(scoreRows, rawRows, names) {
  const campaignName = names?.campaignName;
  const clientName = names?.clientName;
  // índice de raw_campaign_data: linha mais recente por campanha
  const latestByCampaign = new Map();
  for (const r of rawRows) {
    const id = pick(r, COLS.campaignId);
    if (!id) continue;
    const d = pick(r, COLS.date) || "";
    const cur = latestByCampaign.get(id);
    if (!cur || String(d) > String(cur._date || "")) {
      latestByCampaign.set(id, { ...r, _date: d });
    }
  }

  return scoreRows.map((s) => {
    const id = pick(s, COLS.campaignId);
    const raw = (id && latestByCampaign.get(id)) || {};

    const cost = num(pick(raw, COLS.investment));
    const conversions = num(pick(raw, COLS.conversions));
    const revenue = num(pick(raw, COLS.revenue));
    const impressions = num(pick(raw, COLS.impressions));
    const clicks = num(pick(raw, COLS.clicks));

    // KPIs derivados (matemática de exibição — NÃO é o score, que vem pronto).
    // CTR pronto se existir; senão clicks/impressions.
    let ctr = num(pick(raw, COLS.ctr));
    if (ctr === null && impressions !== null && impressions > 0 && clicks !== null) {
      ctr = clicks / impressions;
    }
    // CPA pronto se existir; senão cost/conversions.
    let cpaActual = num(pick(raw, COLS.cpa));
    if (cpaActual === null && conversions !== null && conversions > 0 && cost !== null) {
      cpaActual = cost / conversions;
    }
    // ROAS pronto se existir; senão revenue/cost.
    let roas = num(pick(raw, COLS.roas));
    if (roas === null && cost !== null && cost > 0 && revenue !== null) {
      roas = revenue / cost;
    }
    // Guardrail: sem conversões => CPA/ROAS = N/D (nunca 0).
    if (conversions === 0) {
      cpaActual = null;
      roas = null;
    }

    const scoreRaw = num(pick(s, COLS.score));

    const idStr = id ? String(id) : "";
    const rawClientId = pick(s, COLS.client);
    const nomeCampanha =
      (campaignName && campaignName.get(idStr)) || pick(s, COLS.name) || (idStr || "N/D");
    const nomeCliente =
      (clientName && clientName.get(clientNum(rawClientId))) || rawClientId || "N/D";

    return {
      id: idStr,
      name: nomeCampanha,
      client: nomeCliente,
      platform: platformFrom(id, pick(s, COLS.platform) || pick(raw, COLS.platform)),
      status: normStatus(pick(s, COLS.status)),
      score: scoreRaw === null ? null : Math.round(scoreRaw),
      investment: cost,
      cpaTarget: num(pick(raw, COLS.primaryMetricGoal)),
      cpaActual: round(cpaActual, 2),
      conversions,
      ctr: round(ctr, 4),
      roas: round(roas, 2),
      lastUpdate: pick(raw, COLS.date) || null,
      scoreHistory: [],
      deltas: {
        investment: null,
        cpaActual: null,
        conversions: null,
        ctr: null,
        roas: null,
      },
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  App                                                                        */
/* -------------------------------------------------------------------------- */
const app = express();

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasSecret: !!process.env.GCP_SA_KEY,
    hasNotion: !!process.env.NOTION_TOKEN,
  });
});

// Snapshot de campanhas (score + KPIs). ?debug=1 devolve colunas cruas.
app.get("/api/phi-snapshot", async (req, res) => {
  try {
    if (req.query.debug === "1") {
      const [score, raw] = await Promise.all([
        runBigQuery(`SELECT * FROM ${tbl("phi_score_current")} LIMIT 3`),
        runBigQuery(`SELECT * FROM ${tbl("raw_campaign_data")} ORDER BY 1 DESC LIMIT 3`),
      ]);
      return res.json({
        debug: true,
        phi_score_current: { columns: score[0] ? Object.keys(score[0]) : [], rows: score },
        raw_campaign_data: { columns: raw[0] ? Object.keys(raw[0]) : [], rows: raw },
      });
    }

    const scoreRows = await runBigQuery(`SELECT * FROM ${tbl("phi_score_current")}`);
    // janela curta de raw_campaign_data (partição por date) p/ pegar o dia mais recente
    const rawRows = await runBigQuery(
      `SELECT * FROM ${tbl("raw_campaign_data")} ` +
        `WHERE \`${pickDateCol()}\` >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`,
    ).catch(() => []);

    // Nomes (Notion) — best-effort; se falhar, cai no id/sigla.
    const names = await getNameMaps().catch(() => null);

    const campaigns = buildCampaigns(scoreRows, rawRows, names);
    res.json({
      campaigns,
      tasks: [],
      logs: [],
      alertTimeline: [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[phi-snapshot]", err.message);
    res.status(502).json({ error: err.message });
  }
});

// Diagnóstico de uma base do Notion: /api/notion-debug?db=<database_id>
app.get("/api/notion-debug", async (req, res) => {
  const db = String(req.query.db || "").trim();
  if (!db) return res.status(400).json({ error: "parâmetro 'db' (database_id) obrigatório" });
  try {
    res.json(await debugDatabase(db));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Cadastro real dos clientes (Notion Clientes). Vazio se sem NOTION_TOKEN.
app.get("/api/clients", async (_req, res) => {
  try {
    const clients = await getClients();
    res.json(clients);
  } catch (err) {
    console.error("[clients]", err.message);
    res.status(502).json({ error: err.message });
  }
});

// Série histórica do score de uma campanha (para o gráfico de tendência).
app.get("/api/phi-score-history", async (req, res) => {
  const campaign = String(req.query.campaign || "").trim();
  if (!campaign) return res.status(400).json({ error: "parâmetro 'campaign' obrigatório" });
  try {
    const idCol = COLS.campaignId[0];
    // SELECT * e mapeia/ordena em JS — robusto ao nome real da coluna de data.
    const rows = await runBigQuery(
      `SELECT * FROM ${tbl("phi_score_history")} ` +
        `WHERE CAST(\`${idCol}\` AS STRING) = '${campaign.replace(/'/g, "")}'`,
    );
    const series = rows
      .map((r) => ({ date: pick(r, COLS.date), score: num(pick(r, COLS.score)) }))
      .filter((p) => p.date && p.score !== null)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    res.json(series);
  } catch (err) {
    console.error("[phi-score-history]", err.message);
    res.status(502).json({ error: err.message });
  }
});

function pickDateCol() {
  return COLS.date[0];
}

/* --- Servir o build estático do React (../dist) --- */
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
// SPA fallback: qualquer rota não-API devolve o index.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`PHI webview server on :${PORT} (billing=${BQ_BILLING_PROJECT}, data=${BQ_DATA_PROJECT})`);
});
