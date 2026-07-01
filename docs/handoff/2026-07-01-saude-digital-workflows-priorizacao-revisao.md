# [AUDITORIA] Workflows Saúde Digital — priorização + briefs de revisão (Codex)

> **Objetivo:** revisar, corrigir falhas conhecidas e **reportar o estado real vs
> planejado** de cada workflow do ecossistema Saúde Digital (Agregador T28, score
> PHI, orquestração de análise, loop operacional). Um brief por workflow, em ordem
> de prioridade. Codex pega **um por vez**, na ordem.
> **Frente:** Saúde Digital · **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Data:** 2026-07-01 · **Fonte de estado:** `ESTADO-DO-PROJETO.md` §3.8/§5, ADRs 21/23/24/26/27, ADR-003/004/010.

---

## 0. Dois red flags a atacar primeiro (achados no smoke L3.0 de 2026-07-01)

- **🚩 Score possivelmente em fallback (P2).** O `PHI - Pipeline_v2` devolveu, pra
  CLI-4, `phi_value=50` **com todos os componentes** `mas=tss=fis=es=rs=os=50.0` e
  `phi_classification=WARNING`. Componentes todos idênticos a 50 é assinatura de
  **valor default/fallback**, não de cálculo. Se confirmado, o score que a Camada 2
  consome não tem sinal → **toda a análise fica cega**. Prioridade máxima de verificação.
- **🚩 `Daily Entry` está `active:false` (P6/dependency).** É o escritor canônico
  do `raw_campaign_data` (ADR-010), input do Pipeline_v2 **e** do Agregador. Se está
  desligado, confirmar quem popula `raw_campaign_data` hoje e se não está velho.

## 1. Priorização

| P | Workflow | id | Estado | Camada | Por que a prioridade |
|---|---|---|---|---|---|
| **P1** | PHI — Agregador de Métricas Multi-fonte | `4sdG2UKMCBuFq8xn` | active | 1 (ETL) | Raiz de tudo; escreve `t28_*`. Mais dívida conhecida. Degradou → toda camada 2 degrada. |
| **P2** | PHI - Pipeline_v2 | `ITWG3Ge0asXtUM8U` | active | (score) | Autoridade do PHI·Mídia (ADR-003). Camada 2 **lê** o score dele. Red flag do score-50. |
| **P3a** | WF-T28-Orquestrador-Analises | `8Q5ofmAZju0hTN08` | draft | 2 | L3.0 plumbing (validado hoje). Falta framework + ativação. |
| **P3b** | WF-T28-Analise-Campaign | `fhYmJH0o9BW1IO4i` | draft | 2 | Sub-WF L3.0. Placeholder + bug `numeric(null)`. |
| **P4** | WF-T28-Error-Handler | `rTS5pE34eElfuMPl` | active | 4 (erro) | L2 fechado; confirmar resiliência + L2.5 deferidos. |
| **P5a** | PHI - Loop Alerta Fase 1 | `JqPwFD9udCq2hRPw` | active | 3 (entrega) | Loop ADR-22 (score→alerta→Tarefa→Log→Telegram). Alinhar ao T28/score canônico. |
| **P5b** | PHI - Fechar Otimização | `83vfKD8XMYmjZjFQ` | active | 3 | Fecha otimização no loop. Verificar acoplamento. |
| **P5c** | PHI - Alerta de Erro (Telegram) | `Oj1RbA0laZTzJZPx` | inactive | 4 | Overlap com WF-T28-Error-Handler? É o "Error Workflow nativo" do L2.5? |
| **P6** | Legacy PHI + Daily Entry (bloco) | vários | mistos | — | Confirmar superseded → arquivar; Daily Entry (dependency) verificar. |

**Legacy no bloco P6:** `PHI - Pipeline` (`nFJpI3zYsk0Wst5O`, off), `PHI - Fase 2 Cálculo Score` (`X1eI3_aZ32EE3owgeDi_r`, off), `PHI - Fase 3 Operacional` (`LIaXSq-WoaF1yj3gF30Rj`, off), `phi-production` (`NXWQ9WBk5-G08X-46VPKO`, off), `sw phi pipeline_v2` (`MOGG0bI51pNHevEJ`, off), `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`, **active**), `Daily Entry` (`zGgIqiLlo5iAn8ud`, off). *(Nota: existe uma cópia `Daily Entry` id `demo` — ignorar/arquivar.)*

