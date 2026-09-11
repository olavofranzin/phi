# [BRIEF sub-chat] Comercial — Enriquecimento de leads + NBA com IA no HubSpot

> **Como usar:** abra uma sessão nova (sub-chat dedicado) e cole este arquivo como
> 1ª mensagem. É auto-contido. **Frente:** Comercial (nova, a maior das 6 da expansão
> 2026-07-05). **Objetivo:** a IA enriquece leads, sugere Next Best Action e abordagem,
> e entrega relatório comercial mensal — dentro do HubSpot. **Branch:** `claude/agentic-agency-planning-KwJEw`.
> **Autoridade de design:** `roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md` §3 + Google Doc
> "Arquitetura Cognitiva Comercial" (G4, `1LZg4e…`, domínio `comercial-agencia`) + Guia de
> Agentes de IA (Notion `37db65e5…9f2c`) + catálogo `catalogo-produtos-servicos.md`.

## 0. Missão
Transformar o HubSpot num **cérebro comercial agentizado** (G4): cada lead é enriquecido
(GBP/site/Instagram), recebe uma **NBA** e uma **abordagem sugerida** que evolui a cada etapa
do funil, e o mês fecha com um **relatório analítico** ao Olavo. A IA **propõe**; o Olavo
**decide** (campo de aceite). Nível dos agentes: enriquecimento = N2; NBA/abordagem/relatório
= N3 (Guia §3).

## 1. Estado atual do HubSpot (recon 2026-07-05 — read-only, confirmado)
- **Portal** `5633277` · owner Olavo (`35818487`). Read+Write em CONTACT/DEAL/LINE_ITEM/PRODUCT/MEETING/NOTE/CALL/TASK.
- **1 pipeline** `default` ("Pipeline de Vendas"), 8 estágios (label → internal):
  1. Prospectado → `70807682-148b-4914-acd0-97aad8c2a000`
  2. Interação Instagram → `qualifiedtobuy`
  3. Contato Realizado → `17222650`
  4. Reunião Agendada → `presentationscheduled`
  5. Tomada de Decisão → `decisionmakerboughtin`
  6. Contrato Enviado → `contractsent`
  7. Vencido/GANHO → `closedwon` · 8. Perdido/PERDIDO → `closedlost`
  - **A IA atualiza abordagem nos estágios 1–6; NUNCA em `closedwon`/`closedlost`.**
- **Já existem em Deals** (reusar, não recriar): `followup`, `dados_enriquecimento`, `proxima_acao_recomendada` (todas string simples).
- **Contacts:** sem campos de IA (tema livre). **Sem** campo de transcrição. **Produtos:** 3 (`WebSite Institucuional` SKU1003, `E-Commerce` SKU1002, `Gestão de Tráfego Pago` SKU1001) — faltam **Agentes de IA/automação** e **Gestão de GBP**.

## 2. Campos a criar (spec — colisão já checada; ⚠️ pedir OK do Olavo antes de criar)
| Campo (internal) | Objeto | Tipo | Uso |
|---|---|---|---|
| `followup` *(existe)* | Deal | string | reusar — input humano p/ a IA analisar |
| `dados_enriquecimento` *(existe)* | Deal | (rever p/ multi-line) | saída do enriquecimento; hoje string — avaliar migrar p/ textarea |
| `proxima_acao_recomendada` *(existe)* | Deal | (rever p/ multi-line) | a NBA |
| `proxima_acao_aceite` | Deal | enum (pendente/aceita/rejeitada) | **aceite do Olavo** à NBA |
| `proxima_acao_aceite_data` | Deal | datetime | quando decidiu |
| `abordagem_sugerida_ia` | Deal | multi-line | abordagem (distinta da NBA), evolui por etapa |
| `analise_gbp_ia` | Deal | multi-line | diagnóstico GBP |
| `analise_site_ia` | Deal | multi-line | diagnóstico site |
| `analise_instagram_ia` | Deal | multi-line | diagnóstico IG |
| `transcricao_ia` | Meeting | multi-line | transcrição p/ a IA consumir |
> Considerar um **property group** "IA / Enriquecimento" p/ agrupar no CRM. Avaliar se
> `dados_enriquecimento`/`proxima_acao_recomendada` devem migrar string→textarea (perda de dado? não, estão vazias).

