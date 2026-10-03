# [BRIEF + DIAGNÓSTICO] Automação de Tasks do PHI Score — consolidação no inline + correções

> **Criado:** 2026-07-21. **Autor:** Claude (orquestrador), branch `claude/agentic-agency-planning-KwJEw`.
> **Motivo:** Olavo reportou falhas na abertura/manutenção das tasks "[KIL] PHI ALERT" geradas pelo PHI Score
> (exemplo TSK-135). Investigação forense (subagente, leitura verbatim dos nós) confirmou os 6 pontos **e**
> achou falhas silenciosas mais graves. **Este doc é a fonte da verdade do fix — nenhuma edição em produção
> antes de aprovação do Olavo por lote.**
> **Decisão de arquitetura (Olavo, 2026-07-21):** consolidar no **caminho inline do Pipeline_v2**; o
> `PHI - Loop Alerta Fase 1` é **APOSENTADO** (ver §1).

## 0. Estado real (verificado)

- **Workflow keystone:** `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`), **ativo**, Schedule diário **07:00**
  (`America/Sao_Paulo`; 10:00 UTC). Calcula o score (`Calcular e Persistir PHI Score` → MERGE em
  `phi_prod.phi_score_history`) **e** gere as tasks inline. **É o mesmo WF do score — editar com cuidado.**
- **DB de tasks:** "Tasks" — Notion `19fb65e5-c72b-812d-a734-de9a4d5b980f`
  (data source `collection://19fb65e5-c72b-813f-a6d9-000b8cfd603a`).
- **DB de log:** "Log de Otimizações" — Notion `19fb65e5-c72b-8106-8e76-f1e684197316`.
- **Task-exemplo (ground truth):** TSK-135 `[KIL] PHI ALERT - 01/07/2026`, `campaign_id=GADS-21149189736`
  (Barbearia), **Em Andamento há 21 dias**, Prioridade Baixa, Gravidade Baixa, `execution_id=FALLBACK-20260701-…`
  (congelado), Observação "?? Atualizado automaticamente PHI - PHI Score: 48.96 (WARNING). Priority Score: 30.62."
- **Escala do problema (verificado):** TODAS as "[KIL] PHI ALERT" são da **mesma campanha** (GADS-21149189736,
  cronicamente WARNING ~40–50). Prioridade **sempre Baixa**, mesmo na que foi escalada a Gravidade "Crítica"
  (10/04). O ciclo típico é ~21 dias.

### Como a task muda a cada dia (reconstruído)
Na run diária, a campanha (se ≥2 dias em alerta) passa por `If Deve Escalar? → Update Escalar Tarefa`
(que grava `Prazo=$today`, Gravidade="Crítica", Observação "Escalada automática") **e em seguida** cai no
`Update a database page`, que **sobrescreve** Status/Gravidade/Data Programada/Observação com valores genéricos.
Título e `execution_id` são escritos **só no create** → congelam em 01/07. Resultado líquido = o que se vê na
TSK-135.

## 1. Decisão de arquitetura — consolidar no inline; aposentar o Loop Alerta Fase 1

Existem **dois criadores de task rodando em paralelo** (double-write) na mesma execução:
- **Inline (Pipeline_v2):** nó `Create a database page`, título `[{client_slug}] PHI ALERT - {data}`. **É o vivo
  e visível** (gerou a TSK-135). → **AUTORITATIVO.**
- **`PHI - Loop Alerta Fase 1`** (`JqPwFD9udCq2hRPw`): título `[PHI] Otimizacao - {nome} - {classificação}`.
  Chamado por `Chamar Loop Alerta Fase 1` (executeWorkflow) com `workflowInputs = {}` (vazio — re-consulta tudo).

**Ação (Olavo aprovou):**
1. **Desabilitar** o nó `Chamar Loop Alerta Fase 1` dentro do Pipeline_v2 (`disabled:true`) — corta o double-write.
2. **Desativar** o workflow `JqPwFD9udCq2hRPw` (`unpublish`/inactive) e **renomear** para
   `[APOSENTADO 2026-07-21] PHI - Loop Alerta Fase 1 — NÃO REUTILIZAR` com sticky note explicando.
