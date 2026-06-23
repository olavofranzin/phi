# Relatório Antigravity Rodada 1 — Saúde Digital L2 (Error Handler global)

**Data:** 2026-06-23  
**Veredito Macro:** **REJEITADO**  
**Próximo Passo:** Executar brief Codex de fix `a02` (incluso abaixo).  

O escopo do Lote 2 foi verificado com sucesso em relação aos critérios estruturais e de sanitização. No entanto, foram detectadas duas falhas que afetam a estabilidade e a corretude em runtime, classificando o veredito macro como **REJEITADO**.

---

## 1. Avaliação dos 10 Itens de Revisão Independente

### Item 1 — Coerência semântica do schema `t28_errors`
- **Status:** **PASS**
- **Justificativa:** Os nomes das colunas no DDL estão perfeitamente alinhados com os campos do `[ErrHdl] BQ Insert t28_errors`. A granularidade do `error_id` usando a UUID de runtime ou o fallback secuencial no Code node garante unicidade sem ambiguidades. A normalização de `severity` na preparação do contexto previne drifts de string. A coluna `resolved` iniciada como `null` representa de forma limpa o ciclo de vida inicial.

### Item 2 — Risco de race no `[Err] Roteador Payload` multi-fan-in
- **Status:** **PASS com Observação**
- **Justificativa:** Diferente de fluxos do caminho feliz (onde múltiplos caminhos concorrentes exigem um nó Merge intermediário), os error outputs são branches condicionais excludentes. Em runtime, no máximo um error output será ativado por execução com erro. Inserir um nó Merge configurado com `numberInputs: 15` faria com que o n8n aguardasse indefinidamente pelos outros 14 caminhos que nunca executarão, travando o fluxo. O fan-in direto no Code node é o comportamento correto neste cenário.

### Item 3 — Payload do Execute Workflow
- **Status:** **FALHA**
- **Justificativa:** No jsCode do `[Err] Roteador Payload`, o script lê `$('Set dados').first().json` e `$('Code prepara datas para extração').first().json`. Se o erro ocorrer em um nó inicial (ex: `Get database clientes` ou `Get database campanhas` falham), o nó `Set dados` nunca terá executado na sessão corrente. Tentar referenciá-lo via `$()` no n8n resultará em uma exceção de runtime (`NodeNotExecuted`), travando a execução do próprio Roteador de erros e causando um falha silenciosa geral (sem t28_errors, sem Notion e sem Telegram).
- **Correção Mínima:** Envolver o acesso aos dados em uma função utilitária com bloco try-catch:
  ```javascript
  const safeGetNodeJson = (name) => {
    try {
      return $(name).first().json;
    } catch (e) {
      return null;
    }
  };
  ```
  E então substituir os acessos diretos por:
  ```javascript
  client_id: safeGetNodeJson('Set dados')?.id_client ?? null,
  business_date: safeGetNodeJson('Code prepara datas para extração')?.date_end ?? null,
  ```

### Item 4 — Refactor `readOrThrow` no piloto CLI-4
- **Status:** **PASS**
- **Justificativa:** No cenário de ausência de tráfego pago para o cliente CLI-4, a chamada `HTTP Request GA4 Pago (LPs)` retorna um status `200 OK` com payload contendo metadados normais e array de linhas vazio (`rows: []`). Como o retorno é um objeto válido (e não null/undefined), a validação `readOrThrow` passa sem falhar. Erros reais de API ou conexão dispararão corretamente o throw, que é o comportamento esperado.

### Item 5 — Smoke triste com mutação intencional do BQ Read
- **Status:** **PASS com Observação**
- **Justificativa:** O plano de rodar o smoke triste por meio de alteração manual de coluna no SQL do BQ apresenta risco de fadiga/esquecimento operacional.
- **Observação (L2.5+):** Para próximos testes tristes, priorizar a mutação temporária de credenciais (trocando para uma inválida) ou apontar o dataset/tabela para um ID inexistente no parâmetro do node. Isso é visualmente identificável na interface do n8n e reduz o risco de corrupção sintática do SQL ao reverter.

### Item 6 — Telegram credencial e chat_id
- **Status:** **PASS**
- **Justificativa:** O helper `fromEnvOrRedacted` protege adequadamente os dados no commit do git exportando placeholders como `<TELEGRAM_CHAT_ID_redacted>`. A versão ativa do servidor mantém os dados configurados em banco de forma isolada, não ocorrendo vazamentos ou drifts indesejados.

### Item 7 — Notion Demandas schema runtime
- **Status:** **PASS com Observação**
- **Justificativa:** As propriedades hardcoded existem no Notion e estão alinhadas com o uso em outros fluxos (como no daily entry).
- **Observação (L2.5+):** Alterações no Notion de novos campos requeridos farão com que o nó de criação de demanda falhe. Como o Error Handler é crítico, recomenda-se configurar um Error Workflow nativo do n8n (Settings) apontando para um handler de segurança mínimo para monitorar falhas no próprio sub-WF.

