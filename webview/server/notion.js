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

module.exports = { getNameMaps, getClients, clientNum, debugDatabase };
