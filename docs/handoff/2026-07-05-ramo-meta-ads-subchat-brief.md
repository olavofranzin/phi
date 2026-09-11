# [BRIEF sub-chat] Ramo Meta Ads — ligar ingestão + t28_meta_campaign (cliente-teste CLI-13)

> **Como usar:** sessão nova, cole como 1ª mensagem. Auto-contido. **Frente:** ingestão
> Meta Ads (Camada 1 do Saúde Digital). **Objetivo:** ligar o ramo Meta usando a conta real
> do **Charles Azevedo (CLI-13)** como teste, alimentando `phi_prod.t28_meta_campaign`.
> **Branch:** `claude/agentic-agency-planning-KwJEw`. **Design:** `roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md`
> §0–§1 (2 camadas de métrica + classificação Meta A/B/C + Insights 1/2). **Cruza com** o
> sub-chat do score (o `t28_meta_campaign` alimenta o PHI·Mídia).

## 0. A boa notícia (recon 2026-07-05)
**O caminho de escrita T28 do Meta JÁ EXISTE e está habilitado** no Agregador
(`PHI — Agregador Multi-fonte`, `4sdG2UKMCBuFq8xn`, active): parsing em `Adaptador Input T28`,
`Normalizador T28`, `[T28] Filter/Build MERGE/BQ Merge t28_meta_campaign` (MERGE em
`phi_prod.t28_meta_campaign`, KEY `client_id`+`campaign_id_meta`+`business_date`+`janela`).
**Só a fonte está desligada.** Ligar o ramo é destravar a fonte + fechar 2 gaps de mapeamento,
não construir do zero.

## 1. Cliente-teste — Charles Azevedo (CLI-13 / CHA)
- Notion "Clientes Database" (`collection://19fb65e5-c72b-81db-8376-000bbe74c256`), page `396b65e5-c72b-8017-a37e-c3d94d019b5a`. ATIVO, Negócio Local, SLA Bronze.
- **IDs Meta já preenchidos:** BM `481944856215392` · `id_meta_account` `2040091573153851` · `id_meta_pixel` `2047146085771584`.
- Projeto `[CHA]PROJETO DE TRÁFEGO PAGO` (PRO-23, Fonte=Meta Ads, Não Iniciado).
- **Campanha-teste:** `[CHA] IG_MENS__PROD.TESTE__` (CAMP-10, DB "Campanhas" `collection://19fb65e5-c72b-80be-8c3b-000bb115d53f`, page `396b65e5c72b80e1bc01d84051b83071`). Hierarquia Notion: Campanha → 1 Conjunto → 2 Anúncios.
- **Objetivo `MENS` (mensagens/WhatsApp)** · Modelo Lead Gen · Funil Topo · **Métrica-Mãe CPL, meta 4** · Em execução.
- ⚠️ **Métricas VAZIAS** (scaffold): `id_meta_camp`, Impressões, CPA/CPC/CPL/CPM/CTR e afins em branco. É estrutura + metas, **sem dado histórico carregado**. Ligar a fonte é o que traz número.

## 2. Gaps para ligar (ordem de execução)
1. **Credencial Graph API** — não existe nenhuma no n8n (`list_credentials` meta/facebook = 0). Criar credencial `facebookGraphApi` com token do BM do Charles e anexar ao nó `Fetch Meta Ads`. **← precisa do Olavo (token).**
2. **Popular `id_meta_camp`** na campanha CAMP-10 (hoje vazio) — sem o campaign_id real, `GET /{id}/insights` não resolve. Idealmente também `adset_id_meta`/`ad_id_meta` nos 2 anúncios.
3. **Habilitar `Fetch Meta Ads`** (único nó-fonte off; `GET graph.facebook.com/v21.0/{id}/insights`, `level=ad`, fields `spend,impressions,clicks,reach,frequency,ctr,cpm,actions,action_values`, `time_increment=1`).
4. **Confirmar `phi_prod.t28_meta_campaign` existe** — provavelmente SIM (DDL aplicada na promoção L1.5 do Agregador, 2026-06-22, criou `t28_meta_campaign` + VIEWs d1/d3). Verificar via introspecção antes do smoke.
5. **⭐ Estender o mapa objetivo→resultado (o gap que o teste MENS expõe).** O `Adaptador Input T28` só mapeia `META_LEAD`/`META_PURCHASE` (action_types de pixel). O objetivo do teste é **MENS** → o "resultado" é `messaging_conversation_started` / `onsite_conversion.messaging_first_reply`, que **não está no `metaSum`** → conversas sairiam zeradas. **Estender o mapa de action_types por objetivo:** MENS→mensagens iniciadas, VEND→purchase, LEADS→lead, TRAF→link_click, ENGA→engajamento. Isto materializa o **Insight 1** (Resultado normalizado por objetivo) direto na ingestão.
6. **(Opcional) Nível conjunto/anúncio** — existe `t28_meta_campaign` mas não `t28_meta_adset`/`t28_meta_ad` (o Google tem adset). Se quiser paridade, criar esses ramos — decidir se o MVP Meta é campaign-only.

