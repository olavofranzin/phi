# Fase 5: escada de evidência + fim do `.first()` no gate de Campanhas - Execution Log

Data: 2026-08-08 (execucao 2026-08-09 madrugada BRT)
Branch: claude/consolidacao-2026-08
Brief: docs/handoff/2026-08-08-fase5-escada-gate-campanhas-brief.md
Fases anteriores: `1dd1459` (prefixo) · `820b895` (tendencia) · `79956ab` (desvio indefinido) · `c92b49a` (fase 4)

> **Resultado:** escada de evidencia portada para o `Code classificar status` do
> `sw metricas campanhas`, `.first()` de volume morto, `final_score = null` quando nao
> classifica. Aceite verde: a campanha da barbearia deixou de ser "Dados Insuficientes" e
> agora e **Crítico** (evidencia parcial/30d); o salao **nao regrediu** (segue Crítico /
> "Acima da Meta"). Smoke ANTES de publicar.

---

## Estado inicial

| Workflow | id | activeVersionId antes | activeVersionId depois |
|---|---|---|---|
| sw metricas campanhas | `W571K320aqIHsdtH` | `67e0366e-68b5-4355-86dc-463882e0951b` | **`2a4c40e5-21b4-4b03-a82a-6a6716b9e171`** |

**Rollback:** `restore_workflow_version` -> `67e0366e`.

Um unico no alterado: `Code classificar status`.

---

## Escada portada (do `sw metricas anuncios`, ja vivo desde a fase 3/4)

`Code classificar status` (campanhas) — antes: gate binario `MIN_CLICKS_7D=100` /
`MIN_CONV_7D=10` em 7d + `.first()` de volume. Depois:

1. **Escada de evidencia** (7d E 30d, melhor nivel vence):
   - PLENO: >=100 cliques **e** >=10 conv -> `confianca: certeza`.
   - PARCIAL: >=30 cliques **e** >=3 conv -> `confianca: hipotese`, registra a janela.
   - NENHUM: so aqui deixa de classificar.
2. **`.first()` de volume REMOVIDO.** Usa `raw_clicks_7d/raw_conversions_7d` (e
   `raw_clicks_30d/raw_conversions_30d`) do **item corrente**. O antigo
   `$("HTTP Request Google Ontem (D7)").first()` dava a resposta de UMA campanha a outra
   quando as contagens de run divergiam.
3. **`final_score = null`** quando nao classifica (era o `50` magico).
4. **`significancia`** com `nivel / janela_evidencia / confianca / desvio_indefinido /
   desvio_motivo / clicks_7d / conversions_7d / clicks_30d / conversions_30d /
   dias_desde_inicio / campanha_nova / suficiente`.

A guarda de `desvio === null` antes de comparar (fase 4) foi preservada.

---

## Adaptacoes campanha != anuncio

### 1. "anuncio novo" -> "campanha nova": qual caminho valeu

O fluxo de anuncios lia `Data de Lançamento` do item (`$('Loop Over Items').item`). Para
campanhas usei **`Data de Inicio`** do DB Campanhas, lida pelo no de origem pareado:
`$('Get many database Campanhas').item.json.properties?.['Data de Inicio']?.date?.start`,
dentro de `try/catch`.

**Caminho que valeu no smoke:** a data **estava disponivel** — `dias_desde_inicio` saiu
`459` (Meta CHA), `870` (barbearia) e `870` (salao). Ou seja, nao precisei do fallback
"sem data". Como as tres campanhas sao antigas (>14d), `campanha_nova = false` em todas.
A regra do brief ("se nao houver data no item, cai em Sem Dados, nunca Em aprendizado")
esta implementada e testada em dry-run, mas **nao foi exercida** no smoke porque a data
existia. Registrado: `Em aprendizado` so seria emitido com `Data de Inicio` real < 14 dias.

### 2. Rotulos DENTRO do DB Campanhas — algum divergiu?

