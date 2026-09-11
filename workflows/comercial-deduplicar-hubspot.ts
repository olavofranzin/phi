import { workflow, node, trigger, ifElse, expr } from '@n8n/workflow-sdk';

// Comercial - Deduplicar Leads HubSpot
// ID: izimrLm19H4i6LOq
// Deduplica deals no estágio Prospectado: normaliza nome (NFD + 3 palavras),
// mantém o mais antigo e arquiva duplicatas como closedlost.
// DRY_RUN=true por padrão — mude para false para executar de verdade.

const TELEGRAM_CHAT = '930549271';

const inicio = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: '[ComAb] Inicio' },
});

const buscarDeals = node({
  type: 'n8n-nodes-base.hubspot',
  version: 2.2,
  config: {
    name: '[ComAb] Buscar Deals HubSpot',
    credentials: { hubspotAppToken: { id: 'z32jb58ZpWnc647b', name: 'HubSpot account' } },
    parameters: {
      resource: 'deal',
      operation: 'getAll',
      returnAll: true,
      additionalFields: {
        properties: ['dealname', 'dealstage', 'createdate', 'description', 'hs_object_id'],
      },
    },
  },
});

const calcularDuplicatas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '[ComAb] Calcular Duplicatas',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const DRY_RUN = true;
const STAGE = '70807682-148b-4914-acd0-97aad8c2a000';

function normalizar(nome) {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

const items = $input.all();
const prospectados = items.filter(i => i.json.properties && i.json.properties.dealstage === STAGE);

const grupos = {};
for (const item of prospectados) {
  const nome = (item.json.properties && item.json.properties.dealname) || '';
  const chave = normalizar(nome);
  if (!chave) continue;
  if (!grupos[chave]) grupos[chave] = [];
  grupos[chave].push({
    deal_id: item.json.id,
    deal_nome: nome,
    createdate: item.json.properties.createdate || '1970-01-01T00:00:00Z',
  });
}

const para_arquivar = [];
let grupos_com_dupes = 0;

for (const [chave, deals] of Object.entries(grupos)) {
  if (deals.length < 2) continue;
  grupos_com_dupes++;
  deals.sort((a, b) => new Date(a.createdate) - new Date(b.createdate));
  const manter = deals[0];
  for (let i = 1; i < deals.length; i++) {
    para_arquivar.push({
      deal_id: deals[i].deal_id,
      deal_nome: deals[i].deal_nome,
      manter_id: manter.deal_id,
      chave_normalizacao: chave,
    });
  }
}

return [{
  json: {
    dry_run: DRY_RUN,
    total_prospectado: prospectados.length,
    grupos_com_dupes,
    duplicatas_count: para_arquivar.length,
    para_arquivar,
  }
}];
`,
    },
  },
});

const temDuplicatas = ifElse({
  version: 2.2,
  config: {
    name: '[ComAb] Tem Duplicatas?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{
          leftValue: expr('{{ $json.duplicatas_count }}'),
          operator: { type: 'number', operation: 'gt' },
          rightValue: 0,
        }],
        combinator: 'and',
      },
    },
  },
});

const montarRelatorio = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '[ComAb] Montar Relatorio',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const data = $input.all()[0].json;
const label = data.dry_run
  ? '⚠️ DRY RUN — nenhuma alteração será feita'
  : '✅ EXECUÇÃO REAL — arquivando duplicatas';

const linhas = [
  '<b>[ComAb] Deduplicador HubSpot</b>',
  label,
  '',
  '📊 Total em Prospectado: ' + data.total_prospectado,
  '🔁 Grupos com duplicatas: ' + data.grupos_com_dupes,
  '🗑 Para arquivar: ' + data.duplicatas_count,
  '',
  '📋 Detalhes:',
];

for (const d of (data.para_arquivar || [])) {
  linhas.push('  • ' + d.deal_nome + ' (ID ' + d.deal_id + ') → manter ' + d.manter_id);
}

return [{ json: { text: linhas.join('\\n'), dry_run: data.dry_run } }];
`,
    },
  },
});

