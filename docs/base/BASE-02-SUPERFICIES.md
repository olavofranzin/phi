# BASE-02 — SUPERFÍCIES. Onde o PHI vive, e se está no ar

| | |
|---|---|
| **Dono de qual fato** | **toda superfície que serve, guarda ou move dado do PHI** — viva ou não |
| **Escrito em** | 2026-10-03 |
| **Verificado em** | 🔴 **por linha.** Ver a coluna `verificado` — **ela é o ponto do documento** |
| **Por que existe** | em 02/10 gastamos **três rodadas** para responder *"as Edge Functions do Supabase estão publicadas?"*, e a resposta final veio do Olavo olhar o painel. **Com esta tabela, era uma linha** |
| 🔴 **Regra de credencial** | **o NOME da credencial, nunca o valor.** Nem aqui, nem em commit, nem em chat |

---

## 0. 🔴 Como ler a coluna `verificado`

| Valor | Significa |
|---|---|
| **data + quem** | alguém **abriu a superfície** e confirmou naquele dia |
| ⬜ **`não verificado`** | 🔴 **ninguém confirmou.** O que está escrito é **herdado de documento** — **é hipótese, não premissa** |

> **Este documento é o primeiro teste da regra 1.2 da `BASE-00`.** Metade das linhas abaixo está
> ⬜ **não verificada**, e **está escrito assim de propósito.** Preencher por dedução seria quebrar a
> regra no ato de criá-la.

---

## 1. Orquestração — n8n

**`https://n8n-n8n-editor.1unqx7.easypanel.host`** · self-hosted **v2.15.0** · roda **no EasyPanel**
(mesmo host `1unqx7` do webview)

| Artefato | Id | Estado | Credencial que guarda | Verificado |
|---|---|---|---|---|
| `PHI — Agregador de Métricas Multi-fonte` | `4sdG2UKMCBuFq8xn` | 🟢 **ativo**, 68 nós, semanal+mensal · ativo `ecec7073` | `Google BigQuery account` · Notion · GA4 · GBP · Clarity · Meta | 🟢 **02/10, chat-mãe** |
| `sw metricas campanhas` | `W571K320aqIHsdtH` | 🟢 ativo · versão `dfcc9b21` (12 portas de erro, D1-d) | Google Ads · BigQuery | 🟢 **28/09, sub-chat** |
| `PHI - Pipeline_v2` (o score) | — | 🟢 ativo, 07h | BigQuery · Notion | ⬜ **não verificado** |
| `PHI - Subworkflow Campanhas` | `b1pbn8qmzCNTufTp` | 🟢 ativo · `0cc36334` (o `UPDATE` de `client_config` **saiu** na Fase B) | Google Ads · BigQuery | 🟢 **28/09, sub-chat** |
| `operador unico metricas` | `cLcimNoefTOnVVbd` | 🟢 ativo, cron 04:00 | — | ⬜ **não verificado** |
| `client_config` | `SI5NSzRb8lVUz74RwOhIT` | 🟢 **dono único** de `phi_prod.client_config` desde a Fase B | Notion Trigger · BigQuery | 🟢 **28/09, sub-chat** |
| `PHI - Vigia de Frescor` / **V4** | `9f443157-8787-444a-9bf0-11d1fd3d7981` | 🟢 **publicado 29/09** · rollback `125b437b` | BigQuery | 🟢 **29/09, sub-chat** |
| `WF-T28-Error-Handler` | `rTS5pE34eElfuMPl` | 🟢 ativo | BigQuery · Notion · Telegram | ⬜ **não verificado** |
| `errorWorkflow` do Agregador | `UZ7sIE5cWrrO8xea` | 🟢 configurado (ganho em 28/09) | — | 🟢 **02/10, chat-mãe** |
| `PHI — Digest Diário de Progresso` | `rhobbBEeQaiWIuiF` | 🟢 **ativo, 08:30 BRT** → Telegram | Notion · Telegram | ⬜ **não verificado** |
| `WF-T28-Analise-Campaign` | `fhYmJH0o9BW1IO4i` | 🟡 **Diagnóstico vive; Maestro no rascunho**, não ativado (ADR-28) | `Anthropic account` (`YifaYCQuGWjdd1Oh`) | ⬜ **não verificado** |
| `WF-T28-Orquestrador-Analises` | `8Q5ofmAZju0hTN08` | 🟡 **ainda referencia `phi_dev`** no nó `Set config` — é o que segura o dataset | BigQuery | 🟢 **28/09, sub-chat** |
| `[APOSENTADO 2026-07-21] PHI - Loop Alerta Fase 1` | — | ⚫ **aposentado pela R5** (o único que passa no teste) | — | ⬜ |
| **Motor de Scoring GBP** (cadeia L1-L4) | — | 🟢 ativo **on-demand**, `triggerCount 0` | Apify · GBP | ⬜ **não verificado** |