3. **Documentar aqui** (esta seção) a regra: **o `Loop Alerta Fase 1` NÃO deve ser reaberto/reutilizado sob
   nenhuma hipótese**, a menos que uma necessidade **estrutural/estratégica** o justifique — nesse caso, reabrir
   via ADR. A lógica boa dele (gate de 2 leituras, idempotência por `campaign_id`, criação de Log de Otimizações)
   deve ser **portada para o inline** onde faltar (ver P6), não reativada em paralelo.

> Nota: NÃO arquivar/apagar o `JqPwFD9udCq2hRPw` ainda (mantém histórico auditável); só desativar + renomear.
> Reavaliar arquivamento definitivo quando o inline consolidado estiver validado em produção por ≥2 semanas.

## 2. Diagnóstico forense (verbatim dos nós)

### 2.1 🔴 Tier 1 — falhas SILENCIOSAS (a automação falha sem avisar)

**(A) Auto-close é código morto — tasks nunca fecham sozinhas.**
- `Check Auto-Close` (combinator `and`) testa `{{ $json.phi_classification }} == "GOOD"` **e**
  `{{ $json.otimizacao_ativa }} == true` — mas o item de entrada é a **saída de `Sync Scores to Notion`**
  (objeto de página Notion), onde esses campos **não existem** → ambos `undefined` → aresta `false` sempre →
  a task **nunca** é roteada para fechar. (`Enrich for Sync` nem emite `otimizacao_ativa`.)
- Mesmo se chegasse: `Auto-Close Task (Notion)` grava `Status = "Conclu�do"` (bytes `Conclu ef bf bd do` = U+FFFD),
  que **não é** a opção válida `Concluído` → Notion rejeita.
- `Auto-Close: Desativar Otimização` tem a **chave malformada**:
  `key = "={\"key\":\"Otimização Ativa?|checkbox\",\"checkboxValue\":false}"` (um JSON string dentro do `key`) →
  não limpa o flag.
- `Get Task para Fechar` filtra `Status does_not_equal "Conclu�do"` (U+FFFD) → filtro é no-op.
- Design: fecha só em `GOOD`; recuperação a `EXCELLENT` (≥80) também não fecharia.
- **Consequência:** as 3 tasks "Concluído" foram fechadas manualmente ou por versão antiga — a automação atual
  **não fecha nada**.

**(B) Escalada se autodestrói.** `Update Escalar Tarefa` (Gravidade="Crítica", Observação "Escalada automática")
roda **imediatamente antes** de `Update a database page` no mesmo item, que sobrescreve Gravidade e Observação.
Só `Prazo` sobrevive. → esforço de escalada é jogado fora; explica por que a task de 21 dias mostra "Baixa".

**(C) Corrupção de encoding quebra lógica.** ~18 strings com `U+FFFD` (o editor do n8n corrompe não-ASCII ao
salvar). **3 quebram lógica:** `"Conclu�do"` (auto-close/filtro), `"M�éia"` em `Code Criar Checklist.mapPrioridade`
(`if (score>=40) return 'M�éia'` — prioridade inválida rejeitada pelo Notion; e note que a **cópia da mesma lambda
no `Create` usa `'Média'` correto** — os dois mapeadores divergem), e a chave `"Hip�tese Sugerida (IA)"` em
`Update Hipótese na Tarefa` (não casa o campo → hipótese IA não persiste).

### 2.2 🟠 Tier 2 — os 6 pontos do Olavo (todos CONFIRMADOS)

