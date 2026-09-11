# [BRIEF sub-chat] Consolidação dos WRITERS do PHI — um destino, um dono (v2)

> **Como usar:** abra uma sessão nova (sub-chat dedicado) e cole este arquivo como 1ª mensagem.
> É auto-contido. **Modelo recomendado:** Opus.
> **Repo:** `olavofranzin/phi` · **Branch de trabalho:** `claude/consolidacao-2026-08`
> (é a branch oficial).
> **Substitui** `docs/handoff/2026-08-27-simplificacao-escrita-dados-subchat-brief.md` (v1, mesma
> missão; esta v2 traz o inventário já iniciado e o modelo de contrato que funcionou).
> **Idioma com o Olavo:** português simples. **Antes de mudança grande: explicar e esperar OK.**

---

## 0. Missão

Vários workflows escrevem **o mesmo dado, da mesma fonte, com semânticas diferentes** — em
`raw_campaign_data` (BigQuery) e nos campos de campanha do **Notion**. Ninguém sabe de onde veio
cada número.

**Objetivo:** mapear todos os writers, achar as sobreposições e **implementar um writer canônico
por destino**, com linhagem clara.

**Por que agora:** este trabalho é o critério **C2** da `DEFINICAO-DE-PRONTO-PHI-V1.md`
(*"um dado, um writer"*) e **destrava o C1** — o Score v2 (ADR-34), que precisa de uma série diária
limpa. Está **parado desde 2026-08-27** e é hoje o único item 🔴 do painel do projeto.

## 1. Escopo — leia isto antes de qualquer coisa

O problema dos writers tem **duas metades**. Esta é a segunda.

| Metade | Onde | Estado |
|---|---|---|
| **(a) Planilha `leads` + CRM** (frente Prospecção) | Google Sheets / HubSpot / Odoo | ✅ **RESOLVIDA** — ver ADR-35 |
| **(b) Pipeline do Score** (BigQuery + Notion) | `raw_campaign_data`, `phi_score_history`, campos Notion | 🔴 **É O SEU ESCOPO** |

⚠️ **Não mexa na metade (a).** Ela já tem contrato vigente (ADR-35) e workflows `PROSP-01..08`.
Tocar nela quebraria um contrato aceito.

## 2. 🎯 O modelo a copiar — já funcionou aqui dentro

A metade (a) resolveu **exatamente este problema** com um padrão simples. **Copie o padrão**
(`docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md` + `ADR-35`):

1. **Princípio único:** *um destino, um dono.* Cada tabela/coluna tem **um** workflow autorizado a
   escrever. Todos leem; nenhum outro escreve — nem para "corrigir".
2. **Matriz de propriedade:** uma tabela listando destino → dono → momento da escrita.
3. **Invariantes numerados** (`I1`, `I2`, …) que **não mudam sem novo ADR**. Exemplos que
   provavelmente se aplicam aqui também:
   - nunca escrita cega por chave sem garantir que a chave existe;
   - campo não observado grava **vazio/NULL**, nunca `0` (guardrail `N/D` do PHI);
   - carimbo de data e de origem em toda escrita (linhagem).
4. **Plano de migração em fases**, começando por **"Estancar"** (desligar o que apaga dado alheio)
   antes de construir qualquer coisa nova.

> Esse padrão levou a frente Prospecção de 19 workflows caóticos a 8 com dono declarado.
> **Não reinvente o formato — reuse.**

## 3. O problema, com a evidência já levantada (2026-08-27)