> 🔴 **Credencial fora do padrão, e registrada como tal:** o **`developer-token` do Google Ads é
> hardcoded nos nós** — o n8n self-hosted **não aceita** esse campo em credencial nem variável (regra
> crítica 14). **Não é descuido: é limitação da ferramenta.** Mas é uma superfície de risco que
> precisa ser lembrada em toda migração de workflow.
>
> 🔴 **A chave de API do n8n** é referenciada **só pelo id de credencial `V70ThVPGl1rho6Gb`** — o valor
> **nunca** passa por chat, documento ou commit.

---

## 2. Armazém — BigQuery

**Projeto `project-0e7c58d4-656f-49e8-807`** · service account **`phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com`**

| Dataset / tabela | Estado | Verificado |
|---|---|---|
| **`phi_prod`** | 🟢 o dataset de produção | 🟢 **01/10** |
| `raw_campaign_data` | 🟢 **2 writers** (viola M1 — ver `CONTRATO-PHI.md`) | 🟢 **22/09** |
| `phi_score_history` | 🟢 writer único: `Pipeline_v2` | ⬜ **não verificado** |
| `client_config` | 🟢 **dono único** desde 28/09 | 🟢 **28/09** |
| `t28_ga4_landing` | 🟢 **34 linhas** (eram 38; 4 apagadas em 01/10) | 🟢 **01/10** |
| `t28_clarity_daily` | 🟡 **15 linhas** · 🔴 **porta FECHADA** (`not_configured`), fora do índice e fora do V4 | 🟢 **01/10** |
| `t28_gbp_daily` | 🔴 **1 linha, de 21/06.** Espera a API do GBP | 🟢 **28/09** |
| `raw_ad_data` | 🔴 **0 linhas** — o ramo morre no `IF Gate PMAX` | ⬜ **não verificado desde 21/09** |
| `raw_adset_data_rollup` (view) | 🔴 **vazia, nunca teve writer** | ⬜ **não verificado desde 21/09** |
| **`phi_dev`** | 🟡 **de pé**, só porque o `WF-T28-Orquestrador-Analises` o referencia | 🟢 **28/09** |
| 🔴 **318 linhas com `client_id` NULO** em `t28_campaign` (+2 e +1 em outras) | 🔴 **ponto cego declarado** — o V4 filtra `IS NOT NULL` de propósito. **Etapa própria** | 🟢 **28/09** |

---

## 3. Interface operacional — Notion

