# BRIEF · Anúncios — Campos de diagnóstico do nó "Update a database page"

**Para:** Estrategista (definição de regras de negócio)
**De:** Engenharia (análise técnica do workflow)
**Data:** 2026-07-24
**Workflow:** `sw metricas anuncios` — ID `vVAdXAJh6MW2Z5Hp`
**Nó em foco:** `Update a database page` (tipo `n8n-nodes-base.notion`, `resource: databasePage`, `operation: update`)
**Status:** workflow em rascunho (não publicado). Este brief NÃO pede alteração ainda — pede **decisão** do estrategista.

---

## 1. Objetivo do brief

Durante as correções dos Tracks A e B, surgiu uma dúvida legítima sobre o último nó do fluxo (`Update a database page`): parte dos campos que ele grava na página do anúncio **não vem** dos dados de performance calculados (Meta/Google), e sim é **lida da própria página do anúncio e reescrita sem alteração** (echo).

Este documento:
1. Explica **qual página** é atualizada.
2. Mostra **de onde vem cada campo** (métricas vs. diagnóstico).
3. Lista os **10 campos de diagnóstico** que hoje são echo, o estado atual de cada um e os dados que já existem para calculá-los.
4. Pede ao estrategista as **regras de negócio** necessárias para decidir se cada campo deve passar a ser **calculado** por um novo nó — e como.

---

## 2. Qual página é atualizada

```
pageId = {{ $('Get database anuncios').item.json.id }}   (mode: id)
```

É a **própria página do anúncio** (database "Anúncios"), o mesmo item que entrou no `Loop Over Items`. Ou seja: para cada anúncio processado, o fluxo grava de volta na página desse anúncio. **Isso está correto** e não é objeto de mudança.

---

## 3. De onde vem cada campo (achado central da análise)

Rastreando os 23 campos gravados, existem **duas origens distintas**:

### 3.1 Métricas de performance — JÁ vêm do Meta/Google (corretas)

Estes campos são alimentados por `Code classificar status`, que fica **depois** do `Merge Meta Ads` e, portanto, carrega os números do caminho que rodou (Meta **ou** Google):

| Campo Notion | Nó de origem |
|---|---|
| Cliques, Conversões, CPA, CPC, CPM, CTR, Impressões, Métrica-Mãe 7D, ROAS, Taxa de Conversão, Valor Investido | `Code classificar status` |
| Receita | `Code Cálcula Métricas` |
| Plataforma | `Code Preparar Payload de Observação` |

> **Conclusão parcial:** as métricas de performance **não** vêm do `Loop Over Items`; já são derivadas dos dados frescos de Meta/Google. Para elas **não é preciso criar nó novo.**

### 3.2 Campos de diagnóstico/criativo — vêm do `Loop Over Items` (echo)

Os 10 campos abaixo são lidos da própria página (via `Loop Over Items`) e regravados sem transformação. **É aqui que está a dúvida.**

---

## 4. Os 10 campos de diagnóstico (estado atual)

Todos são lidos hoje de `$('Loop Over Items').item.json.properties.<campo>` e gravados de volta iguais. A coluna "Valor observado" vem de execuções reais (itens KIL/CHA, jul/2026).

| # | Campo Notion | Tipo | Expressão de origem hoje (echo do Loop) | Valor observado |
|---|---|---|---|---|
| 1 | `ad_score_operacional` | number | `...properties.ad_score_operacional.number` | `0` |
| 2 | `ad_prioridade_otimizacao` | select | `...properties.ad_prioridade_otimizacao.select.name` | `"Baixa"` |
| 3 | `ad_diagnostico` | rich_text | `...properties.ad_diagnostico.rich_text[0].text.content` | `"Sem volume suficiente para analise."` |
| 4 | `ad_status_operacional` | select | `...properties.ad_status_operacional.select.name` | `"Sem dados"` |
| 5 | `ad_tendencia` | select | `...properties.ad_tendencia.select.name` | `"Sem dados"` |
| 6 | `ad_ultima_execucao` | date | `...properties.ad_ultima_execucao.date.start` | `2026-06-23` |
| 7 | `criativo_angulo` | rich_text | `...properties.criativo_angulo.rich_text[0].text.content` | `"Sem dados"` |
| 8 | `criativo_cta` | rich_text | `...properties.criativo_cta.rich_text[0].text.content` | `"Sem dados"` |
| 9 | `criativo_fadiga_status` | select | `...properties.criativo_fadiga_status.select.name` | `"Sem dados"` |
| 10 | `criativo_score_operacional` | number | `...properties.criativo_score_operacional.number` | `0` |