**Nenhum rotulo e escrito num select do DB Campanhas por este no.** Mapeei o consumo
(item 3 abaixo): o `Code classificar status` de campanhas **nao** alimenta nenhum campo de
status/prioridade no Notion. Portanto `final_status` (`OK`/`Atenção`/`Crítico`/`Sem Dados`/
`Em aprendizado`) e `classe_score` sao **internos** — nao ha correspondencia a validar
contra as opcoes do DB. Ainda assim, busquei o schema do data source de Campanhas
(`collection://19fb65e5-c72b-80be-8c3b-000bb115d53f`) e confirmei:
- O DB tem `Status Geral da Campanha` (select: `CRITICAL`/`WARNING`/`GOOD`/`EXCELLENT`) —
  **escrito pelo `PHI - Pipeline_v2` (phi_score), nao por este workflow.**
- O DB tem `Status` (status: lifecycle do projeto: Em execução, etc.) — nao e desempenho.
- O DB tem `Data de Inicio` (date) — usada acima.

Como nada de `final_status` vai para o Notion aqui, **nao criei nem usei opcao de select
nova** — nao havia o que casar. Se um dia o Olavo quiser expor a leitura de desempenho da
campanha numa propria propriedade, a correspondencia sugerida seria
`Status Geral da Campanha`: Crítico->CRITICAL, Atenção->WARNING, OK->GOOD, Sem Dados/
Em aprendizado->(deixar em branco). Fica como pendencia (nao implementado).

### 3. Quem consome o status/score da campanha

Tracei o grafo a partir de `Code classificar status`:
`-> Code Preparar Payload de Observação -> Code Debug -> Create a database page Create
Observation -> Update a database page -> Code Montar SQL -> Execute SQL inserir daily
entry`.

- **`Code Preparar Payload de Observação`** usa **`status_meta`** (ex.: "Acima da Meta 🚨"),
  **nao** `final_status`/`final_score`. `status_meta` vem de outro caminho (upstream) e ja
  estava correto.
- **`Update a database page`** (campanhas) escreve **apenas metricas** (CPA/CPC/CPL/CPM/CTR/
  impressoes/investido/metrica-mae), **nada** de `final_status`/`final_score`/`classe_score`.

**Conclusao:** o fluxo de campanhas **nao tem** um no de diagnostico separado que grave o
veredito de desempenho no Notion (diferente do fluxo de anuncios, que tem
`Code Diagnóstico Criativo` + escreve `ad_status_operacional`/`ad_score_operacional`). Assim,
o efeito desta fase e **corrigir a classificacao interna** (`final_status`/`final_score`/
`significancia`), verificavel na execucao, e **matar o `.first()`** — sem mudanca visivel de
campo no Notion. Nao houve nada para ajustar quanto a "`final_score = null`" a jusante,
porque ninguem grava `final_score`. Registrado como o achado do item 3 do brief.

---

## Publicacao

Smoke exec **`26334`** (manual, `success`) rodado **antes** do publish (usa o rascunho).
Depois: `publish_workflow` -> activeVersionId `2a4c40e5-21b4-4b03-a82a-6a6716b9e171`.
Avisos do validador: so os falso-positivos ja conhecidos (`Execute SQL inserir daily entry`
prefixo; `Create a database page Create Observation` schema Notion).

---

## Smoke — exec 26334

| campanha | `bq_campaign_id` | d7.desvio | nivel / janela | confianca | **final_status** | final_score | status_meta |
|---|---|---|---|---|---|---|---|
| Meta CHA | META-120223097083780450 | — (analise error) | nenhum | sem_base | **Sem Dados** | null | No Alvo ? |
| **BARBEARIA** | GADS-21149189736 | 22.88 | **parcial / 30d** | hipotese | **Crítico** | 60 | Acima da Meta 🚨 |
| **SALÃO** | GADS-21116045403 | 18.86 | **pleno / 7d** | certeza | **Crítico** | 48 | Acima da Meta 🚨 |

### Aceite

- **Barbearia deixou de ser "Dados Insuficientes"?** SIM. Antes (fase 4, exec 26175):
  `final_status = "Dados Insuficientes"`, `final_score = 50`, `significancia.suficiente=false`
  porque 3 conv < 10 no gate binario. Agora: **`Crítico`**, `final_score = 60`, nivel
  **parcial** com janela **30d** (30d: 112 cliques / 5 conv -> passa o piso parcial 30/3),
  desvio real 22.88% refletido. A leitura deixou de ser barrada pelo gate.