| Base | Id | Papel | Verificado |
|---|---|---|---|
| **`PHI - Gestão de Projetos`** | `774518d2128a4b10aede511718737058` | 🎯 **o plano. 131 linhas** (39 antigas + 92 novas) | 🟢 **29/09, sub-chat** |
| **`PHI — Registro de Execuções (Sub-chats)`** | `8d8eb685-f662-49c7-ba4f-298d744feec3` · ds `c884f9df-4daf-4142-a3df-e2bc89642484` | o ledger que o digest lê (**R3**/ADR-32) | 🟢 **02/10, chat-mãe** |
| `Clientes` | `19fb65e5-c72b-8147-8aa3-c63aa273d205` | cadastro — **fonte do dossiê e dos ids por fonte** | 🟢 **28/09** |
| `Campanhas` · `Tasks` · `Checklist` · `Log de Otimizações` · `Projetos` · `Observações Diárias` | ver `CLAUDE.md` | operação do PHI | ⬜ **não verificado** |
| **`PHI - SOPs`** | `7ebc98e0ebdc480c8c6abc18f65e2ed5` | 🔴 **a ler na Fase 4** — pode conter os checklists desenhados no início | ⬜ **não verificado** |
| `PHI - Catálogo de Artefatos Operacionais` | `bd8df5b982ad4f00a8ae56d687db819e` | índice vivo de artefatos | ⬜ **não verificado** |
| `Painel de Entregas` | `fad6713a…` | 🔴 **papel DESCONHECIDO** — achado em 29/09, só o schema foi lido. **Risco de 2º painel** | ⬜ **não verificado** |
| `PHI - ANÁLISES` | `38fb65e5-c72b-80db-a425-e5939fc35c7a` | entrega do T28 | ⬜ **não verificado** |
| `PHI - Demandas` · `Eventos` · `Snapshots` · `Mudanças de Escopo` · `Onboarding` | ver `MAPA` §3 | — | ⬜ **não verificado** |
| **Credencial** | `NOTION_TOKEN` — **mora só no `.env` da VPS**, nunca no git | 🟢 **02/10, chat-mãe** |

---

## 4. Tela — o webview

| | |
|---|---|
| **No ar** | `https://app-app.1unqx7.easypanel.host/` |
| **Repo** | `olavofranzin/phi-dashboard-webview`, branch `webview`, HEAD **`c37d0b0`** — 🟢 **privado, 0 forks** |
| **Deploy** | **EasyPanel**, Build Path `/`, `Dockerfile` da **raiz** (⚠️ **não** `webview/Dockerfile`) |
| 🔴 **API do EasyPanel** | **NÃO está ativada** na versão que o Olavo usa — **configuração do painel não é consultável de fora** |
| **Rotas servidas** | `/api/phi-snapshot` 🟢 · `/api/clients` 🟢 · `/api/health` 🟡 (fica, mas para de revelar o token) · `/api/phi-score-history` 🟡 (**o gráfico volta**) · `/api/notion-debug` ⛔ **a apagar** · `/api/campaign-detail` ⛔ **a apagar** |
| 🔴 **Autenticação** | **NENHUMA.** Quem souber o endereço lê a carteira de clientes |
| **Credenciais no servidor** | `GCP_SA_KEY` · `NOTION_TOKEN` · `BQ_BILLING_PROJECT` · `BQ_DATA_PROJECT` — **só no `.env` da VPS** |
| **Dívidas** | `package-lock.json` não fecha + `Dockerfile` usa `npm install` ⇒ **build não reproduzível nem observável** · **12 vulnerabilidades** (10 altas) · pasta `webview/` morta · `.env` fora do `.gitignore` |
| **Verificado** | 🟢 **02/10, chat-mãe** (rotas e repo) · 🟢 **02/10, Olavo** (API do EasyPanel) |

---

## 5. ⚫ Superfícies MORTAS — e o motivo de estarem aqui

> 🔴 **Elas moram nesta tabela de propósito.** Foi justamente uma superfície morta não registrada que
> custou três rodadas. **Apagar o código não apaga o serviço** — é a **R5** aplicada a recurso de nuvem.

