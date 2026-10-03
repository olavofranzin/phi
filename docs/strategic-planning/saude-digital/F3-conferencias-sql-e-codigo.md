# F3 — o SQL e o código das conferências construíveis

| | |
|---|---|
| **Estado** | 🟡 **DESENHO PRONTO, NÃO MONTADO.** Nenhuma linha disto está no n8n |
| **Data** | 2026-09-26 |
| **Por que existe** | a volta 1 parou por premissa refutada (ver `docs/handoff/2026-09-26-F3-vigia-execucao-relatorio.md`). O desenho fica escrito para a próxima volta ser **montagem, não desenho** |
| **Conferido contra** | o schema real de `phi_prod`, execução **43182** (colunas) e **43183** (frescor). **Nenhum nome de coluna aqui foi adivinhado** |

---

## 1. A forma do vigia: 5 nós, 1 mensagem, saída sempre

```
Todo dia 08h BRT  ──►  Conferir no BigQuery ──┐
                                              ├──►  Merge  ──►  Montar UMA mensagem  ──►  Telegram
                  ──►  Clientes ativos (Notion)┘
```

**Duas decisões de desenho que não são estéticas:**

1. 🔴 **A consulta do BigQuery devolve FATO, não só ACHADO.** O V4 devolve **uma linha por tabela
   vigiada, sempre** — inclusive as saudáveis. Isso resolve o **CA5** *na estrutura*, não na boa
   vontade: o nó nunca devolve zero itens, então o ramo nunca morre. É a lição de 18/09 aplicada ao
   próprio vigia.
2. **A expectativa mora no código** (opção A do §5 do plano), num único objeto no topo do nó de código.
   Mudar a expectativa de uma tabela é mudar uma linha, num lugar só.

---

## 2. O nó de BigQuery — uma consulta, seis blocos

Cada bloco devolve `vigia · severidade · chave · detalhe`. Blocos `*_FATO` **sempre** devolvem linha.

