# PHI — Plano de Projeto · relatório e proposta · estado em 2026-09-29

| | |
|---|---|
| **Pedido** | brief `docs/handoff/2026-09-29-plano-de-projeto-no-notion-subchat-brief.md` |
| **Estado desta entrega** | 🔴 **PAREI antes de escrever no `PHI - Gestão de Projetos`.** O DB não comporta o pedido (ver §1). O Olavo escolheu, nesta sessão, **"parar e devolver proposta"** |
| **O que foi escrito no Notion** | **uma linha** no Registro de Execuções (R3) — a do início; a do fim é atualizada junto com este relatório. Nenhuma linha nova ou alterada no DB de projetos |
| **Regra que rege** | não medi nada (sem BigQuery, sem n8n): cada número abaixo é **citado com documento e data**; o que não pude confirmar está escrito como tal |
| **Branch** | `claude/plano-projeto-notion-v20z3g` (a do brief, `claude/consolidacao-2026-08`, é a base; ver §9) |

---

## 0. Primeira tela — o placar (como ficaria a página-espinha)

> **Etapa em andamento (uma só):** 🔵 **E4 — identidade do Agregador (volta 3)**, em execução em sub-chat. Fonte: brief volta-3 e ESTADO §0, ambos de 29/09.

| | |
|---|---|
| **Esperando terceiro** | **1:** ⏳ liberação da API do GBP pelo Google. Pedido enviado em **29/09**; resposta esperada **08/10–13/10** (AG-06) |
| **Bloqueado, com o bloqueio nomeado** | 2: **SC-01** (ADR-37 Fase 2) — bloqueada pelo requisito das 07h e por 2 SQLs do `Pipeline_v2` · **T28-01** (T28) — parado *por decisão*, volta quando o F2 fechar |
| **Esperando o Olavo** | **30** linhas abertas: **20** decisões/ações (⬜) + **10** gatilhos que só ele dispara (lista completa no §4) |
| **Marcos com data (DEFINIÇÃO DE PRONTO, 08/09)** | checkpoint **31/10** · alvo do PHI v1 **30/11**. Critérios: **14**, **2 prontos** em 27/09 (A3 e D3). A data é *estimativa por dependência, não medida* (o próprio doc diz) |

**Placar de tarefas** (contado por script a partir das tabelas abaixo, não à mão):

| Seção | ✅ feito | 🔵 em execução | ⏳ terceiro | ⬜ espera o Olavo | 🟡 planejado | 🔴 bloqueado | Total |
|---|--:|--:|--:|--:|--:|--:|--:|
| **Software** (frentes do projeto) | 9 | 1 | 1 | 15 | 57 | 2 | 85 |
| **Operação (Miro)** | 0 | 0 | 0 | 5 | 2 | 0 | 7 |
| **Total** | 9 | 1 | 1 | 20 | 59 | 2 | 92 |

Legenda: ⬜ = **espera o Olavo** (decisão *ou* ação dele — o brief só previa "decisão"; acrescentei "ação" porque abrir o Telegram por 3 dias é ação, não decisão). 🟡 com "Olavo" na coluna *quem destrava* = **gatilho** que ele dispara.

### Etapas

| # | Etapa | Estado | Quando | Fonte |
|---|---|---|---|---|
| E1 | ADR-39 — dono único de `client_config` | ✅ | 28/09 | ESTADO §0 (28/09) |
| E2 | D1-d — uma credencial ruim não derruba a coleta de todos | ✅ | 28/09 | ESTADO §0 (28/09) |
| E3 | Pedido da liberação do GBP ao Google | ⏳ | enviado 29/09; resposta 08–13/10 | gbp-liberacao (29/09) |
| E4 | **Identidade do Agregador (volta 3)** | 🔵 | em execução em sub-chat | brief volta-3; ESTADO §0 (29/09) |
| E5 | F4 — grão de anúncio | 🟡 | depois de E4 (ordem A→B→C decidida pelo Olavo em 27/09) | ESTADO §0 (27/09) |

> A ordem **A → B → C** (D1-d → fontes paradas → F4) foi **decidida pelo Olavo em 27/09** (fila de decisões D-2). Eu não priorizei nada; só mostro as dependências que a doc afirma.

---

## 1. 🔴 Por que parei — o DB `PHI - Gestão de Projetos` não comporta o pedido (CA2)

**O que o DB tem hoje** (schema lido em 29/09): `Tarefa`, `Status` (Backlog · A fazer · Em andamento · Bloqueada · Concluida · Cancelada), `Area` (11 opções), `Fase`, `Tipo` (7), `Origem` (5 opções fixas), `Prioridade`, `Prazo`, `Ferramentas`, `Observacoes`, `Sugestao de Automacao/IA`, `Status Desenvolvimento`, `Status Implementacao`, `tenant_id`.

| O que o brief exige em toda linha | Existe? |
|---|---|
| frente (Saúde Digital · Agregador · Score · Prospecção · CRM Odoo · Webview · Índice · Governança · Operação) | ❌ `Area` tem outras opções (Comercial, Operacoes, Produto PHI…) |
| estado com ⏳ terceiro / ⬜ Olavo / 🔴 bloqueado | 🟡 só `Status`, sem distinguir quem espera |
| 🔴 **quem destrava** (Olavo · execução · terceiro) | ❌ **não existe** — e o brief chama isto de "o coração" |
| de onde veio (documento **+ data**) | ❌ `Origem` é uma lista de 5 rótulos, sem doc nem data |
| depende de | ❌ (só texto livre em `Observacoes`) |

**Por que não contornei com texto em `Observacoes`:** funcionaria, mas o Olavo **não conseguiria filtrar "o que é meu"** — que é metade do valor da entrega (brief §5.2). E 92 linhas com uma convenção de texto viram uma segunda estrutura que teria de ser refeita quando as colunas existirem.

### 🎯 Proposta (precisa do OK do Olavo — R7)

**Nenhum database novo.** Duas ou três propriedades no DB que já existe:

| Propriedade nova | Tipo | Valores |
|---|---|---|
| `Frente` | select | Saúde Digital/Agregador · Score · T28 · Índice do Negócio · Prospecção · CRM Odoo · Webview · Governança · Operação (Miro) |
| `Quem destrava` | select | Olavo · Execução (sub-chat) · Terceiro |
| `Fonte (doc + data)` | texto | ex.: `ESTADO §0 (28/09)`. Filtro "vazio" = a linha não entra |

Sem propriedade nova para o resto: **estado** = `Status` existente (✅ Concluida · 🔵 Em andamento · 🔴 Bloqueada · 🟡/⏳/⬜ A fazer, e a coluna `Quem destrava` diz quem espera) · **depende de** = 1ª linha de `Observacoes` · **eixo da Operação** = `Area` (Operacoes/Comercial/Atendimento) + `Origem = Miro`, que **já existem**.

Versão mínima, se ele preferir só 2: `Frente` + `Quem destrava`, com `Fonte:` na 1ª linha de `Observacoes`. **Consequência:** perde o filtro "sem fonte não entra".

---

## 2. Tarefas — seção SOFTWARE (85 linhas)

> Estados e donos vêm dos documentos citados, **na data citada**. "Execução" = sub-chat. Onde a doc não diz quem faz, escrevi isso na própria linha.