| # | Problema | Causa-raiz (nó / expressão) |
|---|---|---|
| **P1** | Sem "dias em alerta" | `Buscar Campanhas Alertas`/`Verificar Escalada` contam dias com `ORDER BY … DESC LIMIT 2` + `HAVING COUNT(...) >= 2` → nunca passa de 2, e **nunca é gravado** em campo Notion. |
| **P2** | Título congela 1ª data; prazos bumpam | Título = `[…] PHI ALERT - {{ new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}) }}` só no `Create`. `Data Programada`/`Prazo` = `{{ $today }}` re-avaliado no `Update`/`Update Escalar`. |
| **P3** | Prioridade não reflete WARNING | `Create.Prioridade` = função de `priority_score` (`>=80 Crítica / >=60 Alta / >=40 Média / senão Baixa`). `priority_score = (100-phi)*0.6 + miv*0.4` → 48.96 dá 30.62 → **Baixa**. Setada **só no create** (e re-frozen por `Update Hipótese na Tarefa`); `Update a database page` **não** recalcula. |
| **P4** | execution_id congelado | `Create.execution_id = {{ …execution_id }}` só no create; `Update a database page` não inclui. |
| **P5** | Task 21 dias aberta | Auto-close morto (Tier 1-A) + score cronicamente WARNING. Regra de "2 dias consecutivos" **existe e funciona** (`dias_em_alerta >= 2`, sem bypass CRITICAL-imediato). |
| **P6** | Tipo "Otimização" sem link de log | `Create` seta `Tipo="Otimização"`/`Subtipo="Otimização de Campanha"` (hardcoded). Inline cria checklist (DB Checklist) mas **nenhum** nó cria/linka "Log de Otimizações" — só o Loop Alerta Fase 1 fazia. |

Bônus Tier 2: **Gravidade recebe balde de prioridade** (`Update` seta Gravidade de `priority_score` →
{Crítica,Alta,Média,Baixa}); "Alta"/"Média" **não são opções válidas** de `Gravidade Detectada`
(opções: CRITICAL/WARNING/GOOD/EXCELLENT + Crítica/Baixa legadas) → Gravidade nunca reflete `WARNING`.

### 2.3 Bugs estruturais adicionais
- **Risco de task duplicada:** `Tarefa Existe?` testa `{{ $json.id }} exists`, mas `id` só existe se a query de
  **escalada** (`Get tasks para Escalada`) deixou um id no item. No caminho **não-escalada** (campanha <2 dias)
  não há id → `Tarefa Existe?` = false → `Create` dispara → risco de duplicar. O check precisa de um **lookup
  próprio por `campaign_id`** (como o Loop Alerta faz em `Verificar Tarefa Aberta`).
- **`If otimização ativa`** (cond `otimizacao_ativa == false`): latch de estado (set no create, clear no
  auto-close) está quebrado porque o nó de clear é malformado (Tier 1-A) → flag nunca limpa uma vez setado.
- **Sem "Observação Diária":** a leitura diária **sobrescreve** o campo `Observação` único; o histórico só existe
  em `phi_score_history` (BQ), nunca aparece no Notion. Olavo pediu que variações diárias constem num fluxo.

## 3. Plano de correção (por lotes — cada lote aprovado antes de codar)

> **Campos novos no DB Tasks** (dependência transversal — criar ANTES dos lotes que os usam; documentar por
> ADR-31/Contrato de Dados): `Dias em Alerta` (number, P1), `Data de Detecção` (date, P2),
> `Log de Otimização` (relation → Log de Otimizações, P6), `Workflow` (text, S2), `Última Execução` (date, S2).

### Lote 1 — Falhas silenciosas + Prioridade/execution_id (URGENTE)
1. **Auto-close (Tier 1-A):** apontar `Check Auto-Close` para dados que **carreguem** `phi_classification`
   (ler de `Enrich for Sync`/`Code Clean` via `$('…').item.json…`; incluir esses campos na saída do
   `Enrich for Sync`); condição → `phi_classification IN ('GOOD','EXCELLENT')`; corrigir `Auto-Close Task`
   status → `Concluído`; reescrever `Auto-Close: Desativar Otimização` como `{key,type,checkboxValue}` válido;
   corrigir `Get Task para Fechar` filtro → `Concluído`. Adicionar **histerese** (fechar só após **2 dias
   consecutivos** GOOD/EXCELLENT — simétrico à regra de abertura).