> **Não é workflow ainda:** métricas de anúncios (`raw_ad_data`) está em DDL/planejamento (sub-chat paralelo); sem workflow n8n vivo. Fora deste ciclo de revisão.

## 2. Instruções gerais pro Codex (valem p/ todo brief)

**Metodologia de revisão (por workflow):**
1. `get_workflow_details` (se grande, dump p/ arquivo e parse com jq/python — não estourar contexto).
2. **Planejado vs real:** comparar o grafo/params reais com o "papel planejado" do brief (+ ADR/doc citado). Listar divergências.
3. **Defeitos:** confirmar os defeitos conhecidos listados + achar novos (refs frágeis, schema mismatch, nós órfãos/mortos, credenciais faltando, mojibake, idempotência).
4. **Corrigir** os defeitos claros e de baixo risco **em draft via MCP `update_workflow`** (nunca PUT/publish/activate sem OK explícito do Olavo). Deixar os de alto risco/ambíguos como recomendação no report.
5. **Reportar** (formato no fim de cada brief).

**Guardas da casa (lições já pagas — aplicar sempre):**
- **Draft only.** `update_workflow` (MCP) mantém draft. **Nunca** API pública PUT (auto-ativa). Não publicar/ativar sem OK.
- **Expressão n8n ≠ statements.** `sqlQuery`/expressões usam **uma expressão** ou template `=...{{ }}`. **Não** `={{ const x=...; return ... }}` (quebra — bug real do L3.0).
- **Notion property keys:** `nome|tipo` com o **tipo certo** e **nome exato (case-sensitive)**. select→`selectValue`, relation→`relationValue` (array), multi_select→`multiSelectValue`, formula-filter→`|formula`+`returnType`. Filtro multi-condição precisa `matchType:allFilters` (default é OR!).
- **Refs cross-node:** `.all()[0].json` (determinístico); `executeOnce` em single-item; **zero** `.item.json`/`.first().json` em `runOnceForAllItems`.
- **Nomes de nó ASCII** (sem acento/ç) — refs `$()` quebram com accent-folding/mojibake.
- **BQ:** `executeQuery`+`useLegacySql:false` (Standard SQL); MERGE (DML) p/ idempotência, não streaming insert.
- **`onError:continueRegularOutput`** em fontes opcionais/lookups; propagar erro nas escritas core.

**Formato do report (por workflow), commitar em `docs/handoff/`:**
- Identidade (id, versionId, active, nodeCount).
- **Planejado vs real** (tabela de divergências).
- **Defeitos** (confirmados + novos) e **fixes aplicados** (com versionId novo) vs **recomendados**.
- **Status final** (ex.: `Saudável` / `Degradado` / `Precisa fix X` / `Superseded`).
- Não ativar; aguardar pré-revisão Claude + OK do Olavo p/ publicar.

---

## P1 — PHI — Agregador de Métricas Multi-fonte (`4sdG2UKMCBuFq8xn`) · active · Camada 1

**Papel planejado:** ETL semanal/mensal. Percorre Clientes/Campanhas/Conjuntos/Anúncios (Notion), extrai métricas multi-fonte (Google Ads GAQL 3 níveis, GA4 org/pago, GBP, Clarity, Search Terms, Meta), normaliza no **contract T28** e escreve `t28_*` via **MERGE idempotente** (L1.6). Ref: ESTADO §3.8 (L0/L1/L1.5/L2/L1.6), ADR-23/24, página Notion `386b65e5...9614`.

**Estado conhecido:** ATIVO em prod (activeVersionId `a46d5a6a`, Schedule Semanal+Mensal). L1/L1.5/L2/L1.6 concluídos. Smoke `11755`/L3.0 confirmam escrita OK.