### Agregador (15 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| AG-01 | Volta 3: consertar o `sd[0]` do `Reclassifica IDs` (o `CA13` reprovou na exec `44493`), publicar Agregador **e** V4 (2 drafts), recoletar as 4 linhas do GA4 e apagar as 6 linhas do CLI-13 (se a contagem não der 6, parar) | 🔵 | Execução (sub-chat) | docs/handoff/2026-09-28-agregador-identidade-volta-3-construcao-brief.md §0.4, §4–§7 (29/09); ESTADO §0 (29/09) | — |
| AG-02 | Aceitar o ADR-33 com a extensão `client_id + source + source_id + janela` | ✅ | Olavo | docs/strategic-planning/saude-digital/adr-rascunhos/ADR-33-…md, cabeçalho (28/09) | — |
| AG-03 | Decidir se o contrato de identidade do ADR-33 se estende aos writers `sw metricas anuncios/campanhas` (o aceite de 28/09 liberou só o Agregador) | ⬜ | Olavo | ADR-33, cabeçalho (28/09); brief volta-3 §8 (28/09) | AG-01 |
| AG-04 | Corrigir o `PARTITION BY` do Agregador (sem `platform`, viola o M2) e o `source_ingestion_step` persistido em `t28_campaign` | 🟡 | Execução (sub-chat) | docs/strategic-planning/saude-digital/adr-rascunhos/ADR-38-…md §26.4 (24/09) | ADR-38 Fase C (o doc diz "some com a Fase C") |
| AG-05 | Tratar as 318 linhas com `client_id` nulo em `t28_campaign` (etapa própria; o doc de 26/09 corrige que 216 são do KIL, com custo real — não apagar por conta) | 🟡 | Execução (sub-chat) | docs/handoff/2026-09-26-limpar-tudo-do-bigquery-analise.md (correção de 26/09); brief volta-3 §8 (28/09) | — |
| AG-06 | GBP: aguardar a liberação da API pelo Google (cota `DefaultRequestsPerMinutePerProject = 0`, projeto `641951006374`); pedido enviado em 29/09, resposta esperada entre 08/10 e 13/10; se não responderem até 13/10, cobrar | ⏳ | Terceiro | docs/handoff/2026-09-28-gbp-liberacao-de-api-decisao-e-caminho.md, fechamento (29/09) | — |
| AG-07 | Depois da liberação do GBP, construir a coleta (o doc de 28/09 diz que `t28_gbp_daily` tinha 1 linha, de 21/06 — liberar é a condição, não a coleta) | 🟡 | Execução (sub-chat) | idem (28–29/09) | AG-06 |
| AG-08 | Verificar se o script da Clarity está instalado (contrato de fontes §4 item 7; a doc não diz quem faz nem se exige acesso ao site do cliente) | 🟡 | Execução (sub-chat) | docs/strategic-planning/saude-digital-do-negocio/CONTRATO-DE-FONTES-v0.md §4 (25/09) | — |
| AG-09 | Aposentar a integração da Clarity pelo procedimento R5 (5 passos) — gatilho: o resultado do AG-08 | 🟡 | Execução (sub-chat) | brief volta-3 §0.1 (29/09) | AG-08, AG-01 |
| AG-10 | Apurar os `key_events` do GA4 (`SD-GOV-02`) — CVR de 36–61% é implausível; trava o `SD-CVR-05` | 🟡 | Execução (sub-chat) | CONTRATO-DE-FONTES §4 item 1 (25/09) | — |
| AG-11 | Apurar a atribuição do pago (`SD-GOV-03`) — trava metade do D6 e do D8 | 🟡 | Execução (sub-chat) | CONTRATO-DE-FONTES §4 item 2 (25/09) | — |
| AG-12 | Apurar `search_terms = "error"` com `pct_*` cheios — trava o `SD-AQU-13` | 🟡 | Execução (sub-chat) | CONTRATO-DE-FONTES §4 item 3 (25/09) | — |
| AG-13 | Confirmar o nome do campo de tempo de engajamento no GA4 (Regra 1 do contrato) — trava o `SD-EXP-05` | 🟡 | Execução (sub-chat) | CONTRATO-DE-FONTES §4 item 5 (25/09) | — |
| AG-14 | Preencher `margem_contribuicao_pct` e `ticket_ltv` na DB Clientes (é cadastro; a doc não nomeia quem preenche — assumo o Olavo, pois é ele quem cadastra: PLANO-ENTREGA-FINAL §3.2) | 🟡 | Olavo | CONTRATO-DE-FONTES §4 item 4 (25/09) | — |
| AG-15 | Estender o vigia às tabelas `t28_*` (contrato de fontes §4 item 6, "o mais urgente") — feito pelo V4 do Vigia (`JMgc0HdLPOFPnFYb`); li a doc, não o n8n | ✅ | Execução (sub-chat) | docs/strategic-planning/saude-digital/PLANO-F3-vigia-de-consistencia.md (26/09); ESTADO §0 (27/09) | — |

### Score, vigia e writers (23 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| VG-01 | F3: vigia de consistência no ar, 7 de 7 conferências | ✅ | Execução (sub-chat) | PLANO-F3 (26/09); ESTADO §0 (27/09) | — |
| VG-02 | Dar OK à emenda do V3 (motivo declarado para cliente fora do índice — o CHA é CPL) e ao campo `Fora do índice (motivo)` | ⬜ | Olavo | PLANO-F3, "EMENDA PROPOSTA AO V3" (27/09: "aguarda OK do Olavo") | — |
| VG-03 | Construir a emenda do V3 | 🟡 | Execução (sub-chat) | PLANO-F3 (27/09) | VG-02, CL-01, CL-02 |
| SC-01 | ADR-37 Fase 2: aposentar o `GADS_INSERT`. Bloqueio: SC-02 e SC-03 | 🔴 | Execução (sub-chat) | docs/strategic-planning/saude-digital/adr-rascunhos/ADR-37-…md, cabeçalho (28/09) | SC-02, SC-03 |
| SC-02 | Requisito das 07h: o W1 rodar às 07h e dar os mesmos números do W2, provado em escrita dupla (decidido pelo Olavo em 26/09) | 🟡 | Execução (sub-chat) | ADR-37, cabeçalho (registrado em 27/09) | — |
| SC-03 | Migrar os 2 SQLs do `Pipeline_v2` que ainda leem `client_config.primary_metric_type` (o 3º migrou no 4.3b de 28/09) | 🟡 | Execução (sub-chat) | ADR-37, cabeçalho (28/09) | — |
| SC-04 | ADR-37 Fase 3 — o doc diz que destravou em 28/09 (não reli o conteúdo dela) | 🟡 | Execução (sub-chat) | ADR-37, cabeçalho (28/09) | — |
| SC-05 | ADR-38 Etapa 8 (Fases 1.4 / C1 / C2): o cabeçalho de 24/09 as dá como bloqueadas por P-20, F3 e D1-d; F3 fechou em 26/09 e D1-d em 28/09 — cabeçalho possivelmente defasado. Não localizei o que é P-20 | 🟡 | Execução (sub-chat) | ADR-38, cabeçalho (24/09); ESTADO §0 (27–28/09) | SC-01 |
| SC-06 | Implementar o Score v2 (ADR-34) — critério C1 | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO C1 (27/09); ESTADO §0 (27/09) | SC-01 |
| SC-07 | Escrever o ADR do motor multi-métrica (o ADR-40 disse em 22/09 "precisa de ADR próprio"; em 27/09 ele ainda não existia). Aprovação final é do Olavo | 🟡 | Execução (sub-chat) | ADR-40, cabeçalho (22/09); ESTADO §0 (27/09) | — |
| SC-08 | Implementar o motor multi-métrica — o prazo não é data, é gatilho: o primeiro cliente com métrica diferente de CPA (declarado pelo Olavo em 27/09) | 🟡 | Olavo | ESTADO §0 (27/09); ADR-40 (27/09) | SC-07 |
| SC-09 | Decidir o destino dos componentes `es/rs/os` do PHI·Mídia (placeholders 50.0 desde o ADR-004): calcular / peso 0 (recomendado no relatório) / remover. Não sei se já foi decidido depois de 02/07 | ⬜ | Olavo | docs/handoff/2026-07-02-saude-digital-phi-midia-score-analise-report.md (02/07) | — |
| SC-10 | Gate Meta Ads: antes da 1ª campanha Meta ativa, o score precisa suportá-la (hoje seria descartada em silêncio) — gatilho, não tarefa com data | 🟡 | Olavo | ESTADO §0, achado de 09/09 | gatilho: 1ª campanha Meta ativa |
| SC-11 | F1: um cliente real de CPA entrar e receber nota (o caminho ficou inteiro em 28/09; falta a prova) | 🟡 | Olavo | PLANO-ENTREGA-FINAL §4 F1 (28/09) | gatilho: cliente novo de CPA |
| SC-12 | Apagar o dataset `phi_dev` (só resta o `WF-T28-Orquestrador-Analises` referenciando) | 🟡 | Execução (sub-chat) | ESTADO §0 (28/09); ADR-39 (28/09) | T28-02 |
| SC-13 | F2: fechar a 2ª metade — "zero que significa não achei" | 🟡 | Execução (sub-chat) | PLANO-ENTREGA-FINAL §4 F2 (26/09) | — |
| SC-14 | F4: o grão de anúncio (campanha → conjunto → anúncio). 3º da fila A→B→C decidida pelo Olavo em 27/09. Régua já escrita em `regras-otimizacao-metodo-subido.md` §6 | 🟡 | Execução (sub-chat) | PLANO-ENTREGA-FINAL §4 F4, §4.1; ESTADO §0 (27/09) | AG-01 |
| SC-15 | F7: medir se a orientação funcionou (a metade "verificação" do Log de Otimizações não existe; o nó `Criar Log Otimizacoes` tem `onError: continueRegularOutput` sem destino visível). Ordem: por último, decisão do Olavo (20–21/09) | 🟡 | Execução (sub-chat) | DICIONARIO SD-GOV-07 (25/09); PLANO-ENTREGA-FINAL §4 | SC-13 |
| SC-16 | F5: rodar 30 dias sem intervenção manual (nunca medido) | 🟡 | Execução (sub-chat) | PLANO-ENTREGA-FINAL §4 F5 (20/09) | SC-11, SC-13, VG-01 |
| SC-17 | F6: alguém da equipe opera sem ter desenhado (prioridade rebaixada em 21/09) | 🟡 | Execução (sub-chat) | PLANO-ENTREGA-FINAL §4 F6 (21/09) | — |
| SC-18 | D1-d: fronteira de erro no `sw metricas campanhas` (12 portas → `Campanha pulada`) | ✅ | Execução (sub-chat) | ESTADO §0 (28/09) | — |
| SC-19 | ADR-39 Fase B: dono único de `client_config`, `phi_dev.client_config` apagada | ✅ | Execução (sub-chat) | ADR-39, cabeçalho (28/09) | — |
| SC-20 | ADR-38 etapas 1–7 (identidade neutra + rebuild), reconferido em 18/09 | ✅ | Execução (sub-chat) | ADR-38, cabeçalho (09/09; 18/09) | — |