- **Salao regrediu?** NAO. Continua **`Crítico`** com `status_meta = "Acima da Meta 🚨"`,
  nivel **pleno/7d** (247 cliques / 50 conv). O desvio saiu **18.86%** nesta execucao
  (na fase 4 era ~27%) — a diferenca e **dado vivo do novo dia** (2026-08-09: cpa_7d 4.16
  vs meta 3.5), nao regressao. O invariante do aceite — Crítico / acima da meta — se mantem.

Sem `.first()` de volume executado (removido). Pareamento por `.item` do no Get resolveu a
`Data de Inicio` corretamente para as 3 campanhas.

---

## `.first()` residuais no fluxo de campanhas (mapeados, NAO corrigidos)

Fora do `Code classificar status` (que foi corrigido), estes `.first()`/cross-node de dado
por-item permanecem no `sw metricas campanhas` — **mesma classe da fase 4, so mapeados**:

| no | referencia | tipo | risco |
|---|---|---|---|
| `Code calculo desvio meta` | ja corrigido na fase 4 (item A) | — | — |
| `Code Recupera Metas p Comparação` | `$('Edit Fields').first()` (se existir igual ao de anuncios) | por-item | a confirmar; mesma familia |
| `Code Unificar Períodos (D1, 3D, 7D)` | `$('HTTP ...').first()` | por-item | idem — no fluxo de campanhas roda so no ramo Google |
| `Code Prep Tendência` | usa `.item` (fase 2), ok | — | — |

Observacao: no fluxo de campanhas as contagens de run tendem a bater melhor (menos mistura
Google/Meta no mesmo lote que anuncios), mas a fragilidade e a mesma. Recomendo aplicar a
disciplina "casar por id / indice alinhado, nunca `.first()`" tambem aqui num brief proprio,
espelhando o item B da fase 4. **Nao corrigi** (fora do escopo desta fase).

---

## Pendencias para o Olavo

1. **Campanhas nao expoe a leitura de desempenho no Notion.** O `Code classificar status`
   agora classifica certo (Crítico/Atenção/OK/Sem Dados + score + confianca), mas nada disso
   e gravado numa propriedade da campanha — so `status_meta` e as metricas. Se quiser paridade
   com anuncios (que mostram `ad_status_operacional`/`ad_score_operacional`/`ad_diagnostico`),
   seria preciso: (a) escolher/confirmar a propriedade destino (sugestao:
   `Status Geral da Campanha` para status, `Score Diário (0-100)` para score — ambos ja
   existem no DB), e (b) mapear os rotulos (Crítico->CRITICAL, etc.). Brief proprio.
2. **`.first()` residuais** em `Code Recupera Metas` / `Code Unificar Períodos` de campanhas
   (tabela acima). Mesma correcao do item B da fase 4.
3. **Nao-regressao do salao** deixou o desvio ~19% (dado novo) em vez de ~27%; e apenas a
   metrica do dia, nao mudanca de logica.

---

## Fora de escopo respeitado

- Prefixo `=` de outras queries: intocado.
- `Execute SQL inserir daily entry` e `BigQuery Persistir Sinais Criativo`: intocados.
- `PHI - Subworkflow Campanhas`: NAO arquivado.
- `.first()` fora do `Code classificar status`: so mapeados.
- D1/D3 nao calculados; `Merge Meta Ads` nao perseguido.
- Nenhuma opcao de select nova criada no Notion.
- Sem force-push, sem deletar branch, sem PR.

## Como verificar

1. `get_workflow_details` `W571K320aqIHsdtH` -> activeVersionId `2a4c40e5-...`; `Code
   classificar status` com escada (MIN_CLICKS_PARCIAL/PLENO) e sem `.first()`.
2. `get_execution` `26334` node `Code classificar status` -> BARBEARIA `final_status=Crítico`,
   `significancia.nivel=parcial`, `janela_evidencia=30d`; SALÃO `final_status=Crítico`,
   `nivel=pleno`.
3. Comparar com exec `26175` (fase 4): BARBEARIA era `Dados Insuficientes`/`final_score=50`.
