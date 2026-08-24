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
  client: ["client_slug", "client", "client_id", "cliente", "client_name"],
  platform: ["platform", "plataforma", "source", "channel"],
  status: ["status", "classification", "phi_status", "status_geral", "classificacao"],
  score: ["phi_score", "score", "current_score", "score_atual"],
  name: ["campaign_name", "name", "nome", "nome_da_campanha"],
  // raw_campaign_data
  date: ["date", "day", "dt", "data"],
  investment: ["cost", "investment", "spend", "investimento", "custo"],
  conversions: ["conversions", "conversoes", "conv"],
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

/** Monta o array de campaigns no shape do front (types.ts). */
function buildCampaigns(scoreRows, rawRows) {
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

    const conversions = num(pick(raw, COLS.conversions));
    let cpaActual = num(pick(raw, COLS.cpa));
    let roas = num(pick(raw, COLS.roas));
    // Guardrail: sem conversões => CPA/ROAS não fazem sentido => N/D
    if (conversions === 0) {
      cpaActual = null;
      roas = null;
    }

    return {
      id: id ? String(id) : "",
      name: pick(s, COLS.name) || (id ? String(id) : "N/D"),
      client: pick(s, COLS.client) || "N/D",
      platform: pick(s, COLS.platform) || "N/D",
      status: normStatus(pick(s, COLS.status)),
      score: num(pick(s, COLS.score)),
      investment: num(pick(raw, COLS.investment)),
      cpaTarget: null,
      cpaActual,
      conversions,
      ctr: num(pick(raw, COLS.ctr)),
      roas,
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
  res.json({ ok: true, hasSecret: !!process.env.GCP_SA_KEY });
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
        `WHERE \`${pickDateCol()}\` >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY)`,
    ).catch(() => []);

    const campaigns = buildCampaigns(scoreRows, rawRows);
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

// Série histórica do score de uma campanha (para o gráfico de tendência).
app.get("/api/phi-score-history", async (req, res) => {
  const campaign = String(req.query.campaign || "").trim();
  if (!campaign) return res.status(400).json({ error: "parâmetro 'campaign' obrigatório" });
  try {
    const idCol = COLS.campaignId[0];
    const dateCol = COLS.date[0];
    const scoreCol = COLS.score[0];
    const rows = await runBigQuery(
      `SELECT * FROM ${tbl("phi_score_history")} ` +
        `WHERE CAST(\`${idCol}\` AS STRING) = '${campaign.replace(/'/g, "")}' ` +
        `ORDER BY \`${dateCol}\``,
    );
    const series = rows.map((r) => ({
      date: pick(r, COLS.date),
      score: num(pick(r, COLS.score)),
    }));
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