### T28 (Otimização) (3 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| T28-01 | Reativar o T28 (E1 Maestro, ADR-28). Parado **por decisão** (27/09); gatilho de volta = o F2 fechar; ligar exige OK de budget do Olavo (CLAUDE.md) | 🔴 | Olavo | docs/strategic-planning/saude-digital/adr-rascunhos/ADR-28-…md, cabeçalho (27/09) | SC-13 (F2) |
| T28-02 | Corrigir antes de religar: o `WF-T28-Orquestrador-Analises` lê `phi_dev`, e o nó `BQ Read T28 Score` tem `{{ }}` sem `=` | 🟡 | Execução (sub-chat) | ADR-28 (27/09; 1º confirmado em 28/09 pela Fase B do ADR-39) | — |
| T28-03 | C3/C4: diagnóstico entregando em `PHI - ANÁLISES` para todas as campanhas ativas, e tarefa abrindo a partir dele | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO C3, C4 (27/09) | T28-01 |

### Índice de Saúde Digital do Negócio (inclui campos da DB Clientes) (12 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| IN-01 | ADR-41 aceito (25/09) e ADR-42 aceito (27/09) | ✅ | Olavo | ADR-41 (25/09); ADR-42 (27/09) | — |
| IN-02 | Aprovar o Contrato de Fontes v0 — hoje está RASCUNHO ("não é decisão até virar ADR") e é o documento que manda na construção | ⬜ | Olavo | CONTRATO-DE-FONTES, cabeçalho (25/09) | — |
| IN-03 | Nomear o dono de cada dimensão D1–D10 (agência × cliente). A lista foi apresentada em 27/09 | ⬜ | Olavo | ADR-42 §8.4 #1; fila de decisões D-5 (27/09) | — |
| IN-04 | Escrever o §2 do PLANO-ENTREGA-FINAL (a lista de ambição do PHI). O §1 já foi respondido em 27/09 | ⬜ | Olavo | PLANO-ENTREGA-FINAL §1–§2 (27/09) | — |
| IN-05 | Decidir o que cada nível (bronze/prata/ouro) recebe além do semanal (só a reunião de 30 min está decidida) | ⬜ | Olavo | ADR-42 §8.4 #4 (27/09) | — |
| IN-06 | Escrever o critério da auditoria dos 90 dias — antes do 90º dia; gatilho: fim da configuração do índice | 🟡 | Olavo | ADR-42 §8.2 (27/09) | gatilho: índice v0.1 calculando |
| IN-07 | Construir o índice v0.1 em lotes (API → nós → cliente). O brief de 25/09 foi substituído pelo contrato de fontes; falta brief novo. "Fila, não bloqueada" | 🟡 | Execução (sub-chat) | ESTADO §0 (27/09); CONTRATO-DE-FONTES §0 (25/09) | IN-02, AG-01, AG-06 (2 pilares) |
| IN-08 | Cliente-zero: a agência como cliente (`client_id` próprio + `is_internal` em `client_config`; toda média exclui interno) | 🟡 | Execução (sub-chat) | docs/handoff/2026-09-26-decisoes-do-olavo-nota-dupla-lotes-e-cliente-zero.md (26/09) | IN-07 |
| IN-09 | F8: relatório semanal (segundas; WhatsApp para alguns; reunião remota de 30 min para elegível). Construção nova — o relatório não existe hoje | 🟡 | Execução (sub-chat) | PLANO-ENTREGA-FINAL §1, F8 (27/09); ADR-42 §8.3 | CL-02, IN-05, OP-03 |
| IN-10 | Desenhar o agente que lê os indicadores e devolve hipóteses e sugestões (não conclusão nem ação). Precisa de plano aprovado (R7) | 🟡 | Execução (sub-chat) | ADR-42 §8.1 (27/09) | — |
| CL-01 | Criar o campo `Tipo` (Real / Teste / Interno) na DB Clientes — decidido em 27/09 (D-9: "sim"), falta criar | 🟡 | Execução (sub-chat) | fila de decisões D-9 (27/09); PLANO-F3 (27/09) | — |
| CL-02 | Criar o campo de nível (bronze/prata/ouro) na DB Clientes, só no Notion — decidido em 27/09, falta criar | 🟡 | Execução (sub-chat) | ADR-42 §8.3, §8.4 #5 (27/09) | — |

### Prospecção (14 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| PR-01 | A2: exercitar o caminho P4 → P5O numa prospecção real (quem roda a prospecção real não está escrito — assumo o Olavo) | 🟡 | Olavo | DEFINICAO-DE-PRONTO A2 (27/09); ESTADO §0 (27/09) | — |
| PR-02 | Arquivar os 5 workflows mortos do ADR-35 §3.5 (procedimento R5 com os 5 passos) e renomear `Comercial - Guarda-Schema + Backup` → `PROSP-07`. Autorizado pelo Olavo em 27/09 | 🟡 | Execução (sub-chat) | docs/strategic-planning/prospeccao/ADR-35-…md §3.5 (27/09) | — |
| PR-03 | Rodar `BF`/`LO` (a sigla não está expandida no painel; não confirmei o que são) | 🟡 | Execução (sub-chat) | ESTADO §0 (27/09) | — |
| PR-04 | P1: um lead entra e sai analisado pelo workflow de lead único | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO, frente Prospecção (15/09) | — |
| PR-05 | P2: um recorte completo (2 setores) roda ponta a ponta sem intervenção | 🟡 | Execução (sub-chat) | idem (15/09) | — |
| PR-06 | P3: todo lead no CRM chega com oferta, prioridade, abordagem e NBA | 🟡 | Execução (sub-chat) | idem (15/09) | — |
| PR-07 | P5: a cadência roda, registra tentativas e para na resposta | 🟡 | Execução (sub-chat) | idem (15/09) | — |
| PR-08 | P6: enriquecimentos são skills versionadas no git | 🟡 | Execução (sub-chat) | idem (15/09) | — |
| PR-09 | P7: cada dimensão do score tem definição escrita e status de evidência | 🟡 | Execução (sub-chat) | idem (15/09) | — |
| PR-10 | P9: mini-diagnóstico gerado sem trabalho manual | 🟡 | Execução (sub-chat) | idem (15/09) | — |
| PR-11 | A4: manter o passivo conhecido e não crescendo (127 linhas sem `place_id`; ~48 sem chave de CRM — cifras do doc, sem data própria) | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO A4 (27/09) | — |
| PR-12 | Gatilhos de medição CK1–CK4 e CK6 (custo por lead, capacidade de contato, taxa de resposta, afogamento de follow-up, envelhecimento do dado) | 🟡 | Execução (sub-chat) | PLANO-ENTREGA-FINAL-PROSPECCAO §12.2 (15/09) | gatilhos de cada CK |
| PR-13 | CK5, ao fechar o 3º cliente: decidir quem entrega e abrir a automação da entrega de GBP (fora da v1) | 🟡 | Olavo | idem; DEFINICAO-DE-PRONTO, adendo (15/09) | gatilho: 3º cliente |
| PR-14 | P4 (desfecho volta à planilha) e A3 (loop de aprendizado) fechados em 19/09 | ✅ | Execução (sub-chat) | DEFINICAO-DE-PRONTO (19/09) | — |