```sql
-- PHI - Vigia de Consistencia. Uma consulta, seis blocos.
-- REGRA 1: todo bloco filtra client_id IS NOT NULL (a t28_campaign tem 318 linhas de teste).
-- REGRA 2: os blocos _FATO devolvem linha SEMPRE, inclusive no dia saudavel. Sem isso o
--          ramo morre em silencio no dia bom, que foi o estrago de 18/09.
-- REGRA 3: so leitura. Nenhum DML.

WITH ontem AS (SELECT DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY) AS d),

-- V4_FATO: frescor de cada tabela vigiada. O periodo esperado e o tratamento de cada
-- estado ficam no no de codigo. Aqui so o fato: primeiro, ultimo, linhas.
v4 AS (
  SELECT 'raw_campaign_data' AS t, MIN(date) AS pri, MAX(date) AS ult, COUNT(*) AS n FROM phi_prod.raw_campaign_data WHERE client_id IS NOT NULL
  UNION ALL SELECT 'phi_score_history', MIN(calculated_date), MAX(calculated_date), COUNT(*) FROM phi_prod.phi_score_history WHERE client_id IS NOT NULL
  UNION ALL SELECT 'raw_ad_data', MIN(date), MAX(date), COUNT(*) FROM phi_prod.raw_ad_data WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_campaign', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_campaign WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_ga4_landing', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_ga4_landing WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_clarity_daily', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_clarity_daily WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_adset', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_adset WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_meta_campaign', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_meta_campaign WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_gbp_daily', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_gbp_daily WHERE client_id IS NOT NULL
  UNION ALL SELECT 't28_errors', MIN(business_date), MAX(business_date), COUNT(*) FROM phi_prod.t28_errors WHERE client_id IS NOT NULL
)

-- ---------- V4: frescor (FATO, sempre 10 linhas) ----------
SELECT 'V4_FATO' AS vigia, 'FATO' AS severidade, t AS chave,
  CONCAT('ultimo=', IFNULL(CAST(ult AS STRING),'NUNCA'),
         ' | primeiro=', IFNULL(CAST(pri AS STRING),'NUNCA'),
         ' | linhas=', CAST(n AS STRING),
         ' | atraso=', IFNULL(CAST(DATE_DIFF(CURRENT_DATE('America/Sao_Paulo'), ult, DAY) AS STRING),'-')) AS detalhe
FROM v4

-- ---------- V2: a campanha tem exatamente 1 score de ontem? ----------
UNION ALL
SELECT 'V2', 'CRITICO', CONCAT(client_id,' / ',platform,' / ',campaign_id),
  CONCAT('score repetido ', CAST(COUNT(*) AS STRING), 'x na chave canonica do ADR-38')
FROM phi_prod.phi_score_history, ontem
WHERE client_id IS NOT NULL AND calculated_date = ontem.d
GROUP BY client_id, platform, campaign_id
HAVING COUNT(*) > 1

-- ---------- V2b: a VIEW que a bancada le multiplica? ----------
-- Existe porque phi_score_current agrupa por (client_id, campaign_id) SEM platform,
-- enquanto a chave canonica tem platform. Hoje nao multiplica; e um multiplicador armado.
-- Ver 4.1 do relatorio de 26/09.
UNION ALL
SELECT 'V2b', 'CRITICO', CONCAT(client_id,' / ',campaign_id),
  CONCAT('a view phi_score_current devolve ', CAST(COUNT(*) AS STRING), ' linhas para 1 campanha')
FROM phi_prod.phi_score_current
GROUP BY client_id, campaign_id
HAVING COUNT(*) > 1

-- ---------- V3_FATO: quem teve score ontem (o cruzamento com o Notion e no codigo) ----------
UNION ALL
SELECT 'V3_FATO', 'FATO', client_id,
  CONCAT(CAST(COUNT(DISTINCT campaign_id) AS STRING), ' campanha(s) com score em ', CAST(ontem.d AS STRING))
FROM phi_prod.phi_score_history, ontem
WHERE client_id IS NOT NULL AND calculated_date = ontem.d
GROUP BY client_id, ontem.d

-- ---------- V5: erro roteado com destino visivel, ainda em aberto ----------
-- Desvio declarado do plano: le a t28_errors em vez do status da execucao.
-- Cobre so quem usa o WF-T28-Error-Handler. Pendente de decisao do Olavo (P3).
UNION ALL
SELECT 'V5', 'ATENCAO', CONCAT(IFNULL(workflow_name,'?'),' / ',IFNULL(node_name,'?')),
  CONCAT(CAST(COUNT(*) AS STRING), ' erro(s) roteado(s) sem resolver | severidade=',
         STRING_AGG(DISTINCT IFNULL(severity,'-')))
FROM phi_prod.t28_errors, ontem
WHERE client_id IS NOT NULL AND business_date >= DATE_SUB(ontem.d, INTERVAL 1 DAY)
  AND (resolved IS NULL OR resolved = FALSE)
GROUP BY workflow_name, node_name

-- ---------- V6: o Pipeline_v2 escreveu o score na janela esperada? ----------
-- O score da data D e escrito em D+1, por volta de 07:01 BRT. Em 25/09 saiu 09:10.
UNION ALL
SELECT 'V6', 'ATENCAO', 'Pipeline_v2',
  CONCAT('escreveu o score de ', CAST(ontem.d AS STRING), ' as ',
         FORMAT_TIMESTAMP('%H:%M', MAX(snapshot_timestamp), 'America/Sao_Paulo'),
         ' BRT, fora da janela 07:00-07:45')
FROM phi_prod.phi_score_history, ontem
WHERE calculated_date = ontem.d AND client_id IS NOT NULL
GROUP BY ontem.d
HAVING MAX(snapshot_timestamp) IS NOT NULL
   AND FORMAT_TIMESTAMP('%H%M', MAX(snapshot_timestamp), 'America/Sao_Paulo') NOT BETWEEN '0700' AND '0745'

-- ---------- V7: campanha sem primary_metric_type ----------
UNION ALL
SELECT 'V7', 'ATENCAO', CONCAT(client_id,' / ',platform,' / ',campaign_id),
  'primary_metric_type vazio: a campanha seria julgada por regua inventada (ADR-40 6.1)'
FROM phi_prod.raw_campaign_data, ontem
WHERE client_id IS NOT NULL AND date = ontem.d
  AND (primary_metric_type IS NULL OR TRIM(primary_metric_type) = '')

-- ---------- Sentinela: prova que a consulta rodou ate o fim ----------
UNION ALL
SELECT 'SENTINELA', 'FATO', 'consulta',
  CONCAT('rodou em ', CAST(CURRENT_TIMESTAMP() AS STRING), ' | ontem=', CAST(ontem.d AS STRING))
FROM ontem

ORDER BY vigia, chave
```

