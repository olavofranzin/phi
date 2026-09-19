# [BRUTO v0.1] Frentes paralelas — expansão de escopo (2026-07-05)

> **STATUS:** RASCUNHO para red-line do Olavo (git, ADR-012). Captura o dump de escopo
> do Olavo em 2026-07-05 (6 frentes) + análise/recomendações do Claude. Nada aqui está
> aprovado para build; é o mapa de priorização. Fontes vivas relacionadas: Camada de
> Conhecimento (`camada-conhecimento/BRUTO-v0.1-design.md`), score PHI·Mídia (branch do
> keystone), Guia de Agentes de IA (Notion `37db65e5…9f2c`).

## 0. Princípio organizador — DUAS camadas de métrica (resolve a pergunta de MÉTRICAS)

A pergunta "agente busca as métricas dinamicamente **ou** deixamos as básicas para o score e um agente complementa?" tem uma terceira resposta, que é a arquitetura correta e que já está latente no design (T28 + Camada 2):

- **Camada CANÔNICA (dirige o PHI·Mídia / score):** conjunto **pequeno, fixo, comparável entre campanhas e clientes**, agnóstico de objetivo. Precisa ser determinístico e sempre presente — senão o score deixa de ser comparável (não dá pra ranquear uma campanha pontuada em "compras" contra outra pontuada em "conversas por mensagem" se o conjunto de métricas flutua). Vive no **contract T28** (`t28_campaign`/`t28_meta_campaign`).
- **Camada CONTEXTUAL (dirige a análise/diagnóstico):** **rica, dependente do objetivo da campanha**. É aqui que entra o "agente que entende o contexto e busca métricas" — ele puxa o que **explica** o score e sustenta a recomendação (vídeo → retenção; mensagens → custo por conversa; e-commerce → funil de carrinho). É a Camada 2 (L3.0) + o framework §4.

**Recomendação (MÉTRICAS):** **as duas, em camadas** — não "uma OU outra". Canônicas mínimas para a saúde (poucas, estáveis); agente de análise puxa as contextuais por objetivo para complementar. Isso é exatamente o que o T28 (canônico) + Camada 2 (agentes leem + enriquecem) já preveem. O "agente que busca métricas" é da **camada de análise**, não da ingestão/score.

> **Sequenciamento crítico:** o score está em correção (v1.2 publicado 04/07; CPA/ROAS ainda
> a ramificar) e **Meta Ads não está ingerido** (pipeline com Meta desabilitado hoje). Então
> a classificação Meta abaixo é **design-ahead** para o contract `t28_meta_campaign` — vale
> desenhar agora, ativar quando ligarmos a ingestão Meta.

---

## 1. MÉTRICAS PARA ANÁLISE — parecer sobre as ~90 métricas Meta Ads

Classifiquei em 3 baldes. Critério: **canônica** = presente e comparável em qualquer objetivo, entra no contract/score; **contextual** = objetivo-dependente, o agente extrai conforme o objetivo; **derivada/descartar** = redundante, metadata, ou calculável.

### 🟢 Balde A — CANÔNICAS (contract `t28_meta_campaign` + candidatas ao score)
| Grupo | Métricas | Nota |
|---|---|---|
| Investimento | **Valor usado (BRL)** | base de tudo (spend) |
| Entrega | **Impressões, Alcance, Frequência, CPM, Custo por 1.000 Contas Meta alcançadas** | eficiência de leilão/entrega |
| Clique | **Cliques no link, Cliques no link únicos, CPC (link), CTR (link), CTR único (link)** | usar base **link + único** como canônica (ver Balde C) |
| Resultado (normalizado) | **Resultados, Custo por resultado, Índice de resultados, ROAS de resultados, Valor dos resultados** | ⭐ ver Insight 1 |
| Conversão-compra | **Compras, Custo por compra, Valor de conversão da compra** | objetivos de venda |
| Conversão-lead | **Leads, Custo por lead, Valor de conversão de leads** | objetivos de lead |
| Qualidade | **Classificação de qualidade, Classificação da taxa de engajamento, Classificação da taxa de conversão** | ⭐ ver Insight 2 |