| Superfície | Estado | Verificado |
|---|---|---|
| **Supabase** — projeto `mfnrldnhcxaftwfdolsk` | ⚫ **sem relação com o webview.** Logo: Edge Functions `phi-snapshot` e `phi-score-history` **não publicadas**, e **nenhum `GCP_SA_KEY`** em segredo. Zero migrations, zero chamadas | 🟢 **02/10, Olavo** |
| `src/integrations/supabase/` + `supabase/functions/` + 3 chaves `VITE_SUPABASE_*` | ⚫ **código morto** — sai na faxina. **Registrar pela R5 que o `server/index.js` as substituiu** | 🟢 **02/10, chat-mãe** |
| **HubSpot** | 🟡 **em substituição pelo Odoo.** O `[P5] HubSpot` foi aposentado; `id_hubspot` → `id_crm` | ⬜ **não verificado** |
| pasta `webview/` no repo do webview | ⚫ **resíduo morto.** Apagar **AUTORIZADO** (02/10) — ⚠️ **é mudança de produção: o contexto do Docker é a raiz** | 🟢 **02/10, sub-chat** |

---

## 6. Fontes externas e terceiros

| Fonte | Estado | Verificado |
|---|---|---|
| **Google Ads API v23** | 🟢 em uso · ⚠️ `developer-token` hardcoded · ⚠️ `cost_per_conversion` incompatível com `conversion_action_name` | ⬜ **não verificado** |
| **Meta Ads API** | 🟡 em uso; `t28_meta_campaign` costuma sair 0 | ⬜ **não verificado** |
| **GA4** | 🟢 **em dia** — orgânico e pago rodaram em 02/10 (`44507`) | 🟢 **02/10** |
| **GBP** | 🔴 **cota `DefaultRequestsPerMinutePerProject = 0`** = **nunca liberada**. **Pedido enviado 29/09; Google respondeu que leva 7–10 dias úteis** ⇒ resposta entre **08 e 13/10**; se não vier, **13/10 é gatilho de cobrança** | 🟢 **29/09, Olavo** |
| **Clarity** | 🔴 **retenção de 72h** · **um projeto fixo para todos os clientes** · payload sem `project_id` ⇒ **porta fechada**, fora do índice (decisão de 25/09) | 🟢 **29/09, sub-chat** |
| **Apify** | 🟢 actor no motor de scoring GBP | ⬜ **não verificado** |
| **Anthropic** | credencial `YifaYCQuGWjdd1Oh` — nó de Diagnóstico (Sonnet) | ⬜ **não verificado** |
| **Gemini Flash** (`gemini-2.5-flash`) | camada rápida da cadeia de enriquecimento (**R10**) | ⬜ **não verificado** |
| **Odoo** (CRM, módulo `phi_crm`) | 🟡 **F1+F2 feitos; F3 e F5 pendentes.** ⬜ **não há MCP do Odoo nesta sessão** | ⬜ **não verificado** |
| **Google Sheets** | planilha da Prospecção | ⬜ **não verificado** |
| **Miro** | `Board Agência` `uXjVHecmR7c=` ⚠️ **existe uma `Cópia` que NÃO é a vigente** | ⬜ **não verificado** |
| **Telegram** | digest 08:30 + alertas de campanha pulada | ⬜ **não verificado** |
| **GitHub** | `olavofranzin/phi` (branch `claude/consolidacao-2026-08`) · `olavofranzin/phi-dashboard-webview` | 🟢 **03/10** |

---

## 7. 🔴 O que esta tabela já revela

| # | |
|---|---|
| **1** | **Metade das linhas está `não verificada`.** Isso **não é falha do documento — é o diagnóstico.** Antes dele, essa ignorância era invisível |
| **2** | 🔴 **`Painel de Entregas` com papel desconhecido** é o maior risco de duplicação do plano. **Resolver antes de montar as vistas** |
| **3** | **`PHI - SOPs` nunca foi lido** — e pode conter exatamente os checklists que o Olavo diz faltarem. **É o passo 1 da Fase 4** |
| **4** | **O webview não tem autenticação**, e é a única superfície com dado de cliente **aberta na internet** |
| **5** | **Três coisas presas a um fio só:** `phi_dev` (preso ao Orquestrador), o GBP (preso ao Google), o `raw_ad_data` (preso ao `IF Gate PMAX`) |