**Defeitos conhecidos a corrigir/verificar:**
1. **Cadeia morta** `Merge1 → Calculate KPIs(off) → AI Agent(off) → Prepare Report Data2(off) → Switch(off)` — Adaptador consome via lookup `$('node').first()/.all()`, não por conexão. Canvas engana + frágil a rename. **Deletar a cadeia disabled + Adaptador consumir por conexão explícita** (L2.5 deferido).
2. **GBP + Clarity degradando** (stand-by por decisão do Olavo). No smoke L3.0: `gbp=missing`, `search_terms=error`. Investigar rate-limit/credencial/query (GBP usa `googleOAuth2Api` sem credencial; Clarity cota 10/dia).
3. **Clarity dentro do Loop** — multiplica chamadas (dado é por projeto, não por campanha) → 429. **Mover p/ fora do Loop** (1 call/run) + `onError:continueRegularOutput`.
4. **Search Terms features zeradas** (`pct_*=0`) — listas brand/competitor/excluded são placeholders literais (`INSERT YOUR BRAND TERM HERE`); LLM classifica sem contexto. + no smoke `search_terms=error`. Resolver: preencher 3 props no DB Clientes OU ler `top_search_terms` da raw.
5. **`campaign_name` null** nas linhas t28 (smoke L3.0 mostrou null) — Agregador não popula `campaign_name`. Mapear do Notion/GAQL.
6. **Atribuição multi-campanha (Task 3):** `campaign_id` por linha OK, mas verificar se `landing_page`/contexto de negócio da campanha 1 vaza pra campanha 2 (no smoke as 2 campanhas de CLI-4 tinham a **mesma** `landing_page` — pode ser correto (mesmo cliente) OU o bug; **verificar** se o ctx é resolvido por campanha).
7. **`volume_suficiente`** — critério (MIN_CONV=30/MIN_DIAS=14) em revisão; janela 7d sempre caía insuficiente, mas smoke deu `true` — confirmar coerência.

**Revisar (Codex):** confirmar MERGE idempotente vivo nos 6; helpers `readOrThrow`/`optionalSource` + `source_status`; a resiliência do Adaptador; e os 7 itens acima. Corrigir 1,3,5 (baixo risco); 2,4,6,7 reportar recomendação (dependem de decisão/credencial).

---

## P2 — PHI - Pipeline_v2 (`ITWG3Ge0asXtUM8U`) · active · Autoridade do score

**Papel planejado:** dono único do **PHI·Mídia** (ADR-003). Lê `raw_campaign_data`, calcula score por campanha (fórmula ADR-004 v2: MIV/MAS/TSS/FIS/ES/RS/OS) e faz **MERGE** em `phi_prod.phi_score_history` (chave `client_id`+`campaign_id`+`calculated_date`). VIEW `phi_score_current` = último SUCCESS. Ref: ADR-003/004, handoff `2026-05-09-A7b-DDL-VIEW.md`.

**Estado conhecido:** ATIVO. A.7b adicionou `source_execution_id`. Roda em modo **FALLBACK-*** (`execution_id`), A.6 (parar de usar FALLBACK) pendente.

**🚩 Defeito prioritário a investigar:** no smoke L3.0, `phi_score_current` de CLI-4 (ambas campanhas) veio com **`phi_value=50` e `mas=tss=fis=es=rs=os=50.0`, `phi_classification=WARNING`, `business_model=VAREJO_LOCAL`, `model_version=v1.1`, `calculated_date=2026-06-30`.** Todos os componentes idênticos a 50 → forte suspeita de **fallback/default** (o pipeline não conseguiu calcular e devolveu 50 em tudo). **Verificar:** (a) o cálculo real está rodando ou caindo em fallback? (b) `execution_id` dessas linhas é `FALLBACK-*`? (c) `raw_campaign_data` tem dado fresco pra CLI-4? (d) por que `business_model=VAREJO_LOCAL` no score mas `modelo_negocio=Lead Gen` no t28 (fonte da divergência)?

**Defeitos conhecidos:** `execution_id=FALLBACK-*` (A.6); `source_execution_id` NULL retroativo (por decisão). Consumidores lêem por colunas nomeadas (A.7b auditou — sem `SELECT *` frágil).

**Revisar (Codex):** rastrear o caminho do cálculo (nós de score), achar onde o fallback-50 é setado e por que dispara; confirmar MERGE em `phi_score_history`; verificar se lê `raw_campaign_data` fresco. **Não** mudar a fórmula sem OK. Reportar se o score está real ou fallback — isso decide se a Camada 2 tem sinal.

---

## P3a — WF-T28-Orquestrador-Analises (`8Q5ofmAZju0hTN08`) · draft · Camada 2

