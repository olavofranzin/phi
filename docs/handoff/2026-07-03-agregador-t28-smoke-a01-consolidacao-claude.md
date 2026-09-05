# [CONSOLIDAÇÃO Claude] Smoke a01 do draft do Agregador T28 — veredito final

> **Entradas:** report Codex (`2026-07-03-agregador-t28-smoke-draft-codex-report.md`, commit `11994a1`).
> **Antigravity:** verificação independente NÃO realizada (cota semanal esgotada) — briefing permanece
> válido para o re-smoke a02; nesta rodada a consolidação usa só o report do Codex + as verificações
> que o próprio Claude fez direto no n8n/BQ em 2026-07-02/03.
> **Decisão recomendada ao Olavo: NÃO PUBLICAR o draft `cbd3568d`. Executar o brief a02.**

## 1. Veredito

**FAIL confirmado — e o FAIL é do MEU design (a01), não da execução do Codex.** O report é de alta
qualidade: evidência bruta completa, guardrails respeitados (parou antes da execução 2; draft/ativo
intocados — C6 PASS), workflows temporários arquivados, e ainda pegou 2 defeitos no próprio brief
(E1 com coluna inexistente; E2 com comparação TIMESTAMP×DATE).

## 2. Causa-raiz (fechada com a evidência do report)

A cadeia T28 roda no branch **done** do Loop — uma vez, após todas as iterações. O fix a01 assumiu
contexto "da iteração atual", que ali não existe:

| Sintoma no report | Explicação |
|---|---|
| `client_id NULL` nas 5 linhas | `nodeFirst('Loop')` devolveu item sem campos de negócio → `ctx.client_id` null → Normalizador emitiu `""` → builder converteu para `CAST(NULL AS STRING)` |
| Só `GADS-21149189736` (Barbearia), 5 datas | `@campaign_id` via `$('Set dados').item` no done-branch resolveu para UMA campanha → a leitura one-shot perdeu o Salão (esperado: 2 campanhas, ~12 linhas) |
| `source_ingestion_step` "não persistiu" | Comportamento CORRETO — a coluna existe só no stream de leitura; o SCHEMA do builder (e a tabela) não a têm. O critério C3 do brief a01 estava mal escrito |

## 3. Bônus de evidência do report (importa para o C2 do re-smoke)

O baseline B1 documenta a contaminação histórica que motivou o fix: **todas** as linhas das duas
campanhas trazem `meta_metrica_mae=5.2` e landing `lp-corte-barba` (contexto da Barbearia). Com o raw
tendo goals 3.5 (Salão) / 5.2 (Barbearia), o teste decisivo do a02 ganha valores esperados concretos:
pós-fix, Salão ≠ Barbearia; se saírem idênticas de novo, é FAIL.

## 4. Ações (já preparadas)

1. **Brief a02 atualizado** (`2026-07-03-agregador-t28-fix-a02-codex-brief.md`, com addendum §1.5):
   reverte âncoras, remove `@campaign_id`, contexto por campanha via mapa `id_google_camp`,
   Normalizador lê campos por campanha, E1/E2/C3 corrigidos, limpeza das 5 linhas `EXEC-T28-13697`.
2. Antigravity: quando a cota voltar, o brief de verificação original vale para o resultado do a02
   (não re-verificar o a01 — está superado).
3. Aprendizado a cristalizar (candidato ao DB Aprendizados): *"Cadeia pós-Loop (done-branch) não tem
   'item atual' — contexto por entidade em cadeia one-shot deve vir de mapa keyed por id de negócio,
   nunca de âncora posicional"*. Segundo caso da família `.first()/.item` (o primeiro foi o L2
   cirúrgico do Error Handler).
