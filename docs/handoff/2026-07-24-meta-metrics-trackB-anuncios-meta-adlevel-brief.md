# [BRIEF · Track B] Anúncios — Configurar Meta a nível de anúncio

> **Executor:** rode **`/goal`** com este brief e siga estas regras (do Olavo):
> 1. **Antes de mudar algo grande, explique o plano e espere o Olavo aprovar.**
> 2. **Prefira a solução mais simples que resolve. Nada de complicar sem motivo.**
> 3. **Descreva como vai verificar se o resultado está correto.**

## Contexto (por que este trabalho existe)

No mesmo workflow de anúncios, o lado **Meta é um stub campanha-level não-configurado** (só o Google
chega no anúncio). Para o Módulo 28 diagnosticar **saúde de criativo**, o Meta precisa ser consultado a
**nível de anúncio** — é o único nível onde existem as classificações (qualidade/engajamento/conversão)
e as métricas de vídeo. Track B configura isso.

> **Dependência:** rodar **depois** do Track A (correções Google + dataset `phi_prod`), para o nível
> anúncio Meta aterrissar no BigQuery certo.

## Alvo

- **Workflow:** `sw metricas anuncios` — **`vVAdXAJh6MW2Z5Hp`** (mesmo do Track A).
- Nós Meta: `HTTP Request Meta Ads` e o gêmeo `HTTP Request Meta Ads D-2`; cálculo em
  `Code Cálculo Dados Meta`.
- **Por que aparece "05/2025":** o `time_range` usa `clean_data_inicio`/`clean_data_conclusao`, que vêm
  das **datas da campanha no Notion**. É o registro de uma campanha antiga; assim que houver campanha
  atual no Notion, a data se resolve sozinha. **Não é bug** — é stub.

## Disciplina de edição (idêntica ao Track A)

Editar via MCP, nunca pela UI (corrompe não-ASCII → U+FFFD); read-back byte-exato + scan U+FFFD=0 após
cada edição; **draft → smoke → publicar só com OK do Olavo**; prefixo MCP oscila (recarregar via
ToolSearch); `get_workflow_details` grande → jq/python; smokes pela UI (Olavo cola exec ID).

## Schema Meta acordado (fonte da verdade)

**Núcleo cru (guardar cru, derivar as taxas):** `spend, impressions, reach, frequency, clicks, actions,
action_values`.
**Adicionar (só fazem sentido em ad-level):** as 3 classificações · vídeo 3s/50%/100% · `inline_link_clicks`.
**Extrair do `actions_json` (grátis, zero campo novo):** **só** Conversas por mensagem iniciadas + custo.
**NÃO adicionar (cortados):** Seguidores IG, Visitas perfil IG, Engajamento Página, Visualizadores,
Cliques na loja, "Cliques únicos (todos)"/"CTR único (todos)", Cliques de saída (este só sob demanda p/
objetivo tráfego). Valor-de-lead/ROAS de lead: só se o pixel do cliente disparar valor (normalmente não).

## B1 — `HTTP Request Meta Ads` (+ gêmeo `HTTP Request Meta Ads D-2`)

- `level`: **`campaign` → `ad`**.
- `fields` (string única, vírgula-separada) — partir do atual
  `campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,objective` e **acrescentar**:
  - identidade ad-level: `ad_id,ad_name,adset_id,adset_name`
  - `reach,frequency`
  - `inline_link_clicks,inline_link_click_ctr,unique_inline_link_clicks`
  - `quality_ranking,engagement_rate_ranking,conversion_rate_ranking`
  - `video_3_sec_watched_actions,video_p50_watched_actions,video_p100_watched_actions`
- Manter `time_range` (clean_data_inicio/conclusao) e a credencial `facebookGraphApi`.
- Aplicar a MESMA mudança nos dois nós (D-1 e D-2).
- *Simples:* é uma edição de parâmetros de query (o `fields` e o `level`). Não reescrever o nó.

## B2 — `Code Cálculo Dados Meta` (derivar, não pedir de novo)

- Derivar (hoje faltam): `cpm = spend/impressions*1000`, `roas = revenue/spend`, `frequency`
  (usar o do Meta; fallback `impressions/reach`), **`hook_rate = video_3s / impressions`**,
  **`hold_rate = video_p100 / video_3s`**.
- Extrair do array `actions`: `onsite_conversion.messaging_conversation_started_7d` →
  `conversas_iniciadas`; `custo_por_conversa = spend / conversas_iniciadas`.
- Manter `ctr, cpc, cpa, taxa_conversao` já existentes. Guardas contra divisão por zero (retornar 0).

## B3 — Coleta ciente do objetivo (determinística, sem LLM)

- O campo `objective` já é puxado. Usar um nó **Switch/Code determinístico** para, conforme o objetivo,
  extrair os `action_type` certos do `actions_json` **já buscado** (mensagens → conversa iniciada;
  leads → lead; etc.). **Preferir extrair do `actions` já retornado** a fazer uma 2ª chamada à API
  (mais simples que resolve — regra 2). O **agente interpreta** as métricas; o nó só decide o que extrair.

## Como verificar (regra 3)

1. **Bytes:** read-back byte-exato dos nós tocados; U+FFFD no workflow = **0**.
2. **Smoke contra o histórico de 05/2025** (Meta guarda histórico — ajustar a janela de datas via o
   registro Notion da campanha antiga ou pin de teste):
   - **B1:** a chamada retorna linhas **ad-level** com os campos novos presentes e parseáveis
     (`reach, frequency, video_3_sec_watched_actions`, etc.). *Caveat esperado:* `quality_ranking` de
     anúncio antigo/inativo pode voltar vazio — **isso é OK**; o objetivo do smoke é validar a
     **estrutura da chamada** e o parse, não o valor do ranking.
   - **B2:** no output, `cpm/roas/hook_rate/hold_rate` calculados sem `NaN`/`Infinity`;
     `conversas_iniciadas` extraído quando o objetivo era mensagem.
   - **Sem regressão:** o write-back Notion + o MERGE BigQuery (já em `phi_prod` após Track A) seguem OK.
3. **Publicar** só com OK do Olavo. Registrar exec IDs + versão publicada em execution-log + ledger.

## Âncoras

- WF: `vVAdXAJh6MW2Z5Hp`. Nós: `HTTP Request Meta Ads`, `HTTP Request Meta Ads D-2`,
  `Code Cálculo Dados Meta` (+ nó Switch novo para B3, se necessário).
- Credencial Meta: `facebookGraphApi`; endpoint `graph.facebook.com/v21.0/act_{clean_id_meta_account}/insights`.
- Referência de campos Meta ad-level: Agregador `4sdG2UKMCBuFq8xn` (`Fetch Meta Ads`, level=ad).
- Nota: **não** mover o dev-token do Google (n8n self-hosted).