> ⚠️ **O `V2b` é uma adição minha ao plano**, não uma troca: ele fica **dentro** da pergunta do V2
> (*"cada campanha ativa tem exatamente 1 score?"*), só olha o lugar que a bancada de fato lê. **Se o
> chat-mãe não quiser, é deletar o bloco** — nada mais depende dele.

---

## 3. O nó do Notion — clientes ativos (para o V3)

Nó `n8n-nodes-base.notion`, `resource: databasePage`, `operation: getAll`, `returnAll: true`,
`simple: false`, **`alwaysOutputData: true`**, credencial `Notion account` (`KpPCTsYPAvGXGfp2`).

| | |
|---|---|
| **DB** | Clientes — `19fb65e5-c72b-8147-8aa3-c63aa273d205` |
| **Por que o Notion e não o `client_config`** | o defeito que o V3 existe para pegar foi **o CHA morrendo no `phi_dev`** — ou seja, o `client_config` era justamente o instrumento quebrado. **Ler o cadastro que o humano mantém é o ponto do V3** |
| **Cuidado medido** | na DB Campanhas há **4 páginas com `campaign_id` e `client_id` vazios**, todas `Concluído`. O cruzamento tem de ignorar concluído, senão o V3 grita por campanha morta |

---

## 4. O nó de código — a expectativa e a mensagem única

