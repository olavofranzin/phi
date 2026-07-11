# Contrato de Dados — Planilha de Leads da Prospecção Comercial

> **Status:** FONTE DE VERDADE (versionada) do schema e do PROPÓSITO da planilha de prospecção.
> **Regra-mãe (governança):** nenhuma coluna é criada, renomeada ou removida sem atualizar este contrato
> no mesmo PR. Perder colunas aqui = perder **memória de aprendizado** do processo comercial (já ocorreu
> uma vez, 2026-07; não pode recorrer — ver §4/§5). **Criado/consolidado:** 2026-07-10.
> **Planilha:** Google Sheets `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM` · abas `leads` (gid 0) e
> `qtd leads mes` (gid 624786381). **Workflows:** n8n `5L3SyzDkZqf1N6vW` + `google_maps_updated.json`.
> **HubSpot:** portal 5633277, pipeline `default` ("Pipeline de Vendas"). **Owner:** Comercial (Olavo).

## 0. POR QUE esta planilha existe (o que quase perdemos)
Esta planilha **não é uma lista de contatos** — é o **livro-razão de aprendizado do processo comercial**.
Ela cruza, por lead, **dois lados**:
- **FEATURES** (sinais do negócio na captação: nota, reviews, fotos, site, categoria, score/IPC…) e
- **LABELS / RESULTADO REAL** (o que aconteceu com o lead no HubSpot: avançou? foi rejeitado? por quê?
  converteu? por quanto?).

É o cruzamento **feature × resultado** que ensina os agentes comerciais — o mesmo padrão do Log de
Otimizações (Hipótese → Resultado Real → Aprendizado). Sem os **labels de resultado**, o motor de scoring
não se calibra, o Qualificador não aprende o que é "bom lead" e o relatório comercial não explica perdas.
**Apagar as colunas de resultado apaga a memória supervisionada do comercial.** Por isso o contrato é
versionado e protegido por guarda automática (§5).

## 1. Aba `leads` (gid 0) — dicionário de colunas
Três blocos: **features de extração** (Apify), **saídas do motor de scoring** e **⭐ resultado/aprendizado**
(HubSpot). Nomes reais entre crases; equivalências anotadas.

### 1.1 Chaves e identidade
| Coluna | Origem | Função |
|---|---|---|
| `id` | Apify `placeId`? | **CONFIRMAR** que guarda o `place_id` (chave de dedup e de casamento com o scraper). Se não, adicionar `place_id`. |
| `id_hubspot` | HubSpot deal id | **chave do JOIN** planilha ↔ HubSpot (usada pelo loop de sync, §5.1) |
| `nome` | `title` | identidade |
| `contato` | `phone` | telefone |
| `e-mail` | enriquecimento | contato p/ outreach |
| `site` | `website` | sinal de ICP + oferta (SVC-SITE) |
| `Endereço`/`Bairro`/`Cidade`/`Estado`/`CEP` | address/… | geografia |

### 1.2 Features de extração (Apify) — o que descreve o lead
| Coluna | Origem | Função no aprendizado |
|---|---|---|
| `setor` | `categoryName` | categoria principal — eixo de benchmark por segmento |
| `Categoria 1` / `Categoria 2` | `categories[]` | categorias secundárias — completude/SEO |
| `Quantidade reviews` | `reviewsCount` | volume — qualifica a nota (guarda de volume) |
| `Posição Pesquisa` | `rank` | visibilidade no Maps |
| `Patrocinado` | `isAdvertisement` | já anuncia → sinal SVC-ADS/budget |
| `Searchstring` | `searchString` | termo que trouxe o lead |
| `enriquecimento` | Gemini | corpus qualitativo (financeiro, digital, setor, abordagem) |
| `data extração` / `mês extração` | `$now` | temporalidade + cota mensal |
| 🔴 **`Avaliação`** *(a criar)* | `totalScore` | nota Google — **input de `dim_autoridade`/`ipc`; sem ela o score não roda** |
| 🔴 **`Quantidade fotos`** *(a criar)* | `imagesCount` | `dim_conteudo`, `ipc`, benchmark |
| 🔴 **`Atributos`** *(a criar)* | `additionalInfo` | `dim_saude`, `dim_seo` |
| 🟠 **`Horário`** *(a criar)* | `openingHours` | `dim_saude`, `dim_conversao`, viabilidade |
| 🟠 **`Agendamento`** *(a criar)* | `bookingLinks` | `dim_conversao` |
| 🟠 **`Posts`** *(a criar)* | `ownerUpdates` | `dim_conteudo`, `dim_engajamento` |
| 🟡 **`Rua/Avenida`** *(a criar)* | `street` | endereço estruturado (opcional) |

