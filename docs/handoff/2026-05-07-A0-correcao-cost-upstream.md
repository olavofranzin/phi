# A.0 — Correção upstream de `cost_3d` / `cost_7d` — Blocker Report

> Executado por: **Codex (GPT-5)** • 2026-05-07 • Solicitado pelo Cérebro Estratégico via Painel #4 (`359b65e5-c72b-8145-9caf-d7705d38866f`)
>
> **Status: Bloqueado antes de patch no workflow.** Codex respeitou o critério de parada do briefing.

## Status

Bloqueado antes de patch no workflow.

## Motivo do bloqueio

O arquivo local analisado foi `daily_entry_v23.json` (versão atual do workflow `zGgIqiLlo5iAn8ud` — o repo tinha `daily_entry_v4.json`, possivelmente desatualizado vs. produção).

Pelo critério de parada do briefing, o Codex precisava confirmar que os outputs dos HTTP Requests já trazem custo agregado em janela `3d` e `7d`, sem exigir agregação nova local.

Isso é verdadeiro para Google Ads, mas **não** para Meta Ads neste arquivo:

- `HTTP Request Google Ontem (D3)` consulta `segments.date BETWEEN ...` e retorna `metrics.cost_micros`
- `HTTP Request Google Ontem (D7)` consulta `segments.date DURING LAST_7_DAYS` e retorna `metrics.cost_micros`
- `HTTP Request Meta Ads` consulta apenas um dia via `time_range` com `date_d1` ou fallback `date_d2`, retornando `spend`
- `HTTP Request Meta Ads D-2` também consulta apenas um dia, não uma janela agregada de `3d` ou `7d`

Preencher `cost_3d` e `cost_7d` para Meta neste estado exigiria:

1. adicionar novas chamadas agregadas para `3d` e `7d`, ou
2. agregar localmente múltiplas respostas diárias

Ambas as opções aumentam o escopo e violam a regra explícita de parada.

## Evidência objetiva

### Google Ads já traz custo agregado por janela

`HTTP Request Google Ontem (D3)`:

```text
SELECT ... metrics.cost_micros ...
FROM campaign
WHERE campaign.id = '{{ ... }}'
AND segments.date BETWEEN '{{ $now.minus({ days: 3 }).toFormat('yyyy-MM-dd') }}'
AND '{{ $now.minus({ days: 1 }).toFormat('yyyy-MM-dd') }}'
```

`HTTP Request Google Ontem (D7)`:

```text
SELECT ... metrics.cost_micros ...
FROM campaign
WHERE campaign.id = '{{ ... }}'
AND segments.date DURING LAST_7_DAYS
```

### Meta Ads não traz custo agregado por janela

`HTTP Request Meta Ads`:

```text
fields=campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,objective
time_range={"since":"{{ $json.fallback_active ? $json.date_d2 : $json.date_d1 }}",
            "until":"{{ $json.fallback_active ? $json.date_d2 : $json.date_d1 }}"}
```

`HTTP Request Meta Ads D-2` repete a mesma estratégia de um único dia.

## Diff antes/depois

Nenhum diff aplicado no workflow.

```diff
--- a/daily_entry_v23.json
+++ b/daily_entry_v23.json
@@
- sem alterações
+ sem alterações
```

## Justificativa por trecho

### Sem patch em `Code Montar SQL`

Não apliquei patch porque o fluxo precisaria continuar correto para Google e Meta. Como Meta não fornece `cost_3d` e `cost_7d` agregados neste estado, qualquer correção parcial deixaria a ingestão heterogênea por plataforma sem uma decisão explícita de produto/arquitetura.

### Sem patch em `Code Cálcula Métricas`

Esse node trabalha com `valor_real`, `status_meta`, `orcamento_diario` e `opt_score`, não com a montagem final do SQL de ingestão. O problema do upstream de custo por janela está na disponibilidade do dado por plataforma antes da persistência.

## Como validar localmente

### 1. Confirmar que Google já entrega custo agregado

No JSON local, localizar os nodes:

- `HTTP Request Google Ontem (D3)`
- `HTTP Request Google Ontem (D7)`

Validação esperada:

- a query `D3` usa `BETWEEN ... AND ...`
- a query `D7` usa `DURING LAST_7_DAYS`
- ambas retornam `metrics.cost_micros`

### 2. Confirmar que Meta não entrega custo agregado

Localizar os nodes:

- `HTTP Request Meta Ads`
- `HTTP Request Meta Ads D-2`

Validação esperada:

- ambos usam `time_range` com `since == until`
- o campo retornado é `spend` diário
- não existe request Meta separado para janela `3d` ou `7d`

### 3. Smoke test textual mínimo

Se a pergunta for "consigo montar `cost_3d`/`cost_7d` sem nova agregação?":

- Google Ads: sim
- Meta Ads: não

Resultado: entrega A.0 deve parar aqui e voltar para decisão arquitetural.

## Riscos identificados

### 1. Risco de patch parcial por plataforma

Corrigir só Google faria `raw_campaign_data` passar a ter `cost_3d`/`cost_7d` reais para Google e zeros para Meta. Isso melhora parcialmente o PHI, mas muda a semântica da tabela por plataforma sem decisão explícita.

### 2. Risco de interpretação indevida do score

Se só Google for corrigido sem formalizar a exceção de Meta, o `PHI Score` passa a ser mais confiável para Google do que para Meta, mas isso não fica evidente na fase downstream.

### 3. Risco de regressão silenciosa

Adicionar agregação local improvisada para Meta dentro deste escopo cirúrgico criaria nova lógica de janela sem cobertura explícita de auditoria e sem validação prévia no SOP.

## Próxima decisão necessária

Escolher uma destas opções antes de retomar A.0:

1. limitar A.0 oficialmente a Google Ads e aceitar comportamento heterogêneo por plataforma por ora
2. estender o Daily Entry para buscar Meta `3d` e `7d` explicitamente
3. agregar Meta localmente a partir de múltiplas respostas diárias, com novo escopo e novo aceite

## Notion

Não atualizei a entrega A.0 no Notion para `Aguardando aceite`.

Motivo:

- a entrega não atende o critério de aceite de patch
- o próprio briefing manda parar e reportar ao encontrar esse blocker
- portanto o estado correto é de bloqueio aguardando decisão, não aceite

---

## Observações do Cérebro Estratégico (anexadas ao chegar)

- **Versão do workflow analisado**: Codex usou `daily_entry_v23.json` (provavelmente baixado via MCP n8n com a versão de produção atual). O repo tem `daily_entry_v4.json` — desatualizado vs. produção. Vale tratar como Aprendizado #12 candidato.
- **Critério de parada respeitado integralmente** — comportamento desejado, valida que o sistema operacional funciona.
- **Decisão arquitetural pendente** — apresentada ao Cérebro com 3 opções; aguardando aceite.
