# [HANDOFF] Telemetria Mínima — Brief Lote 1 (Codex)

**De:** Cérebro Estratégico (Claude)
**Para:** Codex
**Data:** 2026-06-04
**Branch alvo:** `claude/agentic-agency-planning-KwJEw` (mesma desta sessão)

---

## 0. Objetivo do Lote 1

Implementar **1 workflow n8n** que coleta 16 métricas operacionais do
PHI uma vez por dia e:
1. **Grava cada métrica como uma linha** no DB Notion `PHI - Snapshots
   de Telemetria` (modelo chave-valor)
2. **Posta um digest formatado no Telegram** do operador (chat_id
   `930549271`)

Sem agente IA neste lote (cálculo determinístico). Flash entra no Lote 3.

---

## 1. Pré-leitura obrigatória

Antes de tocar código, leia (em ordem):

1. **Strawman v0.2:** `docs/strategic-planning/telemetria-minima/BRUTO-v0.1-design.md`
   *(arquivo está nomeado v0.1 mas cabeçalho diz v0.2 — não renomeei pra preservar histórico git)*
2. **Padrões inegociáveis do Lote 1 Onboarding:** seção 5 da âncora
   `[HANDOFF] Curador — Âncora da Área`
   (https://www.notion.so/375b65e5c72b810f8f4be50873daedbe)
3. **Doc mestre:** `docs/strategic-planning/ESTADO-DO-PROJETO.md`
   §12 (notas operacionais)
4. **Padrão de digest Telegram:** workflow A2.7 (`Onb - Digest Diário
   Onboarding`) — mesmo formato HTML, mesma string única.

---

## 2. Recursos prontos no Notion

| Recurso | URL | data_source_id / page_id |
|---|---|---|
| DB Snapshots de Telemetria (destino da escrita) | https://www.notion.so/0e1cffdef0654580828d5f1478c50077 | `32404398-6751-4bbd-be28-4ad591e22bf7` |
| DB Clientes Onboarding (leitura) | https://www.notion.so/04e34a62624b484cbda546604564b88c | data_source dentro |
| DB Etapas Onboarding (leitura) | https://www.notion.so/6eb4565b4f1d498c8b2978e0c80880fd | data_source dentro |
| DB Mudanças de Escopo (leitura) | https://www.notion.so/507d18009622435ba3f17b24d191762d | `bb56ddca-dfad-4aa5-9227-3cf86207bc40` |
| DB Catálogo (leitura) | https://www.notion.so/bd8df5b982ad4f00a8ae56d687db819e | `07623177-4d75-4870-bdc0-4ecd365392a7` |
| DB Decisões/ADR (leitura) | https://www.notion.so/237a5e127f5142eeb9c04ddfb16b6400 | data_source dentro |
| DB Aprendizados (leitura) | https://www.notion.so/2e49a766781841fda4a2681d358bc98f | `aa5d49b2-c2f6-40bc-b883-5cd350a982c7` |

**Credentials n8n:** reusar as do Lote 1 Onboarding (padronizadas no
passo 2 do onb-promo). Telegram chat_id `930549271`.

---

## 3. Configuração do workflow

- **Nome n8n:** `WF-DOC-Telemetria-Diaria`
- **Tags n8n:** `phi`, `documentacao`, `telemetria`
- **Schedule Trigger:** diário **08:30 BR** (`America/Sao_Paulo`)
- **Não tem webhook trigger.** Só Schedule.

---

## 4. Nodes esperados (alta granularidade)

### N1 — Schedule Trigger
Cron diário 08:30 BR.

### N2 — Set execution_id + tenant_id
- `execution_id = "EXEC-TELEMETRIA-" + $execution.id`
- `tenant_id = "phi-agencia"` (single-tenant default)
- `data_snapshot = $now.toISOString().slice(0,10)` (YYYY-MM-DD)
- `versao_consulta = "v1.0"`

### N3-N9 — Notion queries (paralelo onde possível)
Uma query por DB de leitura, com filtros mínimos:
- Clientes: todos com `Status ≠ Arquivado` (ajustar conforme schema real do DB)
- Etapas: idem
- Mudanças de Escopo: todas
- Catálogo: todas
- Decisões/ADR: todas
- Aprendizados: todos

**Atenção:** se algum DB tiver paginação (>100 linhas), implementar
loop ou aumentar page_size.

### N10 — Code: calcula as 16 métricas
jsCode **ASCII-safe** (`ç` em vez de `ç`). Sem libs externas
(usa funções nativas de Date e Array).

Estrutura sugerida:
```javascript
const items = $input.all();
const clientes = items.find(i => i.json.source === 'clientes').json.data;
const etapas = items.find(i => i.json.source === 'etapas').json.data;
// ... idem para os outros

const hoje = new Date();
const d1 = new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000);
const d7 = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
const d30 = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

const metricas = [];

// O1 Briefings entrados
metricas.push({
  area: 'Onboarding',
  chave: 'onb.briefings_intake',
  janela: 'D-1',
  valor_num: clientes.filter(c => new Date(c.created_time) >= d1).length,
  fonte: 'DB Clientes (created_time >= D-1)',
});
// ... e assim por diante para as 16 métricas, com suas janelas.

return metricas.map(m => ({ json: m }));
```

**Lista completa das 16 métricas + chaves + fontes:** ver §4 do strawman.

Convenção de chaves:
- Prefixo: `onb.` `cur.` `glb.`
- Snake_case, descritivo
- Exemplos: `onb.briefings_intake`, `onb.classificacao_aprovado`,
  `onb.classificacao_rejeitado`, `onb.etapas_concluidas`,
  `onb.etapas_abertas`, `onb.etapas_atrasadas`, `onb.falhas_telegram`,
  `onb.falhas_evolution`, `onb.gate_pass`, `onb.gate_fail`,
  `onb.tempo_total_onboarding_dias` (O8),
  `cur.mes_abertas`, `cur.mes_aprovadas`, `cur.tempo_medio_aplicacao_dias`,
  `cur.rodadas_qa_medias`,
  `glb.artefatos_vivos`, `glb.adrs_aceitos`, `glb.aprendizados_aplicados`,
  `glb.workflows_ativos`.

### N11 — Notion: cria N linhas no DB Snapshots (batch)
Para cada métrica retornada pelo N10, criar uma página no DB Snapshots:
- `Título` = `{data} — {Área} — {chave}` (ex: `2026-06-04 — Onboarding — onb.briefings_intake`)
- `Data` = `data_snapshot`
- `Área` = valor da métrica
- `Chave da métrica` = `chave`
- `Janela` = `janela`
- `Valor número` = `valor_num` (se aplicável)
- `Valor texto` = `valor_txt` (se aplicável)
- `Fonte` = `fonte`
- `Versão da consulta` = `v1.0`
- `execution_id` = do N2
- `tenant_id` = `phi-agencia`

**Idempotência:** antes de criar, query no DB Snapshots filtrando
`Data = data_snapshot AND Chave da métrica = chave AND Janela = janela`.
Se já existe, pular. (Evita duplicatas se o workflow rodar 2x no mesmo dia.)

### N12 — Code: monta digest HTML
String única, HTML escape básico (`& < >`). Modelo:

```html
<b>PHI Telemetria — {data_snapshot} 08:30</b>

<b>Onboarding</b> (prod desde 2026-05-29)
- Briefings: D-1: {O1.d1} | D-7: {O1.d7} | D-30: {O1.d30}
- A2.3 Class.: {O2.aprov} Aprov | {O2.rej} Rej (D-30)
- Etapas: {O3.concl} concl | {O3.abertas} abertas | {O4} atrasadas
- Falhas Telegram (D-7): {O5} {ALERTA_SE_>0}
- Falhas Evolution (D-7): {O6} {ALERTA_SE_>0}
- A2.10 Gate: {O7.pass} PASS | {O7.fail} FAIL (D-7)
- Tempo médio onboarding: {O8} dias (D-30)

<b>Curador</b>
- MEs: {C1} abertas | {C2.aprov} aprovadas (D-30)
- Tempo médio Aberta → Aplicada: {C3} dias
- Rodadas Q&A médias: {C4}

<b>Global</b>
- Catálogo: {G1.vivos} Vivos | {G1.revisao} Em revisão | {G1.deprec} Deprecados
- ADRs: {G2.aceitos} Aceitos | {G2.planej} Em planej | {G2.revisao} Em revisão
- Aprendizados: {G3.aplicados} Aplicados | {G3.analise} Em análise | {G3.novos} Novos
- Workflows ativos: {G4}

<a href="https://www.notion.so/0e1cffdef0654580828d5f1478c50077">📊 DB Snapshots</a>
```

Onde `{ALERTA_SE_>0}` = `⚠️` se o valor > 0; vazio caso contrário.

### N13 — Telegram: posta digest
- `chat_id`: `930549271`
- `text`: string única do N12
- `parse_mode`: `HTML`

### N14 — Set status final
- Sucesso geral do workflow registrado em log (futuro sink BQ).
- Não precisa atualizar nada no Notion neste lote.

---

## 5. Padrões inegociáveis aplicados

1. ✅ jsCode ASCII-safe (`ç` para `ç`, etc.)
2. ✅ Telegram `text` = string única, `parse_mode=HTML`, escape básico
3. ✅ Idempotência por (Data, Chave, Janela) na escrita no DB Snapshots
4. ✅ `execution_id` em toda linha gravada (auditoria)
5. ✅ `tenant_id = phi-agencia` em toda linha
6. ✅ `Versão da consulta = v1.0` em toda linha (bump quando regra mudar)
7. ✅ Re-export sanitizada (chat_id, secret, API keys redacted)
8. ✅ Guardrails na suíte de testes: ver §6

---

## 6. Testes/smoke (entregar junto com o workflow)

### Suíte ps1 (`telemetria_tests.ps1`)
Igual padrão dos `promotion_tests.ps1`:

1. **Estrutura:** assert presença dos 14 nodes acima
2. **Wiring:** assert N1 → N2 → (N3-N9 paralelo) → N10 → N11 → N12 → N13 → N14
3. **Schedule:** assert cron 08:30 BR
4. **Idempotência:** assert query antes do create-pages
5. **Telegram:** assert `parse_mode=HTML` e `chat_id=930549271`
6. **execution_id:** assert presença em todas as linhas criadas

### Smoke E2E
1. Acionar manualmente via n8n UI (botão "Execute Workflow")
2. Verificar:
   - DB Snapshots recebeu **16 linhas** com Data = hoje
   - Cada linha tem `tenant_id`, `execution_id`, `Versão da consulta` populados
   - Telegram chegou no chat `930549271` (Olavo confirma)
3. Re-execução no mesmo dia: **0 linhas novas** (idempotência), Telegram **não posta** segundo digest

### Cleanup pós-smoke
Não há cleanup neste lote (snapshots são dados úteis, ficam).

---

## 7. Entregáveis

1. **Arquivo JSON do workflow:** `onboarding/telemetria/workflow.json`
   *(sob `onboarding/` por convenção do repo — telemetria não tem pasta
   própria ainda; pode criar `docs/telemetria/` ou reusar `onboarding/`)*
2. **Suíte ps1:** `onboarding/telemetria_tests.ps1`
3. **Sandbox logs:** `onboarding/telemetria/sandbox_export.json`
4. **Subpágina no Registro de Workflows n8n** (Notion):
   https://www.notion.so/354b65e5c72b815bb166ff8ea26861ae
   - Seguir estrutura obrigatória: Nome / ID / Finalidade / Principais
     nodes / Histórico

---

## 8. Commit pattern

Padrão dos commits do Lote 1/2 Onboarding:

```
telemetria-minima a01: workflow WF-DOC-Telemetria-Diaria (16 metricas)

<descricao do que foi feito>

https://claude.ai/code/session_016ynQo7kzoCN4hP5nmZnV2L
```

---

## 9. Revisão e merge

- **Antigravity revisa** node-a-node antes de publicar (mesma regra
  do Lote 1 Onboarding).
- **Olavo aprova** publicação em produção.
- **NÃO editar workflow de produção na UI** sem re-importar a versão
  canônica do repo antes (lição #13 / passos 7d/7e/7f do Onboarding).

---

## 10. Tensões e perguntas resolvidas

- **A2.7 sobreposição:** A2.7 continua narrativo (Flash); Telemetria
  é quantitativo (Schedule, números). Coexistem em v0.2. Revisitar
  no Lote 3.
- **Schema do DB Clientes / Etapas:** se algum campo previsto no
  cálculo não existir (ex: campo "data_gate" no DB Clientes), reporte
  ao Cérebro Estratégico ANTES de inventar substitutos.
- **Datas:** todas em ISO-8601 (`YYYY-MM-DD`). Timezone consistente em
  America/Sao_Paulo.

---

## 11. O que NÃO fazer

- ❌ Não usar libs externas (mantenha tudo em jsCode nativo).
- ❌ Não usar Gemini Flash neste lote (vem no Lote 3).
- ❌ Não editar workflows do Onboarding (eles só são lidos via API).
- ❌ Não criar prompt de agente IA — workflow puro.
- ❌ Não escrever em outro DB além de `PHI - Snapshots de Telemetria`.