### 1.3 Saídas do motor de scoring (já presentes) — a PREVISÃO
`score_tecnico` · `ipc` · `potencial_comercial` · `oferta_recomendada` · `dim_saude` · `dim_seo` ·
`dim_autoridade` · `dim_conversao` · `dim_engajamento` · `dim_conteudo` · `site_tipo` · `nao_reivindicado` ·
`flags_score` · `data_processamento_score`. (Spec: `scripts/gbp_scoring_prototype.py`.) São a **previsão** do
sistema — só ganham valor de aprendizado quando confrontadas com o resultado real (§1.4).

### 1.4 ⭐ Bloco de RESULTADO / APRENDIZADO (HubSpot) — os LABELS que faltavam
Escrito pelo **loop de sincronização** (§5.1), casando por `id_hubspot`. **Este é o bloco cujo apagamento
motivou este contrato.** Funil real: Prospectado → Interação Instagram → Contato Realizado → Reunião
Agendada → Tomada de Decisão → Contrato Enviado → Vencido / Perdido.

| Coluna *(a criar)* | Origem HubSpot | Função no aprendizado |
|---|---|---|
| `hubspot_estagio` | `dealstage` (label) | **andamento** do lead no funil |
| `hubspot_status` | derivado de `hs_is_closed`/`hs_is_closed_won` | **Aberto / Vencido / Perdido** — label mestre |
| ⭐ `motivo_perda` | `closed_lost_reason` | **por que foi rejeitado/perdido** — ensina quais features predizem perda |
| `motivo_ganho` | `closed_won_reason` | o que fez ganhar |
| `valor` | `amount` | ticket/LTV — pondera o valor do lead |
| `via_aquisicao` | `hs_analytics_source` | canal de origem — quais canais convertem |
| `num_interacoes` | `num_contacted_notes` | esforço (nº de toques) até o desfecho |
| `ultimo_contato` | `notes_last_contacted` | recência/cadência |
| `data_criacao_deal` | `createdate` | início no funil |
| `data_fechamento` | `closedate` | fim |
| `dias_no_funil` | derivado (`closedate`/agora − `createdate`) | velocidade — prioridade |
| `probabilidade` | `hs_deal_stage_probability` | confiança do estágio |
| `nba_recomendada` | `proxima_acao_recomendada` | o que a IA sugeriu |
| ⭐ `nba_aceite` | `proxima_acao_aceite` (pendente/aceita/rejeitada) | **feedback humano do NBA** (aceito/rejeitado) |
| `abordagem_ia` | `abordagem_sugerida_ia` | abordagem usada |
| ⭐ `acerto_previsao` | derivado (`potencial_comercial`/`oferta_recomendada` × desfecho) | **o scoring acertou?** — sinal de calibração do motor |
| `data_sync_hubspot` | agora | auditoria da sincronização |

> **Melhoria de qualidade:** `closed_lost_reason` hoje é **texto livre** → padronizar como **dropdown**
> (ex.: preço, timing, sem-fit, concorrente, sem-resposta, orçamento) melhora muito o aprendizado de perda.

## 2. Aba `qtd leads mes` (gid 624786381) — controle de cota
Leitura pelo workflow: `vagas = max(0, 50 − leads_do_mês)` (free tier Apify). Colunas mínimas: **`mês`**
(competência) + **`quantidade`** (leads extraídos no mês). Confirmar cabeçalhos exatos.

## 3. O que os agentes comerciais aprendem com cada lado
- **Qualificador Cognitivo:** features (1.2/1.3) → label "entrou no funil / rejeitado" (`hubspot_status`, `motivo_perda`).
- **Calibração do motor de scoring:** `potencial_comercial`/`oferta_recomendada` (previsão) × `hubspot_status`/`valor` (real) = `acerto_previsao`.
- **NBA / Estrategista:** `nba_recomendada` × `nba_aceite` (aceito/rejeitado) e `abordagem_ia` × ganho.
- **Relatório comercial mensal / Curador:** agrega `via_aquisicao`, `motivo_perda`, `dias_no_funil`, `valor` → padrões de aquisição, perda e velocidade.