2. **Escalada (Tier 1-B):** eliminar o clobber. Opção recomendada: **um único nó de update** que já computa
   Gravidade/Observação/Prioridade considerando o estado de escalada, em vez de escalada-depois-genérico. A
   Observação passa a **acrescentar** (append dated line), não sobrescrever (atende "Observação Diária").
3. **Encoding (Tier 1-C):** re-digitar as 3 strings que quebram lógica (`Concluído`, `Média`, chave
   `Hipótese Sugerida (IA)`) e, de brinde, limpar as demais U+FFFD nos nós tocados. **Edições via MCP**
   (`update_workflow` preserva bytes — comprovado no Agregador); **não salvar pela UI** (é o que corrompe).
4. **P3 Prioridade:** mapear de `phi_classification` — **CRITICAL→Crítica, WARNING→Alta** (GOOD→Média,
   EXCELLENT→Baixa; tunável). Aplicar em `Create` **e** adicionar prop `Prioridade` ao `Update a database page`
   (re-classifica diariamente). Aposentar o mapeador por `priority_score` (ou mantê-lo só como desempate dentro
   da banda). **Gravidade** também passa a vir de `phi_classification` (CRITICAL/WARNING/GOOD/EXCELLENT).
5. **P4 execution_id:** adicionar `execution_id` (id da **última** execução) ao `Update a database page`;
   manter a proveniência da criação em `Data de Detecção` (Lote 2) ou num `execution_id_criacao`.

### Lote 2 — Rastreabilidade e log (P1, P2, P6, S2)
6. **P1 Dias em Alerta:** contar streak real em `phi_score_history` (sem `LIMIT 2`); gravar em `Dias em Alerta`
   no create+update; refletir no título/Observação.
7. **P2 Título/datas:** título passa a `[{client_slug}] PHI ALERT - {campaign_name}` (**sem data**);
   `Data de Detecção` fixa no create; parar de sugerir "data" pelo `Data Programada` bumpado. (Alternativa:
   manter data no título mas reescrevê-la no update — preterida; sem-data é mais limpo.)
8. **P6 Log de Otimizações:** adicionar nó Notion criando entrada no DB Log de Otimizações após `Create`,
   relacionando à task (espelhar o `Criar Log Otimizacoes` do Loop Alerta Fase 1); prop `Log de Otimização`
   (relation) na task.
9. **S2 Workflow + run:** props `Workflow = {{ $workflow.name }}` e `Última Execução = {{ $now }}` no
   create+update.

### Frente separada — S1 (qual anúncio pesou na quebra)
Hoje **impossível**: o pipeline opera só em nível de campanha (`phi_score_current/_history` keyed por
`client_id,campaign_id`); `Anúncio` nunca é preenchido e não há métrica ad-level no fluxo. Requer:
granularidade de anúncio na ingestão/scoring → identificar o anúncio de maior peso (ex.: maior share de MIV) →
mapear em `Anúncio|relation`. **Não é um patch; é design.** Registrar como item de roadmap.

## 4. Disciplina de implementação (obrigatória)
- **Draft → smoke → publish**, igual ao Agregador. Editar o rascunho via MCP; **execução manual** (não publica)
  para validar; **publish só com OK do Olavo**.
- **Read-back após cada edição** (`get_workflow_details` + comparação byte-a-byte do nó).
- **Nunca salvar pela UI do n8n** enquanto houver strings não-ASCII (corrompe). Se o Olavo precisar abrir na UI,
  não clicar "Save" sem necessidade.
- **Idempotência:** o smoke pode reprocessar a TSK-135 — garantir que update não duplica e que o auto-close, se
  disparar, fecha a task certa.
- **`activeVersionId`:** este WF já teve incidente de versão (ver log do Agregador) — anotar a versão ativa
  antes e depois; o histórico do n8n retém só ~7 versões (rollback longo não é confiável).