### CRM Odoo (5 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| OD-01 | F1 + F2 concluídos (Odoo 19 no ar, módulo `phi_crm`) | ✅ | Execução (sub-chat) | ADR-36 (08/09); ESTADO §0 | — |
| OD-02 | Odoo-F3: campos GBP/IA escritos pela API (critério B3). Não medido no painel de 27/09 (sem MCP do Odoo) | 🟡 | Execução (sub-chat) | ESTADO §0 (27/09); DEFINICAO-DE-PRONTO B3 | — |
| OD-03 | Odoo-F5: migrar os dados do HubSpot | 🟡 | Execução (sub-chat) | ESTADO §0 (27/09); ADR-36 | OD-02 |
| OD-04 | B2: um lead percorre os 6 estágios ponta a ponta; B4: só o humano move estágio | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO B2, B4 | OD-02 |
| OD-05 | B1: um ciclo em paralelo e desligar o HubSpot | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO §3, caminho crítico | OD-03, OD-04 |

### Webview (4 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| WV-01 | Autorizar a publicação da branch `webview` (repositório `phi-dashboard-webview`); depois o smoke HTTP do W4 (o relatório espera 6 de 11 telefones no `/api/clients`) | ⬜ | Olavo | docs/handoff/2026-09-27-webview-W4-notion-dossie-cliente-execution-report.md (28/09) | — |
| WV-02 | Sincronizar o `package-lock.json` e trocar para `npm ci` no Dockerfile da raiz | 🟡 | Execução (sub-chat) | brief W4 §7 (27/09); relatório W4 §8 (28/09) | — |
| WV-03 | Decidir apagar o entulho `webview/` (15 arquivos, 532 KB; nada no build referencia) | ⬜ | Olavo | ESTADO §0 (28/09) | — |
| WV-04 | Avaliar 3 achados de segurança: `.env` da raiz versionado, resíduo do Lovable (`supabase/`), 12 vulnerabilidades preexistentes no `npm audit` (10 altas) | 🟡 | Execução (sub-chat) | relatório W4 §7, §9 (28/09) | — |

### Governança (9 linhas)

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| GV-01 | Publicar no Notion os ADRs aceitos só em git: 33, 35, 36, 37, 38, 39, 40, 42 (a DB do Notion só tem, entre eles, o ADR-41) | 🟡 | Execução (sub-chat) | MAPA-DE-DOCUMENTACAO §3 (ADR-012); leitura da DB de ADRs (29/09) | — |
| GV-02 | Decidir a numeração de ADR: `Número ADR` do Notion é auto-incremento e não bate com o título; consertar exige campo editável (mexe no schema) | ⬜ | Olavo | ADR-41, nota de numeração (25/09) | — |
| GV-03 | Corrigir cabeçalhos defasados (R2 regra 5): PLANO-ENTREGA-FINAL (diz §1 e §2 "em branco"), painel do ESTADO (Índice: "ADR-42 em rascunho" e "gatilho do O4"), CONTRATO-DE-FONTES §5.2–5.3 (ADR-42 "aguardando"), ADR-40 (diz "Fase B: não ocorreu", mas o ADR-39 fundido diz concluída em 28/09), ADR-27/28 e os 2 rascunhos de `execucao-demandas` (Notion mostra Aceito 14/06) | 🟡 | Execução (sub-chat) | comparação dos cabeçalhos com ADR-42 e fila de 27/09 (29/09) | — |
| GV-04 | D1: painel do ESTADO atualizado a cada entrega (só volta a ✅ com duas entregas seguidas com painel no mesmo dia) | 🟡 | Execução (sub-chat) | DEFINICAO-DE-PRONTO D1 (27/09) | — |
| GV-05 | D2: abrir o Telegram por 3 dias seguidos e ver se o digest veio com progresso real; adesão dos sub-chats à R3 | ⬜ | Olavo | DEFINICAO-DE-PRONTO D2 (27/09) | — |
| GV-06 | Responder as perguntas B7, B8, B12 (prefixo de nome dos workflows), B19 e B22 da entrevista do propósito (B4, B5 e B9 já respondidas em 20/09) | ⬜ | Olavo | PLANO-ENTREGA-FINAL §6 (20/09) | — |
| GV-07 | ADRs 23, 24, 25 e 27 (git): RASCUNHO desde 22/06 ("aprovado em princípio"). Decidir: aceitar, superseder ou arquivar | ⬜ | Olavo | docs/strategic-planning/saude-digital/adr-rascunhos/ (22/06) | — |
| GV-08 | ADRs 29, 30 e 31 (git): RASCUNHO desde 31/07 ("vira Aceito quando…"). Decidir: aceitar, superseder ou arquivar | ⬜ | Olavo | idem (31/07) | — |
| GV-09 | ADRs do Notion em `Proposto`: 16 e 17 (briefing genérico, duplicados, 21–22/05) e 21 (framework de abordagem comercial, 02/06) | ⬜ | Olavo | DB PHI™ — Decisões (ADR), lida em 29/09 | — |


## 3. Tarefas — seção OPERAÇÃO (Miro — `Board Agência`, vigente) (7 linhas)

> Lido o board **`uXjVHecmR7c=`** (503 itens, 252 blocos de texto). **A `Cópia de Board Agência` (`uXjVHI3gP6s=`) não foi aberta.** O board é um **mapa mental-modelo**: áreas (Operações, Atendimento, Comercial), procedimentos e passos genéricos — **sem donos nominais, sem datas, sem estado**. Por isso a seção só tem tarefas **derivadas de dependência do software**, e não invenção de procedimentos.

