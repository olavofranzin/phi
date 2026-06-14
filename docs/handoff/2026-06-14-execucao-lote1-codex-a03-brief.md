# Brief Codex — Execução Lote 1 `a03` (reverter B2 pro padrão ADR-19)

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex. Fix cirúrgico, 1 ponto único.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a03` da Execução Lote 1 — reverter a regressão B2 introduzida pelo `a02` (`f581f89`). Causa: brief Claude `a02` mandou usar `$env`, mas isso viola **ADR-19 Aceito 2026-05-28** (runtime n8n bloqueia `$env` em Code nodes). Webhook nunca autoriza no `a02`.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** `git fetch origin claude/agentic-agency-planning-KwJEw` antes; provavelmente HEAD `f581f89` ou commit de doc posterior
- O `a02` (`f581f89`) **passou** estruturalmente (sandbox==workflow, sem placeholder, B1 + B3 corretos) **mas REJEITADO** pela pré-revisão Claude por causa do `$env`

## ADR-19 — Aceito 2026-05-28

**Decisão canônica:** build-time injection para config não-secreta. **Secret** sempre em credencial n8n nomeada **OU** valor **literal injetado** no jsCode na hora de montar o workflow ativo, com sanitização para `<NOME_redacted>` no repo. O workflow ativo no n8n contém o valor literal; o JSON versionado contém o placeholder redacted.

**Por quê:** runtime n8n bloqueia `$env` em Code nodes (`N8N_BLOCK_ENV_ACCESS_IN_NODE`). `process.env` também falha. API `$vars` retornou 403 (indisponível). Logo: secret literal injetado no build é o único caminho que funciona em runtime sem abrir `$env` global (que seria risco de segurança).

URL Notion do ADR-19: https://app.notion.com/p/36eb65e5c72b8136b400da8a8daf99d3

## Fix `a03`

### 1. `generate_export.js` — restaurar constante de build-time

Adicionar de volta:

```js
const EXEC_WEBHOOK_KEY = '<EXEC_WEBHOOK_KEY_redacted>';
```

junto às outras constantes (`CHAT_ID`, `DB_DEMANDAS`, `DB_SOPS`, `DB_EVENTOS`).

### 2. `intakeValidateKey` — reverter pro padrão `a01` adaptado

Trocar o jsCode atual:

```js
// a02 — viola ADR-19
const expected = $env.WEBHOOK_SECRET_EXECUCAO || '';
const first = $input.first();
const headers = first?.json?.headers || {};
const got = headers['x-pacing-secret'] || headers['X-Pacing-Secret'] || '';
return [{ json: { ...first.json, ok: expected !== '' && got === expected, secret_present: !!got } }];
```

por:

```js
// a03 — conforme ADR-19 (build-time injection)
const EXEC_WEBHOOK_KEY = '${EXEC_WEBHOOK_KEY}';
const first = $input.first();
const headers = first?.json?.headers || {};
const lower = {};
for (const [key, value] of Object.entries(headers)) lower[String(key).toLowerCase()] = value;
const got = String(lower['x-pacing-secret'] || '').trim();
return [{ json: { ...first.json, ok: EXEC_WEBHOOK_KEY !== '<EXEC_WEBHOOK_KEY_redacted>' && got === EXEC_WEBHOOK_KEY, secret_present: !!got, ok_pre_inject: got !== '' && EXEC_WEBHOOK_KEY !== '' } }];
```

> Observação: o check `EXEC_WEBHOOK_KEY !== '<EXEC_WEBHOOK_KEY_redacted>'` impede que o workflow autorize qualquer coisa se o build não injetou (ex: alguém importar o JSON do repo direto sem passar pelo build). Robusto.

### 3. Manter:
- Header esperado: `x-pacing-secret` (Olavo já vai configurar nesse formato; padrão semântico bom)
- Output preserva `ok` (consumido pelo IF Secret Valido?)
- Branch false continua retornando 401 (manter o que o a02 fez)
- Demais checks do a02 (B1 rich_text, B3 priorityFor com classe_sla) **intactos**
- PHI_EVENTOS data source ID `3423df0d-77df-4834-bdda-c08ddbae40ff` **intacto**
- Documentação: substituir nota sobre `WEBHOOK_SECRET_EXECUCAO` env var no `notion_phi_eventos_schema.md` por nota sobre build-time injection conforme ADR-19 (operador roda script de build com chave real antes do deploy)

### 4. Atualizar ps1

Substituir o check que validava `WEBHOOK_SECRET_EXECUCAO`/`$env` por:

```powershell
# ADR-19: webhook secret via build-time injection, não $env
$intakeRaw = [System.IO.File]::ReadAllText($intakeWf, [System.Text.Encoding]::UTF8)
if ($intakeRaw -match '\$env\.') {
  throw 'Intake-Pacing must not use $env (violates ADR-19; runtime n8n blocks $env)'
}
if (-not $intakeRaw.Contains('<EXEC_WEBHOOK_KEY_redacted>')) {
  throw 'Intake-Pacing must use <EXEC_WEBHOOK_KEY_redacted> placeholder (ADR-19 build-time injection)'
}
if (-not $intakeRaw.Contains('x-pacing-secret')) {
  throw 'Intake-Pacing must check x-pacing-secret header'
}
```

E manter os checks do a02 (B1 rich_text, B3 classe_sla, placeholder PHI_EVENTOS).

## Critérios de aceite

- [ ] `$env` removido COMPLETAMENTE do jsCode do Intake (e dos outros 2 workflows pra garantir)
- [ ] Constante `EXEC_WEBHOOK_KEY` em `generate_export.js` com placeholder sanitizado
- [ ] Validar Secret usa a constante literal injetada (build-time), não `$env`
- [ ] Branch false ainda retorna 401
- [ ] Header validado é `x-pacing-secret` (case-insensitive via lower())
- [ ] B1 (rich_text) e B3 (classe_sla) do a02 **mantidos** (sem regressão)
- [ ] PHI_EVENTOS data source ID `3423df0d-77df-4834-bdda-c08ddbae40ff` **mantido**
- [ ] ps1 atualizada com novo check `$env` proibido + check do placeholder `<EXEC_WEBHOOK_KEY_redacted>`
- [ ] sandbox == workflow byte-a-byte nos 3 (sha256 igual após regenerar)
- [ ] active:false em todos
- [ ] Sem BOM, secrets, mojibake
- [ ] Nota no `notion_phi_eventos_schema.md`: operador roda build com chave real antes do deploy (ADR-19); script pode ler de `.env` local do Codex e injetar

## NÃO fazer

- ❌ Não tocar B1 (rich_text) ou B3 (priorityFor) — estão corretos no a02
- ❌ Não tocar placeholder PHI_EVENTOS (já substituído)
- ❌ Não tocar Gemini, Merge Triggers, DBs, idempotência Intake
- ❌ NÃO USAR `$env` — viola ADR-19 (motivo desta rodada)
- ❌ Não publicar

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/ onboarding/execucao_lote1_tests.ps1
git commit -m "exec-lote1 a03: reverter B2 pro padrao ADR-19 (build-time injection, sem \$env)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Sequência pós-`a03`: pré-revisão Claude → brief Antigravity rodada 1 → smoke real (Olavo). Sem smoke verde, não publica.

--- END COPY ---
