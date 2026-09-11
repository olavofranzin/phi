# [BRIEF sub-chat] Autonomia do Motor GBP — Schedule + gate "só Deals" no sweep do L3

> **Cole como 1ª mensagem.** Frente: Comercial/Prospecção. Runtime: **n8n** (MCP). **Escopo estrito:** tornar o
> **L3 Enriquecimento** autônomo (rodar por Schedule) e **seguro** (não quebrar, não enriquecer lead que não é
> Deal). **Um único workflow:** `GBP Scoring - L3 Enriquecimento (Pipeline B / C2)` — `EFD7Drr0LDMqfDXw`.
> **NÃO** mexer no L2, L4, no motor de regras, no prompt do Gemini, nem no que se grava. Decisões já tomadas
> pelo Olavo (2026-07-13): **gate = só Deals** (`id_hubspot` presente); entregar via este build.

## 0. Leia primeiro (estado real — não redesenhar)
- **AS-BUILT autoritativo:** `docs/handoff/2026-07-13-motor-scoring-gbp-as-built-reconciliacao.md` (§5.1/§5.2).
- Design mestre (seção AS-BUILT): `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`.
- Contrato da planilha: `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md`.

## 1. Como o L3 está HOJE (verificado por leitura dos nós, 2026-07-13)
Já é um **sweep da planilha inteira**, disparado só sob demanda:
```
Start (chamado por L2) [executeWorkflowTrigger, passthrough]
  → Buscar Lead [Google Sheets, lê TODAS as linhas da aba `leads`, sem filtro]
  → Loop Over Items [splitInBatches v3]
       ├─(loop)→ If [id≠'' E nome≠'' E analise_gbp_ia=''] → 01 Apify (modo place, placeIds:[$json.id])
       │         → Motor de Regras → 05 AI Report (Gemini) → Montar Campos HubSpot
       │         → Atualizar Deal (HubSpot) → Update row in sheet → Wait → volta ao Loop
       └─(fim)→ Call 'Enriquecimento Site L4'
```
- **Resolução por place_id** (`placeIds:[ $json.id ]`) — **não** usa `placeUrl`. Nada a resolver aqui.
- **`Atualizar Deal`** usa `dealId = {{ $('Loop Over Items').item.json.id_hubspot }}`, resource `deal`, op `update`,
  **`onError` default (stopWorkflow)**. Grava só os 17 campos de enriquecimento (nunca `closedwon`/`closedlost`).

## 2. Problemas a corrigir (por que não basta só agendar)
- **(b) 🔴 Crash que para o sweep:** o `If` **não** checa `id_hubspot`. Lead sem Deal (sem `id_hubspot`) passa,
  é enriquecido e **quebra** no `Atualizar Deal` (dealId vazio) → como `onError` é stop, **o sweep inteiro morre**.
- **(a) 🟠 Custo:** hoje enriqueceria **todo** lead não-enriquecido. Deep-dive (`maxReviews:20`,`maxImages:10`) +
  Gemini por lead é caro. Gate escolhido: **só Deals** → resolve (a) e (b) de uma vez.

## 3. Mudanças (SÓ no `EFD7Drr0LDMqfDXw`) — método n8n obrigatório antes de codar
`get_sdk_reference` → `get_workflow_best_practices` (técnicas: "scheduling", "data pipeline") →
`get_workflow_details(EFD7Drr0LDMqfDXw)` → `search_nodes`/`get_node_types` p/ Schedule Trigger, Filter, Limit →
`validate_workflow` **antes** de publicar. Usar credenciais do cofre (`list_credentials`), nunca hardcodar.

### 3.1 Gate "só Deals" + elegibilidade (entre `Buscar Lead` e `Loop Over Items`)
Inserir **antes** do `Loop Over Items` (assim o teto conta só elegíveis):
1. **Filter** "Elegíveis (Deal sem diagnóstico)": manter linha se **`id_hubspot` notEmpty** **E** `analise_gbp_ia`
   empty **E** `id` notEmpty **E** `nome` notEmpty.
2. **Limit** "Teto por execução": `maxItems = 15` (tunável — começa conservador p/ controlar custo Apify+Gemini).
   Sobra (mais de 15 elegíveis) fica p/ a próxima execução — idempotente, não reprocessa quem já tem `analise_gbp_ia`.

Reconectar: `Buscar Lead → Filter → Limit → Loop Over Items` (preservar tudo depois do Loop).

### 3.2 Defesa em profundidade (baratas, mesmo com o Filter)
- No `If` interno, **acrescentar** a condição `id_hubspot` notEmpty (combinator AND) — rede de segurança se o Filter
  for contornado.
- No `Atualizar Deal`, setar **`onError: continueRegularOutput`** — um Deal problemático nunca derruba o sweep.

### 3.3 Autonomia (Schedule)
- Adicionar **Schedule Trigger** "Sweep diário" ligado ao **`Buscar Lead`** (paralelo ao `Start (chamado por L2)`
  — os dois triggers alimentam o mesmo `Buscar Lead`; **não** remover o trigger existente).
- Cadência: **diário às 05:00** (evita choque com o sync de leads a cada 6h nos minutos :00 e com o guarda-schema
  das 08:00). Tunável.

> ⚠️ O gate agora vale **para os dois caminhos** (Schedule e chamada do L2). Isso é desejado: mesmo quando o L2
> chama o L3, só Deals são enriquecidos e o crash some. Não é regressão — leads vindos do L2 normalmente já têm Deal.

## 4. Guardrails
- **Escopo estrito:** só `EFD7Drr0LDMqfDXw`. Não tocar L2/L4/motor/prompt/mapeamentos de escrita.
- HubSpot é **produção**: o L3 continua escrevendo **apenas** os 17 campos de enriquecimento; **nunca**
  `closedwon`/`closedlost` nem mover etapa.
- Idempotência preservada (sweep pula quem já tem `analise_gbp_ia`). Teto por execução obrigatório.
- Manter o workflow **ativo** após publicar. Se algo do plano não for possível, **reportar** — não contornar.

## 5. Teste de aceitação (antes de deixar publicado)
1. **1 execução manual** do L3 (via Schedule desabilitado ou execução manual): confirmar que
   - só linhas com `id_hubspot` **e** sem `analise_gbp_ia` entram no loop (Filter);
   - no máx. 15 leads processados (Limit);
   - nenhum erro em lead sem Deal (não deve nem entrar; e `onError:continue` garante);
   - `analise_gbp_ia` escrito de volta na planilha e no Deal.
2. Conferir que um 2º run **não** reprocessa quem já foi enriquecido (idempotência).
3. Só então confirmar o Schedule ativo.

## 6. Ao terminar — atualizar docs (regra da casa)
- Registrar no AS-BUILT (`docs/handoff/2026-07-13-motor-scoring-gbp-as-built-reconciliacao.md` §5.2) que a
  autonomia foi ligada (gate só-Deals, teto 15/run, Schedule diário 05:00) e encerrar a lacuna de autonomia.
- Escrever um **execution-log** curto do que foi mudado (nós adicionados, teste, decisões).

## 7. Âncoras
- Workflow: `EFD7Drr0LDMqfDXw` (`GBP Scoring - L3 Enriquecimento (Pipeline B / C2)`).
- Cadeia: L2 `5j79f7oR8x1Nxs4q` → L3 `EFD7Drr0LDMqfDXw` → L4 `5L3SyzDkZqf1N6vW`.
- Motor/spec: `scripts/gbp_scoring_prototype.py` · `scripts/gbp_scoring_core.js` (branch `claude/gbp-scoring-motor-n8n-0zri0i`).
