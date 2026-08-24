/**
 * Leitura do Notion (nomes) — best-effort.
 * Traduz campaign_id -> "Nome da campanha" e client_id (CLI-4) -> "Nome" do cliente.
 * Se NOTION_TOKEN não estiver setado, ou a chamada falhar, devolve mapas vazios
 * (o webview cai no id/sigla, sem quebrar).
 */

const NOTION_VERSION = "2022-06-28";
const TOKEN = process.env.NOTION_TOKEN || "";
// IDs das bases (podem ser sobrescritos por env). Sem hifens = database_id do Notion.
const CAMPAIGNS_DB = process.env.NOTION_CAMPAIGNS_DB || "19fb65e5c72b8043a82df47ede397928";
const CLIENTS_DB = process.env.NOTION_CLIENTS_DB || "19fb65e5c72b81478aa3c63aa273d205";

// Data sources (coleções) das bases operacionais — consultadas via API de data sources.
const DS = {
  tarefas: "19fb65e5-c72b-813f-a6d9-000b8cfd603a",
  log: "19fb65e5-c72b-8127-8007-000b6634416b",
  observacoes: "19fb65e5-c72b-81bf-b59f-000b7a5b99c7",
  anuncios: "297b65e5-c72b-80e9-a1f3-000be92275f6",
  analises: "38fb65e5-c72b-80ff-9543-000b9a7468af",
};

const TTL_MS = 10 * 60 * 1000;
let cache = { maps: null, exp: 0 };

/** Extrai texto de uma property do Notion (title / rich_text / unique_id / number). */
function plain(prop) {
  if (!prop) return null;
  if (prop.type === "title") return (prop.title || []).map((t) => t.plain_text).join("").trim() || null;
  if (prop.type === "rich_text") return (prop.rich_text || []).map((t) => t.plain_text).join("").trim() || null;
  if (prop.type === "unique_id") {
    const u = prop.unique_id;
    if (!u || u.number == null) return null;
    return u.prefix ? `${u.prefix}-${u.number}` : String(u.number);
  }
  if (prop.type === "number") return prop.number == null ? null : String(prop.number);
  return null;
}

/** "CLI-4" | "4" | 4 -> "4" (só o número, para casar as duas fontes). */
function clientNum(v) {
  if (v == null) return null;
  const m = String(v).match(/(\d+)/);
  return m ? m[1] : null;
}

/** Lê uma property do Notion de vários tipos e devolve valor primitivo (ou null). */
function readProp(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
      return (prop.title || []).map((t) => t.plain_text).join("").trim() || null;
    case "rich_text":
      return (prop.rich_text || []).map((t) => t.plain_text).join("").trim() || null;
    case "email":
      return prop.email || null;
    case "url":
      return prop.url || null;
    case "phone_number":
      return prop.phone_number || null;
    case "select":
      return prop.select ? prop.select.name : null;
    case "status":
      return prop.status ? prop.status.name : null;
    case "multi_select":
      return (prop.multi_select || []).map((o) => o.name);
    case "number":
      return prop.number == null ? null : prop.number;
    case "date":
      return prop.date ? prop.date.start : null;
    case "unique_id":
      return prop.unique_id
        ? prop.unique_id.prefix
          ? `${prop.unique_id.prefix}-${prop.unique_id.number}`
          : String(prop.unique_id.number)
        : null;
    case "formula": {
      const f = prop.formula;
      if (!f) return null;
      if (f.string != null) return f.string;
      if (f.number != null) return String(f.number);
      if (f.boolean != null) return String(f.boolean);
      return null;
    }
    default:
      return null;
  }
}

let clientsCache = { rows: null, exp: 0 };