| ID | Tarefa (verbo primeiro) | Estado | Quem destrava | De onde veio (doc + data) | Depende de |
|---|---|---|---|---|---|
| OP-01 | Handover Comercial → Operações: definir quem cadastra o cliente novo na DB Clientes do Notion e quando (o F1 depende desse cadastro; o board tem "Coleta de informações do cliente" e "Registro em sistema", mas não cita Notion nem PHI) | ⬜ | Olavo | Board Agência (lido em 29/09) + PLANO-ENTREGA-FINAL §3.1, §3.2 (20/09) | — |
| OP-02 | Definir quem envia o relatório semanal e quem conduz a reunião de 30 min (o board tem "Comunicação proativa" e "Pontos de contato", mas nenhum nó de relatório ou reunião de resultados) | ⬜ | Olavo | Board Agência (29/09) + PLANO-ENTREGA-FINAL §1 (27/09) | — |
| OP-03 | Definir a regra de elegibilidade à reunião de 30 min (o "nível" do cliente decide; o board só tem "Níveis de prioridade", que é de demanda) | ⬜ | Olavo | PLANO-ENTREGA-FINAL §1 (27/09); Board Agência (29/09) | IN-05 |
| OP-04 | Definir como o PHI acessa os dados do cliente para o D9 Relacionamento (10 indicadores, todos 🔴 inexistentes; "problema de acesso e de procedimento"). O board tem "CRM" e "Monitorar a adoção", e nenhum nó de acesso | ⬜ | Olavo | DICIONARIO-DE-INDICADORES, D9 (25/09); Board Agência (29/09) | — |
| OP-05 | Escrever o roteiro do cliente-zero a partir do Board e o critério de aceite antes de começar (condições 3 e 4 da decisão de 26/09) | 🟡 | Olavo | docs/handoff/2026-09-26-decisoes-do-olavo-nota-dupla-lotes-e-cliente-zero.md (26/09) | IN-08 |
| OP-06 | Documento de escopo do projeto que se vende ("o que vamos vender não tem spec"); vence 30 dias após o 1º cliente assinar. No board: "Proposta e Fechamento" | ⬜ | Olavo | docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md §15 (15/09) | — |
| OP-07 | Board sem donos nem datas: os procedimentos (Responsáveis, Publicar versão oficial, Monitorar a adoção) ainda não foram para o git (`docs/operacao/<area>/`, conforme o CLAUDE.md). Só fazer quando o Olavo priorizar a Operação | 🟡 | Olavo | CLAUDE.md, tabela "Por onde começar"; Board Agência (29/09) | — |

### Dependências software ↔ agência que achei (resposta ao §9.5 do brief)

| Do lado do software | O que o board diz (e o que falta) |
|---|---|
| Prospecção (software) → **Handover para Operações** (Comercial): coleta de informações, alinhamento de escopo, registro de prazos, transferência de responsabilidades | o plano da Prospecção termina no lead no CRM. O F1 ("todo cliente que contrata aparece no PHI") depende de o Olavo cadastrar o cliente no Notion (PLANO-ENTREGA-FINAL §3.2). **O board não cita Notion nem PHI em nenhum bloco** → OP-01 |
| F8 relatório semanal + reunião de 30 min → **Atendimento** (Comunicação proativa, Pontos de contato, Pesquisa de satisfação) | o board não tem bloco de "relatório" nem de "reunião de resultados", e não nomeia quem envia → OP-02 |
| Nível do cliente (bronze/prata/ouro) → elegibilidade à reunião | o board só tem "Níveis de prioridade" (de demanda) → OP-03 |
| D9 Relacionamento do índice (10 indicadores, todos 🔴 inexistentes) → acesso ao CRM/WhatsApp/agenda **do cliente** | o board tem "CRM" (Sistemas de apoio) e "Monitorar a adoção", **sem nenhum bloco de acesso a dados do cliente** → OP-04 |
| Cliente-zero → percorre o Board inteiro (Comercial → handover → onboarding → entrega) | a decisão de 26/09 manda o roteiro sair do Board, com critério de aceite escrito antes → OP-05 |
| Documento do que se vende → **Proposta e Fechamento** (Comercial) | o doc de 15/09 diz que esse documento não existe → OP-06 |

> ⚠️ **"O board não tem X" é ausência de texto nos 251 blocos que extraí** (busquei: acesso, nível, relatório, reunião, WhatsApp, elegível, Notion, PHI, alerta). Não vi imagens nem comentários do board.

---

## 4. 🔴 O que é do OLAVO — a lista à parte (CA6)

### 4.1. Decisões e ações dele (⬜, 20)

1. **AG-03** — Decidir se o contrato de identidade do ADR-33 se estende aos writers `sw metricas anuncios/campanhas` (o aceite de 28/09 liberou só o Agregador)
2. **VG-02** — Dar OK à emenda do V3 (motivo declarado para cliente fora do índice — o CHA é CPL) e ao campo `Fora do índice (motivo)`
3. **SC-09** — Decidir o destino dos componentes `es/rs/os` do PHI·Mídia (placeholders 50.0 desde o ADR-004): calcular / peso 0 (recomendado no relatório) / remover. Não sei se já foi decidido depois de 02/07
4. **IN-02** — Aprovar o Contrato de Fontes v0 — hoje está RASCUNHO ("não é decisão até virar ADR") e é o documento que manda na construção
5. **IN-03** — Nomear o dono de cada dimensão D1–D10 (agência × cliente). A lista foi apresentada em 27/09
6. **IN-04** — Escrever o §2 do PLANO-ENTREGA-FINAL (a lista de ambição do PHI). O §1 já foi respondido em 27/09
7. **IN-05** — Decidir o que cada nível (bronze/prata/ouro) recebe além do semanal (só a reunião de 30 min está decidida)
8. **WV-01** — Autorizar a publicação da branch `webview` (repositório `phi-dashboard-webview`); depois o smoke HTTP do W4 (o relatório espera 6 de 11 telefones no `/api/clients`)
9. **WV-03** — Decidir apagar o entulho `webview/` (15 arquivos, 532 KB; nada no build referencia)
10. **GV-02** — Decidir a numeração de ADR: `Número ADR` do Notion é auto-incremento e não bate com o título; consertar exige campo editável (mexe no schema)
11. **GV-05** — D2: abrir o Telegram por 3 dias seguidos e ver se o digest veio com progresso real; adesão dos sub-chats à R3
12. **GV-06** — Responder as perguntas B7, B8, B12 (prefixo de nome dos workflows), B19 e B22 da entrevista do propósito (B4, B5 e B9 já respondidas em 20/09)
13. **GV-07** — ADRs 23, 24, 25 e 27 (git): RASCUNHO desde 22/06 ("aprovado em princípio"). Decidir: aceitar, superseder ou arquivar
14. **GV-08** — ADRs 29, 30 e 31 (git): RASCUNHO desde 31/07 ("vira Aceito quando…"). Decidir: aceitar, superseder ou arquivar
15. **GV-09** — ADRs do Notion em `Proposto`: 16 e 17 (briefing genérico, duplicados, 21–22/05) e 21 (framework de abordagem comercial, 02/06)
16. **OP-01** — Handover Comercial → Operações: definir quem cadastra o cliente novo na DB Clientes do Notion e quando (o F1 depende desse cadastro; o board tem "Coleta de informações do cliente" e "Registro em sistema", mas não cita Notion nem PHI)
17. **OP-02** — Definir quem envia o relatório semanal e quem conduz a reunião de 30 min (o board tem "Comunicação proativa" e "Pontos de contato", mas nenhum nó de relatório ou reunião de resultados)
18. **OP-03** — Definir a regra de elegibilidade à reunião de 30 min (o "nível" do cliente decide; o board só tem "Níveis de prioridade", que é de demanda)
19. **OP-04** — Definir como o PHI acessa os dados do cliente para o D9 Relacionamento (10 indicadores, todos 🔴 inexistentes; "problema de acesso e de procedimento"). O board tem "CRM" e "Monitorar a adoção", e nenhum nó de acesso
20. **OP-06** — Documento de escopo do projeto que se vende ("o que vamos vender não tem spec"); vence 30 dias após o 1º cliente assinar. No board: "Proposta e Fechamento"

### 4.2. Gatilhos que só ele dispara (10)

- **AG-14** — Preencher `margem_contribuicao_pct` e `ticket_ltv` na DB Clientes (é cadastro; a doc não nomeia quem preenche — assumo o Olavo, pois é ele quem cadastra: PLANO-ENTREGA-FINAL §3.2)
- **SC-08** — Implementar o motor multi-métrica — o prazo não é data, é gatilho: o primeiro cliente com métrica diferente de CPA (declarado pelo Olavo em 27/09)
- **SC-10** — Gate Meta Ads: antes da 1ª campanha Meta ativa, o score precisa suportá-la (hoje seria descartada em silêncio) — gatilho, não tarefa com data
- **SC-11** — F1: um cliente real de CPA entrar e receber nota (o caminho ficou inteiro em 28/09; falta a prova)
- **T28-01** — Reativar o T28 (E1 Maestro, ADR-28). Parado **por decisão** (27/09); gatilho de volta = o F2 fechar; ligar exige OK de budget do Olavo (CLAUDE.md)
- **IN-06** — Escrever o critério da auditoria dos 90 dias — antes do 90º dia; gatilho: fim da configuração do índice
- **PR-01** — A2: exercitar o caminho P4 → P5O numa prospecção real (quem roda a prospecção real não está escrito — assumo o Olavo)
- **PR-13** — CK5, ao fechar o 3º cliente: decidir quem entrega e abrir a automação da entrega de GBP (fora da v1)
- **OP-05** — Escrever o roteiro do cliente-zero a partir do Board e o critério de aceite antes de começar (condições 3 e 4 da decisão de 26/09)
- **OP-07** — Board sem donos nem datas: os procedimentos (Responsáveis, Publicar versão oficial, Monitorar a adoção) ainda não foram para o git (`docs/operacao/<area>/`, conforme o CLAUDE.md). Só fazer quando o Olavo priorizar a Operação

