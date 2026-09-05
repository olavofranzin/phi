import { workflow, node, trigger, sticky, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

const NORMALIZER_CODE = `const ctx = $('[L2b] Set Parametros').first().json;
const textQuery = ctx.textQuery || '';
const agora = new Date();
const dataExtracao = agora.toISOString().slice(0, 10);
const mesExtracao = dataExtracao.slice(0, 7);

const comp = (place, tipo) => {
  const lista = place.addressComponents || [];
  const achado = lista.find((c) => (c.types || []).includes(tipo));
  return achado ? (achado.longText || achado.shortText || '') : '';
};

const SOCIAL_HOSTS = ['instagram.com','facebook.com','fb.com','linktr.ee','linktree','wa.me','api.whatsapp.com','linkedin.com','tiktok.com','youtube.com','twitter.com','x.com','beacons.ai','bio.link'];
const classificarSite = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return 'none';
  let host = '';
  try { host = new URL(url).hostname.toLowerCase().replace(/^www\\./, ''); }
  catch (err) { return 'none'; }
  if (!host) return 'none';
  if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith('.' + s) || host.includes(s))) return 'social';
  return 'own';
};

const formatarHorario = (place) => {
  const oh = place.regularOpeningHours;
  if (!oh) return '';
  const dias = oh.weekdayDescriptions || [];
  return dias.length ? dias.join(' | ') : '';
};

const contarFotos = (place) => {
  const fotos = place.photos || [];
  return { valor: fotos.length, saturado: fotos.length >= 10 };
};

const itens = $input.all();

const linhas = itens.map((item, idx) => {
  const place = item.json || {};
  const site = place.websiteUri || '';
  const fotos = contarFotos(place);
  const rating = typeof place.rating === 'number' ? place.rating : null;
  const nReviews = typeof place.userRatingCount === 'number' ? place.userRatingCount : 0;
  const types = Array.isArray(place.types) ? place.types : [];

  return {
    id: place.id || '',
    nome: (place.displayName && place.displayName.text) || '',
    setor: (place.primaryTypeDisplayName && place.primaryTypeDisplayName.text) || '',
    contato: place.nationalPhoneNumber || '',
    site: site,
    'Endere\\u00e7o': place.formattedAddress || '',
    'Rua/Avenida': comp(place, 'route'),
    Bairro: comp(place, 'sublocality_level_1') || comp(place, 'sublocality'),
    Cidade: comp(place, 'locality') || comp(place, 'administrative_area_level_2'),
    Estado: comp(place, 'administrative_area_level_1'),
    CEP: comp(place, 'postal_code'),
    'Avalia\\u00e7\\u00e3o': rating,
    'Quantidade reviews': nReviews,
    'Hor\\u00e1rio': formatarHorario(place),
    'Categoria 1': types[0] || '',
    'Categoria 2': types[1] || '',
    Searchstring: textQuery,
    'Posi\\u00e7\\u00e3o Pesquisa': idx + 1,
    'data extra\\u00e7\\u00e3o': dataExtracao,
    'm\\u00eas extra\\u00e7\\u00e3o': mesExtracao,
    'Quantidade fotos': fotos.saturado ? '>=10' : String(fotos.valor),
    nao_reivindicado: '',
    Posts: '',
    Agendamento: '',
    Patrocinado: '',
    Atributos: '',
    _site_tipo: classificarSite(site),
    _rating: rating,
    _n_reviews: nReviews,
    _fotos: fotos.valor,
    _fotos_saturado: fotos.saturado,
    _business_status: place.businessStatus || '',
  };
});

const reviewsValidos = linhas.map((l) => l._n_reviews).filter((n) => n > 0);
const mediaReviews = reviewsValidos.length ? reviewsValidos.reduce((s, n) => s + n, 0) / reviewsValidos.length : 0;
const ratingsValidos = linhas.filter((l) => l._rating !== null && l._n_reviews >= 5).map((l) => l._rating);
const mediaRating = ratingsValidos.length ? ratingsValidos.reduce((s, n) => s + n, 0) / ratingsValidos.length : 0;

return linhas.map((linha) => ({ json: Object.assign({}, linha, {
  _bench_media_reviews: Number(mediaReviews.toFixed(1)),
  _bench_media_rating: Number(mediaRating.toFixed(2)),
  _bench_n_concorrentes: linhas.length,
}) }));`;

const SCORING_CODE = `const itens = $input.all();
const dataProc = new Date().toISOString().slice(0, 10);
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

const resultado = itens.map((item) => {
  const l = item.json;
  const siteTipo = l._site_tipo || 'none';
  const nRev = l._n_reviews || 0;
  const rating = l._rating;
  const media = l._bench_media_reviews || 0;
  const fotos = l._fotos || 0;
  const temHorario = !!(l['Hor\\u00e1rio'] || '').trim();
  const temTelefone = !!(l.contato || '').trim();
  const status = l._business_status || '';
  const motivos = [];
  const flags = [];

  let gapFundacao = 0;
  if (siteTipo === 'none') { gapFundacao += 40; motivos.push('sem site proprio'); flags.push('SEM_SITE'); }
  else if (siteTipo === 'social') { gapFundacao += 25; motivos.push('site e rede social'); flags.push('SITE_SOCIAL'); }

  const deficitRev = media > 0 ? (media - nRev) / media : 0;
  if (deficitRev > 0) {
    const pts = Math.min(30, deficitRev * 30);
    gapFundacao += pts;
    if (deficitRev > 0.4) { motivos.push('reviews abaixo da media da busca (' + nRev + ' vs ' + media + ')'); flags.push('REVIEWS_BAIXO'); }
  }
  if (!temHorario) { gapFundacao += 15; motivos.push('sem horario cadastrado'); flags.push('SEM_HORARIO'); }
  if (!temTelefone) { gapFundacao += 15; motivos.push('sem telefone'); flags.push('SEM_TELEFONE'); }
  if (fotos < 10 && !l._fotos_saturado) { flags.push('POUCAS_FOTOS'); }

  let prontidaoAds = 0;
  if (siteTipo === 'own') { prontidaoAds += 40; }
  if (media > 0 && nRev >= media) { prontidaoAds += 30; motivos.push('reviews acima da media da busca'); }
  if (rating !== null && rating >= 4.5 && nRev >= 5) { prontidaoAds += 30; }
  if (rating !== null && nRev < 5) { flags.push('SINAL_FRACO_VOLUME'); }

  let viabilidade = 1;
  if (status === 'CLOSED_PERMANENTLY') { viabilidade = 0; flags.push('FECHADO_PERM'); }
  else if (status === 'CLOSED_TEMPORARILY') { viabilidade = 0.3; flags.push('FECHADO_TEMP'); }
  else if (!temHorario && !temTelefone && siteTipo === 'none') { viabilidade = 0.5; flags.push('VIABILIDADE_INCERTA'); }

  let oferta = '';
  if (siteTipo === 'none' || siteTipo === 'social') { oferta = 'SVC-SITE'; }
  else if (deficitRev > 0.3 || !temHorario || (fotos < 10 && !l._fotos_saturado)) { oferta = 'SVC-GBP'; }
  else { oferta = 'SVC-ADS'; }

  const gapC = clamp(gapFundacao);
  const prontC = clamp(prontidaoAds);
  const potencial = clamp(Math.max(gapC, prontC) * viabilidade);

  let chance = 'Baixa';
  if (potencial >= 70) { chance = 'Alta'; }
  else if (potencial >= 45) { chance = 'Media'; }

  const limpo = Object.assign({}, l);
  delete limpo._site_tipo; delete limpo._rating; delete limpo._n_reviews;
  delete limpo._fotos; delete limpo._fotos_saturado; delete limpo._business_status;
  delete limpo._bench_media_reviews; delete limpo._bench_media_rating; delete limpo._bench_n_concorrentes;

  return { json: Object.assign(limpo, {
    site_tipo: siteTipo,
    gap_fundacao: gapC,
    prontidao_ads: prontC,
    viabilidade: viabilidade,
    potencial_comercial: potencial,
    oferta_recomendada: oferta,
    chance_de_venda: chance,
    flags_score: flags.join(','),
    motivos_score: motivos.join(' | '),
    data_processamento_score: dataProc,
    fonte_descoberta: 'places-api',
  }) };
});

return resultado.sort((a, b) => b.json.potencial_comercial - a.json.potencial_comercial);`;

const inicioManual = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: '[L2b] Inicio Manual', position: [0, 0] },
  output: [{}],
});

