# [HANDOFF] Telemetria Lote 1 — Brief Antigravity

**De:** Cérebro Estratégico (Claude)
**Para:** Antigravity (revisor técnico)
**Data:** 2026-06-05
**Branch:** `claude/agentic-agency-planning-KwJEw`
**Commit Codex:** `b15e8dd` + correção Claude `327872d`

---

## 0. Objetivo da revisão

Revisar **WF-DOC-Telemetria-Diaria** nó-a-nó antes de:
1. Olavo acionar smoke E2E via n8n UI
2. Workflow virar `active: true` em produção

Este workflow fecha o gap **T6** do `ESTADO-DO-PROJETO` (severidade original Alta):
Onboarding em produção desde 2026-05-29 sem visibilidade. Telemetria
diária dispara às 08:30 BR, gera 16 métricas operacionais (Onboarding +
Curador + Global), posta digest no Telegram do operador e persiste
snapshots no DB Notion.

---

## 1. Pré-leitura obrigatória (em ordem)

1. **Brief Codex original:** `docs/handoff/2026-06-04-telemetria-lote1-codex-brief.md` — define padrões esperados e 14 nodes
2. **Strawman v0.2:** `docs/strategic-planning/telemetria-minima/BRUTO-v0.1-design.md` (cabeçalho diz v0.2; path preserva histórico git)
3. **Pré-revisão Claude (commit `327872d`):** 3 gaps identificados — G1 corrigido, G2 e G3 documentados como aceitáveis
4. **Padrões inegociáveis Lote 1 Onboarding:** seção 5 da âncora [HANDOFF] Curador (https://www.notion.so/375b65e5c72b810f8f4be50873daedbe)
5. **ADR-012 Aceito 2026-06-04:** Git canônico para design, Notion canônico para estado operacional (https://www.notion.so/376b65e5c72b818a87e8d491f98be1fb)
6. **ADR-010 Aceito 2026-06-04:** Divisão BigQuery × Supabase (https://www.notion.so/376b65e5c72b814a81fac10aaf50befc) — sink BQ entra apenas no Lote 4 da Telemetria, NÃO neste

---

## 2. Arquivos a revisar

| Arquivo | Linhas | Função |
|---|---|---|
| `onboarding/telemetria/workflow.json` | 620 | Export canônico do workflow (`active=false`, IDs redacted) |
| `onboarding/telemetria/sandbox_export.json` | 620 | Cópia estrutural do workflow — suíte ps1 valida igualdade |
| `onboarding/telemetria/generate_export.js` | ~338 | Gerador idempotente do JSON. Executar `node generate_export.js` reproduz exatamente os 2 JSONs |
| `onboarding/telemetria_tests.ps1` | 213 | Suíte estrutural PowerShell |

**Workflow no n8n produção:** ainda NÃO publicado. ID = `<workflow_id_pending_review>`.

---

## 3. Recursos no Notion (read targets do workflow)

| Recurso | URL | data_source_id |
|---|---|---|
| DB Snapshots (destino da escrita) | https://www.notion.so/0e1cffdef0654580828d5f1478c50077 | `32404398-6751-4bbd-be28-4ad591e22bf7` |
| DB Clientes Onboarding (read) | https://www.notion.so/04e34a62624b484cbda546604564b88c | `04e34a62624b484cbda546604564b88c` |
| DB Etapas Onboarding (read) | https://www.notion.so/6eb4565b4f1d498c8b2978e0c80880fd | `6eb4565b4f1d498c8b2978e0c80880fd` |
| DB Mudanças de Escopo (read) | https://www.notion.so/507d18009622435ba3f17b24d191762d | `bb56ddca-dfad-4aa5-9227-3cf86207bc40` |
| DB Catálogo (read) | https://www.notion.so/bd8df5b982ad4f00a8ae56d687db819e | `07623177-4d75-4870-bdc0-4ecd365392a7` |
| DB Decisões/ADR (read) | https://www.notion.so/237a5e127f5142eeb9c04ddfb16b6400 | `237a5e127f5142eeb9c04ddfb16b6400` |
| DB Aprendizados (read) | https://www.notion.so/2e49a766781841fda4a2681d358bc98f | `aa5d49b2-c2f6-40bc-b883-5cd350a982c7` |

**Telegram chat operador:** `930549271` (real, redacted nos exports como `<TELEGRAM_CHAT_ID_redacted>`).

---

## 4. Checklist de revisão nó-a-nó

Marque cada item. Se falhar, sinalize antes de prosseguir.

### 4.1. Estrutura geral
- [ ] Workflow nome: `WF-DOC-Telemetria-Diaria` (conforme D5 nomenclatura — prefixo `WF-`)
- [ ] `active: false` (não publicado em prod)
- [ ] `id: '<workflow_id_pending_review>'`
- [ ] Tags: `phi`, `documentacao`, `telemetria`
- [ ] `settings.timezone: 'America/Sao_Paulo'`
- [ ] `settings.executionOrder: 'v1'`
- [ ] 14 nodes exatamente
- [ ] Cada node tem prefixo `[Telemetria] `

### 4.2. Schedule Trigger (N1)
- [ ] Diário às **08:30 BR** (não 09:00 — coexistência com A2.7)
- [ ] `rule.interval[0] = { field: 'days', daysInterval: 1, triggerAtHour: 8, triggerAtMinute: 30 }`

### 4.3. Set Contexto (N2)
- [ ] 4 assignments: `execution_id`, `tenant_id`, `data_snapshot`, `versao_consulta`
- [ ] `execution_id` prefixo `EXEC-TELEMETRIA-` (não EXEC-ONB ou similar)
- [ ] `tenant_id = 'phi-agencia'` (single-tenant default)
- [ ] `data_snapshot = $now.toISOString().slice(0,10)` → `YYYY-MM-DD`
- [ ] `versao_consulta = 'v1.0'`

### 4.4. 7 reads Notion (N3-N9, paralelos)
Cada um deve:
- [ ] Tipo `n8n-nodes-base.notion`, typeVersion `2.2`
- [ ] `resource: 'databasePage'`, `operation: 'getAll'`
- [ ] `returnAll: true` (paginação)
- [ ] `simple: false`
- [ ] `filterType: 'none'`
- [ ] `executeOnce: true` (eficiência)
- [ ] `alwaysOutputData: true` (tolerante a vazio)
- [ ] `databaseId.value` bate com IDs em §3

**Específico:** `Buscar Snapshots Existentes` é chave da idempotência. NÃO tem filtro de data (esse é o **G2** documentado — escalonamento ruim mas funcional v0.1; Lote 2 endereça).

### 4.5. Calcular Métricas (N10) — código jsCode
- [ ] Tipo `n8n-nodes-base.code`, typeVersion `2`
- [ ] `mode: 'runOnceForAllItems'`
- [ ] jsCode **ASCII-safe** (sem `ç`, `ã`, `é` literais — usa `\u00XX`)
- [ ] **Sem** `require()` nem `import` (proibido por contrato)
- [ ] Helpers presentes: `pickTitle`, `pickText`, `pickSelect`, `pickNumber`, `pickDate`, `daysAgo`, `since`, `avg`, `diffDays`, `hasAny`
- [ ] `existingKeys = new Set()` populado a partir de `Buscar Snapshots Existentes`
- [ ] Chave idempotência: `data_snapshot + '|' + chave + '|' + janela`
- [ ] **16 chamadas a `add(...)`:** 8 Onboarding + 4 Curador + 4 Global
- [ ] Chaves seguem convenção: `onb.`, `cur.`, `glb.` prefixos
- [ ] `toCreate.filter(m => !existingKeys.has(m.idempotency_key))` aplica idempotência
- [ ] Cada métrica gerada carrega: `execution_id`, `tenant_id`, `versao_consulta`, `data_snapshot`, `idempotency_key`, `titulo`

### 4.6. Criar Snapshot (N11)
- [ ] Tipo `n8n-nodes-base.notion`, typeVersion `2.2`
- [ ] `operation: 'create'`
- [ ] `databaseId.value = '32404398-6751-4bbd-be28-4ad591e22bf7'` (DB Snapshots — único destino)
- [ ] 10 propriedades mapeadas: Data, Área, Chave da métrica, Janela, Valor número, Valor texto, Fonte, Versão da consulta, execution_id, tenant_id
- [ ] Title vem de `$json.titulo`

### 4.7. Montar Digest HTML (N12) — código jsCode
- [ ] `mode: 'runOnceForAllItems'`
- [ ] jsCode ASCII-safe
- [ ] `escapeHtml` substitui `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`
- [ ] Header `<b>PHI Telemetria - {data} 08:30</b>`
- [ ] 3 blocos: Onboarding / Curador / Global
- [ ] Alertas ` ALERTA` quando falhas > 0 (sem emoji — ASCII-safe)
- [ ] Link final: `<a href="https://www.notion.so/0e1cffdef0654580828d5f1478c50077">DB Snapshots</a>`
- [ ] ⚠️ **CRÍTICO:** NÃO tem linha residual `'parse_mode=HTML'` no array (G1 — corrigido por Claude em `327872d`)
- [ ] Retorna `[{ json: { digest_html, data_snapshot, linhas_novas } }]`

### 4.8. Enviar Telegram (N13)
- [ ] Tipo `n8n-nodes-base.telegram`, typeVersion `1.2`
- [ ] `chatId = '<TELEGRAM_CHAT_ID_redacted>'` (NÃO `930549271` direto — redaction)
- [ ] `text = '={{ $json.digest_html }}'` (string única do N12)
- [ ] `additionalFields.parse_mode = 'HTML'`
- [ ] `additionalFields.appendAttribution: false`

### 4.9. Set Status Final (N14)
- [ ] `mode: 'runOnceForAllItems'`
- [ ] Retorna `[{ json: { status: 'ok', execution_id, tenant_id, data_snapshot, versao_consulta } }]`
- [ ] Sem side effects

### 4.10. Wiring
- [ ] `Schedule Trigger → Set Contexto`
- [ ] `Set Contexto` fan-out para os 7 reads (paralelo)
- [ ] Cada um dos 7 reads → `Calcular Métricas` (fan-in)
- [ ] `Calcular Métricas → Criar Snapshot → Montar Digest → Telegram → Status`

### 4.11. Segurança e padrões inegociáveis Lote 1 Onboarding
- [ ] Sem `chat_id` real (`930549271`) em qualquer arquivo do repo
- [ ] Sem `AIza`, `secret`, `api_key`, `token` em qualquer arquivo
- [ ] Sem mojibake (padrão regex: `NÃ|Ã£|Ã§|Ã©|Ã³`)
- [ ] `creds.notionApi.id = '<credential_id_redacted>'`
- [ ] `creds.telegramApi.id = '<TELEGRAM_CREDENTIAL_ID_redacted>'`
- [ ] Arquivos UTF-8 **sem BOM** (suíte ps1 valida)

### 4.12. Suíte ps1
- [ ] Executar `pwsh onboarding/telemetria_tests.ps1` (ou `powershell.exe` no Windows). Deve passar.
- [ ] Se falhar, NÃO publicar. Reportar erro.
- [ ] ⚠️ **Atenção paths:** suíte tem caminhos `C:\tmp\phi_repo\` hardcoded. Ajustar antes de rodar no seu ambiente OU rodar diretamente com `$workflowPath` e `$sandboxPath` editados.

---

## 5. Gaps já documentados (NÃO bloqueiam aprovação)

### G1 — CORRIGIDO por Claude (commit `327872d`)
Linha `'parse_mode=HTML'` no array `linhas` do digest jsCode (`generate_export.js` linha 170 do commit anterior). Sairia como texto literal no Telegram após o link DB Snapshots. **Já removida.** JSONs regenerados via `node generate_export.js` (apenas 2 linhas alteradas em cada). Suíte ps1 ajustada (removido snippet `'parse_mode'` da validação do digestCode; segue validando `parse_mode: 'HTML'` no node Telegram via `additionalFields`).

### G2 — Documentado pra Lote 2 (NÃO bloqueia)
`Buscar Snapshots Existentes` lê **todos** os snapshots históricos sem filtro `Data >= hoje`. Escala mal (1 ano = ~5840 itens, com paginação Notion implícita pelo `returnAll`). Funcionará por meses até virar dor. Lote 2 da Telemetria adiciona filtro de data na query.

### G3 — Reportado por Codex, correto (NÃO bloqueia)
`cur.tempo_medio_aplicacao_dias` permanece **0** com `valor_txt = "sem campo de data de aplicacao no schema atual"`. DB Mudanças tem `Estado da aplicação` (select) mas não `Data de aplicação` (date). **Codex acertou ao reportar gap em vez de inventar substituto** (alinhado com brief §10). Mudança de Escopo futura via Curador adiciona o campo.

---

## 6. O que reportar de volta

Quando terminar a revisão, abra issue/comentário com:

1. **Veredito:** APROVADO / APROVADO com ressalvas / REJEITADO
2. **Itens do checklist falhos:** se algum
3. **Bugs novos** que encontrou (além de G1/G2/G3)
4. **Sugestões opcionais** (sem bloquear) que poderiam melhorar
5. **Recomendação:** "smoke autorizado" / "reabrir Codex para X"

---

## 7. Após aprovação Antigravity — sequência de smoke E2E

Quem executa: **Olavo** (com Claude narrando ao vivo se quiser).

### Passo 1 — Subir o workflow no n8n
- Importar `onboarding/telemetria/workflow.json` no n8n produção
- **NÃO** ligar `active: true` ainda
- Salvar
- **Re-importar é obrigatório** se editar na UI depois — padrão inegociável Lote 1 Onboarding

### Passo 2 — Conectar credenciais reais
- `creds.notionApi.id`: substituir pela credential real do Notion (mesma do Lote 1 Onboarding)
- `creds.telegramApi.id`: substituir pela credential real do Telegram
- `chatId`: substituir `<TELEGRAM_CHAT_ID_redacted>` por `930549271`
- Salvar **localmente apenas** (re-export sempre sanitiza)

### Passo 3 — Smoke E2E manual
- Botão **Execute Workflow** no n8n UI
- Aguardar conclusão (estimativa: 30s–2min, depende da paginação Notion)

### Passo 4 — Validar resultado
- DB Snapshots https://www.notion.so/0e1cffdef0654580828d5f1478c50077:
  - **16 linhas novas** com `Data = hoje`
  - Cada linha tem `execution_id` começando com `EXEC-TELEMETRIA-`
  - Cada linha tem `tenant_id = phi-agencia`
  - Cada linha tem `Versão da consulta = v1.0`
- Telegram no chat `930549271`:
  - Digest chegou
  - **Sem** linha residual `parse_mode=HTML`
  - 3 blocos (Onboarding / Curador / Global) visíveis
  - Link DB Snapshots clicável
  - Alertas ` ALERTA` presentes se houver falhas Telegram/Evolution > 0

### Passo 5 — Idempotência
- Executar workflow **2ª vez** no mesmo dia (Execute Workflow novamente)
- DB Snapshots: **0 linhas novas** (idempotência funcionou)
- Telegram: ainda chega o digest (não é idempotente — por design; digest sempre vai)

### Passo 6 — Cleanup pós-smoke
- Não há cleanup. Snapshots são dados úteis.
- Marcar `active: true` no workflow
- Re-export sanitizada via `node generate_export.js` se o ID do workflow real precisar ser atualizado no JSON canônico

### Passo 7 — Registro Notion
- Atualizar subpágina no Registro de Workflows n8n
  (https://www.notion.so/354b65e5c72b815bb166ff8ea26861ae):
  - Nome: `WF-DOC-Telemetria-Diaria`
  - ID: ID real do n8n
  - Finalidade: digest diário de 16 métricas operacionais (Onboarding + Curador + Global)
  - Principais nodes: 14 do checklist 4.1-4.10
  - Histórico: `2026-06-05 — a01 (Codex) + pre-revisao Claude (G1 fix) + aprovacao Antigravity + smoke E2E + publicacao prod`

### Passo 8 — Fechamento T6 no ESTADO
- Marcar T6 como `Resolvido` no §6 do `ESTADO-DO-PROJETO.md`
- Atualizar Catálogo: `WF-DOC-Telemetria-Diaria` Estado `Em revisão` → `Vivo`; Versão `a01` → `prod 2026-06-05`
- Marcar §5 pendência Telemetria como Resolvida
- §13 nova versão do doc mestre (v0.1.8)

### Passo 9 — Aprendizado se houver surpresa
- Se aparecer algo inesperado no smoke, criar Aprendizado no DB PHI™ Aprendizados (Fase `0.5 — Governança` + Categoria pertinente)

---

## 8. Tensões registradas que afetam Telemetria

- **T11 — A2.7 × Telemetria:** sobreposição. v0.2 coexistem (A2.7 narrativo qualitativo, Telemetria quantitativo). Revisitar Lote 3 da Telemetria (Flash summarize) quando ambos rodando.
- **T13 — Telemetria alimenta Curador (loop):** métricas globais (`glb.artefatos_vivos`, `glb.adrs_aceitos`, `glb.aprendizados_aplicados`) viram input para drift detection do Curador no Lote 5+.

---

## 9. Convenções do projeto a respeitar

- **Nomenclatura travada 2026-06-04:** prefixo `WF-` para workflows. Áreas verbose ("Documentação e Ferramentas"). Termos canônicos: "Operação Interna" (não "Chassi"), "Planejado/Retroativo" (não "ANTES/DEPOIS"). Glossário completo em `docs/strategic-planning/ESTADO-DO-PROJETO.md` §7.
- **Padrões inegociáveis Lote 1:** Telegram string única HTML, idempotência por marca em DB, jsCode ASCII-safe, NÃO editar prod sem re-importar canônico do repo.
- **ADR-012 Aceito:** Git canônico para design (este brief, strawmans, workflow.json) + Notion canônico para estado operacional (DB Snapshots).
- **ADR-010 Aceito:** Sink BQ entra apenas no Lote 4 da Telemetria — não toca este lote.

---

## 10. Contato

Qualquer dúvida durante a revisão: abrir issue no repo `olavofranzin/phi` mencionando este brief, ou pingar Olavo direto.

Boa revisão.