- **`raw_campaign_data` é populado pelo `GADS_INSERT`** (o "Subworkflow Campanhas"), **não** pelo
  Daily Entry — apesar do **ADR-010** dizer que só o Daily Entry deveria escrever essa tabela.
  Verificação read-only (execução n8n **32695**): últimos 60 dias das 2 campanhas KIL =
  **100% `step=GADS_INSERT`**, 1 linha/dia, contínuo.
  → **Correção 2026-09-08 (informada pelo Olavo):** o `Daily Entry` (`zGgIqiLlo5iAn8ud`) está inativo
  **porque foi SUCEDIDO**, não abandonado. Em seu lugar entrou **`sw metricas campanhas`
  (`W571K320aqIHsdtH`), que é uma CÓPIA do Daily Entry**, chamada pelo orquestrador
  **`operador unico metricas` (`cLcimNoefTOnVVbd`)**. Ou seja: o **ADR-010 não está violado** — está
  **desatualizado no nome**. A função canônica continua existindo, mudou de arquivo sem ADR de
  atualização. O ADR-37 deve corrigir a nomenclatura, não decretar violação.
- **Cada writer trata `conversions` diferente:**
  - `daily_entry_v4` grava `conversions = round(Métrica-Mãe 1D)` = **round(CPA)** — bug, mas **esse
    writer não é o que vence** para o KIL.
  - `GADS_INSERT` grava **contagem real**, porém **INT64** (perde fracionárias) e **subcontando** vs.
    o export oficial: Salão BQ `sum_conv=321` vs export ~481 no mesmo período (~49 dias).
    Provável **atraso de atribuição** + arredondamento + escopo de ações diferente. **Investigar.**
- **Tipos inconsistentes:** `conversions` **INT64**; `conversions_3d/7d` **FLOAT64** (NULL nas linhas
  GADS_INSERT); `cost`/`cost_7d`/`primary_metric_goal` FLOAT64; `impressions` INT64.
- **Notion tem escrita dupla:** `phi_subworkflow_campaign_metrics` escreve `Score Diário`/`phi_score`
  (de um `final_score` próprio) **e** o `Pipeline_v2` escreve `Score Diário`/`Status Geral` (do
  `phi_value` do BigQuery). **Dois donos do mesmo campo → quem roda por último vence.**
- **Positivo:** dias sem entrega **existem** no BQ como linhas-zero explícitas (cost=0/impr=0/conv=0).
  Bom para o "sinal de entrega" do Score v2 — não há buraco de calendário em produção.

## 4. A arquitetura viva (confirmada pelo Olavo em 2026-09-08)

```
operador unico metricas   cLcimNoefTOnVVbd   ← ORQUESTRADOR (ativo)
   ├── sw metricas campanhas   W571K320aqIHsdtH   ← CÓPIA do Daily Entry · grão campanha × dia
   ├── sw metricas conjuntos   t0DH5N5maws4egnG   ← grão conjunto
   └── sw metricas anuncios    vVAdXAJh6MW2Z5Hp   ← grão anúncio
```

O `Daily Entry` (`zGgIqiLlo5iAn8ud`) foi **desativado por sucessão**: quem faz o trabalho dele hoje
é o `sw metricas campanhas`. **Este é o writer vivo do grão campanha × dia.**

### ✅ RESULTADO DO LOTE 1 (parcial) — 2026-09-08, confiança 0,93

**Resposta à pergunta nº 1: opção (b). São DOIS writers ativos na mesma tabela.**

| Cadeia | Quem escreve | Carimba | Roda |
|---|---|---|---|
| `operador unico metricas` → | `sw metricas campanhas` `W571K320aqIHsdtH` | `'DAILY_ENTRY'` | **04:00 BRT** |
| `PHI - Pipeline_v2` → | `PHI - Subworkflow Campanhas` `b1pbn8qmzCNTufTp` | `'GADS_INSERT'` | **07:00 BRT** |

Ambas ativas, ambas com sucesso em 05, 06, 07 e 08/09 (execuções reais conferidas).

#### 🔴 Por que o BigQuery mostrava 100% `GADS_INSERT` mesmo com dois writers

Assimetria entre os dois MERGE:
- **04h** — o `sw metricas campanhas` não acha a linha do dia e faz **INSERT** com `DAILY_ENTRY`.
- **07h** — o `PHI - Subworkflow Campanhas` acha a linha e faz **UPDATE**, e o `UPDATE SET` dele
  **inclui `ingestion_step = 'GADS_INSERT'`**. O `UPDATE SET` do primeiro **não inclui** o campo.