## 5. Verificação por lote — como o executor verifica e o resultado esperado

> **Padrão de verificação (todos os lotes), 3 camadas:**
> **(V1) Read-back de edição** — após cada `update_workflow`, `get_workflow_details` + comparação **byte-a-byte**
> do(s) nó(s) tocado(s) contra o texto pretendido (via jq/python). PASS = idêntico; nenhum `U+FFFD` novo.
> **(V2) Smoke funcional** — execução **manual** do `ITWG3Ge0asXtUM8U` (não publica). O executor **não** dispara
> por MCP (approval-wall); pede ao Olavo para rodar pela UI e passar o `executionId`, ou usa `execute_workflow`
> se liberado. Depois inspeciona a execução (`get_execution includeData`) e/ou consulta o Notion.
> **(V3) Verificação de dado** — `notion-fetch`/`notion-query-data-sources` na task e no Log; queries BQ via um
> workflow temporário (padrão do Agregador, arquivar ao fim).
> **Regra de ouro:** verificar num **objeto de teito descartável** sempre que a ação for destrutiva (fechar task,
> etc.) — nunca validar auto-close direto na TSK-135.

### Lote 0 — Arquitetura (desativar o double-write)
- **Método:** (a) `get_workflow_details(ITWG3Ge0asXtUM8U)` → `jq` no nó `Chamar Loop Alerta Fase 1` conferindo
  `disabled == true`; (b) `get_workflow_details(JqPwFD9udCq2hRPw)` → `active == false` e `name` começa com
  `[APOSENTADO 2026-07-21]`; (c) após o 1º smoke pós-mudança, `notion-query-data-sources` na DB Tasks filtrando
  `Nome da Tarefa` que comece com `[PHI] Otimizacao` **criadas após** o timestamp do smoke.
- **Resultado esperado (PASS):** nó `Chamar…` desabilitado; WF `JqPwFD9udCq2hRPw` inativo e renomeado;
  **zero** tasks novas `[PHI] Otimizacao …` após o smoke. Só o formato `[…] PHI ALERT …` (inline) aparece.

### Lote 1 — Falhas silenciosas + Prioridade/execution_id
**V1 (read-back):** os nós `Check Auto-Close`, `Auto-Close Task (Notion)`, `Auto-Close: Desativar Otimização`,
`Get Task para Fechar`, `Update a database page`, `Create a database page`, `Code Criar Checklist`,
`Update Hipótese na Tarefa` batem byte-a-byte com o pretendido; **nenhum `U+FFFD`** remanescente neles
(checar com `grep -c $'\\ufffd'`).

**V2/V3 — cenário A (WARNING corrente, sem fechar):** rodar smoke; consultar a task da campanha em WARNING
(TSK-135 / GADS-21149189736 via `notion-fetch`).
- **PASS:** `Prioridade = Alta`; `Gravidade Detectada = WARNING` (banda real, não "Baixa"/"Média");
  `execution_id` = id da execução **desta** run (prefixo `EXEC-PHI-<hoje>…`, **≠** `FALLBACK-20260701`);
  `Observação` **acrescida** de uma linha datada nova (histórico preservado, não sobrescrito); a linha de
  escalada (se ≥2 dias) **sobrevive** (não é mais clobberada); Status permanece `Em Andamento` (não fecha — WARNING).

**V2/V3 — cenário B (teste controlado de auto-close, sem poluir BQ):**
1. Criar **1 task descartável** na DB Tasks: `Nome = [TESTE] AUTOCLOSE`, `Criado por Automação = YES`,
   `Status = Em Andamento`, `campaign_id = GADS-21116045403` (Salão, hoje **GOOD** phi≈67; confirmar via
   `phi_score_current` que tem ≥2 dias GOOD/EXCELLENT consecutivos).