/** Registros reais dos clientes (Notion Clientes). Best-effort (vazio sem token). */
async function getClients() {
  const now = Date.now();
  if (clientsCache.rows && now < clientsCache.exp) return clientsCache.rows;
  if (!TOKEN) return [];
  try {
    const pages = await queryAll(CLIENTS_DB);
    const rows = pages.map((p) => {
      const x = p.properties || {};
      const clientId = readProp(x["client_id"]);
      return {
        clientId,
        num: clientNum(clientId),
        name: readProp(x["Nome"]) || readProp(x["Nome do Cliente"]) || null,
        status: readProp(x["Status"]),
        sla: readProp(x["SLA"]),
        riscoChurn: readProp(x["Risco de Churn"]),
        canalAquisicao: readProp(x["Canal de Aquisição"]),
        email: readProp(x["Email"]),
        fone: readProp(x["Fone"]),
        endereco: readProp(x["Endereço"]),
        site: readProp(x["Site"]),
        cnpj: readProp(x["CNPJ"]),
        segmento: readProp(x["Segmento"]),
        servicos: readProp(x["Serviços Prestados"]) || [],
        ticketLtv: readProp(x["Ticket/LTV"]),
        margem: readProp(x["Margem de Contribuição"]),
        nps: readProp(x["NPS Atual (0-10)"]),
        inicioContrato: readProp(x["Inicio Contrato"]),
        terminoContrato: readProp(x["Término Contrato"]),
      };
    });
    clientsCache = { rows, exp: now + TTL_MS };
    return rows;
  } catch (e) {
    console.error("[notion getClients]", e.message);
    return [];
  }
}