const telegramRelatorio = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: '[ComAb] Telegram Relatorio',
    continueOnFail: true,
    credentials: { telegramApi: { id: 'pHCHzZTP2yReQXb6', name: 'Telegram account' } },
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: TELEGRAM_CHAT,
      text: expr("={{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"),
      additionalFields: { parse_mode: 'HTML' },
    },
  },
});

const modoExecucao = ifElse({
  version: 2.2,
  config: {
    name: '[ComAb] Modo Execucao?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr(`={{ String($('[ComAb] Calcular Duplicatas').all()[0].json.dry_run) }}`),
          operator: { type: 'string', operation: 'equals' },
          rightValue: 'false',
        }],
        combinator: 'and',
      },
    },
  },
});

const expandirDuplicatas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '[ComAb] Expandir Duplicatas',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const data = $('[ComAb] Calcular Duplicatas').all()[0].json;
const now = new Date();
const br = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

return (data.para_arquivar || []).map(d => ({
  json: {
    deal_id: d.deal_id,
    deal_nome: d.deal_nome,
    manter_id: d.manter_id,
    descricao: 'Arquivado pelo Deduplicador [ComAb] em ' + br + '. Mantido: ' + d.manter_id,
    br_timestamp: br,
  }
}));
`,
    },
  },
});

const arquivarDeal = node({
  type: 'n8n-nodes-base.hubspot',
  version: 2.2,
  config: {
    name: '[ComAb] Arquivar Deal HubSpot',
    continueOnFail: true,
    credentials: { hubspotAppToken: { id: 'z32jb58ZpWnc647b', name: 'HubSpot account' } },
    parameters: {
      resource: 'deal',
      operation: 'update',
      dealId: {
        __rl: true,
        mode: 'id',
        value: expr('={{ $json.deal_id }}'),
      },
      updateFields: {
        stage: 'closedlost',
        description: expr('={{ $json.descricao }}'),
      },
    },
  },
});

const consolidarResultado = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: '[ComAb] Consolidar Resultado',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const items = $input.all();
let ok = 0, fail = 0;
for (const i of items) {
  if (i.json.error) fail++; else ok++;
}
const now = new Date();
const br = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
return [{
  json: {
    text: '✅ <b>[ComAb] Deduplicador — Concluído</b>\\nArquivados com sucesso: ' + ok + '\\nFalhas: ' + fail + '\\n' + br,
  }
}];
`,
    },
  },
});

const telegramConclusao = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: '[ComAb] Telegram Conclusao',
    continueOnFail: true,
    credentials: { telegramApi: { id: 'pHCHzZTP2yReQXb6', name: 'Telegram account' } },
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: TELEGRAM_CHAT,
      text: expr("={{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"),
      additionalFields: { parse_mode: 'HTML' },
    },
  },
});

const telegramSemDuplicatas = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: '[ComAb] Telegram Sem Duplicatas',
    continueOnFail: true,
    credentials: { telegramApi: { id: 'pHCHzZTP2yReQXb6', name: 'Telegram account' } },
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: TELEGRAM_CHAT,
      text: '[ComAb] Deduplicador: nenhuma duplicata encontrada em Prospectado.',
      additionalFields: { parse_mode: 'HTML' },
    },
  },
});

export default workflow('comercial-deduplicar-hubspot', 'Comercial - Deduplicar Leads HubSpot')
  .add(inicio)
  .to(buscarDeals)
  .to(calcularDuplicatas)
  .to(temDuplicatas
    .onTrue(montarRelatorio.to(telegramRelatorio).to(modoExecucao
      .onTrue(expandirDuplicatas.to(arquivarDeal).to(consolidarResultado).to(telegramConclusao))
    ))
    .onFalse(telegramSemDuplicatas)
  );