**Papel planejado:** orquestra a análise campaign-level. Lê `t28_campaign` × `phi_score_current` (JOIN), resolve relations Notion, fan-out por campanha → sub-WF. Ref: `L3.0-orquestrador-campaign-design.md`, brief `2026-06-30-...l3.0-codex-plumbing-brief.md`.

**Estado conhecido:** **plumbing VALIDADO** (smoke phi_dev PASS 2026-07-01, idempotente, ambas relations resolvem). Já pré-revisado por Claude; fixes aplicados (sqlQuery template, `id_client|formula` p/ cliente). Draft, não ativado, `Set config` em phi_dev.

**Defeitos/pendências:** (a) não ativado / não flip pra phi_prod (proposital — pós-framework); (b) `Schedule Trigger` com cron placeholder (semanal seg 07:00) a refinar; (c) `Calc Window Dates` usa "última data" fallback — validar em prod.

**Revisar (Codex):** leve — o grosso já foi revisado hoje. Confirmar que o fix da `sqlQuery` e do `id_client|formula` persistem; validar o `Schedule` p/ ativação futura; NÃO ativar. Reportar prontidão p/ produção (checklist de ativação).

---

## P3b — WF-T28-Analise-Campaign (`fhYmJH0o9BW1IO4i`) · draft · Camada 2

**Papel planejado:** sub-WF reutilizável. Recebe payload da campanha, gera análise (flags + severidade + insight), faz **upsert idempotente** de 1 page em `PHI - ANÁLISES`. Ref: mesmo design.

**Estado conhecido:** plumbing OK; upsert idempotente provado. Nó de análise é **placeholder determinístico** (framework real vem no sub-chat §4). Pré-revisado hoje (chaves Notion tipo/nome + `matchType=allFilters` corrigidos).

**Defeitos a corrigir:** **`numeric(null)→0`** no `Build Deterministic Flags` (`Number(null)===0` finito) → `impression_share_baixo` espúrio quando `impression_share=null`. Guard `value==null → null`. *(Nota: as regras de flags serão reescritas no sub-chat do framework — coordenar p/ não retrabalhar; o guard vale de qualquer forma.)*

**Revisar (Codex):** corrigir o `numeric(null)`; confirmar o upsert (`matchType=allFilters`, `business_date|date equals`) e os mapeamentos de property. Deixar o ponto de inserção do nó LLM claro (entre `Build Deterministic Flags` e `Build Notion Page`). Reportar.

---

## P4 — WF-T28-Error-Handler (`rTS5pE34eElfuMPl`) · active · Camada 4

**Papel planejado:** sub-WF acionado via `onError` dos nós críticos do Agregador. Grava `t28_errors` + cria Tarefa (DB Demandas) + Telegram. ADR-26. Ref: ESTADO §3.8 (L2), execution log L2.

**Estado conhecido:** L2 **fechado** (smoke `11755` PASS, resiliência provada organicamente). ATIVO. Cadeia = 1 `[Err] Roteador Payload` + 1 `[Err] Call Handler`, 15 error outputs.

**Defeitos/deferidos (L2.5):** (a) **anti-spam Telegram** (rajada de erros → flood); (b) **Error Workflow nativo** do n8n (settings) como rede extra; (c) confirmar que o Roteador não tem ref órfão pós-rename (`extracao`).

**Revisar (Codex):** confirmar os 15 error outputs mapeados; testar 1 erro forçado (dry, sem ativar nada novo); avaliar anti-spam (dedupe/janela) e o overlap com `PHI - Alerta de Erro (Telegram)` (P5c). Reportar recomendação L2.5.

---

## P5a — PHI - Loop Alerta Fase 1 (`JqPwFD9udCq2hRPw`) · active · Camada 3

**Papel planejado:** loop operacional ADR-22 — gate cognitivo PHI (só alerta se sinal real, não ruído/volume-insuficiente) → idempotência → cria **Tarefa** (DB Demandas) + **Log de Otimizações** (Notion) + Telegram. Ref: ADR-22, "PHI — Especificação do Loop Operacional" (`37db65e5...a37d`).

**Estado conhecido:** `active:true`, mas a description diz "active:false até smoke aprovado" — **verificar se foi smokado/aprovado** ou ativado sem validação.