const inicioSubworkflow = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: '[L2b] Chamado por Outro Workflow',
    position: [0, 220],
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: { values: [{ name: 'textQuery', type: 'string' }] },
    },
  },
  output: [{ textQuery: 'dentista em Curitiba' }],
});

const setParametros = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: '[L2b] Set Parametros',
    position: [220, 100],
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'q', name: 'textQuery', value: expr('{{ $json.textQuery || "dentista em Curitiba, PR" }}'), type: 'string' },
          { id: 'rc', name: 'regionCode', value: 'BR', type: 'string' },
          { id: 'lc', name: 'languageCode', value: 'pt-BR', type: 'string' },
        ],
      },
    },
  },
  output: [{ textQuery: 'dentista em Curitiba, PR', regionCode: 'BR', languageCode: 'pt-BR' }],
});

const buscarPlaces = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: '[L2b] Places Text Search',
    position: [440, 100],
    parameters: {
      method: 'POST',
      url: 'https://places.googleapis.com/v1/places:searchText',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          {
            name: 'X-Goog-FieldMask',
            value: 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.types,places.primaryTypeDisplayName,places.businessStatus,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.photos,nextPageToken',
          },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ textQuery: $json.textQuery, regionCode: $json.regionCode, languageCode: $json.languageCode, pageSize: 20 }) }}'),
      options: {
        timeout: 20000,
        pagination: {
          pagination: {
            paginationMode: 'updateAParameterInEachRequest',
            parameters: {
              parameters: [
                { type: 'body', name: 'pageToken', value: expr('{{ $response.body.nextPageToken }}') },
              ],
            },
            paginationCompleteWhen: 'other',
            completeExpression: expr('{{ !$response.body.nextPageToken }}'),
            limitPagesFetched: true,
            maxRequests: 3,
            requestInterval: 2500,
          },
        },
      },
    },
    credentials: { httpTemplatedCustomAuth: newCredential('Google Places API') },
  },
  output: [{ places: [{ id: 'ChIJexemplo', displayName: { text: 'Odonto Exemplo' }, rating: 4.8, userRatingCount: 259 }] }],
});