## 3. Produtos a acrescentar (catálogo v1)
Adicionar 2 line-items/produtos: **`SVC-IA` Agentes de IA e automação** e **`SVC-GBP` Configuração e gestão do GBP**. Reusar os existentes p/ Anúncios online (`Gestão de Tráfego Pago` SKU1001) e Criação de site (`WebSite Institucuional` SKU1003) — **não duplicar SKU**. Mapear cada serviço ao gap que ele resolve (GBP fraco→SVC-GBP; sem site→SVC-SITE; e-commerce sem tráfego→SVC-ADS; quer escala/automação→SVC-IA).

## 4. Arquitetura dos agentes (fatias)
1. **Enriquecimento (N2)** — dado o lead (empresa/site/@IG/GBP), roda análise básica: **GBP** (descrição, produtos/serviços, Q&A, avaliações + respostas da empresa), **Instagram** (frequência de posts, tipo predominante topo/meio/fundo, produto vs conteúdo útil), **site** (básica). Escreve em `analise_*_ia` + consolida em `dados_enriquecimento`. Reusa o sub-WF GBP previsto no ADR-25 (Saúde Digital).
2. **NBA + produtos ofertáveis (N3)** — a partir do enriquecimento + `followup`, sugere `proxima_acao_recomendada`, insere na Oportunidade os **produtos ofertáveis** (do catálogo, pelo gap), e aguarda `proxima_acao_aceite`.
3. **Abordagem por etapa (N3)** — gera `abordagem_sugerida_ia` a partir de enriquecimento + follow-up + **transcrições** (`transcricao_ia`); **re-gera a cada mudança de estágio** (trigger no pipeline), exceto `closedwon`/`closedlost`.
4. **Relatório mensal (N3 + schedule n8n)** — fecha o mês: leads que entraram, vias de aquisição, tempo de interação, prováveis motivos de perda, análise das vendas ganhas, o que melhorar. Envia por **e-mail ou Telegram** ao Olavo.

## 5. Dependências e ordem
- **Começar já (estrutura):** criar os campos (§2) + os 2 produtos (§3). Barato, destrava tudo. **← prioridade do Olavo.**
- **Enriquecimento** depende de: acesso GBP (credencial — pendência antiga), acesso IG (scraping/API), análise de site (reuso §2 do roadmap). Reusa a taxonomia de conteúdo (frente Conteúdo).
- **NBA/abordagem** dependem do enriquecimento + catálogo (✅) + campo de transcrição.
- **Relatório mensal** depende de dados consolidados no HubSpot (roda cedo, mesmo com pouco histórico).
- **Substrato de raciocínio:** G4 (Arquitetura Cognitiva Comercial) já está catalogado como Fonte de Conhecimento — puxar seus 2 prompts prontos e as lentes (interpretação de leads, funil como hipótese).

## 6. Guardrails
- **HubSpot é produção/externo (CRM real do Olavo).** Criar propriedades/produtos só após OK do spec. Nunca escrever em Deals `closedwon`/`closedlost` (abordagem/NBA). A IA **propõe**, aceite é humano (`proxima_acao_aceite`).
- **Não recriar** os 3 campos existentes nem SKUs existentes.
- Enriquecimento externo (scraping GBP/IG/site) respeita ToS/limites; sem PII sensível além do necessário.
- Multi-tenant: `tenant_id` na lógica; o portal é single-tenant hoje mas o design nasce multi-cliente.
- Relatório mensal: Telegram HTML string única (padrão da casa) OU e-mail — decidir com Olavo.

## 7. Lotes sugeridos
- **C1 (estrutura, já):** campos §2 + produtos §3 via HubSpot MCP, com read-back. Property group "IA/Enriquecimento".
- **C2:** agente de enriquecimento (GBP primeiro — reuso ADR-25; depois site; IG por último por causa de acesso).
- **C3:** NBA + produtos ofertáveis + aceite.
- **C4:** abordagem por etapa (trigger de estágio).
- **C5:** relatório comercial mensal.
- Cada lote: brief Codex/execução → pré-revisão Claude → smoke com 1 Deal real → OK Olavo.

## 8. Âncoras
- Portal `5633277`; pipeline `default`; estágios em §1. Produtos SKU1001/1002/1003.
- Catálogo: `docs/strategic-planning/catalogo-produtos-servicos.md`. Roadmap: `roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md` §3.
- Fonte de raciocínio: G4 (Notion, DB Fontes de Conhecimento `533a0d0c…`). Guia de Agentes §3/§6.
