# Guia de Formatação do CRM (HubSpot) — Ciclo de Vida do Lead, Governança e Sincronia com a IA

> **O que é:** o guia canônico de **como formatar/configurar o nosso CRM** (HubSpot, portal
> `5633277`). Traduz a estratégia dos documentos de pesquisa para a **configuração concreta** do
> HubSpot que já usamos no PHI Comercial (deals + diagnóstico GBP + agentes de IA).
>
> **Fontes:** `prospecção/Plano de Alinhamento_ Governança Comercial...md` e
> `prospecção/Roteiro Estratégico_ Sincronia entre IA e CRM...md` (ambos sobre o *Panorama Agendor
> 2025* + framework *Rework*), as 3 pesquisas em `prospecção/`, e o nosso plano:
> `card-gbp-record-spec.md` + briefs Comercial/HubSpot + motor de scoring GBP/IPC.
>
> **Escopo:** este é o **desenho/spec**. Aplicar em produção é **config na UI pelo Olavo** (tier
> **Free** — respeitar os limites). Guardrail-mãe do PHI: a IA **diagnostica e recomenda**; o
> **humano dá o play**. A IA nunca move deal nem escreve em `closedwon`/`closedlost`.

---

## 1. Princípios não-negociáveis (a régua)

1. **Fonte única da verdade.** Fim das planilhas paralelas. "Se um dado não está no CRM, ele não
   existe" — nem para o time, nem para a IA. (Panorama: 80,8% ainda dependem de planilhas → é o
   gargalo-raiz.)
2. **Linguagem comum = 7 estágios** com **critérios técnicos de entrada e saída** por estágio.
   Definição vaga de "lead" é a origem do desalinhamento Marketing↔Vendas.
3. **Velocidade > volume.** Volume de leads é métrica de vaidade; o que importa é a **velocidade
   do pipeline** e onde a receita está parada. SLAs de tempo são mandatórios.
4. **A IA faz o burocrático; o humano decide e se relaciona.** Auto-fill, enriquecimento, scoring
   e cadência inicial são da IA; qualificação final, negociação e relacionamento são humanos.
5. **Processo previsível = bem-estar.** Governança não é só receita: reduz a pressão tóxica e o
   burnout (52,2% já tiveram saúde mental afetada). Métrica é consequência do processo.
6. **Um destino, um dono.** Cada campo tem **um** responsável por escrever (IA, humano ou sistema)
   — nunca dois workflows disputando o mesmo campo.

---

## 2. Objetos do CRM e seus papéis

| Objeto | Papel | Quem/o quê governa |
|---|---|---|
| **Contato** | pessoa (decisor/influenciador) | Lifecycle Stage + dados de contato |
| **Empresa** | a conta (o negócio local prospectado) | ICP/fit, setor, dados de enriquecimento |
| **Negócio (Deal)** | a **oportunidade** — espinha operacional do PHI | pipeline, diagnóstico GBP, oferta, NBA |
| **Produto** | catálogo de serviços (`SVC-GBP`, `SVC-SITE`, `SVC-ADS`, `SVC-IA`) | vira *line item* na proposta |

> No PHI, o **Deal é o centro**: é nele que vivem o score GBP, a oferta recomendada e a NBA. Contato
> e Empresa dão o *fit* (ICP) e o enriquecimento.

---

## 3. Os 7 estágios do ciclo de vida → mapeados ao HubSpot

O modelo canônico (Rework) tem 7 estágios. Como a nossa operação é **outbound/prospecção liderada
pelo PHI** (a gente pontua perfis GBP e recomenda oferta), adaptamos assim — mantendo a governança:

| # | Estágio canônico | No HubSpot (Lifecycle + Deal stage) | Dono | Entrada | Saída (critério técnico) | Intervenção da IA (PHI) |
|---|---|---|---|---|---|---|
| 1 | Visitante Anônimo | (n/a no outbound) — origem é a lista de prospecção | Prospecção | perfil identificado na fonte (Maps/GBP) | vira registro no CRM | coleta/identificação |
| 2 | **Known Lead** (fit) | Lifecycle `Lead` · Deal **Prospectado** | Prospecção | Empresa criada com fit de ICP | **score GBP calculado** | enriquecimento (site/IG/dados públicos) |
| 3 | **MQL** (intenção/potencial) | Lifecycle `MQL` · Deal **Diagnosticado** | Marketing/PHI | `potencial_comercial` + `oferta_recomendada` preenchidos | **aceite humano** da abordagem | scoring preditivo (potencial/IPC), NBA recomendada |
| 4 | **SAL** (aceito) | Lead Status `Aceito` · Deal **Aprovado p/ Abordagem** | SDR | `proxima_acao_aceite = aceita` | **1º contato efetivo** (SLA ≤5 min) | resposta/cadência inicial, abordagem sugerida |
| 5 | **SQL** (qualificado) | Lifecycle `SQL` · Deal **Em Qualificação** | Vendas | contato feito + BANT/MEDDIC | oportunidade formal criada | transcrição + validação de BANT/MEDDIC |
| 6 | **Oportunidade** | Lifecycle `Opportunity` · Deal **Proposta** | Vendas | proposta enviada + *line items* (SVC-*) | **Ganho** ou **Perda/Reciclagem** | insights de discovery, tendências do setor |
| 7 | **Cliente** | Lifecycle `Customer` · Deal `closedwon` | Vendas/CS | contrato assinado + pagamento | início do onboarding | análise de sentimento, saúde da conta (churn/expansão) |

> **O abismo MQL→SAL (só ~13% convertem):** a regra de ouro — **só promove a MQL quem tem perfil
> (fit) E sinal de potencial** (no nosso caso, `potencial_comercial` acima do corte). Sem isso, o
> time queima energia em "turista" e o CAC dispara. O `potencial_comercial`/`ipc` do PHI é
> justamente esse filtro objetivo.

---

## 4. Pipeline de Negócios — os deal stages a configurar

**Estado atual (recon 2026-08-17):** 1 pipeline `default`, entrada **Prospectado**
(`70807682-148b-4914-acd0-97aad8c2a000`), fechados `closedwon`/`closedlost`.

**Proposta de estágios** (nomear na UI; mapeiam a §3):

1. **Prospectado** (entrada) — Known Lead: empresa + score GBP.
2. **Diagnosticado** — MQL: PHI preencheu potencial/oferta/NBA. *Aguarda o play humano.*
3. **Aprovado p/ Abordagem** — SAL: humano aceitou (`proxima_acao_aceite = aceita`). **Dispara SLA ≤5 min.**
4. **Em Qualificação** — SQL: contato feito, BANT/MEDDIC.
5. **Proposta** — Oportunidade: proposta + *line items* SVC-*.
6. **`closedwon`** — Cliente (→ onboarding).
7. **`closedlost`** — Perdido/Reciclagem (**motivo obrigatório**).

> Regra: a IA **nunca** move o deal entre estágios — ela **preenche os campos** que habilitam o
> humano a mover. Mover é ato humano (dá o "play").

---

## 5. Dicionário de propriedades (campo → tipo → dono → estágio)

**Dono** = quem **escreve** o campo: **IA** (PHI/agentes), **HUM** (pessoa), **SIS** (HubSpot/automação).

### 5.1. Governança do ciclo (padrão RevOps — a criar/ativar)
| Campo | Tipo | Dono | Estágio | Uso |
|---|---|---|---|---|
| Lifecycle Stage | enum padrão | SIS/HUM | todos | marcador cross-objeto |
| Lead Status | enum (`Novo\|Aceito\|Em cadência\|Reciclado`) | HUM | 3–4 | nuance do SAL/cadência |
| Origem (source) | enum | SIS | 2 | atribuição |
| Data de virada de estágio | datetime | SIS | todos | **Cycle Time / Stall** (HubSpot registra nativo) |
| `motivo_rejeicao_mql` | enum/text | HUM | 3→2 | fecha o buraco MQL→SAL (feedback obrigatório) |
| `motivo_perda` | enum | HUM | 7-lost | obrigatório no `closedlost` |
| `data_primeiro_contato` | datetime | SIS/IA | 4 | mede **Speed to Lead** |
| `tentativas_contato` | number | IA/SIS | 4–5 | cadência ≥8 antes de reciclar |
| `proxima_acao_data` | date | IA/HUM | 3–6 | evita "limbo"/stall |
| Proprietário (owner) | user | SIS/HUM | 4+ | responsabilidade clara |