### 🟡 Balde B — CONTEXTUAIS por objetivo (agente de análise extrai)
| Objetivo da campanha | Métricas que o agente puxa |
|---|---|
| **Mensagens/conversas** | Destino do resultado das mensagens, Conversas por mensagem iniciadas/respondidas, Custo por conversa, Novos contatos de mensagem, Contatos por mensagem (e que retornam), Custo por novo/por/retorno de contato, Visualizações da mensagem de boas-vindas |
| **Vídeo** | ThruPlays, Reproduções ≥3s, 25/50/75/95/100%, Tempo médio de reprodução, Reproduções de vídeo |
| **Engajamento/social** | Engajamento com a Página, Seguidores no Instagram, Visitas ao perfil IG, Comentários, Reações, Compartilhamentos, Engajamentos com o post, Cliques na foto |
| **E-commerce (topo de funil)** | Adições ao carrinho + Custo + Valor de conversão; Adições à lista de desejos + Custo + Valor |
| **Negócio local / app** | Cliques na loja, Cliques em Como chegar, Cliques no número de telefone, Cliques no anúncio no app |
| **Tráfego externo (site)** | Cliques de saída, Cliques de saída únicos, CTR de saída, CTR de saída único |
| **Contatos genéricos** | Contatos, Custo por contato |

### ⚪ Balde C — DERIVADAS / metadata / redundantes (não persistir cru)
- **Variantes "(todos)"** quando já temos "(link)": `Cliques (todos)`, `CTR (todos)`, `CPC (todos)`, `Cliques únicos (todos)`, `CTR único (todos)` — "todos" inclui cliques não-link (curtidas, expandir), mais ruidoso; padronizar em **link + único** e derivar o resto se precisar.
- **Metadata, não métrica:** `Tipo de resultado`, `Tipo de valor de resultado` (aparece 2× na sua lista), `Destino do resultado das mensagens` (é dimensão), `Visualizadores` (ambíguo).
- **Taxas calculáveis** (CTR, custo-por-X) não precisam ser persistidas se guardamos numerador+denominador — mas manter as principais materializadas ajuda o agente.

### Dois insights que valem decisão
- **⭐ Insight 1 — "Resultados/Custo por resultado/ROAS de resultados" resolve o CPA×ROAS.** A Meta **já normaliza** "Resultado" para o evento de otimização da campanha. Adotar essa tripla como **saída canônica objetivo-agnóstica** deixa **uma fórmula de score funcionar em qualquer objetivo** sem ramificar por tipo (o problema exato do PHI·Mídia hoje). **Ressalva:** só vale se o evento de otimização configurado = a meta de negócio real (nem sempre é). Recomendo: canônico = `Resultado`, mas **guardar também `Compras`/`Leads` crus** para validar que a otimização aponta pro lugar certo.
- **⭐ Insight 2 — as 3 Classificações (qualidade/engajamento/conversão) são candidatas a preencher ES/RS/OS.** São os sinais **relativos à concorrência** da própria Meta — exatamente o tipo de coisa que os componentes stub `es/rs/os` do score deveriam capturar. Para campanhas Meta, dá pra sair do placeholder 50 usando essas classificações (mapeando Acima/Na/Abaixo da média → escala 0–100). Conecta direto com a decisão de modelo do score (candidato a ADR-008).

> **Ação proposta:** quando desenharmos `t28_meta_campaign`, Balde A vira coluna; Balde B vira
> JSON aninhado `contextual_metrics` OU busca sob demanda do agente; Balde C descartado. E levar
> os Insights 1–2 para o sub-chat do score (decisão de modelo).

---

## 2. MÉTRICAS de site (a outra parte de MÉTRICAS)
Sessões, tempo de sessão, páginas/sessão, contatos, produtos vistos, add-to-cart, vendas → **já previstas no contract T28** (`t28_ga4_landing`, `t28_clarity_daily`). Mesma lógica de camadas: engajamento/CVR de site entram como **canônicas de site** (com a arbitragem CVR-site≠CVR-plataforma já registrada em `benchmarks-canonicos.yaml`); o resto é contextual. **Nada novo a criar** — é ligar GA4 orgânico/Clarity (credenciais já pendentes no backlog do Agregador).

---