## 4. Governança — por que não se perde de novo (documentação)
1. **Este contrato é a fonte de verdade** (git, ADR-012). Mudança de schema **só via PR que o atualiza**.
2. **Registrar a planilha na DB `PHI — Fontes de Conhecimento`** (Camada de Conhecimento §2) como fonte viva:
   `{nome, tipo=google-sheet, file_id, dono=Comercial, domínio=comercial, schema_hash, modificado_em, contrato=este arquivo}`.
3. **ADR proposto (registrar):** "*Todo artefato de dados operacional (planilha/DB) tem Contrato de Dados
   versionado + guarda-schema + backup automático.*" Torna a prevenção uma política, não um remendo.

## 5. Automação — os DOIS loops (o "gatilho que salva" + o "loop que checa")
### 5.1 Loop de SINCRONIZAÇÃO HubSpot → planilha (captura o resultado automaticamente)
**n8n, Schedule (ex.: a cada 6 h).** Para cada lead com `id_hubspot` (ou deals `hs_lastmodifieddate` desde a
última sync): lê os campos do §1.4 no HubSpot → calcula derivados (`hubspot_status`, `dias_no_funil`,
`acerto_previsao`) → **grava/atualiza** a linha na aba `leads` (upsert por `id_hubspot`/`place_id`) →
carimba `data_sync_hubspot`. Idempotente. **É o gatilho que salva o andamento/rejeição/motivo sem depender
de ninguém preencher à mão.** (HubSpot é produção: este loop **só lê** o deal e **escreve na planilha** — não
altera o CRM.)

### 5.2 Loop GUARDA-SCHEMA + BACKUP (impede a perda e detecta apagamento)
**n8n, Schedule diário.** (1) Lê a **linha de cabeçalho** da planilha e compara com a lista de colunas deste
contrato → **coluna do contrato ausente = alerta imediato (Telegram)** com os nomes faltantes. (2) **Snapshot**:
exporta a aba `leads` (CSV) para backup (git/Drive `backups/leads/AAAA-MM-DD.csv`), retendo histórico → qualquer
apagamento é **detectado em ≤24 h e sempre restaurável**. Opcional: auto-recriar o cabeçalho faltante.

> Os dois loops vivem no **n8n** (persistente) — não em cron de sessão (que morre). MCP do n8n disponível para construir.

## 5b. Estado AS-BUILT (2026-07-11) — construído pelo sub-chat
Execução em `claude/gbp-scoring-motor-n8n-0zri0i` (log: `docs/handoff/2026-07-11-restaurar-planilha-leads-loops-sync-guarda-execution-log.md` **naquela branch**). Os workflows vivem no n8n (produção, independem de branch).
- **R1 ✅** aba `leads` = **60 colunas** (36 originais + 24 restauradas em `AK1:BH1`, aditivo).
- **R2 ✅ (não testado end-to-end)** aplicado no workflow REAL `HubSpot - Atualizar status e disparar extracao` (`kED2AlXJjIYgvHXH`), nó "Normalizar campos do lead" — **não** no `5L3SyzDkZqf1N6vW` (inativo/abandonado, ref. quebrada). `totalScore→Avaliação` agora é gravado.
- **R3 ✅ testado real** `Comercial - Sync HubSpot -> Planilha` (`WRFU2NM8rLJU7bRT`, ativo, 6 h). Cursor em Data Table `gbp_sync_cursor` (`zPnW2B39G0ovWjpA`). 13 deals na 1ª execução (1 Vencido). Só LÊ o HubSpot. Bug `Number(null)=0` no `acerto_previsao` corrigido.
- **R4 ✅ testado real** `Comercial - Guarda-Schema + Backup` (`vUI0pPlDASf64Htn`, ativo, diário 08:00). Schema espelhado em Data Table `gbp_leads_schema_canonico` (`QIrDCkhppfc0FfOH`, 60 linhas). Backup = duplica a aba (`backup_leads_AAAA-MM-DD`, retenção 30 d). Alerta Telegram `chatId 930549271`.