---

## 5. ADRs — todos, com status e data (CA9)

Fontes: cabeçalho de cada arquivo em `adr-rascunhos/`, `prospeccao/`, `execucao-demandas/`; e a DB `PHI™ — Decisões (ADR)` do Notion (33 linhas lidas em 29/09: 30 Aceito, 3 Proposto). Idade calculada até **29/09/2026**.

> ⚠️ **A numeração git × Notion não bate** (defeito já registrado no ADR-41: `Número ADR` do Notion é auto-incremento). Ex.: o "ADR-29" do git (Guardião) não é o "ADR-29" do Notion (contrato T28). Por isso a tabela diz de qual fonte é cada linha.
>
> ⚠️ **Só um dos ADRs 33–42 do git está publicado no Notion (o 41)** — pelo ADR-012 o Notion é canônico para ADR aceito (GV-01).

| Nº | Título | Status | Data do status | Idade (dívida) |
|---|---|---|---|---|
| 23 | Separação Agregador × Orquestrador | RASCUNHO (aprovado em princípio) | 2026-06-22 | 🔴 99 dias em rascunho/proposto |
| 24 | Granularidade bottom-up | RASCUNHO (aprovado em princípio) | 2026-06-22 | 🔴 99 dias em rascunho/proposto |
| 25 | Sub-WFs reutilizáveis Social + GBP | RASCUNHO (aprovado em princípio) | 2026-06-22 | 🔴 99 dias em rascunho/proposto |
| 26 | Error Handler global | ACEITO — publicado no Notion | 2026-06-22 | — |
| 27 | Entrega de análises (DB `PHI - ANÁLISES`) | RASCUNHO (aprovado em princípio). A DB já existe (CLAUDE.md): provável execução parcial; não confirmei | 2026-06-22 | 🔴 99 dias em rascunho/proposto |
| 28 | Decomposição do cérebro T28 (E1 Maestro) | RASCUNHO; parado **por decisão** em 27/09 | 2026-07-31 | 🔴 60 dias em rascunho/proposto |
| 29 | Guardião da Métrica-Mãe | RASCUNHO (aprovado em princípio) | 2026-07-31 | 🔴 60 dias em rascunho/proposto |
| 30 | Cadência/Janelas no Maestro + Ordem Sagrada | RASCUNHO (aprovado em princípio) | 2026-07-31 | 🔴 60 dias em rascunho/proposto |
| 31 | Camada de Conhecimento de Plataforma | RASCUNHO (aprovado em princípio) | 2026-07-31 | 🔴 60 dias em rascunho/proposto |
| 33 | Identidade estável do item na pipeline de métricas | ACEITO, em execução (Agregador). Foi RASCUNHO de 09/08 a 28/09 (50 dias) | 2026-09-28 | — |
| 35 | Contrato da Prospecção | ACEITO; §3.5 (limpeza) autorizado em 27/09, não executado | 2026-09-08 | — |
| 36 | Odoo é o CRM canônico | ACEITO; F1+F2 executados, F3/F5 pendentes | 2026-09-08 | — |
| 37 | Writers canônicos | ACEITO com D1 em revisão; Fase 0.1 executada; Fase 2 bloqueada | 2026-09-08 | — |
| 38 | Identidade neutra + rebuild | ACEITO; etapas 1–7 executadas em 09/09; etapa 8 em curso | 2026-09-09 | — |
| 39 | Dono único de `client_config` | ACEITO e EXECUTADO (Fase A 21/09, Fase B 28/09) | 2026-09-28 | — |
| 40 | Métrica-Mãe viaja com a campanha | ACEITO; Fase A executada em 21/09. Cabeçalho diz Fase B "não ocorreu"; o ADR-39 fundido diz concluída em 28/09 | 2026-09-21 | — |
| 41 | Índice de Saúde Digital: pesos iguais, cobertura declarada | ACEITO, não executado (publicado no Notion) | 2026-09-25 | — |
| 42 | Normalização de alvo + decisões de 25/09 e 27/09 | ACEITO, não executado. O painel do ESTADO ainda diz "rascunho" | 2026-09-27 | — |
| — | Eventos canônicos + sink BigQuery (`execucao-demandas`) | git: "Rascunho"; Notion: Aceito (14/06). Divergência entre as duas fontes | 2026-06-14 | — |
| — | Tiering de agentes IA (`execucao-demandas`) | git: "Rascunho"; Notion: Aceito (14/06). Divergência entre as duas fontes | 2026-06-14 | — |
| 16 | (Notion) Briefing genérico sem condicionais por segmento | Proposto no Notion | 2026-05-21 | 🔴 131 dias em rascunho/proposto |
| 17 | (Notion) Briefing genérico sem condicionais (duplicado do 16) | Proposto no Notion | 2026-05-22 | 🔴 130 dias em rascunho/proposto |
| 21 | (Notion) Framework de abordagem comercial — Nó 2 | Proposto no Notion | 2026-06-02 | 🔴 119 dias em rascunho/proposto |
| 34 | Score v2 (PHI·Mídia) | **Não localizei o documento** nem no git nem na DB de ADRs do Notion; o ESTADO e a DEFINIÇÃO DE PRONTO o citam como "desenhado e validado" | — | — |

> 🔴 **Rascunhos antigos = dívida com juros** (lição do ADR-33: 50 dias em rascunho, o defeito se espalhou). Os mais velhos: **ADR-16/17 (Notion, 130 dias)**, **ADR-23/24/25/27 (git, 99 dias)**, **ADR-21 (Notion, 119 dias)**. Viraram GV-07, GV-08 e GV-09.

---

## 6. Reconciliação das 39 linhas de junho — PROPOSTA, **nada foi aplicado** (CA3)

Estado do DB em 29/09: **39 linhas** — 23 de `Origem = Planejamento Estrategico / Pendencia ESTADO` e 16 de `Plano Operacional`; **nenhuma** das frentes de agosto/setembro. Para cada linha, o que eu faria (com a evidência):

**Resumo proposto:** fechar **1** · atualizar/reabrir **7** · cancelar **2** · manter **16** (já concluídas ou ainda válidas) · **não confirmei 13** (deixar como estão) = **39**. Criar: ver a nota abaixo da tabela.