async function queryAll(dbId) {
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    if (!res.ok) throw new Error(`Notion ${dbId} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    rows.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return rows;
}

/** { campaignName: Map<campaign_id,nome>, clientName: Map<numeroCliente,nome> } */
async function getNameMaps() {
  const now = Date.now();
  if (cache.maps && now < cache.exp) return cache.maps;
  const empty = { campaignName: new Map(), clientName: new Map() };
  if (!TOKEN) return empty;
  try {
    const [camps, clients] = await Promise.all([queryAll(CAMPAIGNS_DB), queryAll(CLIENTS_DB)]);

    const campaignName = new Map();
    for (const p of camps) {
      const props = p.properties || {};
      const cid = plain(props["campaign_id"]);
      const name = plain(props["Nome da campanha"]);
      if (cid && name) campaignName.set(cid, name);
    }

    const clientName = new Map();
    for (const p of clients) {
      const props = p.properties || {};
      const num = clientNum(plain(props["client_id"]));
      const name = plain(props["Nome"]) || plain(props["Nome do Cliente"]);
      if (num && name) clientName.set(num, name);
    }

    const maps = { campaignName, clientName };
    cache = { maps, exp: now + TTL_MS };
    return maps;
  } catch (e) {
    console.error("[notion]", e.message);
    return empty;
  }
}

/* -------------------------------------------------------------------------- */
/*  Painel operacional da campanha (W7)                                        */
/* -------------------------------------------------------------------------- */

/** Consulta uma DATA SOURCE (coleção) do Notion com filtro/sort (API 2025-09-03). */
async function queryDataSource(dsId, body = {}) {
  const res = await fetch(`https://api.notion.com/v1/data_sources/${dsId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Notion DS ${dsId} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.results || [];
}

let idxCache = { map: null, exp: 0 };
/** Map campaign_id -> { pageId, name, clientId, ops } a partir da base Campanhas. */
async function getCampaignIndex() {
  const now = Date.now();
  if (idxCache.map && now < idxCache.exp) return idxCache.map;
  const map = new Map();
  if (!TOKEN) return map;
  const pages = await queryAll(CAMPAIGNS_DB);
  for (const p of pages) {
    const x = p.properties || {};
    const cid = readProp(x["campaign_id"]);
    if (!cid) continue;
    map.set(cid, {
      pageId: p.id,
      name: readProp(x["Nome da campanha"]),
      clientId: readProp(x["client_id"]),
      ops: {
        // Nomes de campo do Notion são enganosos: "CPA Campanha" guarda o INVESTIDO
        // (custo 7d/30d) e "CPL Campanha" guarda a MÉTRICA-MÃE (ex.: CPA) 7d/30d.
        investido: readProp(x["CPA Campanha"]),
        metricaMaeNome: readProp(x["Métrica-Mãe"]),
        metricaMaeValor: readProp(x["CPL Campanha"]),
        cpc: readProp(x["CPC Campanha"]),
        cpm: readProp(x["CPM Campanha"]),
        ctr: readProp(x["CTR Campanha"]),
        taxaConversao: readProp(x["Taxa de Conversão"]),
        impressoes: readProp(x["Impressões"]),
        roas: readProp(x["ROAS Campanha"]),
        metaMae: readProp(x["Meta da Métrica-mãe"]),
        resultadoMae: readProp(x["Resultado Atual (Métrica-mãe)"]),
      },
    });
  }
  idxCache = { map, exp: now + TTL_MS };
  return map;
}

const TASK_OPEN_EXCLUI = new Set(["Concluído", "Concluída", "Cancelado", "Cancelada"]);

function mapTask(p) {
  const x = p.properties || {};
  return {
    name: readProp(x["Nome da Tarefa"]),
    status: readProp(x["Status"]),
    priority: readProp(x["Prioridade"]),
    metric: readProp(x["Métrica Afetada"]),
    hypothesis: readProp(x["Hipótese Sugerida (IA)"]),
    gravity: readProp(x["Gravidade Detectada"]),
    url: p.url,
  };
}
function mapLog(p) {
  const x = p.properties || {};
  return {
    acao: readProp(x["Ação Executada"]),
    date: readProp(x["Data da Ação"]),
    resultado: readProp(x["Resultado"]),
    tipo: readProp(x["Tipo de Otimização"]),
    impacto: readProp(x["Impacto Percebido"]),
    classificacao: readProp(x["Classificação PHI"]),
    url: p.url,
  };
}
function mapDaily(p) {
  const x = p.properties || {};
  return {
    title: readProp(x["Observação Diária"]),
    date: readProp(x["Data Execução"]),
    analise: readProp(x["Análise de Performance"]),
    statusMetrica: readProp(x["Status da Métrica-Mãe"]),
    metricaPrincipal: readProp(x["Métrica Principal"]),
    v1d: readProp(x["Valor Métrica-Mãe 1D"]),
    v3d: readProp(x["Valor Métrica-Mãe 3D"]),
    v7d: readProp(x["Valor Métrica-Mãe 7D"]),
    tendencia1: readProp(x["Tendência 1Dvs7D"]),
    tendencia3: readProp(x["Tendência 3Dvs7D"]),
    optimizationScore: readProp(x["Optimization Score"]),
    fonte: readProp(x["Fonte dos Dados"]),
    url: p.url,
  };
}
function mapAnalysis(p) {
  const x = p.properties || {};
  return {
    titulo: readProp(x["titulo"]),
    diagnostico: readProp(x["maestro_diagnostico"]),
    decisao: readProp(x["maestro_decisao"]),
    proximosPassos: readProp(x["maestro_proximos_passos"]),
    leitura: readProp(x["leitura"]),
    severidade: readProp(x["severidade"]),
    flags: readProp(x["flags_ativas"]) || [],
    janela: readProp(x["janela"]),
    nivel: readProp(x["nivel"]),
    score: readProp(x["phi_midia_score"]),
    data: readProp(x["calculated_date"]),
    modelo: readProp(x["modelo_llm"]),
    confianca: readProp(x["maestro_confianca"]),
    url: p.url,
  };
}
function mapAd(p) {
  const x = p.properties || {};
  return {
    nome: readProp(x["Nome"]),
    plataforma: readProp(x["Plataforma"]),
    status: readProp(x["Status do Anúncio"]),
    statusOperacional: readProp(x["ad_status_operacional"]),
    scoreOperacional: readProp(x["ad_score_operacional"]),
    diagnostico: readProp(x["ad_diagnostico"]),
    tendencia: readProp(x["ad_tendencia"]),
    metaMae: readProp(x["Meta Métrica-Mãe"]),
    metricaMae7d: readProp(x["Métrica-Mãe 7D"]),
    kpis: {
      investido: readProp(x["Valor Investido"]),
      cpa: readProp(x["CPA"]),
      cpc: readProp(x["CPC"]),
      cpm: readProp(x["CPM"]),
      ctr: readProp(x["CTR"]),
      roas: readProp(x["ROAS"]),
      conversoes: readProp(x["Conversões"]),
      impressoes: readProp(x["Impressões"]),
      cliques: readProp(x["Cliques"]),
      taxaConversao: readProp(x["Taxa de Conversão"]),
    },
    url: p.url,
  };
}

/** Painel operacional completo de uma campanha (Notion). Best-effort por seção. */
async function getCampaignDetail(campaignId) {
  const empty = { ops: null, tasks: [], logs: [], dailyEntries: [], analyses: [], ads: [] };
  if (!TOKEN || !campaignId) return empty;

  const idx = await getCampaignIndex().catch(() => new Map());
  const entry = idx.get(campaignId);
  const pageId = entry ? entry.pageId : null;
  const ops = entry ? entry.ops : null;

  const relFilter = (prop) => ({ filter: { property: prop, relation: { contains: pageId } } });
  const textFilter = { filter: { property: "campaign_id", rich_text: { equals: campaignId } } };

  const jobs = {
    tasks: pageId
      ? queryDataSource(DS.tarefas, relFilter("Campanha"))
      : Promise.resolve([]),
    logs: pageId
      ? queryDataSource(DS.log, {
          ...relFilter("Campanhas"),
          sorts: [{ property: "Data da Ação", direction: "descending" }],
          page_size: 15,
        })
      : Promise.resolve([]),
    daily: pageId
      ? queryDataSource(DS.observacoes, {
          ...relFilter("Campanha"),
          sorts: [{ property: "Data Execução", direction: "descending" }],
          page_size: 14,
        })
      : Promise.resolve([]),
    analyses: queryDataSource(DS.analises, {
      ...textFilter,
      sorts: [{ property: "calculated_date", direction: "descending" }],
      page_size: 10,
    }),
    ads: queryDataSource(DS.anuncios, { ...textFilter, page_size: 50 }),
  };

  const [tasksR, logsR, dailyR, analysesR, adsR] = await Promise.allSettled([
    jobs.tasks,
    jobs.logs,
    jobs.daily,
    jobs.analyses,
    jobs.ads,
  ]);
  const val = (r) => (r.status === "fulfilled" ? r.value : []);

  const tasks = val(tasksR)
    .map(mapTask)
    .filter((t) => !TASK_OPEN_EXCLUI.has(t.status || ""));

  return {
    ops,
    tasks,
    logs: val(logsR).map(mapLog),
    dailyEntries: val(dailyR).map(mapDaily),
    analyses: val(analysesR).map(mapAnalysis),
    ads: val(adsR).map(mapAd),
  };
}

/** Diagnóstico: primeiras `limit` linhas de uma base, com nome/tipo/valor das
 *  properties + a URL da página no Notion. Serve para descobrir os campos reais. */
async function debugDatabase(dbId, limit = 3) {
  if (!TOKEN) throw new Error("NOTION_TOKEN ausente no servidor.");
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: Math.min(limit, 5) }),
  });
  if (!res.ok) throw new Error(`Notion ${dbId} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const rows = (data.results || []).map((p) => {
    const props = {};
    for (const [k, v] of Object.entries(p.properties || {})) {
      props[k] = { type: v.type, value: readProp(v) };
    }
    return { _url: p.url, _id: p.id, props };
  });
  const columns = rows[0] ? Object.keys(rows[0].props) : [];
  return { database_id: dbId, count: rows.length, columns, rows };
}

module.exports = { getNameMaps, getClients, clientNum, debugDatabase, getCampaignDetail };