## 3. PROSPECÇÃO → área Comercial + enriquecimento HubSpot (frente PESADA)
A maior parte daqui é uma frente nova e substancial (não "acréscimo"). Mapa:

| Item | Onde encaixa | Esforço | Depende de |
|---|---|---|---|
| **Descoberta + scoring de leads (GBP) — motor de 5 módulos + IPC** | Comercial/Prospecção (novo motor) | **M–L** | Apify modo busca → `02_normalizer`→`03_scoring`→`04_benchmark` (regras, sem IA) → Lead Opportunity Score + **IPC** (potencial comercial) + Índice de Visibilidade multi-busca. Design completo: `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`. Testado 2026-07-10. |
| Análise básica GBP (descrição, produtos, Q&A, avaliações + respostas) — **C2** | Comercial/Prospecção; fonte = **Apify dois níveis** (não a Performance API) | **M** | Apify (LEVE Auditor → COMPLETO scraper cru, modo place_id); agente N2 Gemini Flash. Ver `docs/handoff/2026-07-05-comercial-c2-enriquecimento-gbp-brief.md` |
| Análise de perfil Instagram (frequência, tipo de post topo/meio/fundo, produto vs conteúdo útil) | Comercial/Prospecção | **M** | acesso IG/scraping; taxonomia de conteúdo |
| Análise básica de site | reuso do estrato de análise de site (§2) | **S–M** | GA4/scraping |
| HubSpot: campo follow-up (input p/ NBA) | HubSpot (custom property) | **S** | HubSpot MCP (✅ conectado) |
| HubSpot: campo de dados enriquecidos (visualização melhor) | HubSpot | **S** | idem |
| HubSpot: campo NBA sugerida + aceite/recusa do Olavo | HubSpot + agente NBA (Tema 26) | **M** | enriquecimento + agente N3 |
| HubSpot: IA insere produtos/serviços ofertáveis na Oportunidade | HubSpot | **M** | catálogo de produtos + enriquecimento |
| HubSpot: campo de abordagem sugerida (enriquecimento + follow-up + transcrições) | HubSpot + campo de transcrição de reunião | **M–L** | transcrições (novo campo); agente |
| Abordagem atualiza a cada etapa do CRM (exceto Vencido/Perdido) | HubSpot workflow + agente por estágio | **M** | mapa de estágios; trigger |
| Relatório comercial mensal (leads, vias de aquisição, tempo de interação, motivos de perda, análise de vendas) por e-mail/Telegram | agente N3 + n8n schedule | **M** | dados HubSpot consolidados |

**Leitura:** isto é o **cérebro comercial agentizado** que o Google Doc "Arquitetura Cognitiva Comercial" (G4) já concebe — e G4 está catalogado como fonte de domínio `comercial-agencia`. HubSpot MCP está conectado, então o enriquecimento é tecnicamente alcançável já. **Recomendo tratar como uma frente própria (Comercial L2)** com sub-chat dedicado, não itens soltos.

## 4. CRIAÇÃO DE CONTEÚDO (frente nova, MÉDIA)
| Item | Esforço | Nota |
|---|---|---|
| Conteúdo por etapa de funil × produto/serviço | **M** | precisa do catálogo de produtos/serviços (falta) |
| Pasta Drive p/ conteúdos de terceiros (fonte) | **S** | vira fonte na Camada de Conhecimento (DB Fontes) |
| Pasta Drive p/ exemplos de anúncios (swipe file) | **S** | idem |
| Agente que analisa os repositórios e indica anúncios a salvar | **M** | reuso do decodificador de criativo (Tema 16); depende do swipe file existir |

**Encaixe limpo:** as pastas do Drive entram como **novas fontes** no DB `PHI - Fontes de Conhecimento` que acabamos de criar — o watcher K5 já as cobre. O agente de curadoria de criativos é uma extensão do Curador de Conhecimento (K6).

## 5. OTIMIZAÇÃO
| Item | Esforço | Depende de |
|---|---|---|
| Criar os agentes primários já desenhados p/ as campanhas rodando | **L** | ⚠️ **score confiável** (v1.2 em validação) + Camada de Conhecimento (✅ pronta) + framework §4 (prompts do Módulo 28, hoje vazios) |
| Agente que pesquisa concorrentes e seus anúncios (Meta Ad Library etc.) | **M** | acesso Ad Library; encaixa no swipe file (§4) |

