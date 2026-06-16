# Prompt Codex — Telemetria Lote 1 `a03` (B3 + B4 + B2 recomendado)

> Copie o bloco abaixo (entre as linhas `--- COPY ---`) e cole no Codex.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: implementar correções do veredito Antigravity REJEITADO sobre o WF-DOC-Telemetria-Diaria, gerando entrega `a03`.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **HEAD esperado:** `69d64e2` (ou superior — sempre faça `git fetch` antes)
- **Commits relevantes:**
  - `b15e8dd` — Telemetria `a01` (entrega original)
  - `327872d` — Pré-revisão Claude (G1 fix). **NÃO retoque G1; já corrigido.**
  - `ed3d4be` — Brief Antigravity
  - `69d64e2` — Brief Codex `a03` + retificação Aprendizado #19

## Brief detalhado (PRÉ-LEITURA OBRIGATÓRIA)

`docs/handoff/2026-06-05-telemetria-lote1-codex-fix-brief.md`

Leia o brief inteiro antes de tocar código. Ele tem o checklist completo, diffs concretos e justificativa de cada mudança.

## O que implementar (resumo)

1. **B3 — sentinel pattern** no metricCode (`generate_export.js` linha 131): garantir que sempre retorna ≥1 item, com flag `sentinel: true` quando idempotência zera `toCreate`.

2. **B4 — acento em "Chave da métrica"** no Criar Snapshot (`generate_export.js` linha 242): mudar `'Chave da metrica|rich_text'` → `'Chave da métrica|rich_text'` (com acento Unicode `é`). Bate com a leitura (linha 70).

3. **B2 — 16 nodes com IF + Merge (RECOMENDADO)**: adicionar `[Telemetria] IF Tem Novas Linhas` (filtra `linhas_novas > 0`) e `[Telemetria] Merge Pos-Snapshot` (passthrough convergente). Resolve B3 elegantemente — sem isso, o sentinel cria linha fantasma no DB.

4. **Atualizar `telemetria_tests.ps1`** pra refletir B2 + B3 + B4 (16 nodes, sentinel snippets, Chave da métrica com acento, IF outputs validados).

5. **Regenerar JSONs** via `node onboarding/telemetria/generate_export.js`.

6. **Executar suíte PS1** — deve passar antes do commit.

## Padrões inegociáveis (Lote 1 Onboarding)

- jsCode **ASCII-safe** (`é` em vez de literal `é`)
- Telegram `text` = string única, `parse_mode: HTML` no node Telegram
- Idempotência por chave (data|chave|janela)
- `execution_id`, `tenant_id`, `versao_consulta` em cada métrica
- Re-export sanitizada: `<TELEGRAM_CHAT_ID_redacted>`, `<credential_id_redacted>`, `<TELEGRAM_CREDENTIAL_ID_redacted>`
- Sem secrets em arquivo (`AIza|secret|api_key|token`)
- Sem mojibake (`NÃ|Ã£|Ã§|Ã©|Ã³`)
- UTF-8 sem BOM
- Mantém `active: false` (não publica em prod ainda)

## NÃO fazer

- ❌ Não retoque `digestCode` (G1 já corrigido em `327872d`)
- ❌ Não mude a contagem de 19 `add()` (decisão consolidada)
- ❌ Não introduza Gemini Flash (Lote 3)
- ❌ Não toque workflows do Onboarding ou outras áreas
- ❌ Não mude DB target (Snapshots `32404398-6751-4bbd-be28-4ad591e22bf7`)

## Critérios de aceite

- [ ] B3 sentinel pattern implementado no metricCode
- [ ] B4 acento Chave da métrica corrigido na escrita
- [ ] B2 (se aplicado): 16 nodes com IF + Merge wiring correto
- [ ] PS1 atualizada e **verde** (`pwsh onboarding/telemetria_tests.ps1`)
- [ ] `workflow.json` ≡ `sandbox_export.json` estruturalmente
- [ ] Sem secrets, sem mojibake, UTF-8 sem BOM
- [ ] `active: false` mantido

## Commit + push + verificação obrigatória pós-push

```bash
git add onboarding/telemetria/
git commit -m "telemetria-minima a03: B3 sentinel + B4 acento + B2 IF/Merge 16 nodes"
git push -u origin claude/agentic-agency-planning-KwJEw

# Verificação SHA pós-push (Aprendizado #19 retificado):
git fetch origin claude/agentic-agency-planning-KwJEw
git log origin/claude/agentic-agency-planning-KwJEw --oneline -1
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA — INVESTIGAR"
```

Reporte o SHA do commit final no fim da entrega. Antigravity rodada 2 só é acionada depois disso.

--- END COPY ---