const separarLeads = node({
  type: 'n8n-nodes-base.splitOut',
  version: 1,
  config: {
    name: '[L2b] Separar Leads',
    position: [660, 100],
    parameters: { fieldToSplitOut: 'places', include: 'noOtherFields' },
  },
  output: [{ id: 'ChIJexemplo', displayName: { text: 'Odonto Exemplo' }, rating: 4.8, userRatingCount: 259 }],
});

const normalizar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '[L2b] Normalizar Schema Canonico',
    position: [880, 100],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: NORMALIZER_CODE },
  },
  output: [{ id: 'ChIJexemplo', nome: 'Odonto Exemplo', site: 'https://exemplo.com.br', _site_tipo: 'own', _n_reviews: 259, _bench_media_reviews: 173.3 }],
});

const pontuar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '[L2b] Scoring Fase 1 + Roteamento',
    position: [1100, 100],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: SCORING_CODE },
  },
  output: [{ id: 'ChIJexemplo', nome: 'Odonto Exemplo', potencial_comercial: 88, viabilidade: 1, gap_fundacao: 0, prontidao_ads: 100, oferta_recomendada: 'SVC-ADS', chance_de_venda: 'Alta', site_tipo: 'own' }],
});

const gravarPlanilha = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: '[L2b] Upsert Planilha Leads',
    position: [1320, 100],
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'sheet',
      operation: 'appendOrUpdate',
      documentId: { __rl: true, mode: 'id', value: '1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM' },
      sheetName: { __rl: true, mode: 'name', value: 'leads' },
      columns: {
        mappingMode: 'autoMapInputData',
        value: {},
        matchingColumns: ['id'],
        schema: [
          { id: 'id', displayName: 'id', required: false, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'ignoreIt' },
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
  },
  output: [{ id: 'ChIJexemplo', nome: 'Odonto Exemplo', potencial_comercial: 88, viabilidade: 1, oferta_recomendada: 'SVC-ADS', chance_de_venda: 'Alta' }],
});