```js
// PHI - Vigia de Consistencia. Monta UMA mensagem por dia.
// REGRA: este no SEMPRE devolve exatamente 1 item. Nunca [].
// No dia saudavel ele emite a prova de vida. Vigia silencioso e indistinguivel
// de vigia morto - e foi assim que a Fase 3 ficou 8 dias morta, verde todo dia.

// ---- A EXPECTATIVA, num lugar so (opcao A do parag. 5 do plano) ----
// periodo: quantos dias de atraso ainda sao normais.
//   diario  = 1 dia de folga (o dado de ontem entra hoje)
//   semanal = 10 dias. O Agregador roda segunda com business_date do domingo:
//             na terca o atraso e 2, na segunda seguinte chega a 8. 10 da folga
//             sem deixar passar um mes de silencio.
// estado: vigiar | em_estudo (lista, nao alerta) | conhecido (lista, nao grita todo dia)
const ESPERADO = {
  'raw_campaign_data': { dias: 1,  estado: 'vigiar' },
  'phi_score_history': { dias: 1,  estado: 'vigiar' },
  't28_campaign':      { dias: 10, estado: 'vigiar' },
  't28_ga4_landing':   { dias: 10, estado: 'vigiar' },
  't28_errors':        { dias: 10, estado: 'vigiar' },
  // Clarity: decisao do Olavo de 26/09. A coleta FICA, o vigia LISTA, nao alerta.
  // Alertar por dado que ninguem consome seria instalar no vigia o defeito que ele combate.
  't28_clarity_daily': { dias: 10, estado: 'em_estudo' },
  // gbp_daily tem 1 linha unica de 21/06: nunca recebeu de verdade (cota do GBP).
  't28_gbp_daily':     { dias: 10, estado: 'conhecido' },
  't28_adset':         { dias: 10, estado: 'conhecido' },
  't28_meta_campaign': { dias: 10, estado: 'conhecido' },
  'raw_ad_data':       { dias: 1,  estado: 'conhecido' },
};

const linhas = $input.all().map((i) => i.json || {});
const bloco = (v) => linhas.filter((l) => l.vigia === v);

const criticos = [];
const atencao  = [];
const listados = [];
let conferidas = 0;

// ---- V4: frescor, com os TRES estados distintos ----
for (const l of bloco('V4_FATO')) {
  conferidas++;
  const exp = ESPERADO[l.chave] || { dias: 1, estado: 'vigiar' };
  const m = /atraso=(-|\d+)/.exec(l.detalhe || '');
  const atraso = m && m[1] !== '-' ? Number(m[1]) : null;
  const nunca = /ultimo=NUNCA/.test(l.detalhe || '');

  if (exp.estado === 'em_estudo') {
    listados.push(l.chave + ': em estudo, sem consumidor. ' + l.detalhe);
  } else if (nunca || exp.estado === 'conhecido') {
    listados.push(l.chave + ': ' + (nunca ? 'nunca recebeu' : 'conhecido') + '. ' + l.detalhe);
  } else if (atraso !== null && atraso > exp.dias) {
    atencao.push('V4 ' + l.chave + ': parou de receber. ' + l.detalhe +
                 ' (esperado no maximo ' + exp.dias + ' dia(s))');
  }
}

// ---- V2 / V2b: criticos, acordam o Olavo ----
for (const l of [...bloco('V2'), ...bloco('V2b')]) {
  conferidas++;
  criticos.push(l.vigia + ' ' + l.chave + ': ' + l.detalhe);
}

// ---- V3: cliente ativo no Notion que nao aparece no score ----
// (o no do Notion entra pela 2a entrada do Merge; ver parag. 3)
const comScore = new Set(bloco('V3_FATO').map((l) => l.chave));
const ativosNotion = linhas
  .filter((l) => l.properties && !l.vigia)            // itens vindos do Notion
  .map((l) => {
    const p = l.properties || {};
    const cid = ((p.client_id && p.client_id.rich_text) || []).map((t) => t.plain_text).join('').trim();
    const st  = (p.Status && (p.Status.select || p.Status.status) || {}).name || '';
    return { cid, st };
  })
  .filter((c) => c.cid && !['Arquivado', 'Cancelado', 'Concluído'].includes(c.st));

for (const c of ativosNotion) {
  conferidas++;
  if (!comScore.has(c.cid)) {
    criticos.push('V3 ' + c.cid + ': ativo no Notion e SEM score ontem - cliente pago sem monitoramento');
  }
}

// ---- V5 / V6 / V7 ----
for (const v of ['V5', 'V6', 'V7']) {
  const b = bloco(v);
  conferidas += (v === 'V6' ? 1 : b.length || 1);
  for (const l of b) atencao.push(v + ' ' + l.chave + ': ' + l.detalhe);
}

// ---- A MENSAGEM UNICA ----
const sent = bloco('SENTINELA')[0];
const partes = ['PHI - VIGIA DE CONSISTENCIA'];

if (criticos.length === 0 && atencao.length === 0) {
  // A PROVA DE VIDA. Nao e ruido: e o recibo de que o vigia rodou.
  partes.push('', 'Tudo certo. Conferi ' + conferidas + ' itens, ' + conferidas + ' ok.');
} else {
  if (criticos.length) partes.push('', 'ACORDA (numero errado na bancada / cliente sem monitoramento):',
                                   ...criticos.map((s) => '- ' + s));
  if (atencao.length)  partes.push('', 'CONSERTA AMANHA:', ...atencao.map((s) => '- ' + s));
}
if (listados.length) partes.push('', 'Conhecido, sem acao (nao e alarme):', ...listados.map((s) => '- ' + s));
partes.push('', sent ? sent.detalhe : 'sentinela ausente - DESCONFIE desta mensagem');

// SEMPRE 1 item. Nunca [].
return [{ json: { alert_message: partes.join('\n'),
                  criticos: criticos.length, atencao: atencao.length, conferidas } }];
```

---

## 5. O que este desenho **não** resolve

| Vigia | Por quê |
|---|---|
| **V1** | exige ler a execução do n8n; **não há credencial `n8nApi`** na instância. Pergunta **P2** do relatório |
| **V5** | cobre só erro roteado ao `WF-T28-Error-Handler`. Pergunta **P3** |
| **V6** | só o lado `Pipeline_v2`. O lado `operador unico` não tem como ser provado: `raw_campaign_data` **não tem coluna de timestamp de carga** |

> 🔴 **Antes de montar, refazer as contagens.** Os números que calibram o `ESPERADO` são de **26/09**.
> Quem montar isto daqui a uma semana está usando número velho para decidir o que é atraso — e foi
> exatamente assim que o "06/09" entrou no brief e custou esta volta.