### 5.2. Diagnóstico GBP / scoring (o "MQL preditivo" do PHI — **já existem**, 21 props)
`potencial_comercial` (num 0–100, **IA**) · `oferta_recomendada` (enum SVC-GBP/SITE/ADS, **IA**) ·
`ipc` · `score_tecnico` · `dim_saude` · `dim_seo` · `dim_autoridade` · `dim_conversao` ·
`dim_engajamento` · `dim_conteudo` (num 0–100, **IA**) · `nao_reivindicado` (bool, **IA**) ·
`site_tipo` (enum, **IA**) · `flags_score` (string, **IA**) · `proxima_acao_aceite`
(enum `pendente\|aceita\|rejeitada`, **HUM** — é o "play").

### 5.3. Enriquecimento & diagnóstico por IA (textões — aba "IA/Diagnóstico")
`analise_gbp_ia` · `analise_site_ia` · `analise_instagram_ia` · `abordagem_sugerida_ia` ·
`proxima_acao_recomendada` · `dados_enriquecimento` (JSON) — todos **IA** · `followup` (**HUM**).

> Detalhe de apresentação (do `card-gbp-record-spec.md`): **card = só número/enum/bool**; **texto
> longo só na aba**. Bandas das dimensões: forte ≥70 / médio 40–69 / fraco <40 (valor sempre visível).

---

## 6. Governança: critérios de saída + SLAs

**Critérios de saída = campos obrigatórios para avançar** (o CRM deve exigir):
- **Prospectado → Diagnosticado:** score GBP calculado (`potencial_comercial` ≠ vazio).
- **Diagnosticado → Aprovado:** `proxima_acao_aceite = aceita` (ou `rejeitada` + `motivo_rejeicao_mql`).
- **Aprovado → Em Qualificação:** `data_primeiro_contato` registrada.
- **Em Qualificação → Proposta:** BANT/MEDDIC preenchido.
- **Proposta → Ganho/Perda:** `closedlost` exige `motivo_perda`.

**SLAs mandatórios (os do mercado, adotados):**
1. **Speed to Lead ≤ 5 min** para levantada de mão (converte 8× mais; média BR = 47 h).
2. **Aceite/rejeição de MQL ≤ 24 h** — lead parado em SAL é receita evaporando.
3. **Cadência ≥ 8 tentativas** multi-canal (telefone/e-mail/WhatsApp/LinkedIn) antes de reciclar
   (44% desistem após 1 tentativa; 80% das vendas exigem 5–12 contatos).

**Buracos negros a vigiar** (com o campo que os fecha):
- MQL→SAL: `motivo_rejeicao_mql` obrigatório (feedback pro Marketing).
- SAL→SQL: `tentativas_contato` + `proxima_acao_data` (mata a desistência precoce).
- SQL→Oportunidade: exigir o deal no estágio Proposta (fim do pipeline "escondido").

---

## 7. Sincronia IA ↔ CRM (quem faz o quê)

A IA é **camada de inteligência ativa**, não automação periférica. Divisão por estágio:

| Estágio | A IA faz (automático) | O humano decide |
|---|---|---|
| Known Lead | enriquece (site/IG/dados públicos → `dados_enriquecimento`) | — |
| MQL | calcula score GBP + `potencial_comercial`/`oferta_recomendada` + `proxima_acao_recomendada` (NBA) | **aceita/rejeita** a abordagem (`proxima_acao_aceite`) |
| SAL | dispara resposta/cadência inicial, entrega `abordagem_sugerida_ia` | conduz o 1º contato humano |
| SQL | **auto-fill**: transcreve reunião/e-mail e preenche o CRM; valida BANT/MEDDIC | qualifica de fato |
| Oportunidade | insights de discovery + tendências do setor | negocia e envia proposta |
| Cliente | análise de sentimento/saúde da conta (churn/expansão) | relacionamento/CS |

**Regras da sincronia:**
- **Auto-fill resolve a dor nº1** (registro no CRM cansa 52,86% dos vendedores) — a IA captura, a
  pessoa confere.
- **Um dono por campo** (§1.6): os campos GBP/IA são escritos **só** pelo pipeline do PHI; os
  campos de qualificação/negociação, **só** pelo humano. Nada de dois workflows no mesmo campo.
- **Guardrail PHI:** a IA **exibe e recomenda** (card/aba); **move e fecha é humano** — nunca em
  `closedwon`/`closedlost`.

---

## 8. Métricas & dashboard de governança

O termômetro é a **velocidade**, não o volume. Três KPIs (todos deriváveis dos timestamps de
mudança de estágio que o HubSpot registra nativamente):

- **Cycle Time por estágio** — dias médios em cada fase. Alto em "Em Qualificação" = execução de
  vendas; alto em "Diagnosticado" = nutrição/aceite travado.
- **Pipeline Velocity** — `(nº oportunidades × taxa de conversão × ticket médio) ÷ ciclo em dias`.
  Termômetro financeiro real.
- **Stall Rate** — % de deals parados > 30–90 dias. Leads parados = estresse + falsa esperança.

> Para o dashboard funcionar, os **critérios de saída (§6) precisam ser cumpridos** — sem
> `motivo_rejeicao`/`motivo_perda` e sem datas de estágio, não há como medir onde a receita para.

---

## 9. Convenções & higiene

- **Nomes internos** em `snake_case`, prefixo por domínio quando útil (`gbp_`, `ia_`).
- **Enums fechados** (evitar texto livre em campo de status) — comparabilidade e automação.
- **Dedup** por chave estável (Empresa: domínio/Place ID; Contato: e-mail/telefone).
- **N/D honesto** (herdado do PHI): dado ausente/indefinido é **N/D**, nunca 0 forjado.
- **Deals fechados são imutáveis** para a IA.

---

## 10. Roadmap de implementação (ciente do tier Free)

1. **Agora (nativo, Free):** renomear os deal stages (§4); criar/ativar os campos de governança
   (§5.1) e os critérios de saída obrigatórios (§6); montar a aba "IA/Diagnóstico" e os "Destaques"
   (Camada A do `card-gbp-record-spec.md`); ligar os 3 SLAs como regra operacional.
2. **Contínuo:** garantir o **auto-fill** e o **um-dono-por-campo** (depende da consolidação da
   escrita — ver o sub-chat de simplificação de dados).
3. **No upgrade (Starter+):** App Card rico (Camada B) + automações de cadência/roteamento.

---

## 11. Âncoras

- **Estratégia:** `prospecção/Plano de Alinhamento_ Governança Comercial e Gestão do Ciclo de Vida do Lead.md` ·
  `prospecção/Roteiro Estratégico_ Sincronia entre IA e CRM...md` · 3 pesquisas em `prospecção/`.
- **Nosso plano:** `card-gbp-record-spec.md` · `docs/handoff/2026-07-05-comercial-hubspot-subchat-brief.md` ·
  `docs/handoff/2026-08-18-hubspot-cards-finalizacao-subchat-brief.md` ·
  `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`.
- **CRM:** HubSpot portal `5633277` (STANDARD, BRL, `America/Sao_Paulo`, **Free**); pipeline `default`;
  21 propriedades GBP + campos IA **já existem**; produtos `SVC-*` no catálogo.
- **Guardrails PHI:** IA diagnostica/recomenda, humano dá o play; N/D honesto; deals fechados intocáveis.