> **Quem escreve por último apaga o rótulo do primeiro. Sempre.**
> **`ingestion_step` não diz de onde veio o número — diz quem mexeu por último.**
> A evidência da execução 32695 **não provava um writer só**: provava que um sobrescreve o outro.

#### 🔴 Pior: cada linha é uma colcha de retalhos

O `GADS_INSERT` sobrescreve `cost`, `conversions`, `clicks`, `impressions`, `revenue`,
`primary_metric_goal` e até o `execution_id`. Mas **não toca** em `cost_3d`, `conversions_3d`,
`cost_7d`, `conversions_7d`, `data_source` e `platform` — que ficam com o que o `DAILY_ENTRY` gravou
3 horas antes.

**Cada linha mistura duas origens, sem nenhuma marcação.** As métricas de 1 dia vêm de um writer e
as janelas de 3/7 dias vêm de outro.

#### ✅ Hipótese do `round(CPA)` — DESCARTADA
O bug já foi corrigido no `sw metricas campanhas` (código de 09/08/2026): ele usa
`metrics.conversions` direto da API. O `round(CPA)` sobrevive só em lugares mortos (o `Daily Entry`
inativo) e **no repositório, que nunca foi atualizado** — corrigir o repo faz parte do Lote 3.

#### 🔎 Achado novo para o Lote 2 — duas formas de arredondar, e a pior vence
| Writer | Como arredonda | Efeito em 4,7 conversões |
|---|---|---|
| `GADS_INSERT` (**vence**) | `parseInt()` — **trunca** | **4** |
| `DAILY_ENTRY` | `Math.round()` | 5 |

**Hipótese (não medida):** explica parte do subcount do Salão (BQ 321 × export ~481).
**Como medir:** comparar `SUM(conversions)` do BQ com o export oficial no mesmo período e ver se a
diferença bate com o número de dias com fração.

#### ↩️ Retificação — eu errei, a v1 estava certa
Na v2 eu supus que o `PHI - Subworkflow Campanhas` fosse o writer do Notion. **Não é.** Os 14 nós
foram lidos: ele **não escreve nenhum campo do Notion** — ele **é o `GADS_INSERT`**.
A v1 do brief estava correta; **minha retificação introduziu o erro** ao inferir a partir da
informação do Olavo em vez de verificar. **O writer do Notion continua desconhecido.**

#### O que o Lote 1 ainda NÃO cobriu
`sw metricas conjuntos` · `sw metricas anuncios` · `Agregador T28` · `Fechar Otimização` ·
`WF-DOC-Telemetria-Diaria` · tabelas `raw_ad_data`, `t28_*`, `phi_score_history` ·
**quem escreve `Score Diário`/`phi_score` no Notion**.

### Demais candidatos ATIVOS a inventariar
| Workflow | ID | Suspeita |
|---|---|---|
| `PHI - Pipeline_v2` | `ITWG3Ge0asXtUM8U` | escreve Notion (`Score Diário`, `Status Geral`) a partir do `phi_value` do BQ |
| `PHI — Agregador de Métricas Multi-fonte` | `4sdG2UKMCBuFq8xn` | escreve tabelas `t28_*` |
| `PHI - Fechar Otimização` | `83vfKD8XMYmjZjFQ` | escreve Notion (Log de Otimizações) |
| `client_config` | `SI5NSzRb8lVUz74RwOhIT` | escreve config |
| `WF-DOC-Telemetria-Diaria` | `VubalOUaoBteCyC6` | telemetria |

