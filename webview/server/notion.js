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

module.exports = { getNameMaps, clientNum };
