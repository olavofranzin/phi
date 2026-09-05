# [BRIEF Codex] L3.0 — Framework de Análise de Campanha (§4, o IP) — implementação

> **Frente:** Saúde Digital · **Lote:** L3.0 (Camada 2 — Análise), peça final (§4)
> **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Framework (decisões travadas):** `docs/strategic-planning/saude-digital/L3.0-framework-analise-campanha.md`
> **Fluxo de revisão:** Codex implementa → Claude pré-revisa → smoke real (Olavo).
> **Escopo deste brief:** adicionar o node Claude (LLM real) ao sub-WF
> `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`, draft), ajustar as regras
> determinísticas para a taxonomia final, e corrigir os 2 bugs herdados do
> placeholder. **Não inclui** ativar schedule nem rodar em `phi_prod`.

---

## 1. Comando `/goal` — rodar antes de começar

Antes de tocar em qualquer node, rode `/goal` e registre a meta desta sessão
com o texto abaixo (cole exatamente, é a meta que baliza o trabalho):

```
Implementar o node de análise LLM (Claude Sonnet, Structured Output) no
sub-WF n8n WF-T28-Analise-Campaign (fhYmJH0o9BW1IO4i, draft), substituindo
o placeholder determinístico pelas decisões travadas em
docs/strategic-planning/saude-digital/L3.0-framework-analise-campanha.md:
(1) reescrever "Build Deterministic Flags" com a taxonomia final de 12
flags + severidade agregada, corrigindo os bugs numeric(null)->0 e a
colisão de nome analise.leitura/analise.insight; (2) inserir o node Claude
com o system+user prompt e o schema estruturado do framework (§2 e §10);
(3) ajustar "Build Notion Page" para consumir llm.insight/recomendacoes/
evidencias, mantendo flags_ativas/severidade determinísticos (nunca vindos
do LLM). Manter os workflows em DRAFT (sem publish/activate/PUT). Entregar
validado (validate_workflow verde nos dois workflows) e pronto para
pré-revisão + smoke real em phi_dev, reusando o Orquestrador
8Q5ofmAZju0hTN08, batendo os critérios de aceite da §5 deste brief.
```

Use essa meta como critério de "pronto" — se algum dos 3 itens não foi
concluído, a tarefa não está feita, mesmo que o workflow valide.

## 2. Pré-requisito bloqueante

**Credencial Claude/Anthropic no n8n.** Ainda não configurada (pendência
registrada em `ESTADO-DO-PROJETO.md` §5). Sem ela o node Anthropic não roda —
confirmar com Olavo antes de iniciar, ou implementar o node em draft sem
credencial atribuída (fica pendente de teste até a credencial existir).

## 3. Mudanças no sub-WF `WF-T28-Analise-Campaign`

### Grafo alvo
```
Execute Workflow Trigger
  → Build Deterministic Flags   (REESCRITO — taxonomia final §3/§4 do framework)
  → Analise LLM Claude          (NOVO node — Anthropic, tool-use/structured output)
  → Build Notion Page           (AJUSTADO — consome llm.insight/recomendacoes/evidencias)
  → Lookup Existing Analysis → Has Existing Analysis → Update/Create Analysis Page  (INALTERADO)
```

### 3.1 `Build Deterministic Flags` — reescrever

Substituir a lógica atual pela taxonomia final (framework §3):