### Item 8 — Sub-WF `active=false` no commit
- **Status:** **PASS**
- **Justificativa:** Confirmado que o arquivo exportado está com `"active": false` no git e inativo no live do n8n.

### Item 9 — Detecção de `source` por substring
- **Status:** **FALHA**
- **Justificativa:** Na lógica da função `sourceFor` do Roteador de erros, os testes para `ga4`, `gbp` e `clarity` precedem o teste para `bq`. Nós de inserção no BigQuery, como `[T28] BQ Insert t28_ga4_landing`, contêm o termo `'ga4'` no nome do nó. Por conta disso, serão falsamente classificados com o source `'ga4'` em vez de `'bq'`. Erros na camada de persistência BigQuery devem ser unificados como `'bq'`.
- **Correção Mínima:** Mover a verificação de `'bq'` para o topo das condicionais de substring da função `sourceFor` no Code node do Roteador.

### Item 10 — `node_name='unknown'` fallback
- **Status:** **PASS**
- **Justificativa:** O encadeamento de chaves utilizado é robusto e segue a convenção do n8n para saídas de erro. Manter o fallback `'unknown'` é correto, pois silenciar erros sem captura seria prejudicial à monitoração.

---

## 2. Próximos Passos e Brief Codex `a02`

Abaixo está o brief para o Codex realizar a correção cirúrgica dos dois problemas identificados.

--- COPY ---

Você é o **Codex do projeto PHI**. Sua tarefa é implementar o fix `a02` do Lote 2 Saúde Digital (Error Handler global), corrigindo os dois bugs funcionais levantados na revisão independente Antigravity do draft versionId `ae0e79af-753f-452c-9b05-c7866dbd7197` (workflow `4sdG2UKMCBuFq8xn`).

### Contexto
- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** HEAD mais recente (git fetch antes).

### Modificações Necessárias (WF `4sdG2UKMCBuFq8xn`)

#### 1. Corrigir jsCode do nó `[Err] Roteador Payload`
No workflow `4sdG2UKMCBuFq8xn`, atualize o parâmetro `jsCode` do nó `[Err] Roteador Payload` para introduzir um método utilitário que impeça erros `NodeNotExecuted` em nós não executados previamente, e mova a detecção de `'bq'` para o topo do mapping de substrings:

```javascript
const sourceFor = (nodeName) => {
  const n = String(nodeName || '').toLowerCase();
  if (n.includes('bq')) return 'bq';
  if (n.includes('google ads')) return 'google_ads';
  if (n.includes('ga4')) return 'ga4';
  if (n.includes('gbp')) return 'gbp';
  if (n.includes('clarity')) return 'clarity';
  if (n.includes('notion')) return 'notion';
  if (n.includes('telegram')) return 'telegram';
  return 'other';
};

const errMessage = (json) => json?.error?.message || json?.message || json?.errorMessage || json?.description || 'unknown';

const safeGetNodeJson = (name) => {
  try {
    return $(name).first().json;
  } catch (e) {
    return null;
  }
};

return $input.all().map((item) => {
  const j = item.json || {};
  const nodeName = j?.error?.node?.name || j?.node?.name || j?.nodeName || j?.node_name || 'unknown';
  return { json: {
    workflow_id: $workflow.id,
    workflow_name: $workflow.name,
    node_name: nodeName,
    source: sourceFor(nodeName),
    severity: 'error',
    error_message: String(errMessage(j)).slice(0, 1000),
    error_details: j,
    client_id: safeGetNodeJson('Set dados')?.id_client ?? null,
    business_date: safeGetNodeJson('Code prepara datas para extração')?.date_end ?? null,
    execution_id: 'EXEC-T28-' + $execution.id
  } };
});
```

#### 2. Atualizar Logs e Versionamentos
- Aplique a alteração via MCP `update_workflow` no workflow `4sdG2UKMCBuFq8xn`.
- Atualize o `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md` registrando o novo versionId do draft do agregador gerado após a modificação do Roteador.

### Critérios de Aceite
- [ ] O jsCode de `[Err] Roteador Payload` no n8n não lança exceções quando referenciando nós não executados.
- [ ] Erros em nós de BigQuery com nomes do tipo `[T28] BQ Insert t28_ga4_landing` retornam source `'bq'` e não `'ga4'`.
- [ ] O execution log reflete o novo draft versionId pós-edit `a02` do agregador.
- [ ] `validate_node_config` e `validate_workflow` no agregador passam sem regressões estruturais.

### Commit + Push
Realize o commit e envie para a branch `claude/agentic-agency-planning-KwJEw` com a mensagem:
`fix(saude-digital-l2): a02 - fix B1 exceptions no Roteador + B2 ordenacao source bq`

--- END COPY ---
