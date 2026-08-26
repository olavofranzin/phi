# [DECISÃO de fonte — companion do ADR-34] Série diária que alimenta o Score v2

> **STATUS:** Rascunho de decisão (git). Responde à pergunta deixada aberta no ADR-34:
> *de onde vem a série diária* que a tendência/anomalia do Score v2 precisa. Feito a pedido
> do Olavo (2026-08-26, "opção A: mapear o que o Agregador grava vs. o que falta").
>
> **Método:** leitura dos DDLs (`agregador-t28/ddl/`), do writer `daily_entry_v4.json` e do
> nó de score `Calcular e Persistir PHI Score` (Pipeline_v2). **Sem execução de workflow.**

---

## 1. O que já existe (mapa das tabelas)

| Tabela | Grão | Particionada | Tem série diária? | Papel p/ o Score v2 |
|---|---|---|---|---|
| **`raw_campaign_data`** | campanha × dia | `date` | **SIM** (base D-1 acumula) + janelas `cost_3d/7d`, `conversions_3d/7d` pré-calc | **Fonte natural** |
| `raw_ad_data` | anúncio × dia | `date` | SIM (base D-1 + 3D/7D) | drill-down; rollup por VIEW |
| `t28_campaign` | campanha × **janela** (D-7/D-30) | `business_date` | **NÃO** (só agregados; VIEWs D-1/D-3 são "esqueletos" — o próprio DDL admite) | não serve p/ tendência/anomalia |

**Writer canônico (ADR-010):** só o **Daily Entry** (`daily_entry_v4.json`) escreve
`raw_campaign_data`. Grava 1 linha por (client_id, campaign_id, `date=D-1`) por rodada, com
`cost/clicks/impressions` **reais da API** + janelas + `primary_metric_goal` + `ingestion_step='DAILY_ENTRY'`.

## 2. O que falta / está quebrado (os gaps)

### 🔴 GAP 1 — `conversions` NÃO é contagem de conversões (bloqueador)
No `daily_entry_v4.json`:
```js
const conversions = Math.round(getNum(prop('Métrica-Mãe 1D') ?? prop('Valor Métrica-Mãe 1D')));
// ...gravado como: CAST(${conversions} AS INT64) AS conversions
```
- `Métrica-Mãe 1D` é o **valor do CPA** (v_d1 = custo/conv), não a **contagem** de conversões.
- O `extractRaw` do mesmo nó puxa `cost/clicks/impressions` de `metrics`, mas **não puxa
  `metrics.conversions`** — a contagem real **existe na resposta da API** e é ignorada.
- Efeito: `conversions` e `conversions_7d` guardam um **CPA arredondado**. O score faz
  `cost_7d / conversions_7d` ⇒ conta sem sentido. Ainda: `CAST … INT64` + `Math.round`
  **perde conversões fracionárias** (a API devolve ex. 6,97; `raw_ad_data` usa FLOAT64 de propósito).
- **⚠️ Verificar ao vivo** (1 query read-only) o que `raw_campaign_data.conversions/conversions_7d`
  contém hoje para Barbearia/Salão antes de codar — mas estruturalmente o writer **não produz**
  a contagem que o Score v2 precisa.

### 🟠 GAP 2 — Composição (hard vs soft) não é gravada (Onda B, deferível)
`raw_campaign_data` tem um único `conversions`. A separação hard/soft (Peça 3 do ADR-34 e
checks #1/#2 do ADR-29) exige `segments.conversion_action_category` — **não é bloqueador do v1**
(a composição é "flag + teto", não o núcleo).

### 🟡 GAP 3 — Continuidade / idade
- **Continuidade:** buracos por queda de credencial (incidente 08–16/jul) e dias sem rodada.
  O Score v2 deve **degradar com elegância** (IQR/tendência sobre os dias disponíveis) + honrar
  `ingestion_status`/`source_status` (guardrail 9).
- **Idade da campanha** (p/ o portão Peça 0): não está em `raw_campaign_data`; está em
  `t28_campaign.data_inicio_campanha` e no Notion. Plumbing simples.

### 🟡 GAP 4 — Janelas pré-calculadas são frágeis
`cost_7d/conversions_7d` são pré-somadas pelo writer (e hoje quebradas pelo GAP 1). Além disso o
relatório 2026-07-02 já pegou linhas-esqueleto com janelas NULL.

## 3. Decisão

1. **Fonte = `raw_campaign_data`, base diária** (`date, cost, conversions`). O Score v2
   **calcula as janelas (7d atual, 7d anterior) e a série diária de CPA por conta própria**,
   direto das linhas diárias — **não confia** nas colunas `*_7d` pré-somadas (frágeis; GAP 4).
2. **Camada 0 (ADR-29) — o que o writer precisa passar a gravar (o "falta"):**
   - **(v1, bloqueador)** extrair `metrics.conversions` **real** da resposta da API que o Daily
     Entry já busca (D-1), gravar como **FLOAT64** (sem `round`), na coluna `conversions`.
     Correção pequena e localizada no `Code Montar SQL` + `extractRaw`.
   - **(Onda B)** adicionar composição (`conversion_action_category`) p/ hard/soft.
   - Garantir **cobertura de todas as campanhas ativas** e honrar `source_status`.
3. **Idade** entra no score via `t28_campaign.data_inicio_campanha` (ou Notion).
4. **Não** usar `t28_campaign` como fonte de série (é agregado por janela).

## 4. Verificação antes de codar (1 query read-only)
Confirmar em `phi_prod.raw_campaign_data` (Barbearia + Salão, últimos 30–60 dias):
- `conversions`/`conversions_7d` são **contagem** ou **CPA arredondado**? (confirma GAP 1)
- Há **linha diária contínua** por campanha? Qual `ingestion_step` domina? Há esqueleto residual?
- `cost` diário bate com o CSV (Barbearia 60d = R$86,85; Salão = R$1.740)?

> Custo: 1 SELECT read-only (padrão do relatório 2026-07-02, workflow temporário arquivado).
> **Só com OK de budget do Olavo** (disciplina de token do CLAUDE.md).

## 5. Sequência proposta
1. **Verificar** GAP 1 ao vivo (query read-only). 2. **Corrigir o writer** (conversions real,
FLOAT64) — smoke em `phi_dev`. 3. **Backfill** de `conversions` real onde der (ou reprocessar da
API). 4. **Implementar o Score v2** (ADR-34) lendo a base diária. 5. Smoke Barbearia+Salão →
produção. **Nada aplicado sem OK + smoke.**

## 6. Conexões
ADR-34 (consome esta série) · ADR-29 (Camada 0 = este writer; checks #5/#6 já dão p/ v1) ·
ADR-010 (Daily Entry é o writer canônico de `raw_campaign_data`) · ADR-003/21 (autoridade/dado ralo).
