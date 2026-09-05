/**
 * 02_normalizer_places -- Code node do L2b Discovery (Places API)
 *
 * Entrada : itens do Split Out sobre places[] da resposta do Text Search
 * Saida   : uma linha por lead no schema canonico da planilha `leads`
 *
 * Regras da casa aplicadas:
 * - ASCII-safe: sem literais nao-ASCII (acentos via \uXXXX)
 * - Campo nao observado NAO vira 0/false -- vira string vazia (guardrail BLOCO COMUM)
 * - Chave de dedup: `id` = place_id
 *
 * Ver: docs/strategic-planning/prospeccao/spec-no-places-api-descoberta.md
 */

const ctx = $('[L2b] Set Parametros').first().json;
const textQuery = ctx.textQuery || '';
const agora = new Date();
const dataExtracao = agora.toISOString().slice(0, 10);
const mesExtracao = dataExtracao.slice(0, 7);

// --- helpers -------------------------------------------------------------

/** Extrai um componente de endereco pelo type do addressComponents. */
const comp = (place, tipo) => {
  const lista = place.addressComponents || [];
  const achado = lista.find((c) => (c.types || []).includes(tipo));
  return achado ? (achado.longText || achado.shortText || '') : '';
};

/**
 * Classifica o website em none | social | own.
 * Necessario para o roteamento SVC-SITE (decisao Olavo 2026-07-10) e para o
 * refino v1.1: negocio pujante com site=social e lead de alto valor.
 */
const SOCIAL_HOSTS = [
  'instagram.com', 'facebook.com', 'fb.com', 'linktr.ee', 'linktree',
  'wa.me', 'api.whatsapp.com', 'linkedin.com', 'tiktok.com',
  'youtube.com', 'twitter.com', 'x.com', 'beacons.ai', 'bio.link',
];
const classificarSite = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return 'none';
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch (err) {
    return 'none';
  }
  if (!host) return 'none';
  if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith('.' + s) || host.includes(s))) {
    return 'social';
  }
  return 'own';
};

/** Horario legivel a partir de regularOpeningHours. */
const formatarHorario = (place) => {
  const oh = place.regularOpeningHours;
  if (!oh) return '';
  const dias = oh.weekdayDescriptions || [];
  return dias.length ? dias.join(' | ') : '';
};

/**
 * Contagem de fotos -- CENSURADA A DIREITA.
 * A Places API devolve no maximo 10 refs em photos[]; nao e a contagem real
 * do perfil. Vale como sinal binario de perfil fraco (<10), nao como medida.
 */
const contarFotos = (place) => {
  const fotos = place.photos || [];
  const n = fotos.length;
  return { valor: n, saturado: n >= 10 };
};

// --- normalizacao --------------------------------------------------------

const itens = $input.all();

const linhas = itens.map((item, idx) => {
  const place = item.json || {};

  const site = place.websiteUri || '';
  const siteTipo = classificarSite(site);
  const fotos = contarFotos(place);
  const rating = typeof place.rating === 'number' ? place.rating : null;
  const nReviews = typeof place.userRatingCount === 'number' ? place.userRatingCount : 0;

  // types[] do Google NAO e equivalente as categorias GBP do dono.
  // Gravado para nao perder o dado, mas marcado como origem distinta.
  const types = Array.isArray(place.types) ? place.types : [];

  return {
    // --- chave ---
    id: place.id || '',

    // --- identidade ---
    nome: (place.displayName && place.displayName.text) || '',
    setor: (place.primaryTypeDisplayName && place.primaryTypeDisplayName.text) || '',
    contato: place.nationalPhoneNumber || '',
    site: site,

    // --- endereco (derivado de addressComponents, SKU Essentials) ---
    'Endere\u00e7o': place.formattedAddress || '',
    'Rua/Avenida': comp(place, 'route'),
    Bairro: comp(place, 'sublocality_level_1') || comp(place, 'sublocality'),
    Cidade: comp(place, 'locality') || comp(place, 'administrative_area_level_2'),
    Estado: comp(place, 'administrative_area_level_1'),
    CEP: comp(place, 'postal_code'),

    // --- metricas de reputacao ---
    'Avalia\u00e7\u00e3o': rating,
    'Quantidade reviews': nReviews,

    // --- operacao ---
    'Hor\u00e1rio': formatarHorario(place),

    // --- categorias (taxonomia Google, NAO categorias GBP) ---
    'Categoria 1': types[0] || '',
    'Categoria 2': types[1] || '',

    // --- proveniencia ---
    Searchstring: textQuery,
    'Posi\u00e7\u00e3o Pesquisa': idx + 1,
    'data extra\u00e7\u00e3o': dataExtracao,
    'm\u00eas extra\u00e7\u00e3o': mesExtracao,

    // --- fotos (censurado a direita -- ver spec secao 4) ---
    'Quantidade fotos': fotos.saturado ? '>=10' : String(fotos.valor),

    // --- AUSENTES na Places API: gravar VAZIO, nunca 0/false. ---
    // O L3 (Apify) preenche. Escrever 0 aqui afirmaria fato nao observado.
    nao_reivindicado: '',
    Posts: '',
    Agendamento: '',
    Patrocinado: '',
    Atributos: '',

    // --- campos internos p/ o scoring da Fase 1 (nao vao para a planilha) ---
    _site_tipo: siteTipo,
    _rating: rating,
    _n_reviews: nReviews,
    _fotos_saturado: fotos.saturado,
    _business_status: place.businessStatus || '',
  };
});

// --- benchmark da propria busca ------------------------------------------
// Os outros resultados da mesma query SAO o conjunto de concorrentes.
// 1 run de busca alimenta o leadScore COM comparacao -- sem custo extra.
const reviewsValidos = linhas.map((l) => l._n_reviews).filter((n) => n > 0);
const mediaReviews = reviewsValidos.length
  ? reviewsValidos.reduce((s, n) => s + n, 0) / reviewsValidos.length
  : 0;

const ratingsValidos = linhas
  .filter((l) => l._rating !== null && l._n_reviews >= 5)
  .map((l) => l._rating);
const mediaRating = ratingsValidos.length
  ? ratingsValidos.reduce((s, n) => s + n, 0) / ratingsValidos.length
  : 0;

return linhas.map((linha) => ({
  json: {
    ...linha,
    _bench_media_reviews: Number(mediaReviews.toFixed(1)),
    _bench_media_rating: Number(mediaRating.toFixed(2)),
    _bench_n_concorrentes: linhas.length,
  },
}));