| # | Linha antiga | Ação proposta | Motivo / evidência |
|---|---|---|---|
| 1 | Refatorar agregador T28 (…) + escrever em phi_dev | **CANCELAR** | premissa `phi_dev` como sandbox caiu (M9: um ambiente só, `phi_prod`; ADR-39 apagou `phi_dev.client_config`) |
| 2 | Resolver credenciais ausentes no agregador T28 | **manter (já Concluída)** | — |
| 3 | Mover Clarity para fora do Loop + onError… | **REABRIR/ATUALIZAR** | está Concluída, mas o brief de 29/09 §0.2, lendo o workflow ativo, diz que `HTTP Request Clarity` pende direto do `Loop`, sem filtro. Absorvida pelo AG-01 |
| 4 | Catalogar agregador T28 + âncora HANDOFF | **manter (já Concluída)** | — |
| 5 | Coordenar A.7b com DDL T28 | **não confirmei** | o ESTADO §3 (tabela de 18/06) ainda lista A.7b como Backlog; não sei o estado real |
| 6 | DDL das 6 tabelas T28 em phi_dev → phi_prod | **FECHAR** | as tabelas `t28_*` existem em `phi_prod` com linhas (F3 relatório 26/09: `t28_campaign` 634 linhas; DICIONARIO 25/09). A parte `phi_dev` caiu com o M9 |
| 7 | SOP volume_suficiente | **manter (já Concluída)** | — |
| 8 | ADR destino canônico do contract T28 | **manter (já Concluída)** | — |
| 9 | Decidir schedule do WF-Deduplicar | **manter (já Concluída)** | — |
| 10 | Smoke a05-relations + activate 3 WFs Execução | **não confirmei** | a frente Execução de Demandas não aparece no painel de 27/09 |
| 11 | Sanar 4 débitos do WF-Deduplicar | **não confirmei** | provável obsolescência com o ADR-36 (HubSpot sai); não confirmei |
| 12 | Localizar 2 âncoras [HANDOFF] | **manter (já Concluída)** | — |
| 13 | Definir owner da área Comercial (WF-Deduplicar) | **não confirmei** | hoje o Comercial é o parque PROSP-01..08; não sei se o WF-Deduplicar ainda existe |
| 14 | A.7b DDL nas 2 base tables + A.6 | **não confirmei** | idem A.7b acima |
| 15 | Ajustar timezone do cron L1 Priorização | **manter (já Concluída)** | — |
| 16 | Definir caminho de acesso ao protótipo do dashboard | **CANCELAR** | o Webview está no ar na VPS, com repositório próprio `phi-dashboard-webview` (ESTADO §0, 27/09) |
| 17 | Decidir se callout→HTTP vira ADR | **não confirmei** | a observação já diz "manter como aprendizado"; a decisão final não está clara |
| 18 | Smoke a05-padronizador + activate | **não confirmei** | idem Execução de Demandas |
| 19 | Localizar/criar Aprendizados #17 e #18 | **não confirmei** | — |
| 20 | Rascunhar ADR-011 (Curador) | **não confirmei** | — |
| 21 | Re-smoke A2.3 caminho Aprovado | **não confirmei** | bloqueada por cota Gemini em junho; não sei se destravou |
| 22 | Configurar credencial Gemini Pro no WF-EXEC-Orquestrador | **manter (já Concluída)** | — |
| 23 | Rotação de credenciais expostas no histórico do git (Alta) | **não confirmei** | 🔴 é segurança e está "A fazer" desde junho; **não cancelar sem confirmar** se foi rotacionada |
| 24 | Pesquisa de Satisfação/Feedback | **manter** | A2.11 em produção desde 29/05; falta finalização/renovação |
| 25 | Otimização de Campanhas | **ATUALIZAR** | registrar que o T28 está parado por decisão desde 27/09 (T28-01) |
| 26 | Follow-ups automáticos de leads | **ATUALIZAR** | é o critério P5 da Prospecção (PR-07), não uma ideia solta |
| 27 | Planejamento de Campanhas | **manter** | backlog de Operação |
| 28 | Identificação de Leads | **ATUALIZAR** | parque PROSP-01..03 ativo (ESTADO §0 27/09; ADR-35 §3.6, 08/09) |
| 29 | Criação de Sites/Landing Pages | **manter** | fora do v1 (DEFINIÇÃO DE PRONTO §4) |
| 30 | Agendamento de Reuniões | **manter** | backlog de Operação |
| 31 | Entrega de Acessos e Senhas | **manter** | backlog de Operação |
| 32 | Relatório de Resultados Abrangente | **ATUALIZAR** | é o F8 (semanal, segunda, WhatsApp; PLANO-ENTREGA-FINAL §1, 27/09) — IN-09 |
| 33 | Qualificação de Leads (SDR Typebot) | **não confirmei** | o parque PROSP-03 pontua `potencial_comercial`, mas não vi SDR por Typebot |
| 34 | Geração de Relatórios (coleta + formatação + insights) | **ATUALIZAR** | absorvida pelo F8 (IN-09); a coleta é o Agregador |
| 35 | Criação de Criativos e Copy | **manter** | backlog de Operação |
| 36 | Abordagem Direta Outbound (cold email + LinkedIn) | **não confirmei** | não li o §10.5 do plano da Prospecção sobre o conflito de DM |
| 37 | Acompanhamento de Tarefas | **manter** | — |
| 38 | Análise de Performance e Resultados (resumo executivo) | **ATUALIZAR** | duplicata de intenção do F8 (IN-09) |
| 39 | Proposta de Renovação | **manter** | backlog de Operação (board: "Renovação") |

**Sobre "criar":** as 92 tarefas do §2–§3 são o alvo. As 7 linhas marcadas ATUALIZAR/REABRIR podem servir de veículo para algumas delas (F8, P5, Otimização, Identificação de Leads, Clarity), então as linhas **novas** ficariam entre **85** e **92**. É estimativa: depende de cada ATUALIZAR virar a mesma linha ou uma nova.

---

## 7. Os 12 critérios de aceite (§7 do brief)

| # | Critério | Resultado |
|---|---|---|
| **CA1** | Inventariou o Notion antes e registrou a busca | ✅ **Achou:** o DB alvo (39 linhas); o Registro de Execuções (`8d8eb685…`); a DB de ADRs (`237a5e12…`); e **um que o brief não lista: `PHI™ — Painel de Entregas` (`fad6713a…`)**, que li só no schema — é o ledger de entregas com aceite (fases 0.5–7, executor, revisor, bloqueios, ADRs relacionados). **Não resolve a lacuna do §1:** também não tem `Frente` nem `Quem destrava`. Não abri suas linhas nem escrevi nele. **Busquei** 3 termos no Notion ("Registro de Execuções", "Decisões (ADR)", "Plano de Projeto / roadmap / etapas", "estado em 2026") e **não achei** nenhuma página ou DB de plano do projeto. Não usei Demandas, Catálogo, Projetos/Tasks/Checklist (brief §1) |
| **CA2** | Nenhum DB/propriedade novo, ou parou e devolveu proposta | ✅ **Parei e devolvi a proposta** (§1). Nada criado |
| **CA3** | Linhas de junho reconciliadas, não duplicadas | 🟡 **Reconciliação feita no papel, não aplicada** (§6): fechar 1 · atualizar 7 · cancelar 2 · manter 16 · não confirmei 13. **Aplicadas: 0** |
| **CA4** | Toda linha tem frente · estado · quem destrava · origem com data | ✅ **nas tabelas deste relatório**; 🔴 **não no Notion** (não há colunas). Amostra de 5 linhas: AG-01, AG-06, SC-01, WV-01, OP-01 (§2 e §3) |
| **CA5** | Etapa em andamento é UMA e está no topo | ✅ E4 — identidade do Agregador (§0). Contei por script: **1** linha 🔵 |
| **CA6** | O que é do Olavo, separado e listado | ✅ §4: 20 ⬜ + 10 gatilhos |
| **CA7** | Nenhum número medido por mim | ✅ Nenhuma query, nenhum n8n/BigQuery. Todo número tem doc + data. "Não medido" está marcado (Odoo, adesão à R3, cifras de A4) |
| **CA8** | Miro do board vigente; Operação em seção própria | ✅ `uXjVHecmR7c=` lido; cópia não aberta; seção própria (§3) |
| **CA9** | ADRs com status e data; rascunho antigo = dívida | ✅ §5 |
| **CA10** | Primeira tela é placar | 🟡 **Descrita no §0; não publicada** (a página-espinha depende do §1). Só o placar e a etapa única estão prontos para colar |
| **CA11** | Linha no Registro, começo e fim | ✅ início criado em 29/09 (`3eab65e5…`); fim: atualizada com este relatório |
| **CA12** | O que não consegui confirmar e onde a semente errou | ✅ §8 e §9 |

---

## 8. Onde a semente do §6 estava errada (CA12)

