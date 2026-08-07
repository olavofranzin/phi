# [BUGFIX] Telemetria Diária — Correções Pré-Publish (Codex)

**De:** Cérebro (Antigravity)
**Para:** Codex
**Data:** 2026-06-05
**Branch alvo:** `claude/agentic-agency-planning-KwJEw`
**Arquivo alvo:** `onboarding/telemetria/workflow.json`
**Revisão:** Antigravity pós-fix

---

## Contexto

O Antigravity review de `b15e8dd` identificou **2 bugs bloqueadores** que impedem o
publish do WF-DOC-Telemetria-Diaria. As correções abaixo devem ser aplicadas ao
`workflow.json` e re-validadas com a suíte `telemetria_tests.ps1`.

---

## BUG-1 — Digest silenciado após Dia 1 (crítico)

### Causa raiz

`[Telemetria] Calcular Metricas` retorna `toCreate.map(...)`. Quando todos os 19
snapshots do dia já existem, `toCreate = []` → o nó retorna array vazio → n8n
interrompe o branch → `Montar Digest HTML`, `Enviar Telegram` e `Set Status Final`
nunca executam. Na prática o digest só seria enviado na **primeira execução do dia**.

### Fix — Reestruturar com nó IF + Merge

Adicionar dois nós entre `[Telemetria] Calcular Metricas` e `[Telemetria] Criar Snapshot`:

#### Novo nó: `[Telemetria] IF Tem Novas Linhas`
- Tipo: `n8n-nodes-base.if`
- Condição: `{{ $json.linhas_novas > 0 }}`
- True branch → `[Telemetria] Criar Snapshot`
- False branch → `[Telemetria] Merge Pos-Snapshot`

#### Novo nó: `[Telemetria] Merge Pos-Snapshot`
- Tipo: `n8n-nodes-base.merge`
- Mode: `passThrough` (passa o primeiro input que chegar)
- Entrada 0: saída de `[Telemetria] Criar Snapshot`
- Entrada 1: saída false de `[Telemetria] IF Tem Novas Linhas`
- Saída → `[Telemetria] Montar Digest HTML`

#### Alterar retorno de Calcular Metricas

Substituir o bloco final:

```js
// ANTES
const toCreate = metricas.filter((m) => !existingKeys.has(m.idempotency_key));
return toCreate.map((m) => ({ json: { ...m, metricas_do_dia: metricas, linhas_novas: toCreate.length } }));
```

```js
// DEPOIS
const toCreate = metricas.filter((m) => !existingKeys.has(m.idempotency_key));
const linhas_novas = toCreate.length;
// Sempre emitir ao menos um item para que IF/Merge disparem o digest
const itemsParaCriar = toCreate.length > 0
  ? toCreate.map((m) => ({ json: { ...m, metricas_do_dia: metricas, linhas_novas } }))
  : [{ json: { sentinel: true, metricas_do_dia: metricas, linhas_novas: 0, data_snapshot, execution_id, tenant_id, versao_consulta } }];
return itemsParaCriar;
```

> **Por que funciona:** o IF lê `linhas_novas`. Se 0, vai pelo false branch direto ao
> Merge. O Merge passa o item adiante para Montar Digest HTML, que lê `metricas_do_dia`
> do primeiro item (sentinel ou real) — o digest sempre é enviado.
> O nó `Criar Snapshot` só executa quando `linhas_novas > 0`.

---

## BUG-2 — `parse_mode=HTML` literal no corpo do Telegram (cosmético-crítico)

### Causa raiz

No `[Telemetria] Montar Digest HTML`, a array `linhas` termina com:
```js
'<a href="https://www.notion.so/0e1cffdef0654580828d5f1478c50077">DB Snapshots</a>',
'',
'parse_mode=HTML'   // ← isto aparece como texto na mensagem Telegram
```

O `parse_mode` já está correto no nó `Enviar Telegram` como `additionalFields.parse_mode`.

### Fix

Remover a última linha `'parse_mode=HTML'` da array `linhas`:

```js
// ANTES (final da array linhas)
  '<a href="https://www.notion.so/0e1cffdef0654580828d5f1478c50077">DB Snapshots</a>',
  '',
  'parse_mode=HTML'
];
```

```js
// DEPOIS
  '<a href="https://www.notion.so/0e1cffdef0654580828d5f1478c50077">DB Snapshots</a>'
];
```

---

## Atenção (não bloqueante, documentar no commit)

**A1 — Acento em `Chave da métrica`:**
- Leitura em Calcular Metricas: `props['Chave da métrica']` (com acento ✅)
- Escrita em Criar Snapshot: `"key": "Chave da metrica|rich_text"` (sem acento ⚠️)

Se o nome real do campo Notion for "Chave da métrica" (com acento), corrigir a chave
de escrita para `"Chave da métrica|rich_text"`. Verificar no DB antes de publicar.

---

## Checklist de validação pós-fix

1. `telemetria_tests.ps1` continua passando sem erros
2. `workflow.json` tem os dois novos nós (`IF Tem Novas Linhas` + `Merge Pos-Snapshot`)
3. O nó `Criar Snapshot` está conectado ao branch `true` do IF
4. O `false` branch do IF chega ao Merge
5. A saída do `Criar Snapshot` chega ao Merge
6. A saída do Merge chega ao `Montar Digest HTML`
7. A string `'parse_mode=HTML'` não existe mais na array `linhas`
8. O retorno de Calcular Metricas sempre emite >= 1 item (com ou sem `sentinel: true`)
9. `active: false` ainda presente
10. ASCII clean (sem literais não-ASCII no jsCode)

Commit message sugerido:
```
telemetria-minima bugfix: digest sempre dispara + remove parse_mode literal
```

Após commit + push, reportar o SHA para Antigravity verificar.