### INATIVOS — confirmar que estão mortos antes de arquivar
`PHI - Pipeline` `nFJpI3zYsk0Wst5O` · `PHI - Fase 2 Cálculo Score` `X1eI3_aZ32EE3owgeDi_r` ·
`PHI - Fase 3 Operacional` `LIaXSq-WoaF1yj3gF30Rj` · `sw phi pipeline_v2` `MOGG0bI51pNHevEJ` ·
`sw métricas e diagnósticos anúncios` `uqEHxuJPWRiZS6ai` · as 3 cópias `*copia seg*`
(`sZYkRjHcFwEatKOJ`, `nPBVPzw2qK7epQtU`, `ffEyTUED2p4Rq2Iw`) · `WF-T28-Analise-Campaign`
`fhYmJH0o9BW1IO4i` · `WF-T28-Orquestrador-Analises` `8Q5ofmAZju0hTN08`

⚠️ **O `Daily Entry` NÃO entra na lista de arquivamento** sem antes confirmar que o
`sw metricas campanhas` cobre 100% do que ele fazia — é o original de uma cópia que está em produção.

> **Método deste inventário:** leitura por nome/descrição/estado ativo (n8n MCP, 2026-09-08) +
> correção do Olavo sobre a cadeia `operador unico metricas`. **Não** foi leitura nó a nó.

## 5. Lote 1 — Inventário (OBRIGATORIAMENTE read-only)

Completar a tabela abaixo para cada workflow do §4, abrindo os nós:

| Coluna | O que preencher |
|---|---|
| Workflow (id + nome) | do §4 |
| Fonte | Google Ads API / Meta / Notion / BQ |
| Destino | tabela BQ (+ `ingestion_step`) e/ou campo Notion |
| Grão | campanha/conjunto/anúncio × dia/janela |
| Semântica de `conversions` | contagem real? `round(CPA)`? qual escopo de ações? |
| Frequência | cron / on-demand / sub-workflow |
| Conflito | escreve algo que outro também escreve? |

Tabelas a cobrir: `raw_campaign_data`, `raw_ad_data`, `t28_*`, `phi_score_history`.
**Entregável:** o mapa + a **lista de sobreposições** (é ela que vira o ADR).

### 5.1. Tarefa transversal — escrever a descrição fiel (regra R5)

**Toda vez que você abrir um workflow para inventariar, saia dele com a descrição correta.**
Não é trabalho extra: é o entregável que faz a próxima auditoria dispensar o Olavo.

A descrição precisa responder, em duas frases: **o que faz** + **por que existe / o que substituiu**.

Comece por estes três, cuja intenção hoje **só existe na cabeça do Olavo**:

| Workflow | O que a descrição precisa registrar |
|---|---|
| `operador unico metricas` `cLcimNoefTOnVVbd` | que é o **orquestrador** e chama os 3 sw (campanhas/conjuntos/anúncios) |
| `sw metricas campanhas` `W571K320aqIHsdtH` | que é **cópia do `Daily Entry`** e **entrou no lugar dele** — por isso o original está inativo |
| `Daily Entry` `zGgIqiLlo5iAn8ud` | que está inativo **por sucessão**, e quem assumiu — para ninguém arquivar por engano |

⚠️ Descrição copiada de outro workflow é bug (o ADR-35 pegou 3 casos assim na Prospecção).

## 6. Lote 2 — Desenho → vira **ADR-37**

No formato do ADR-35 (§2 deste brief). Precisa decidir:
- **Um** writer canônico de `raw_campaign_data`, com `conversions` **real e FLOAT64**
  (`metrics.conversions` da API). Aposentar o GADS_INSERT **ou** o Daily Entry — **não os dois vivos**.
- **Um** dono por campo do Notion (ex.: só o `Pipeline_v2` escreve `Score Diário`/`Status Geral`).
- **Atraso de atribuição:** dias recentes são **provisórios** — re-puxar N dias ou marcar a linha.
- **Linhagem por linha:** `execution_id`/`source_execution_id` — quem escreveu, de qual fonte, quando.
- **ADR-010 está VIOLADO DE FATO** (não é só nome desatualizado, como supus): há **dois writers
  ativos na mesma tabela hoje**. O ADR-37 precisa declarar **um** e desligar o outro.