**Ponto duro:** "criar os agentes primários" é **a** entrega que amarra tudo — depende do score valer (senão os agentes analisam ruído) e dos 7 prompts do Módulo 28 (framework §4). É o destino natural depois que a Trilha A (score) estabilizar. O agente de concorrentes é mais autônomo e pode andar antes.

## 6. INFRA — ferramenta de gerenciamento de agentes (Hermes/Openclaw)
**Não vou cravar Hermes vs Openclaw sem verificar** — são ferramentas de nicho/emergentes e eu não tenho base sólida o suficiente pra recomendar uma sem pesquisar (evitar recomendar por nome sem fundamento). O que posso enquadrar já:

- **Hoje o "runtime de agentes" do PHI é o n8n** (orquestração + schedule + fan-out) + Claude/Gemini via API + Notion (memória) + git (design). Isso **já funciona** para os agentes atuais.
- A pergunta real é se falta uma camada de **observabilidade/gestão de agentes** (tracing de execuções, versionamento de prompts, avaliação de qualidade de saída, custo por agente, catálogo vivo). Critérios que a ferramenta teria que atender no nosso caso: (a) integrar com n8n/API, não substituí-lo; (b) versionar prompts (hoje em git, prefixo `PROMPT-`); (c) rastrear custo por tier (ADR Tiering); (d) registrar avaliações/aprendizados (fecha com o Log e Aprendizados); (e) multi-tenant lógico (ADR base).
- **Recomendo:** eu faço uma **pesquisa comparativa dedicada** (Hermes, Openclaw + alternativas maduras: LangSmith, Langfuse, Agenta, etc.) contra esses 5 critérios, e volto com um parecer. É uma decisão de infra que merece evidência, não palpite.

---

## 7. Sequenciamento — o que pode andar em PARALELO já × o que está bloqueado

**Pode começar já (não depende do score):**
- Classificação Meta → especificar `t28_meta_campaign` (design-ahead) + levar Insights 1–2 ao sub-chat do score.
- HubSpot: criar os campos custom (follow-up, dados enriquecidos, NBA+aceite, transcrição) — **estrutura**, sem o agente ainda (HubSpot MCP conectado).
- Drive: criar as 2 pastas (conteúdo terceiros + swipe file de anúncios) e registrá-las como Fontes de Conhecimento.
- Infra: pesquisa comparativa de ferramenta de gestão de agentes.
- Catálogo de produtos/serviços do Olavo (falta e é pré-requisito de Conteúdo e de "produtos ofertáveis" no HubSpot).

**Bloqueado até o score/Camada 2 estabilizar:**
- Agentes primários de otimização (dependem do score válido + prompts do Módulo 28).
- NBA/abordagem por estágio que consome o score/enriquecimento.
- Análises GBP/IG/site "de verdade" (dependem de credenciais + do estrato de análise).

**Dependências no que JÁ construímos (bom aproveitamento):**
- Camada de Conhecimento (K0–K3 ✅) alimenta os agentes de análise e de conteúdo.
- `benchmarks-canonicos.yaml` (arbitragem CVR site×plataforma) já cobre as métricas de site.
- DB Fontes de Conhecimento já recebe as pastas do Drive.
- G4 (Arquitetura Cognitiva Comercial) já é a base do cérebro comercial.

## 8. Decisões para o Olavo (red-line)
1. **Confirmar o princípio de 2 camadas de métrica** (canônica p/ score + contextual p/ agente) — organiza tudo.
2. **Balde A/B/C das métricas Meta** — aceita a classificação? Os Insights 1 (Resultado normalizado) e 2 (classificações → ES/RS) sobem pro sub-chat do score?
3. **Comercial/HubSpot vira frente própria** (sub-chat dedicado) — de acordo? É a maior das 6.
4. **O que priorizar entre os "pode começar já"** (§7) — sugiro: (a) campos HubSpot + pastas Drive (baratos, destravam), (b) pesquisa de infra, (c) spec `t28_meta_campaign`.
5. **Catálogo de produtos/serviços** — você me passa a lista? É pré-requisito de 2 frentes.
6. **Pesquisa de infra de agentes** — quer que eu rode já?