**Efeito prático hoje:** como o valor gravado é o mesmo que já estava na página, esses campos **nunca evoluem sozinhos** — ficam presos em `"Sem dados"`/`0` a menos que alguém edite à mão. Eles não refletem a performance do anúncio.

---

## 5. Dados que JÁ existem para calcular esses diagnósticos

O **Track B** (concluído em rascunho) elevou a coleta Meta para **nível anúncio** e passou a derivar métricas novas no nó `Code Cálculo Dados Meta`. Hoje já estão disponíveis, por anúncio:

**Do Meta (ad-level):**
- `hook_rate` (vídeo iniciado ÷ impressões, %)
- `hold_rate` (vídeo completo ÷ vídeo iniciado, %)
- `cpm`, `roas`, `ctr`, `cpc`, `cpa`, `taxa_conversao`
- `quality_ranking`, `engagement_rate_ranking`, `conversion_rate_ranking` (rankings do Meta: `ABOVE_AVERAGE` / `AVERAGE` / `BELOW_AVERAGE_*` — podem vir vazios em anúncios antigos)
- `video_iniciados`, `video_50`, `video_completos`
- `message_conversations`, `conversoes`, `receita`, `objective`

**Do Google:** métricas equivalentes de custo/cliques/impressões/conversões/CPA/ROAS (janelas D1/D7/D30) já unificadas no fluxo antes de `Code classificar status`.

> **Ou seja:** existe matéria-prima suficiente para **calcular** diagnósticos de saúde criativa em vez de só ecoar o valor antigo. Falta a **regra de negócio**.

---

## 6. Decisão pedida ao estrategista

Para cada um dos 10 campos, decidir em qual categoria ele se encaixa:

- **(A) Calcular** a partir dos dados de Meta/Google → engenharia cria um nó novo (`Code Diagnóstico Criativo`) e religa o `Update` para ler de lá.
- **(B) Manter como echo do Notion** (valor definido manualmente ou por outro processo) → nada muda.
- **(C) Remover** do update (se o campo não faz sentido ser gravado aqui).

Sugestão inicial da engenharia (a confirmar/ajustar):

| Campo | Sugestão | Por quê |
|---|---|---|
| `ad_score_operacional` | **A (calcular)** | score 0–100 de saúde do anúncio; há dados para compor |
| `criativo_score_operacional` | **A (calcular)** | idem, focado no criativo (hook/hold/rankings) |
| `criativo_fadiga_status` | **A (calcular)** | fadiga é derivável de tendência de hook_rate/CTR/frequência |
| `ad_tendencia` | **A (calcular)** | melhora/piora vs. janela anterior (já temos tendência 3D×7D) |
| `ad_status_operacional` | **A (calcular)** | "Ativo/Sem dados/Pausado" a partir de entrega e status |
| `ad_diagnostico` | **A ou B** | texto-resumo; pode ser gerado por regra ou continuar manual |
| `ad_prioridade_otimizacao` | **B (echo)** | parece decisão do gestor, não métrica |
| `ad_ultima_execucao` | **B/C** | é data de controle; provavelmente não é diagnóstico de performance |
| `criativo_angulo` | **B (echo)** | atributo descritivo do criativo, definido manualmente |
| `criativo_cta` | **B (echo)** | atributo descritivo do criativo, definido manualmente |