| # | Item da semente | Veredito da doc |
|---|---|---|
| 1 | Volta 3 do Agregador | ✔ estado e dono. **Faltava:** a Clarity **não se recoleta** (a API só guarda 72h) e a porta dela **fecha**; só as **4** linhas do GA4 se recoletam; o `CA13` **reprovou** na `44493`. (brief volta-3 §0.1, §0.4) |
| 2 | 318 linhas com `client_id` nulo | ✔ existe, mas: a tabela é **`t28_campaign`** (não `raw_campaign_data`); **foi medida** em 25/09 e 26/09 — o que não existe é a etapa de tratamento; e **216 das 318 são do KIL, com custo real** — o rótulo "linha de teste" caiu (limpar-tudo, correção de 26/09) |
| 3 | ADR-37 Fase 2 | ✔ (2 SQLs — na verdade **2 de 3**; o 3º migrou em 28/09) |
| 4 | Dataset `phi_dev` | ✔ (só resta o `WF-T28-Orquestrador-Analises`, parado por decisão) |
| 5 | Motor multi-métrica | **Incompleto.** Além do gatilho, o **ADR do motor não existe** (ADR-40, 22/09; ESTADO 27/09) — é tarefa separada (SC-07). O painel ainda chama o tema de "bloqueio nº 1", embora o Olavo tenha destravado a execução em 27/09 |
| 6 | GBP | ✔ Google, 08–13/10. Faltava: gatilho de cobrança em 13/10, e que liberar a API não é a coleta |
| 7 | W4 do webview | **Errado no estado e no dono.** A implementação local já está **concluída** (relatório de 28/09, commit `c37d0b0`); o que falta é o **Olavo autorizar a publicação**. A "casca `webview/`" é **decisão do Olavo**, não execução. Faltavam: `.env` versionado, resíduo Lovable, 12 vulnerabilidades do `npm audit` |
| 8 | 3 campos na DB Clientes | **Errado.** `Tipo` (D-9 "sim", 27/09) e nível (ADR-42 §8.3) já estão **decididos** — falta só criar (execução). **Só** o `Fora do índice (motivo)` aguarda OK do Olavo (PLANO-F3, 27/09) |
| 9 | §1 e §2 do PLANO-ENTREGA-FINAL | **Errado pela metade.** O **§1 foi respondido em 27/09** (verbatim no doc). **Só o §2** está aberto. O cabeçalho do plano ainda diz "§1 e §2 em branco" — **defasado** (R2 regra 5) |
| 10 | Dono de D1–D10 | ✔ (fila D-5 e ADR-42 §8.4 #1; a fila diz "pilar", o ADR diz "dimensão") |
| 11 | F8 relatório semanal | ✔ construção nova. Depende do campo de nível e de decisão do Olavo sobre o que cada nível recebe (ADR-42 §8.4 #4) |
| 12 | Índice do Negócio | ✔ ADR-41 (25/09) e ADR-42 (27/09) aceitos. **O painel do ESTADO ainda diz "ADR-42 em rascunho"** e "gatilho do O4" a definir — ambos já decididos em 27/09 |
| 13 | T28 / ADR-28 | ✔ parado por decisão. **Faltava:** ligar exige OK de budget do Olavo (CLAUDE.md) e 2 defeitos a corrigir antes |
| 14 | Motor só CPA; `es/rs/os` placeholder | **Duas coisas misturadas.** Motor só-CPA tem gatilho (SC-08). `es/rs/os` é **decisão do Olavo** (calcular / peso 0 / remover) desde 02/07 — não é "execução" |
| 15 | Vigia estendido às `t28` | **Desatualizada: já foi feita.** O V4 do vigia (F3, 26/09) confere as `t28_*`. Não verifiquei no n8n (não posso medir), li o PLANO-F3 e o painel |
| 16 | Script da Clarity instalado? | ✔ (a doc não diz quem faz) |
| 17 | Aposentar a Clarity pela R5 | ✔ |
| 18 | `raw_ad_data` vazia | ✔ F4. A cifra "3 meses vazia" é do CLAUDE.md da frente, de ~20/09; **não remedida** |
| 19 | `ingestion_step` mente no `WHEN MATCHED` | **Impreciso.** Os writers **não** atualizam o campo no `WHEN MATCHED` (Fase 0.1, 08/09); ele mente "nos dois sentidos" e é **inerte no score**. **Não é inerte no Agregador** (`source_ingestion_step` persistido). Some com a **Fase C**, não com a Fase 2 (ADR-38 §26.4; CONTRATO-PHI M7) |
| 20 | Emenda V3 "aguardando construção" | **Errado.** Ela aguarda o **OK do Olavo** antes (PLANO-F3, 27/09) |
| 21 | CRM Odoo F3/F5 | ✔ "não medido". ⚠️ **Colisão de nomes:** F3/F5 **do Odoo** ≠ F3/F5 **do PLANO-ENTREGA-FINAL** (vigia; 30 dias sem intervenção) |

**Erros do próprio brief:** (a) o §2 item 6 manda ler o **"§7"** do `CONTRATO-DE-FONTES-v0.md` — **o arquivo só vai até o §6**; a lista de pré-requisitos é o **§4**. (b) o brief diz que o Plano de Entrega tem os §1 e §2 "em branco" — o **§1 foi respondido em 27/09**.

**Faltava na semente (a doc tem, a lista não):** a **Prospecção inteira** (A2, limpeza autorizada em 27/09, P1–P9, CK1–CK6) · **7 dos 14 critérios** da Definição de Pronto · os **5 pré-requisitos** do contrato de fontes §4 · **todos os ADRs em rascunho** · **publicar os ADRs no Notion** · **estender o ADR-33 aos writers** · **gate do Meta Ads** · **Contrato de Fontes ainda RASCUNHO** · **agente leitor do índice** · **cliente-zero** · **critério da auditoria de 90 dias** · **decisão do `es/rs/os`** · **cabeçalhos defasados** (R2).

## 9. O que não consegui confirmar, e o que precisaria

| Não confirmei | Para confirmar eu precisaria |
|---|---|
| Se o V4 do vigia **está de fato no ar** e cobre `t28_*` (AG-15) | ler o n8n (`versionId` = `activeVersionId`, R13) — fora do escopo do brief |
| Estado real do CRM Odoo (F3/F5, B1–B4) | acesso ao Odoo; o painel de 27/09 também diz "não medido" |
| Se `es/rs/os` já foi decidido depois de 02/07 (SC-09) | resposta do Olavo |
| O que é **P-20** (ADR-38 §27.4) e o que são **`BF`/`LO`** (painel de 27/09) | o autor dos documentos |
| Se as linhas antigas marcadas "não confirmei" (13) ainda valem — em especial **a rotação de credenciais expostas** (segurança, Alta) | conferência do Olavo; **não cancelar** sem isso |
| O conteúdo da **Fase 3 do ADR-37** e do **ADR-34 (Score v2)**, que não localizei como arquivo | achar o ADR-34 no git ou no Notion |
| Se cada 🟡 mudou depois do **último dia lido (29/09)** | reler o ESTADO no dia |
| Quem roda a prospecção real (PR-01) e quem verifica a Clarity (AG-08) — assumi/deixei escrito | resposta do Olavo |
| O que cada **imagem/comentário** do Miro diz (li só texto) | abrir o board no app |

**Duas observações de governança:** (1) o **branch**: o brief manda `claude/consolidacao-2026-08`; a instrução desta sessão manda desenvolver em `claude/plano-projeto-notion-v20z3g`. Usei a segunda para o commit e mantive a primeira como base — **decida se quer este arquivo também na `consolidacao`**. (2) o **painel do ESTADO** tem 3 linhas defasadas (Índice/ADR-42, gatilho do O4, cabeçalho do plano) — GV-03.

---

## 10. Como verificar este relatório

1. **Contagens** (placar, Olavo, reconciliação) saem de script sobre as próprias tabelas; a soma da reconciliação dá 39 (há `assert`).
2. **Dependências** citam só IDs que existem (validado por script).
3. **Cada linha** tem doc + data; conferir abrindo o doc citado na seção citada.
4. **Notion:** ler a linha `3eab65e5c72b81a9ae8bcdfa714d1275` no Registro de Execuções.
5. **Confiança (0–1):** estrutura do §0–§1 e ADRs **0,9**; estados/donos de cada linha **0,8** (leitura de doc, não de sistema); reconciliação das 39 linhas **0,7** (13 marcadas "não confirmei" de propósito); dependências do Miro **0,75** (só texto).
