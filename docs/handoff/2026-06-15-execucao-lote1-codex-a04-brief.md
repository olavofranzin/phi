# Brief Codex — Execução Lote 1 `a04` (page_id em vez de data_source_id nos HTTP Notion)

> Copie o bloco entre `--- COPY ---` e cole na sessão Codex. Cirurgia: 2 IDs trocados (search & replace) em 7 nodes de 3 workflows.

--- COPY ---

Você é o **Codex do projeto PHI**. Tarefa: `a04` da Execução Lote 1 — trocar `data_source_id` por `page_id` nos jsCodes que constroem bodies pra HTTP requests `POST api.notion.com/v1/pages`.

## Contexto

- **Repo:** `olavofranzin/phi`
- **Branch:** `claude/agentic-agency-planning-KwJEw`
- **Base:** o HEAD mais novo (`git fetch origin claude/agentic-agency-planning-KwJEw` antes)

O `a03` (`6e49fda`) **passou** pré-revisão Claude (B1 rich_text, B2 build-time ADR-19, B3 priorityFor). **MAS o smoke real expôs novo bug** ao tentar configurar credenciais: HTTP Request nodes mandam `Notion-Version: 2022-06-28` pra `POST /v1/pages`, e nessa versão `parent.database_id` espera **page_id do DB** (o que aparece na URL `app.notion.com/p/<page_id>?v=...`), NÃO o `data_source_id`. Os jsCodes usam `data_source_id` (vem do MCP Notion `create-database` quando criamos os DBs — propagamos sem perceber que a REST API direta espera outro identificador).

Nodes Notion nativos (`Buscar SOP Vigente`, `Buscar Demandas Existentes`) continuam OK porque o n8n converte internamente — só HTTP direto é afetado.

## Mapa dos IDs

| DB | data_source_id (errado p/ HTTP) | page_id (correto) |
|---|---|---|
| PHI - Demandas | `cd1ab757-e4d1-493f-b1e1-b64a95d33d1b` | **`a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b`** |
| PHI - Eventos | `3423df0d-77df-4834-bdda-c08ddbae40ff` | **`c64f600e-4f46-4b2b-ac22-c1e425c8966e`** |
| PHI - SOPs | `bfeb1105-83a6-4e89-8d62-26607ebfcc8c` | (não usado em HTTP — só Notion node nativo, mantém) |

## Substituições (find & replace globais em `generate_export.js`)

**Substituição 1:**
```
cd1ab757-e4d1-493f-b1e1-b64a95d33d1b
```
→
```
a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b
```

**Substituição 2:**
```
3423df0d-77df-4834-bdda-c08ddbae40ff
```
→
```
c64f600e-4f46-4b2b-ac22-c1e425c8966e
```

**Atenção:** essas substituições aplicam APENAS dentro dos jsCodes que constroem **bodies pra HTTP** (`demanda_body`, `event_body`, `eventBody(...)`). NÃO trocar nos parâmetros dos **Notion nodes nativos** (`Buscar SOP Vigente`, `Buscar Demandas Existentes`, `Buscar Demandas Em Revisao`) — esses ficam com `data_source_id`.

Na prática, no `generate_export.js` as constantes mais limpas seriam:

```js
// PARA HTTP requests (POST /v1/pages, PATCH /v1/pages/...) — page_id
const DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b';
const DB_EVENTOS_PAGE  = 'c64f600e-4f46-4b2b-ac22-c1e425c8966e';

// PARA Notion node nativo (parametro databaseId.value) — data_source_id
const DB_DEMANDAS = 'cd1ab757-e4d1-493f-b1e1-b64a95d33d1b';
const DB_SOPS     = 'bfeb1105-83a6-4e89-8d62-26607ebfcc8c';
const DB_EVENTOS  = '3423df0d-77df-4834-bdda-c08ddbae40ff';
```

E usar as `_PAGE` apenas dentro de `demanda_body`, `event_body`, `eventBody(event)` (qualquer payload que vá pra HTTP).

## Locais afetados (7 nodes em 3 workflows)

Confirmado por grep:

- **intake-pacing**:
  - `[Exec Intake] Normalizar SOP Vigente` (eventBody helper — Eventos)
  - `[Exec Intake] Preparar Demanda e Evento` (demanda_body — Demandas; event_body — Eventos)
  - `[Exec Intake] Montar Evento demanda.criada` (event_body — Eventos)
- **orquestrador**:
  - `[Exec Orq] Normalizar SOP Vigente` (eventBody helper — Eventos)
  - `[Exec Orq] Calcular Prioridade Pro` (eventBody — Eventos; updates de demanda usam HTTP/Notion?)
- **qualitygate-pacing**:
  - `[Exec QG] Montar Evento demanda.em_revisao` (eventBody — Eventos)
  - `[Exec QG] Validar DoD Pacing Flash` (eventBody — Eventos)

Adicional: nodes que fazem `update` da demanda via HTTP PATCH (se houver) também precisam usar page_id se forem `PATCH /v1/databases/...` — mas se forem `PATCH /v1/pages/<page_id>` (atualizar página específica), o ID é o da página da demanda criada, não o DB. **Confira durante implementação.**

## NÃO fazer

- ❌ Não trocar os `data_source_id` dos Notion nodes NATIVOS (`databaseId.value`)
- ❌ Não tocar B1 (rich_text), B3 (priorityFor), B4 (build-time injection ADR-19) — preservar do a03
- ❌ Não tocar Merge `numberInputs:2`, Gemini Pro/Flash, ps1 (exceto adicionar checks novos abaixo)
- ❌ Não usar `Notion-Version: 2025-09-03` (alternativa que aceitaria data_source_id) — mudança de API tem impacto mais amplo; fica pra ADR futuro

## Atualizar ps1

Adicionar checks novos:

```powershell
# Garantir page_id nos jsCodes (não data_source_id) onde aparece database_id em payloads HTTP
foreach ($path in @($intakeWf, $orqWf, $qgWf)) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  # Padrão a procurar: database_id seguido de um dos data_source_ids errados
  if ($raw -match "database_id['""]?\s*:\s*['""]cd1ab757-e4d1-493f-b1e1-b64a95d33d1b") {
    throw "$path uses data_source_id for Demandas in HTTP body; must use page_id a5c6b6ae-..."
  }
  if ($raw -match "database_id['""]?\s*:\s*['""]3423df0d-77df-4834-bdda-c08ddbae40ff") {
    throw "$path uses data_source_id for Eventos in HTTP body; must use page_id c64f600e-..."
  }
  # Garantir presença dos page_ids
  if (-not $raw.Contains('a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b') -and $raw -match 'demanda_body') {
    throw "$path has demanda_body but missing PHI - Demandas page_id"
  }
}
```

## Critérios de aceite

- [ ] Em todos os jsCodes dos 3 workflows: `database_id: '<UUID>'` em construções de body HTTP usa **page_id**, não data_source_id
- [ ] Notion nodes NATIVOS (`databaseId.value`) continuam com data_source_id (não foram tocados)
- [ ] `generate_export.js` ganhou constantes `DB_DEMANDAS_PAGE` e `DB_EVENTOS_PAGE` (ou equivalente claro)
- [ ] ps1 atualizada com 2 checks novos + passa verde
- [ ] sandbox==workflow byte-a-byte nos 3 (sha256 igual após regenerar)
- [ ] B1/B3/B4 (ADR-19) do a03 mantidos intactos
- [ ] Sem BOM, secrets, mojibake, placeholder antigo
- [ ] `active: false` mantido

## Commit + push + verificação

```bash
git add onboarding/execucao/lote1/ onboarding/execucao_lote1_tests.ps1
git commit -m "exec-lote1 a04: page_id em vez de data_source_id nos HTTP Notion (POST /v1/pages)"
git push -u origin claude/agentic-agency-planning-KwJEw

git fetch origin claude/agentic-agency-planning-KwJEw
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/claude/agentic-agency-planning-KwJEw)" ] \
  && echo "PUSH CONFIRMADO" || echo "DIVERGENCIA"
```

Reporte o SHA. Olavo já fez fix inline pro smoke andar; `a04` cristaliza no repo pra que re-imports futuros não percam.

--- END COPY ---