```js
const p = $json;
const score = p.score || {};
const metricas = p.metricas || {};
const contexto = p.contexto || {};
const qualidade = p.qualidade || {};
const rel = p.rel || {};
const flags = [...(rel.resolucao_flags || [])];
const reasons = [];

// FIX bug #1 (numeric(null) -> 0): guard explicito de null/undefined
const numeric = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const scoreValue = numeric(score.phi_value);
const tss = numeric(score.tss);
const meta = numeric(contexto.meta_metrica_mae);
const mm = String(contexto.metrica_mae || '').toUpperCase();
const conversions = numeric(metricas.conversions);
const cost = numeric(metricas.cost);
const convValue = numeric(metricas.conv_value);
const imprShare = numeric(metricas.impression_share);
const budgetLost = numeric(metricas.budget_lost_is);
const cpa = numeric(metricas.cpa) ?? (cost !== null && conversions ? cost / conversions : null);
const roas = numeric(metricas.roas) ?? (cost && convValue !== null ? convValue / cost : null);

const SEVERITY_BY_FLAG = {
  volume_insuficiente: 'info',
  score_indisponivel: 'info',
  tendencia_instavel: 'info',
  cpa_acima_meta: 'atencao',
  cpa_muito_acima_meta: 'critico',
  roas_abaixo_meta: 'atencao',
  roas_muito_abaixo_meta: 'critico',
  impression_share_baixo: 'atencao',
  impression_share_muito_baixo: 'critico',
  budget_lost: 'atencao',
  budget_lost_alto: 'critico',
  sem_conversao: 'critico',
};

if (qualidade.volume_suficiente === false) { flags.push('volume_insuficiente'); reasons.push('Volume abaixo do minimo para leitura conclusiva.'); }
if (scoreValue === null) { flags.push('score_indisponivel'); reasons.push('Score PHI Midia ausente.'); }
if (tss !== null && tss < 40) { flags.push('tendencia_instavel'); reasons.push('TSS baixo: tendencia recente instavel, tratar como hipotese.'); }

if (mm === 'CPA' && meta !== null && meta > 0 && cpa !== null) {
  if (cpa > meta * 1.5) { flags.push('cpa_muito_acima_meta'); reasons.push('CPA > 1.5x a meta.'); }
  else if (cpa > meta * 1.2) { flags.push('cpa_acima_meta'); reasons.push('CPA > 1.2x a meta.'); }
}
if (mm === 'ROAS' && meta !== null && meta > 0 && roas !== null) {
  if (roas < meta * 0.5) { flags.push('roas_muito_abaixo_meta'); reasons.push('ROAS < 0.5x a meta.'); }
  else if (roas < meta) { flags.push('roas_abaixo_meta'); reasons.push('ROAS abaixo da meta.'); }
}
if (imprShare !== null) {
  if (imprShare < 0.3) { flags.push('impression_share_muito_baixo'); reasons.push('Impression share < 30%.'); }
  else if (imprShare < 0.5) { flags.push('impression_share_baixo'); reasons.push('Impression share < 50%.'); }
}
if (budgetLost !== null) {
  if (budgetLost > 0.4) { flags.push('budget_lost_alto'); reasons.push('Perda de impressao por budget > 40%.'); }
  else if (budgetLost > 0.2) { flags.push('budget_lost'); reasons.push('Perda de impressao por budget > 20%.'); }
}
const semConversaoFloor = Math.max(meta || 0, 50);
if ((conversions || 0) === 0 && (cost || 0) >= semConversaoFloor) {
  flags.push('sem_conversao'); reasons.push('Investimento >= ' + semConversaoFloor + ' com conversoes zeradas.');
}

const uniqueFlags = [...new Set(flags)];
const RANK = { info: 0, atencao: 1, critico: 2 };
let severidade = uniqueFlags.reduce((acc, f) => {
  const s = SEVERITY_BY_FLAG[f];
  return s && RANK[s] > RANK[acc] ? s : acc;
}, 'info');
if (qualidade.volume_suficiente === false) severidade = 'info'; // guarda ADR-21 Tema 10

// FIX bug #2: renomeado de 'leitura' para 'insight' (evita colisao com a
// property Notion 'leitura' = phi_classification)
return { json: { ...p, analise: {
  modelo_llm: 'placeholder_deterministico_l3_0', // sobrescrito pelo node LLM
  severidade,
  flags: uniqueFlags,
  reasons,
  insight: '[PLACEHOLDER] Analise deterministica. Score PHI Midia: ' + (scoreValue ?? 'N/D') + ' (' + (score.phi_classification || 'sem leitura') + '). Flags: ' + (uniqueFlags.join(', ') || 'nenhuma') + '.',
  recomendacoes: [],
} } };
```

### 3.2 `Analise LLM Claude` — node novo

- Tipo: node Anthropic do n8n (chat/message com tool-use forçado ou
  Structured Output, conforme disponível na versão do node).
- **Model: Claude Sonnet — fixado, não usar Opus nem Haiku.** Usar a versão
  Sonnet vigente na credencial Anthropic do n8n (hoje, linha Sonnet 5 —
  ex.: `claude-sonnet-5`); confirmar o identificador exato disponível no
  seletor do node antes de salvar, mas a família é sempre Sonnet. Racional
  (framework §7): severidade/flags já são determinísticas, o LLM só narra,
  prioriza e recomenda dentro de um schema fechado — não precisa do modelo
  mais caro da família.