---

## 7. Perguntas específicas (necessárias para engenharia implementar o item A)

Para **cada campo marcado como "A (calcular)"**, precisamos das regras exatas:

1. **`ad_score_operacional` (0–100):** quais componentes e pesos? (ex.: 40% desempenho vs. meta, 30% hook_rate, 30% hold_rate). Qual a fórmula final e o arredondamento?
2. **`criativo_score_operacional` (0–100):** quais entradas? (ex.: hook_rate, hold_rate, rankings do Meta). Como pontuar quando os rankings vêm vazios (anúncios antigos)?
3. **`criativo_fadiga_status` (select):** quais valores possíveis (ex.: `Saudável`, `Atenção`, `Saturado`, `Sem dados`) e quais **faixas/gatilhos** disparam cada um? (ex.: queda de hook_rate > X% em 7 dias, ou frequência > Y).
4. **`ad_tendencia` (select):** quais rótulos (ex.: `Melhorando`, `Estável`, `Piorando`, `Sem dados`) e quais **limiares** de variação definem cada um? Sobre qual métrica-base (a Métrica-Mãe? hook_rate?).
5. **`ad_status_operacional` (select):** quais estados e como derivá-los (entrega > 0, status do anúncio na plataforma, ausência de dados)?
6. **`ad_diagnostico` (texto):** deve ser gerado por regra (frases-modelo por faixa) ou continua manual? Se por regra, quais frases para quais situações?

> **Importante:** para campos `select`, precisamos da **lista exata de opções** já existentes no Notion (nomes idênticos), senão o update falha. Para campos `number`, precisamos da **faixa e do arredondamento**.

---

## 8. Proposta técnica (assim que as regras forem definidas)

1. Criar um nó **`Code Diagnóstico Criativo`** logo após `Code classificar status` (onde já existem métricas unificadas de Meta/Google + dados ad-level do Track B).
2. Esse nó calcula apenas os campos marcados como **(A)**, aplicando as regras do item 7, com **guardas anti-`NaN`/`Infinity`** e fallback para `"Sem dados"`/`0` quando faltar entrada.
3. Religar no `Update a database page` **somente** os campos (A) para lerem de `$('Code Diagnóstico Criativo')` em vez de `$('Loop Over Items')`. Os campos (B) permanecem como echo; os (C) são removidos.
4. Não mexer nas métricas de performance (já corretas).

---

## 9. Verificação (após implementação)

- **Integridade de bytes:** 0 ocorrências de U+FFFD nos nós editados (validação byte-exata pós-edição).
- **Sem `NaN`/`Infinity`** em nenhum campo `number` calculado.
- **Selects válidos:** todo valor gravado em campo `select` corresponde a uma opção existente no Notion (senão erro 400).
- **Smoke test** com anúncio real **com veiculação** (Meta ad-level e Google não-PMax), conferindo que os diagnósticos deixam de ser `"Sem dados"`/`0` e refletem a performance.
- **Regressão:** métricas de performance e demais campos continuam gravando normalmente.

---

## 10. Referências

- **Workflow:** `sw metricas anuncios` — `vVAdXAJh6MW2Z5Hp`
- **Nó alvo:** `Update a database page` (página atualizada: `Get database anuncios`.item.json.id)
- **Fonte das métricas (ok):** `Code classificar status`, `Code Cálcula Métricas`, `Code Preparar Payload de Observação`
- **Fonte dos diagnósticos (echo hoje):** `Loop Over Items`
- **Dados ad-level novos:** nó `Code Cálculo Dados Meta` (Track B) — `hook_rate`, `hold_rate`, rankings, vídeo, etc.
- **Briefs relacionados:** `2026-07-24-meta-metrics-trackA-anuncios-google-fixes-brief.md`, `2026-07-24-meta-metrics-trackB-anuncios-meta-adlevel-brief.md`