const filaEnriquecimento = ifElse({
  version: 2.3,
  config: {
    name: '[L2b] Entra na Fila de Enriquecimento?',
    position: [1540, 100],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { leftValue: expr('{{ $json.potencial_comercial }}'), operator: { type: 'number', operation: 'gte' }, rightValue: 45 },
          { leftValue: expr('{{ $json.viabilidade }}'), operator: { type: 'number', operation: 'gt' }, rightValue: 0 },
        ],
        combinator: 'and',
      },
    },
  },
});

const chamarL3 = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: '[L2b] Chamar L3 Enriquecimento',
    position: [1760, 0],
    parameters: {
      workflowId: { __rl: true, mode: 'id', value: 'EFD7Drr0LDMqfDXw' },
      mode: 'once',
      workflowInputs: { mappingMode: 'defineBelow', value: {}, schema: [] },
      options: { waitForSubWorkflow: false },
    },
  },
  output: [{ ok: true }],
});

const notaArquitetura = sticky(
  '## Fase 1 - Descoberta (Places API)\n\n' +
    'Text Search Enterprise: 1 req = ate 20 leads. Cota gratuita 10.000 req/mes.\n\n' +
    'NUNCA usar FieldMask com asterisco: forca SKU Enterprise+Atmosphere.\n\n' +
    'Campos que a Places API NAO entrega (gravados vazios, o L3/Apify preenche):\n' +
    'nao_reivindicado, Posts, Agendamento, Patrocinado, Atributos.\n' +
    'Gravar 0/false neles afirmaria fato nao observado.\n\n' +
    'Quantidade fotos e CENSURADA A DIREITA (max 10 refs): vale como sinal binario, nao como medida.',
  [setParametros, buscarPlaces, separarLeads, normalizar, pontuar],
  { color: 4 },
);

const notaFila = sticky(
  '## O IF prioriza, NAO descarta\n\n' +
    'Decisao Olavo 2026-07-10: o potencial NAO gateia "abordar ou nao" - ele roteia para a oferta certa.\n\n' +
    'Lead abaixo de 45 permanece na planilha com score, aguardando na fila.\n' +
    'O IF decide apenas: vale gastar Apify + Gemini neste lead AGORA?\n\n' +
    'Perfil forte NAO e descartado - vira lead de SVC-ADS.',
  [filaEnriquecimento, chamarL3],
  { color: 3 },
);

export default workflow('l2b-discovery-places', 'GBP Scoring - L2b Discovery (Places API)')
  .add(inicioManual)
  .to(setParametros)
  .add(inicioSubworkflow)
  .to(setParametros)
  .add(setParametros)
  .to(buscarPlaces)
  .to(separarLeads)
  .to(normalizar)
  .to(pontuar)
  .to(gravarPlanilha)
  .to(filaEnriquecimento.onTrue(chamarL3))
  .add(notaArquitetura)
  .add(notaFila);