2. Rodar smoke. 3. `notion-fetch` na task de teste.
- **PASS:** Status vira **`Concluído`** (opção válida, sem `U+FFFD`); flag `Otimização Ativa?` = **false**
  (desmarcado); e — controle negativo — a task da campanha WARNING **NÃO** fecha.
4. **Cleanup:** apagar/cancelar a `[TESTE] AUTOCLOSE`. Registrar no report que foi removida.
- **PASS de histerese:** se existir só **1** dia GOOD (não 2), a task de teste **não** deve fechar (fecha só com
  2 dias consecutivos bons — simétrico à regra de abertura).

### Lote 2 — Rastreabilidade e log (P1, P2, P6, S2)
**V1 (read-back):** nós de create/update + o novo nó do Log de Otimizações batem byte-a-byte; props novas
presentes.
**V3 (dado) na task criada/atualizada no smoke:**
- **P1 — `Dias em Alerta`:** número; cruzar com uma query BQ (via WF temporário) contando dias consecutivos em
  `phi_score_history` para aquele `campaign_id` na banda CRITICAL/WARNING. **PASS:** o número na task == a
  contagem do BQ (e reflete o valor real, ex.: 21, não capado em 2).
- **P2 — Título/datas:** `Nome da Tarefa` = `[{client_slug}] PHI ALERT - {campaign_name}` (**sem data**);
  existe `Data de Detecção` fixa (= data de criação, não muda entre runs). **PASS:** título estável run-a-run;
  `Data de Detecção` não muda; sem data enganosa no título.
- **P6 — Log de Otimizações:** `notion-query-data-sources` na DB Log de Otimizações
  (`19fb65e5-c72b-8106-8e76-f1e684197316`) filtrando pela relação com a task. **PASS:** existe **1** entrada
  ligada à task; a task tem `Log de Otimização` (relation) preenchido; sem duplicar em re-runs (idempotente).
- **S2 — Workflow + run:** **PASS:** `Workflow` = "PHI - Pipeline_v2"; `Última Execução` = timestamp da run
  (atualiza a cada run).

### Fechamento (todos os lotes)
- **Idempotência:** rodar o smoke **2×** — 2ª run **não** cria task duplicada para a mesma campanha, **não**
  duplica entrada no Log, e apenas **atualiza** (Observação ganha +1 linha, Prioridade/Gravidade/execution_id
  re-gravados). PASS = contagem de tasks/logs por `campaign_id` inalterada entre as duas runs.
- **Versão:** anotar `activeVersionId` antes/depois; publicar **só** com OK do Olavo; confirmar `active:true`
  e `versionId == activeVersionId` após publish.

## 6. Guardrails
- Escopo estrito: só os nós de ciclo de vida da task no `ITWG3Ge0asXtUM8U` + desativar o `JqPwFD9udCq2hRPw`.
  **NÃO** tocar na cadeia de ingestão/cálculo do score (`Calcular e Persistir PHI Score` e upstream).
- Notion é produção: cuidado ao criar campos novos (documentar no Contrato/ADR-31). Não apagar campos existentes.
- Se algo do plano não for possível, **reportar** — não contornar.

## 7. Âncoras
- WF keystone: `PHI - Pipeline_v2` `ITWG3Ge0asXtUM8U` (inline autoritativo).
- WF aposentado: `PHI - Loop Alerta Fase 1` `JqPwFD9udCq2hRPw`.
- DBs Notion: Tasks `19fb65e5-c72b-812d-a734-de9a4d5b980f`; Log de Otimizações `19fb65e5-c72b-8106-8e76-f1e684197316`.
- Score: `phi_prod.phi_score_history` / VIEW `phi_score_current`; `priority_score = ROUND((100-phi)*0.60 + miv*0.40, 2)`.
- Task-exemplo: TSK-135 `390b65e5-c72b-816c-9cf4-dc0f68b8d3db`.
- Relacionados: ADR-31 (Contrato de Dados — campos novos), log do Agregador (`2026-07-21-agregador-t28-a02-a03-execution-log.md`, disciplina de versão).
