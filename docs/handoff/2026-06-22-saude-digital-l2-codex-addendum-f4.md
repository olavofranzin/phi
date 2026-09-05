# Addendum F4 — completar refactor `safe()` no Adaptador Input T28

> **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Brief mãe:** `docs/handoff/2026-06-22-saude-digital-l2-codex-brief.md`
> **Entrega anterior:** commit `e859b14` (scaffold) — F1/F2/F3 concluídos, F4 parcial.

## O que falta

§6 do brief mãe — **substituir `safe()` por `readOrThrow` / `safeOptional` no jsCode do node `Adaptador Input T28`** (WF `4sdG2UKMCBuFq8xn`).

Foi adicionado `onError: continueErrorOutput` + conexão error output ao
roteador no scaffold, mas o jsCode interno do Adaptador NÃO foi tocado.
Sem o refactor, o `safe()` antigo continua engolindo bugs estruturais
em runtime e o smoke triste não dispara pelo caminho esperado.

## Implementação

1. Adicionar 2 helpers no topo do jsCode:

   ```javascript
   function readOrThrow(label, fn) {
     try {
       const v = fn();
       if (v === null || v === undefined) {
         throw new Error(`[T28-ADAPTADOR] fonte estrutural ausente: ${label}`);
       }
       return v;
     } catch (e) {
       throw new Error(`[T28-ADAPTADOR] falha lendo ${label}: ${e.message}`);
     }
   }

   function safeOptional(label, fn, defaultValue = null) {
     try {
       return fn() ?? defaultValue;
     } catch (e) {
       console.log(`[T28-ADAPTADOR] opcional ${label} ausente: ${e.message}`);
       return defaultValue;
     }
   }
   ```

2. Substituir as chamadas `safe(...)` existentes pelos novos helpers
   conforme tabela §6.1 do brief mãe (reproduzida abaixo):

| Fonte | Helper |
|---|---|
| `$('Set dados').item.json` | `readOrThrow('Set dados', () => ...)` |
| `$('Get database campanhas').item.json.properties` | `readOrThrow` |
| `$('Get database clientes').item.json.properties` | `readOrThrow` |
| `$('Code prepara datas para extração').item.json` | `readOrThrow` |
| `$('Get database conjuntos').all()` | `safeOptional` (cliente pode não ter) |
| `$('Get database anuncios').all()` | `safeOptional` |
| `$('[T28] BQ Read raw_campaign_data').all()` | `readOrThrow` (era o bug do L1!) |
| `$('Google Ads Conjuntos (GAQL)').first()` | `safeOptional` (PMAX sem adset) |
| `$('Google Ads Anúncios (GAQL)').first()` | `safeOptional` |
| `$('HTTP Request GA4 Orgânico').first()` | `readOrThrow` |
| `$('HTTP Request GA4 Pago (LPs)').first()` | `readOrThrow` |
| `$('HTTP Request GBP').first()` | `readOrThrow` |
| `$('HTTP Request Clarity').first()` | `readOrThrow` |
| `$('Fetch Meta Ads').first()` | `safeOptional` (cliente pode não ter Meta) |
| `$('[T28] Search Terms Features').first()` | `safeOptional` (placeholder hoje) |

3. Aplicar via MCP `update_workflow` no `4sdG2UKMCBuFq8xn`. Operação:
   `setNodeParameter` no path `/jsCode` (ou `updateNodeParameters` com
   `replace: false` substituindo o `parameters.jsCode` inteiro).

4. Atualizar `docs/handoff/2026-06-22-saude-digital-l2-execution-log.md`:
   - Marcar F4 como concluído (remover do bloco "Warnings / pendencias").
   - Registrar novo draft versionId pós-edit do `4sdG2UKMCBuFq8xn`.
   - Confirmar `validate_node_config` PASS no node modificado.

5. Commit cirúrgico com mensagem:
   ```
   feat(saude-digital-l2): completar F4 — refactor safe() no Adaptador Input T28

   readOrThrow nas 8 fontes estruturais (Set dados, Get database
   campanhas/clientes, Code prepara datas, BQ Read T28, GA4 Orgânico,
   GA4 Pago, GBP, Clarity); safeOptional nas 7 opcionais (Get database
   conjuntos/anuncios, GAQL Conjuntos/Anuncios, Fetch Meta, Search Terms
   Features). Pronto para pré-revisão Claude (§10 do brief mãe).
   ```

6. Push para `claude/agentic-agency-planning-KwJEw` e responder ao Olavo.

## Checks rápidos

- jsCode do Adaptador NÃO contém mais `safe(` (só `readOrThrow` ou `safeOptional`).
- Helpers no topo (antes do `const out = []`).
- `validate_node_config` PASS.
- Nenhum outro node tocado (só o Adaptador).
- Nenhuma mudança topológica (só substituição de função no jsCode).
