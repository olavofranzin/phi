const DEFAULT_ONB_WEBHOOK_URL = 'https://n8n-n8n-editor.1unqx7.easypanel.host/webhook/onb-briefing-to-client';

const FIELD_ALIASES = {
  cnpj_cliente: ['cnpj_cliente', 'CNPJ', 'CNPJ do cliente', 'CNPJ Cliente'],
  cliente_nome: ['cliente_nome', 'Cliente', 'Nome do cliente', 'Nome da empresa'],
  data_inicio: ['data_inicio', 'Data de inicio', 'Data de início', 'Data inicio', 'Data início'],
  modelo_negocio: ['modelo_negocio', 'Modelo de negocio', 'Modelo de negócio', 'Business model'],
  servico: ['servico', 'Serviço', 'Servico', 'Serviços contratados', 'Servicos contratados'],
  origem_comercial: ['origem_comercial', 'Origem comercial', 'Origem (vendedor / comercial)', 'Vendedor'],
  responsavel_geral_email: ['responsavel_geral_email', 'Responsavel geral email', 'Responsável geral email', 'E-mail do responsável']
};

const VALID_MODELOS = ['Infoproduto', 'Lead Gen', 'E-Commerce'];
const VALID_SERVICOS = ['Tráfego pago', 'Site', 'Agente IA'];

function onFormSubmit(e) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const secret = scriptProperties.getProperty('ONB_WEBHOOK_SECRET');
  if (!secret) {
    throw new Error('Script Property ONB_WEBHOOK_SECRET ausente.');
  }

  const webhookUrl = scriptProperties.getProperty('ONB_WEBHOOK_URL') || DEFAULT_ONB_WEBHOOK_URL;
  const namedValues = (e && e.namedValues) || {};
  const payload = buildOnboardingPayload_(namedValues);

  const response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Onb-Secret': secret
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('Webhook A2.1 retornou HTTP ' + status + ': ' + response.getContentText());
  }
}

function buildOnboardingPayload_(namedValues) {
  const payload = {
    cnpj_cliente: getRequiredValue_(namedValues, 'cnpj_cliente'),
    cliente_nome: getRequiredValue_(namedValues, 'cliente_nome'),
    data_inicio: normalizeDate_(getOptionalValue_(namedValues, 'data_inicio') || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'))
  };

  const modelo = getOptionalValue_(namedValues, 'modelo_negocio');
  if (modelo) {
    payload.modelo_negocio = normalizeModelo_(modelo);
  }

  const servico = getOptionalValue_(namedValues, 'servico');
  if (servico) {
    payload.servico = normalizeServicos_(servico);
  }

  const origem = getOptionalValue_(namedValues, 'origem_comercial');
  if (origem) {
    payload.origem_comercial = origem;
  }

  const responsavel = getOptionalValue_(namedValues, 'responsavel_geral_email');
  if (responsavel) {
    payload.responsavel_geral_email = responsavel.toLowerCase();
  }

  return payload;
}

function getRequiredValue_(namedValues, fieldKey) {
  const value = getOptionalValue_(namedValues, fieldKey);
  if (!value) {
    throw new Error('Campo obrigatório não encontrado no Form: ' + fieldKey + '. Ajuste FIELD_ALIASES antes de conectar.');
  }
  return value;
}

function getOptionalValue_(namedValues, fieldKey) {
  const aliases = FIELD_ALIASES[fieldKey] || [];
  for (const alias of aliases) {
    const raw = namedValues[alias];
    if (raw === undefined || raw === null) continue;
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw);
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function normalizeDate_(value) {
  const trimmed = String(value).trim();
  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return trimmed;

  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    return brMatch[3] + '-' + month + '-' + day;
  }

  throw new Error('data_inicio deve estar em YYYY-MM-DD ou DD/MM/YYYY.');
}

function normalizeModelo_(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (!VALID_MODELOS.includes(trimmed)) {
    throw new Error('modelo_negocio inválido: ' + trimmed + '. Esperado: ' + VALID_MODELOS.join(', '));
  }
  return trimmed;
}

function normalizeServicos_(value) {
  if (!String(value).trim()) return [];
  const parts = String(value)
    .split(/[,;\n]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item === 'Trafego pago' ? 'Tráfego pago' : item);

  const invalid = parts.filter(item => !VALID_SERVICOS.includes(item));
  if (invalid.length) {
    throw new Error('servico inválido: ' + invalid.join(', ') + '. Esperado: ' + VALID_SERVICOS.join(', '));
  }
  if (!parts.length) {
    throw new Error('servico vazio.');
  }

  return parts;
}