## 3. Insights do roadmap a materializar aqui
- **Insight 1 (Resultado normalizado):** implementar o mapa objetivo→action_type (gap #5) faz `resultado`/`custo_por_resultado` funcionarem em qualquer objetivo — a chave que resolve o CPA×ROAS do score. `metrica_mae`/`meta_metrica_mae` já fluem do Notino (CPL/4).
- **Insight 2 (Classificações → es/rs/os):** para trazer as 3 Classificações Meta (qualidade/engajamento/conversão), **adicionar aos fields do insights**: `quality_ranking,engagement_rate_ranking,conversion_rate_ranking` (são campos separados da Graph API). Persistir em `t28_meta_campaign` (colunas novas) → alimentam os componentes stub do score em campanhas Meta. **Levar essa decisão ao sub-chat do score.**

## 4. Classificação canônica (do roadmap §1) aplicada ao fetch
- **Balde A (canônicas, já no fetch/schema):** spend, impressions, clicks, reach, frequency, ctr, cpm, actions/action_values → leads/purchases/roas. **Acrescentar:** os 3 `*_ranking` (Insight 2) e garantir `resultado`/`custo_por_resultado` normalizados (Insight 1).
- **Balde B (contextual, objetivo MENS):** conversas iniciadas, custo por conversa, novos contatos — o agente de análise (Camada 2) puxa; no mínimo o `resultado` do objetivo entra canônico.
- **Balde C:** descartar variantes "(todos)"/metadata.

## 5. Guardrails
- **Não ativar/publicar** o Agregador sem smoke — ele está `active` em produção; alterações via MCP `update_workflow` mantêm draft, **read-back obrigatório** (bug conhecido de não-persistência de nó grande). Habilitar `Fetch Meta Ads` só no draft, smoke em `phi_dev` primeiro se possível.
- **Credencial:** token do BM é segredo — configurar no n8n (credential store), nunca em código/commit. Seguir ADR-19 (injeção em build-time) para qualquer placeholder.
- **Smoke:** 1 execução com CAMP-10 → conferir linha em `t28_meta_campaign` (spend/impressions reais, `resultado` de mensagens ≠ 0, `source_status.meta_ads='ok'`). Idempotência (MERGE) já garantida.
- Meta ToS: respeitar rate limits da Graph API.

## 6. Sequência sugerida
- **M1:** Olavo gera token BM + preenche `id_meta_camp` (e adset/ad ids) na CAMP-10 → cria credencial n8n.
- **M2:** estender mapa objetivo→resultado (gap #5) + adicionar `*_ranking` (Insight 2) no fetch e no schema (draft, read-back).
- **M3:** habilitar `Fetch Meta Ads` (draft) → smoke `phi_dev`/1 campanha → validar `t28_meta_campaign`.
- **M4:** publicar → Charles vira o 2º cliente com dados reais (junto do Google Ads existente) → alimenta o score e o sub-chat do modelo (CPA/ROAS/ES-RS).
- **M5 (opcional):** níveis adset/ad.

## 7. Âncoras
- Agregador `4sdG2UKMCBuFq8xn` (nós: `Fetch Meta Ads` [off], `Adaptador Input T28`, `Normalizador T28`, `[T28] *t28_meta_campaign`, `Set dados`). BQ `phi_prod.t28_meta_campaign`.
- CLI-13/CHA: cliente `396b65e5-c72b-8017-a37e-c3d94d019b5a`; campanha CAMP-10 `396b65e5c72b80e1bc01d84051b83071`.
- Classificação Meta A/B/C + Insights: `roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md` §1. Score: `docs/handoff/2026-07-01-saude-digital-phi-midia-score-analise-subchat-brief.md`.