- System prompt: literal do framework §2.1.
- User message: montar via expression concatenando os campos do payload,
  conforme framework §2.2 (adaptar para sintaxe de expressão única do n8n —
  mesmo cuidado do bug já corrigido no `BQ Read T28 Score`: **não usar
  `const`/`return` dentro de uma expressão `{{ }}`**, só interpolação direta
  ou uma única expressão de template string).
- Tool/schema: literal do framework §10 (`phi_analise_campanha`).
- `onError`: **propagar** (não é um node de lookup best-effort — se o LLM
  falhar, a análise não deve ser escrita com dado incompleto/inconsistente).
  Se quiser resiliência, discutir com Olavo antes de adicionar fallback
  (ex.: manter o insight placeholder quando o LLM falhar) — não decidir
  isso sem sinal explícito.
- Output: mesclar no item como `llm` (não sobrescrever `analise.flags`/
  `analise.severidade`, que continuam vindo do node anterior):
  ```js
  return { json: { ...$json, llm: <parsed tool output>, analise: { ...$json.analise, modelo_llm: 'claude-<versao-exata-do-node>' } } };
  ```

### 3.3 `Build Notion Page` — ajustar

- `blocks[0].text` passa a vir de `llm.insight` (fallback para
  `analise.insight` se o LLM não rodou/falhou de forma tolerada).
- Novo bloco de Recomendações: formatar `llm.recomendacoes` (ação, esforço,
  impacto esperado) em vez do texto fixo "placeholder vazio".
- Bloco de Evidências: usar `llm.evidencias` se presente; manter o bloco
  determinístico atual (cpa/roas/meta/impression_share/budget_lost_is) como
  linha adicional — não remover, é dado bruto útil de qualquer forma.
- `props.flags_ativas` continua vindo de `analise.flags` (determinístico).
- `props.severidade` continua vindo de `analise.severidade` (determinístico
  — **não** usar `llm.severidade`, que é só para checagem de consistência).
- `props.modelo_llm` passa a vir de `analise.modelo_llm` já atualizado pelo
  node LLM (ex.: string real do modelo Sonnet usado, não mais
  `placeholder_deterministico_l3_0`).

## 4. Validação

- `validate_node_config` no node Anthropic e no `Build Deterministic Flags`
  antes de plugar no grafo completo.
- `validate_workflow` no sub-WF inteiro — deve continuar `valid=true`.
- Manter **draft** (sem publish/activate), igual ao restante do L3.0.

## 5. Smoke esperado (reusa o Orquestrador, phi_dev)

1. Disparar `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`) via
   `execute_workflow` manual, mesmo config do smoke anterior
   (`BQ_DATASET=phi_dev`, `business_date=2026-06-21`, `janela=D-7`).
2. As 2 pages de smoke já existentes em `PHI - ANÁLISES`
   (`390b65e5...d28f`, `390b65e5...5553`) devem ser **atualizadas**
   (idempotente, mesma chave de negócio) — não duplicar.
3. Critérios de aceite (novos, em cima dos já provados no plumbing):
   - `insight` não começa mais com `[PLACEHOLDER]` — é texto real do LLM.
   - Body tem recomendações reais (não mais "placeholder vazio").
   - Nenhuma flag `impression_share_baixo` espúria quando
     `impression_share=null` (fix do bug #1 confirmado).
   - `severidade` gravada bate com a computada em `Build Deterministic
     Flags` (não com o que o LLM retornou, se divergir — logar a
     divergência, não travar o smoke por causa dela).
   - Se alguma das 2 campanhas do smoke tiver `volume_suficiente=false`:
     `insight` começa com "VOLUME INSUFICIENTE" e recomendações ≤ 1,
     não-agressiva.
4. Reportar no execution log (`2026-06-30-saude-digital-l3.0-execution-log.md`,
   nova seção) ou em log novo dedicado a esta entrega: execution ids, texto
   real do insight gerado, modelo usado, e confirmação de idempotência.

## 6. Fora de escopo (não fazer agora)

- Ativar Schedule / rodar em `phi_prod`.
- Integração com o loop de Demandas (ADR-22) a partir das recomendações.
- L3.1 (ad/adset, Gemini) e L3.2 (cliente).
- Nova query de tendência D-7 vs D-7 anterior (decisão: usar proxy TSS, ver
  framework §8).