- 🔴 **Criar linhagem de verdade.** `ingestion_step` não serve — ele registra o último a tocar, não
  a origem do número. Decidir um mecanismo por linha (ex.: `source_execution_id` + carimbo por
  bloco de colunas) que sobreviva a um segundo writer.

## 7. Lote 3 — Implementar (com cuidado)

`phi_dev` primeiro + smoke (Barbearia + Salão) → migração de tipo (`conversions` → FLOAT64) →
desligar os writers redundantes → produção **só com OK do Olavo**.
🔴 **Não quebrar o pipeline diário que roda 07:00 BRT.**

## 8. Guardrails (não-negociáveis)

- **Lote 1 é read-only** para **comportamento**: nada de alterar lógica, nó, query ou agendamento
  em produção sem OK + smoke em `phi_dev`.
  ✅ **EXCEÇÃO EXPLÍCITA (corrige contradição com o §5.1, apontada pelo sub-chat em 2026-09-08):**
  **escrever `description` de workflow É PERMITIDO no Lote 1.** É metadado, não muda comportamento,
  e é o entregável da regra R5. Não precisa de OK caso a caso.
  *(A v2 deste brief mandava escrever a descrição no §5.1 e proibia mexer em produção no §8 — o
  sub-chat parou e perguntou, que era o certo. A contradição era minha.)*
- **Disciplina de token:** validar SQL/queries no chat **antes** de gastar no n8n. Workflow
  temporário de leitura → **arquivar depois** (padrão da execução 32695).
- **Guardrails de dado:** `conversions=0 ⇒ CPA/ROAS N/D` · `source_status error ⇒ N/D`, nunca `0`.
- **Não recalcular score (ADR-003).** Este sub-chat cuida da **escrita/ingestão**, não do cálculo.
- **Não tocar na frente Prospecção** (§1).

## 9. Registro de andamento — OBRIGATÓRIO (regras R2/R3 do CLAUDE.md)

1. **Notion (R3):** DB "PHI — Registro de Execuções (Sub-chats)"
   (`8d8eb685f66249c7ba4f298d744feec3`) — **ao começar e ao encerrar cada lote**: frente · o que foi
   feito · estado · próximo passo · link. *O digest diário das 08:30 depende disso e hoje vive
   dizendo "sem progresso" porque ninguém escreve lá.*
2. **Execution-log (git):** `docs/handoff/<data>-consolidacao-writers-<lote>-execution-log.md`.
3. **Painel (R2):** atualizar `docs/strategic-planning/ESTADO-DO-PROJETO.md` §0 e o critério **C2**
   da `DEFINICAO-DE-PRONTO-PHI-V1.md`.
4. **ADR:** o Lote 2 vira **ADR-37** em `docs/strategic-planning/saude-digital/adr-rascunhos/`.

## 10. Âncoras

- **Modelo de contrato:** `docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md` + `ADR-35`.
- **Linha de chegada:** `docs/strategic-planning/DEFINICAO-DE-PRONTO-PHI-V1.md` (critérios C1 e C2).
- **Consumidor que motiva:** ADR-34 (Score v2) + `docs/analises/score-v2-validacao/`.
- **Mira errada a corrigir:** `docs/handoff/2026-08-27-fase2-fix-writer-conversions-DRAFT.md` mirava
  o `daily_entry_v4` — **alvo errado**, o writer vivo é o `GADS_INSERT`.
- ADR-010 (violado) · ADR-29 Camada 0 · ADR-25 (sub-WFs reutilizáveis) · ADR-32 (Ledger).
- BigQuery: `project-0e7c58d4-656f-49e8-807` / `phi_prod`, credencial n8n `UhLRAanVarQeOpQy`.
- Campanhas de teste: Barbearia `GADS-21149189736` (meta CPA 5,20) · Salão `GADS-21116045403` (3,50).

---

## 11. A pergunta de fecho (R4)
> *"Onde estamos, quanto falta, e o que eu atualizei para provar isso?"*