**Defeitos a verificar:** (a) **de qual score ele lê?** Deve ler o canônico (`phi_score_current`/`phi_classification`, ADR-003) — confirmar que não está acoplado ao PHI legado; (b) alinhamento com a Camada 2 nova (T28/`PHI - ANÁLISES`) — o loop deveria reagir à análise do L3, não a um caminho paralelo; (c) idempotência do alerta; (d) gate cognitivo implementa os temas ADR-21 (volume/ruído/1-KPI)?

**Revisar (Codex):** mapear a fonte de dados e o destino (Demandas/Log); avaliar se o loop se integra ao L3 (`PHI - ANÁLISES` → alerta) ou se é legado a realinhar. **Divergência planejado-vs-real é o foco aqui.** Reportar.

---

## P5b — PHI - Fechar Otimização (`83vfKD8XMYmjZjFQ`) · active · Camada 3

**Papel planejado:** fecha o ciclo de otimização (marca Tarefa/Log como concluído, mede resultado pós-janela — o "Esperar" do O.D.A.E., ADR-22).

**Estado conhecido:** `active:true`, 1 trigger. Pouco documentado no ESTADO.

**Revisar (Codex):** descobrir o que faz de fato (trigger, entradas, escritas); mapear ao ADR-22 (fase Esperar/medir); ver acoplamento a DBs (Demandas/Log/Campanhas) e se usa o score canônico. Reportar planejado-vs-real + se ainda é necessário na arquitetura T28.

---

## P5c — PHI - Alerta de Erro (Telegram) (`Oj1RbA0laZTzJZPx`) · inactive · Camada 4

**Papel planejado:** Error Workflow (Error Trigger) que formata falhas de outros WFs e alerta via Telegram.

**Estado conhecido:** `inactive`. **Overlap** com o `WF-T28-Error-Handler` (P4) — este é sub-WF via `onError`; aquele seria Error Workflow nativo global.

**Revisar (Codex):** decidir o papel: é o "Error Workflow nativo" que o L2.5 quer (rede global) ou é redundante/legado? Se útil, apontar como configurá-lo como Error Workflow nas settings dos WFs Saúde Digital (sem duplicar Telegram com o P4 — coordenar anti-spam). Reportar recomendação (ativar/arquivar).

---

## P6 — Bloco legacy + Daily Entry (dependency)

**Legacy PHI (todos `inactive` exceto onde notado) — hipótese: superseded pelo `PHI - Pipeline_v2`:**
`PHI - Pipeline` (`nFJpI3zYsk0Wst5O`), `PHI - Fase 2 Cálculo Score` (`X1eI3_aZ32EE3owgeDi_r`), `PHI - Fase 3 Operacional` (`LIaXSq-WoaF1yj3gF30Rj`), `phi-production` (`NXWQ9WBk5-G08X-46VPKO`), `sw phi pipeline_v2` (`MOGG0bI51pNHevEJ`), `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`, **active!**), `Daily Entry` cópia `demo`.

**Revisar (Codex) — brief consolidado:**
1. Pra cada um: confirmar se é chamado por algum WF vivo (Execute Workflow / Error Workflow / Schedule). **`PHI - Subworkflow Campanhas` está active** — descobrir quem o chama (Pipeline_v2?) antes de qualquer coisa.
2. Os que forem **órfãos comprovados** → recomendar **arquivar** (`archive_workflow`, reversível) — não deletar. Documentar no report.
3. `Daily Entry` cópia `demo` → arquivar.

**🚩 Daily Entry (`zGgIqiLlo5iAn8ud`) — dependency crítica, `active:false`:**
Escritor canônico do `raw_campaign_data` (ADR-010) — input do Pipeline_v2 e do Agregador. **Está desligado.** Investigar com urgência: (a) `raw_campaign_data` ainda recebe dado fresco? por qual mecanismo? (b) se Daily Entry é a fonte e está off, o score-50 (P2) pode ser consequência de raw velho/vazio. (c) reportar se precisa reativar ou se foi substituído. **Não reativar sem OK** (pode ter sido desligado de propósito).

---

## Sequência sugerida de execução
P1 → P2 (os dois red flags primeiro: raw/score é onde a Camada 2 ganha ou perde sinal) → P3a/P3b (leve, quase fechados) → P4 → P5a/b/c → P6. Cada um: revisar → corrigir baixo-risco em draft → reportar planejado-vs-real → pré-revisão Claude → OK do Olavo p/ publicar/arquivar.