### Watch-items (verificados 2026-07-11 na execução real do sync `WRFU2NM8rLJU7bRT`)
1. ✅ **`acerto_previsao` — fonte VÁLIDA (corrige o watch-item anterior):** `potencial_comercial`, `oferta_recomendada`, `score_tecnico`, `ipc` **existem como propriedades do Deal no HubSpot** (o motor de scoring as grava) — o sync lê certo. **Mas 2 defeitos no nó "Derivar Campos de Aprendizado" (patch pronto):**
   - 🟠 **`probabilidade`** grava o float cru `hs_deal_stage_probability` (`0.1000000000000000055511…`, 60 dígitos) → `probabilidade: p.hs_deal_stage_probability != null && p.hs_deal_stage_probability !== '' ? Math.round(Number(p.hs_deal_stage_probability)*100) : ''` (→ `10`, `100`). É só a probabilidade **do estágio**, não do lead.
   - 🟠 **`acerto_previsao`** dispara em deal **não pontuado/legado** (`potencial_comercial`≈0 → "errou" falso). Trocar `temPotencial (!== '')` por `const potencial = Number(p.potencial_comercial); const temPotencial = Number.isFinite(potencial) && potencial > 0;`. E clampar `dias_no_funil` negativo (deal legado 2023 com `closedate<createdate` → `-63`) para `''`.
2. 🔧 **Backup off-file** — credencial Google Drive **existe** no n8n (`7YDwXhsbVGkrlV5p`). Especificado no brief `docs/handoff/2026-07-11-patch-sync-probabilidade-acerto-previsao-brief.md` (Lote 2): copiar o arquivo inteiro p/ pasta Drive "PHI - Backups Planilha Leads", retenção 30d; in-file reduzido a 7d. **Pendente aplicar** (sub-chat).
3. 🟠 **Duas fontes de schema:** git `planilha-leads-schema.json` × Data Table `gbp_leads_schema_canonico`. **Git é a fonte**; sincronizar a Data Table ao mudar o contrato.
4. **R2 não testado end-to-end** — validar na próxima extração real que as 6 features brutas chegam preenchidas.
5. ✅ **R5 — FEITO:** planilha registrada em `PHI - Fontes de Conhecimento` (page `39ab65e5-c72b-8115-9648-fb92b87e70c2`, evidência A) + **ADR-31** criado (`39ab65e5-c72b-817b-87d1-f1ec824af590`, Status **Proposto** — aguarda o Olavo mover para Aceito). Documenta a política (contrato+guarda+backup) e os 2 loops (SOP-04).
6. **Reconciliação de branch:** contrato + schema JSON em `claude/agentic-agency-planning-KwJEw`; execução em `claude/gbp-scoring-motor-n8n-0zri0i`. No merge, conferir schema JSON × 60 colunas reais.

## 6. Restauração imediata (checklist)
1. Criar na aba `leads` as colunas 🔴/🟠 do §1.2 (**`Avaliação` é a mais urgente**) e o **bloco §1.4 inteiro**.
2. Fazer o nó de normalização do workflow Apify mapear `totalScore/imagesCount/additionalInfo/openingHours/bookingLinks/ownerUpdates`.
3. Subir o loop §5.1 (sync HubSpot→planilha) e o §5.2 (guarda+backup).
4. Registrar a planilha em `PHI — Fontes de Conhecimento` e o ADR do §4.

## 7. Âncoras
- Análise oficial (Notion): `350b65e5-c72b-817f-ae19-f07f8a332549`.
- Motor de scoring: `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` · `scripts/gbp_scoring_prototype.py`.
- C2/HubSpot: `docs/handoff/2026-07-05-comercial-c2-enriquecimento-gbp-brief.md`. Camada de Conhecimento: `docs/strategic-planning/camada-conhecimento/BRUTO-v0.1-design.md`.
- HubSpot: pipeline `default`; estágios Prospectado(`70807682-148b-4914-acd0-97aad8c2a000`)→qualifiedtobuy→17222650→presentationscheduled→decisionmakerboughtin→contractsent→closedwon/closedlost.
