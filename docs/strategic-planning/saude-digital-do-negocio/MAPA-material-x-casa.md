# MAPA — o que o material cobre × o que a casa já tem

> # 🔴 CORREÇÃO — 2026-09-25, depois de ler o ADR-21, o ADR-22 e o ADR-29
>
> **A premissa do §0 e da §3 deste documento caiu.** Eu escrevi que *"o material novo descobriu que o
> mapa era maior que a parte desenhada"*. **Não descobriu.**
>
> | O que este mapa afirma | O que é |
> |---|---|
> | o material novo traz 8 pilares contra um PHI que mede uma fatia de um | 🔴 **o ADR-21 já promoveu o PHI a Índice de Saúde Digital com 6 pilares** (Paga 35 · Funil 20 · Orgânico 15 · Social 10 · Reputação 10 · Dados 10), **Aceito por Olavo em 11/06/2026** — e nunca construído. O material novo é a **segunda** tentativa da mesma descoberta, não a primeira |
> | o F7 (*"o PHI sabe se a orientação funcionou"*) não existe | 🟡 **o ADR-22 o decidiu em 11/06/2026.** A metade de **escrita existe** (`PHI - Pipeline_v2`, nó `Criar Log Otimizacoes`). Falta a metade de **verificação** |
> | `t28_search_terms` foi desenhado e não está no DDL — *"não verifiquei"* | ✅ **resolvido: o ADR-29 D5 o removeu de propósito** (termos de busca são sensíveis). Não foi esquecimento, foi decisão |
> | a P6 (colisão do nome "Saúde Digital") | ✅ **já estava decidida pelo ADR-21**: "Saúde Digital" para o todo, **PHI·Mídia** para a parte paga |
>
> **O que deste mapa continua valendo:** o inventário (§1, §2), o achado das tabelas que coletam sem
> leitor (§4), a queda da **H1** e da **H2** (§3) — a H1 ganhou fundamento estatístico no `G5` do
> dicionário — e as correções ao README (§6).
>
> **O que o substitui:** **`DICIONARIO-DE-INDICADORES-v0.md`** é o documento **canônico** desta frente
> (decisão do Olavo, 25/09). Este mapa passa a ser **insumo**, com esta correção no cabeçalho.
>
> ⚠️ **E o eixo "v1 / depois / nunca" usado em todo este documento perdeu a base:** ele media contra
> **30/11**, e o Olavo destravou essa data em 25/09. O dicionário o substitui pelo **tier 🅐 núcleo /
> 🅑 extensão**, que pergunta *"o índice fecha sem ele?"* em vez de *"cabe até 30/11?"*.


| | |
|---|---|
| **Data** | 2026-09-25 |
| **Papel** | **primeira e única entrega desta rodada.** Mapa e comparação — **não é ADR, não é spec, não é score novo** |
| **Status** | 🟡 **estudo.** Nada aqui é decisão até o Olavo aprovar |
| **Regra que mais pesou** | a **nº 4** do brief: o escopo explode se eu deixar. Cada linha deste mapa responde **v1 / depois / nunca** |
| **O que eu NÃO fiz** | não alterei workflow, tabela, coluna, nem documento de fora desta pasta. Não desenhei índice novo |

> **Como ler as marcas de confiança** — o Olavo pediu isso explicitamente:
> **[LIDO]** = eu abri o artefato ou o documento e estou citando o que vi.
> **[DEDUZO]** = é minha leitura, pode estar errada.
> **[NÃO VERIFIQUEI]** = ninguém nesta casa conferiu, e eu também não pude.

---

## 0. A resposta curta, antes das tabelas

**A reformulação é grande no mapa e pequena no v1.**

| | |
|---|---|
| **Grande no mapa** | dos 8 pilares, **3 não têm nada** e **1 — o mais pesado, peso 20 — não tem quase nada**. O PHI cobre bem **um** pilar e meio |
| **Pequena no v1** | **nenhum pilar novo entra no PHI v1.** O v1 fecha em 30/11 com 14 critérios já cortados, e o `DEFINICAO-DE-PRONTO-PHI-V1.md` §4 diz que coisa nova só entra **trocando** por um critério existente, nunca somando |
| **O que muda já, e é de graça** | **três tabelas do parque já coletam dado de 4 pilares diferentes e ninguém as lê.** Isso não é escopo novo: é o **M11** do contrato — dado escrito sem consumidor. Ver §4 |

**[DEDUZO]** O valor desta rodada não é descobrir o que falta construir. É descobrir que **parte do material já está coletada e jogada fora**, e que o buraco real (peso 20) é **fora do software** — é atendimento.

---

## 1. Mapa por PILAR — os 8 do material

> Pesos do `fundamentos-presenca-digital.md`. Colunas conforme o brief §3.

### Pilar 1 — Presença e infraestrutura · peso 10

| | |
|---|---|
| **existe hoje?** | 🟡 **parcial, e só para LEAD** |
| **onde** | planilha `leads`: `site`, `site_tipo`, `nao_reivindicado` (dono **P3**/**P4**) · Odoo `phi_crm`: `gbp_site_tipo` · workflow `L1 - Abertura de Projeto Tecnico Setup` (`cgw7ozJ7Zk9jBrj1`) cria **checklist de setup** para cliente ATIVO sem setup — é o mais perto de um inventário de acessos que a casa tem **[LIDO]** |
| **para CLIENTE** | 🔴 **nada.** Domínio, certificado, perfis oficiais, quem controla cada ativo, se o rastreamento existe: nenhuma coluna, nenhum workflow |
| **quem consome** | `PROSP-03` (motor de score do lead) · o humano, no checklist do Notion |
| **v1 / depois / nunca** | **DEPOIS.** O `L1` está **fora do `CONTRATO-PHI` por decisão D6** — e o próprio `PLANO-ENTREGA-FINAL-PHI.md` §3.1 já registra que essa decisão **pode precisar ser revista**, porque o `L1` é a ponte da contratação. Isso é do **F1**, não deste pilar |

### Pilar 2 — Visibilidade orgânica e local · peso 15

| | |
|---|---|
| **existe hoje?** | 🟡 **parcial para LEAD** · 🔴 **projetado e vazio para CLIENTE** |
| **onde (lead)** | planilha `leads`: `Posição Pesquisa`, `Searchstring`, `Categoria 1/2` (**P2**) · `dim_seo`, `score_gbp` (**P3**) · rubrica **pilar 2** em `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md` **[LIDO]** |
| **onde (cliente)** | 🔴 **`phi_prod.t28_gbp_daily`** — colunas `gbp_impressions`, `gbp_search_views`, `gbp_maps_views`, `gbp_website_clicks`, `gbp_phone_calls`, `gbp_direction_requests`. **A tabela existe no DDL de produção. Nunca recebeu uma linha:** o nó `HTTP Request GBP` do `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) falha **toda rodada** com *"receiving too many requests"* (cota) **[LIDO — `CONTRATO-PHI.md` §4.1]** |
| **Search Console** | 🔴 **não existe em lugar nenhum.** Cliques/impressões/CTR/posição média — as 4 métricas que o material chama de centrais — **nenhuma coluna, nenhum workflow.** Única menção na casa: `docs/pesquisa-trafego-pago.md` linha 401, como recomendação **[LIDO]** |
| **Índice de Visibilidade Local multi-busca** | 🟡 **desenhado, nunca construído** — `roadmap-expansao/gbp-motor-scoring-ipc-design.md` §"Índice de Visibilidade Local" **[LIDO]** |
| **quem consome** | **lead:** `PROSP-03`. **cliente: ninguém** — a tabela está vazia |
| **v1 / depois / nunca** | **`t28_gbp_daily` = DEPOIS, mas é o item mais barato do mapa inteiro** (tabela pronta, workflow pronto, falta resolver cota). **Search Console = DEPOIS.** **Diretórios e resposta de IA = NUNCA no v1** |

### Pilar 3 — Redes sociais e conteúdo · peso 10

| | |
|---|---|
| **existe hoje?** | 🔴 **não** — nem lead, nem cliente |
| **onde** | o que **parece** cobrir e não cobre: `Posts` na planilha é **`ownerUpdates` do GBP**, não Instagram **[LIDO — `2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md`]** · `t28_meta_campaign` é **mídia paga** da Meta, não conteúdo orgânico **[LIDO — DDL]** · `dim_conteudo` e `dim_engajamento` do lead avaliam **fotos e Q&A do GBP** |
| **quem consome** | `PROSP-03`, e só sobre GBP |
| **v1 / depois / nunca** | **NUNCA no v1.** Exigiria Instagram Graph API com credencial **por cliente**, e o próprio material diz que *"seguidores e curtidas são indicadores auxiliares"*. **[DEDUZO]** de todos os pilares, é o de pior razão esforço/valor |

### Pilar 4 — Reputação e autoridade · peso 10

| | |
|---|---|
| **existe hoje?** | 🟡 **parcial para LEAD** · 🔴 **projetado e vazio para CLIENTE** |
| **onde (lead)** | `Quantidade reviews`, `Avaliação` (**P2**) · `dim_autoridade`, `dim_engajamento` (**P3**) · rubrica **pilar 4** (quantidade, nota, crescimento, **respostas do proprietário**, reclamações recorrentes, distribuição 1–5★) **[LIDO]** |
| **onde (cliente)** | `t28_gbp_daily.gbp_reviews_count` e `gbp_reviews_avg_rating` — **colunas existem, tabela vazia** (mesma cota do pilar 2) |
| **o que falta em coluna** | 🔴 **`% de avaliações respondidas`** e **`tempo de resposta a avaliação`**: o material trata as duas como métricas de Confiança; a casa tem isso só como **julgamento qualitativo da IA** dentro da rubrica, **nunca como número** **[LIDO]** · menções e citações externas: nada |
| **quem consome** | **lead:** `PROSP-03`. **cliente: ninguém** |
| **v1 / depois / nunca** | **`gbp_reviews_*` do cliente = DEPOIS, e vem junto do pilar 2** (mesma chamada de API, mesma cota). **% respondidas = DEPOIS.** **Menções externas = NUNCA no v1** |

### Pilar 5 — Experiência digital · peso 10

| | |
|---|---|
| **existe hoje?** | 🟢 **SIM, e é o achado que eu não esperava** |
| **onde (cliente)** | **`phi_prod.t28_clarity_daily`** — `clarity_rage_clicks`, `clarity_dead_clicks`, `clarity_excessive_scroll`, `clarity_avg_scroll_depth`, `clarity_avg_session_sec` · **`phi_prod.t28_ga4_landing`** — `bounce_rate`, `engagement_rate`, `avg_session_duration_sec`, por **landing page**. Escritas pelo `PHI — Agregador`. **As duas escreveram dado real em 14/09** **[LIDO — `CONTRATO-PHI.md` §4.1: *"✅ escreveram em 14/09"*]** |
| **onde (lead)** | `PROSP-04 Enriquecimento` mede o site com **HTML + PageSpeed** e a IA redige sobre a medição → `enriquecimento_site` **[LIDO — `ADR-35` §"O 04 mede o site"]** |
| **quem consome** | 🔴 **ninguém.** O destinatário declarado é o **T28**, e o `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`) está **inativo e lendo `phi_dev`** **[LIDO]** |
| **v1 / depois / nunca** | 🔴 **este não é escopo novo: é defeito M11 já existente.** *"Todo dado escrito tem consumidor declarado"* — duas tabelas escrevendo há meses sem leitor. **DEPOIS** para virar pilar; **mas o M11 já obriga a decidir hoje: ou ganha leitor, ou para de escrever** |

### Pilar 6 — Aquisição orgânica e paga · peso 15

| | |
|---|---|
| **existe hoje?** | 🟢 **a parte PAGA, sim — é o PHI** · 🟡 **a parte ORGÂNICA é coletada e ignorada** |
| **onde (pago)** | `phi_prod.raw_campaign_data` → `phi_score_history` → view `phi_score_current` → Notion `Score Diário (0-100)` / `Status Geral da Campanha`. Workflows: `sw metricas campanhas` (`W571K320aqIHsdtH`), `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`), `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`). Grão de conjunto: `sw metricas conjuntos` (`t0DH5N5maws4egnG`) → Notion *Conjuntos de Anúncios*. Grão T28: `t28_campaign`, `t28_adset`, `t28_meta_campaign` **[LIDO]** |
| **onde (orgânico)** | 🟡 **`t28_ga4_landing.canal = 'google_organic'`** — a coluna `source` separa `'organico'` de `'pago'`, e o smoke de 14/09 escreveu **2 linhas: organic + paid** **[LIDO]**. **A aquisição orgânica já entra no BigQuery todo dia de rodada. Nenhum score a usa** |
| **quem consome** | **pago:** `PHI - Pipeline_v2`, Notion, o Olavo. **orgânico:** ninguém |
| **v1 / depois / nunca** | **pago = V1** — é o **F4** (*"enxergar campanha, conjunto e anúncio e apontar em qual nível está a causa"*), já decidido na ordem F1→F3→F2→F4. **orgânico = DEPOIS**, e também é M11, não escopo novo |

### Pilar 7 — 🔴 Conversão e atendimento · peso 20 — **o maior de todos**

| | |
|---|---|
| **existe hoje?** | 🔴 **conversão: uma fatia. Atendimento: nada** |
| **conversão — onde** | `t28_ga4_landing.conversions` e `key_events` (**escrevem** desde 14/09) · `raw_campaign_data.conversions` → `phi_value` (CPA). **É conversão de campanha e de site — não de atendimento** |
| **atendimento — onde** | 🔴 **em lugar nenhum.** ⚠️ **A armadilha a não cair:** o **CRM Odoo** (`crm.franzcomunicacao.com`, módulo `phi_crm`) é o **CRM da AGÊNCIA vendendo para leads** — estágios, `motivo_perda`, `dias_no_funil`, `probabilidade`, `acerto_previsao`. **Não é o CRM do cliente atendendo os clientes dele.** O README desta pasta diz *"CRM Odoo, parcialmente"* para este pilar — **eu derrubo essa linha: [DEDUZO] o Odoo cobre 0% do atendimento DO CLIENTE** |
| **tempo até a 1ª resposta** | 🔴 **não existe.** Procurei no repositório inteiro: aparece só no material novo e em `Análise Estratégica de Mercado…` (§"Métricas que diferenciam") — **nunca em coluna, tabela ou workflow** **[LIDO — grep]** |
| **comparecimento / no-show / reativação** | 🔴 **nada** |
| **e o que a casa perdeu de propósito** | `num_interacoes` e `ultimo_contato` na planilha estão **vazias por decisão registrada** — *"não há equivalente direto em `crm.lead`… deixar vazia até confirmar a fonte"* **[LIDO — `CONTRATO-PROSPECCAO.md` §"Campos sem par"]**. Mesmo no funil da agência, a casa **não mede interação** |
| **quem consome** | conversão de campanha: `PHI - Pipeline_v2`. Conversão de site (`t28_ga4_landing`): **ninguém**. Atendimento: não aplicável |
| **v1 / depois / nunca** | 🔴 **DEPOIS, inteiro — e é o maior buraco do mapa.** **[DEDUZO] e é o único pilar cujo dado não está nas mãos da agência**: mora no WhatsApp, no telefone e na agenda do cliente. Não é problema de API: é problema de **acesso e de procedimento** |

### Pilar 8 — Dados, automação e governança · peso 10

| | |
|---|---|
| **existe hoje?** | 🟢 **muito, mas não é este pilar** — ver §3, hipótese H2 |
| **onde** | `CONTRATO-PHI.md` invariantes **M1–M12** · ADR-37 (um destino, um dono) · ADR-38 (identidade neutra) · ADR-39/40 · `source_status` JSON em toda tabela `t28_*` · `execution_id` / `source_execution_id` · `PHI - Vigia de Frescor dos Dados` (`JMgc0HdLPOFPnFYb`) · `PHI - Alerta de Falha` (`UZ7sIE5cWrrO8xea`) **[LIDO]** |
| **o que isso governa** | 🔴 **o parque da AGÊNCIA.** O pilar do material fala de *"analytics, CRM, automações, consentimento, segurança e propriedade dos ativos"* — **do cliente** |
| **para o cliente** | 🔴 **nada.** Consentimento: nada. Propriedade de conta/pixel/domínio: só como item de checklist no `L1`, sem coluna. *"É possível ligar o resultado à origem?"* — a casa sabe responder do **próprio** pipeline, não do do cliente |
| **quem consome** | o Olavo, os sub-chats, a rotina semanal de auditoria |
| **v1 / depois / nunca** | **governança do parque = V1** (é o **F2** e o **F3**). **Governança do ativo do cliente = DEPOIS** |

### Placar por pilar

| Pilar | Peso | Cliente | Lead | Onde dói |
|---|---|---|---|---|
| Presença e infraestrutura | 10 | 🔴 nada | 🟡 parcial | nenhum inventário de ativos do cliente |
| Visibilidade orgânica e local | 15 | 🔴 tabela vazia | 🟡 parcial | `t28_gbp_daily` morre na cota · Search Console inexistente |
| Redes sociais e conteúdo | 10 | 🔴 nada | 🔴 nada | exige credencial por cliente |
| Reputação e autoridade | 10 | 🔴 tabela vazia | 🟡 parcial | mesma cota do GBP |
| Experiência digital | 10 | 🟢 **coleta** | 🟡 PageSpeed | 🔴 **coleta sem leitor (M11)** |
| Aquisição orgânica e paga | 15 | 🟢 pago · 🟡 orgânico | — | 🔴 **orgânico sem leitor (M11)** |
| 🔴 Conversão e atendimento | 🔴 **20** | 🔴 quase nada | 🔴 nada | **o dado não está na agência** |
| Dados e governança | 10 | 🟢 do parque · 🔴 do cliente | — | o pilar do material é outro |

**[DEDUZO] Somando os pesos:** o PHI cobre com solidez ~15 pontos de 100 (o pago do pilar 6) e **coleta sem usar** outros ~20 (pilares 5, 6-orgânico e partes de 2 e 4). **Os 20 pontos de Conversão e atendimento estão em zero.**

---

## 2. Mapa por DIMENSÃO — as 10 do material

> As 10 dimensões **não são os 8 pilares com outro nome** — são a lista de *o que se verifica*, e cortam os pilares na diagonal. Mapear as duas separadamente é o que o brief pediu, e foi útil: a dimensão **Consistência** não tem pilar próprio, e é um buraco que o mapa por pilar escondia.

| Dimensão | existe? | onde (com nome) | quem consome | v1/depois/nunca |
|---|---|---|---|---|
| **Infraestrutura** | 🟡 lead | `site`, `site_tipo`, `nao_reivindicado` (planilha) · checklist do `L1 - Abertura de Projeto` | `PROSP-03` · humano | **DEPOIS** |
| **Descoberta** | 🟡 lead · 🔴 cliente | `Posição Pesquisa`, `Searchstring` (planilha) · `t28_gbp_daily.gbp_search_views`/`gbp_maps_views` **(vazia)** | `PROSP-03` · ninguém | **DEPOIS** (o conserto de cota é o mais barato) |
| **Consistência** | 🔴 **não** | 🔴 **nada.** NAP aparece só como **texto de rubrica** (pilar 2) e como item de pesquisa em `2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md`. **Nenhuma coluna compara nome/telefone/endereço entre canais** | ninguém | **DEPOIS** · **[DEDUZO]** é a dimensão mais invisível do mapa: não tem pilar próprio e ninguém sentiu falta |
| **Reputação** | 🟡 lead · 🔴 cliente | `Quantidade reviews`, `Avaliação`, `dim_autoridade` · `t28_gbp_daily.gbp_reviews_*` **(vazia)** | `PROSP-03` · ninguém | **DEPOIS** |
| **Conteúdo** | 🔴 quase nada | `Quantidade fotos`, `Posts` (GBP, não social) · `dim_conteudo` | `PROSP-03` | **NUNCA no v1** |
| **Experiência** | 🟢 **sim** | `t28_clarity_daily` (5 colunas de UX) · `t28_ga4_landing.bounce_rate`/`engagement_rate` · PageSpeed no `PROSP-04` | 🔴 **ninguém** | **DEPOIS** — mas o **M11 já cobra hoje** |
| **Aquisição** | 🟢 pago · 🟡 orgânico | `raw_campaign_data` → `phi_score_history` → Notion · `t28_ga4_landing.canal='google_organic'` | Pipeline_v2 · ninguém | **V1 (pago = F4)** |
| **Conversão** | 🟡 fatia | `raw_campaign_data.conversions` → `phi_value` · `t28_ga4_landing.conversions`/`key_events` | Pipeline_v2 · ninguém | **V1 (a fatia de campanha)** |
| **Relacionamento** | 🔴 **não** | 🔴 **nada.** Atendimento, follow-up, retenção, recompra, indicação: zero coluna. `num_interacoes`/`ultimo_contato` **vazias por decisão** | — | **DEPOIS** |
| **Dados e governança** | 🟢 do parque · 🔴 do cliente | M1–M12, ADR-37/38/39/40, `source_status`, vigias | Olavo, sub-chats | **V1 (o parque = F2/F3)** |

---

## 3. As duas hipóteses do chat-mãe — atacadas

### H1 — *"as duas frentes são duas metades da mesma coisa"*

> **Veredicto: sobrevive na metade de baixo e cai na de cima. E a divisão é exatamente onde o `CLAUDE.md` avisa.**

**O que sustenta a hipótese, e é mais forte do que o chat-mãe escreveu [LIDO]:**

A rubrica `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md` tem **10 pilares de GBP**, e o **pilar 10 é literalmente a metade do cliente**: *"**Performance (só com acesso ao perfil)** — pesquisas diretas, pesquisas por descoberta, cliques no site, ligações, solicitações de rota, mensagens, visualizações de fotos, termos de pesquisa"*. A casa **já escreveu**, em julho, que o mesmo instrumento tem uma parte que só funciona com acesso — **que é o que se tem de um cliente e não se tem de um lead.**

E o `gbp-motor-scoring-ipc-design.md` mapeia as **6 dimensões** do lead nos 10 pilares dessa rubrica: `Saúde do Perfil`, `SEO Local`, `Autoridade`, `Conversão`, `Engajamento`, `Conteúdo`. Confrontadas com o material novo, **cinco dos oito pilares dele têm dimensão correspondente já implementada.**

**O que derruba a hipótese, e é o motivo certo do aviso do `CLAUDE.md`:**

**`potencial_comercial` e `phi_value` não são o mesmo tipo de número — são espécies incomparáveis.**

| | `potencial_comercial` | `phi_value` |
|---|---|---|
| **como se calcula** | `fit × oportunidade`, com **rank percentil dentro da mesma `Searchstring`** **[LIDO — `CONTRATO-PROSPECCAO.md` §3]** | **absoluto contra uma meta** (`primary_metric_goal`, `primary_metric_type`) |
| **o que 70 significa** | *"está acima de 70% dos concorrentes desta busca"* | *"está a tal distância da meta desta campanha"* |
| **tira do coorte** | 🔴 **perde o significado** | continua válido |

**[DEDUZO] Não existe tabela de pesos que torne os dois comparáveis.** Um percentil sem coorte não é nota; uma nota absoluta não tem coorte. Fundir os dois produziria um número que **parece** saúde e é ranking — e é exatamente o modo de falha da **R11**: verde fazendo o contrário do que o nome diz.

**E tem um segundo motivo, mais limpo [LIDO]:** o eixo **`oportunidade`** é definido como *"tenho o que vender a ele?"*. Isso é **interesse comercial da agência**, não saúde do negócio. Num cliente que já comprou, o eixo **não tem sentido** — e se ele viajar junto, a agência passa a medir a saúde do cliente com metade da régua apontada para o próprio bolso.

**Conclusão útil, que não é sim nem não:**

> **O que é uma só coisa é o INVENTÁRIO DE FATOS — e ele deveria ser compartilhado.** Nota do GBP, nº de avaliações, respostas do dono, PageSpeed, categoria: um lead e um cliente têm os mesmos fatos, e a casa hoje os coleta **duas vezes, por caminhos diferentes** (Apify na Prospecção, GBP API no Agregador).
> **O que são duas coisas são os SCORES.** Um ranqueia para vender; o outro mede distância de meta para entregar. **[DEDUZO] Se algo se unifica, é a coleta — nunca o score.**

### H2 — *"nada do que foi construído é desperdício; o parque é o pilar Dados e governança inteiro"*

> **Veredicto: cai nas duas metades. E a queda vale mais, como o brief previu.**

**Metade 1 — o parque NÃO é aquele pilar. Ele vale mais que isso.**

O pilar do material é sobre **o cliente**: *"analytics, CRM, automações, consentimento, segurança e propriedade dos ativos"*. O que a casa construiu — M1–M12, writer único, identidade neutra, `source_status`, vigias — governa **o pipeline da agência**. São coisas diferentes com o mesmo nome.

**[DEDUZO] E rebaixar o parque a "1 pilar de 8, peso 10" seria injusto com ele:** sem `MERGE` idempotente, sem chave `(client_id, platform, campaign_id, date)` e sem `source_status`, **nenhum** dos 8 pilares é mensurável de forma confiável. **O parque não é um dos oito andares — é o piso embaixo dos oito.**

**Metade 2 — e existe desperdício, nomeado pelos documentos da própria casa [LIDO]:**

| O que | Prova, no `CONTRATO-PHI.md` |
|---|---|
| `raw_ad_data` | **0 linhas.** Os dois nós de escrita nunca executam — o ramo morre no `IF Gate PMAX` |
| `raw_adset_data_rollup` | view **sem origem** — nunca teve writer, e duas varreduras atribuíram a escrita ao workflow errado |
| `workflow_execution_log` | **10 escritas/dia, 0 leituras.** Viola M11 |
| `raw_campaign_data` | **17 colunas sem leitor** · **12 colunas sem writer** (§4.1, grão de coluna, 24/09) |
| `client_config` em `phi_dev` | **0 execuções** no histórico retido, ambiente errado (M9) |

**Dizer "nada é desperdício" contradiz o M10 e o M11 — os dois invariantes que a casa escreveu justamente para nomear isso.** O `raw_ad_data` é o caso fundador: três meses de escrita diária para tabela que ninguém lia.

**A versão que eu proponho no lugar:**

> **Nada do que foi construído perde valor com esta reformulação — mas parte dele já estava sem valor antes, e o contrato já disse quais.** O que a reformulação muda é o contrário do que a H2 diz: ela **dá régua** ao M11. Até agora *"quem lê esta tabela?"* não tinha resposta possível por falta de entrega final declarada — é o que o próprio `PLANO-ENTREGA-FINAL-PHI.md` §0 admite. **Com os 8 pilares na mão, `t28_clarity_daily` e `t28_ga4_landing` deixam de ser órfãs e passam a ter nome: pilar 5 e pilar 6-orgânico.**

---

## 4. 🔴 O achado que eu não fui procurar — e é o de maior valor imediato

**Três tabelas de produção já coletam dado de quatro pilares diferentes, e nenhuma tem leitor.**

| Tabela | Pilar do material que ela serve | Estado | Leitor |
|---|---|---|---|
| `t28_clarity_daily` | **5 — Experiência digital** | ✅ escreveu 14/09 | 🔴 ninguém |
| `t28_ga4_landing` (`source='organico'`) | **6 — Aquisição orgânica** | ✅ escreveu 14/09 | 🔴 ninguém |
| `t28_ga4_landing` (`conversions`, `key_events`) | **7 — Conversão** (a parte de site) | ✅ escreveu 14/09 | 🔴 ninguém |
| `t28_gbp_daily` | **2 — Visibilidade local** + **4 — Reputação** | 🔴 vazia por cota | 🔴 ninguém |

**[LIDO]** O destinatário declarado das quatro é o **T28**. O `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`) está **inativo** e aponta para **`phi_dev`**.

**[DEDUZO] Por que isso importa mais que qualquer pilar novo:** o material não pede, aqui, nenhuma construção. Pede **um leitor**. E o M11 já obriga a decidir: *"tabela sem leitor é custo, não ativo"* — a alternativa honesta é **parar de escrever**. É a mesma decisão do `raw_ad_data`, só que agora com dado bom dentro.

⚠️ **Não estou propondo construir o leitor.** Estou apontando que a pergunta *"o material cobre isso?"* e a pergunta *"o M11 permite continuar assim?"* **têm a mesma resposta**, e ela não espera 30/11.

---

## 5. As três coisas que o material diz e a casa não faz — apontadas, não resolvidas

### 5.1 🔴 Conversão e atendimento pesa 20 e está em zero

Ver **Pilar 7**. Três correções ao que o README desta pasta supôs:

1. **O Odoo não cobre "parcialmente".** É o CRM da agência **vendendo**; o atendimento do cliente não passa por ele. **[DEDUZO]** cobertura real: **0%**.
2. **Nem no funil da agência a casa mede interação:** `num_interacoes` e `ultimo_contato` estão **vazias por decisão registrada** — falta fonte em `crm.lead` **[LIDO]**.
3. 🟢 **Mas a casa JÁ ESCREVEU a lista de métricas deste pilar** — e ninguém a ligou ao PHI. `Análise Estratégica de Mercado — Agência de Tráfego Pago… (2026–2030).md`, §"Métricas que diferenciam" **[LIDO]**:
   > *"Tempo até primeira resposta · Taxa de contato, qualificação, agendamento, **comparecimento** e fechamento · Motivos de perda e recuperação · Ocupação por dia, unidade e profissional · Receita reativada e recompra"*

   **É o pilar 20 escrito na íntegra, meses antes do material novo.** E o mesmo documento, em §"Mensagens por perfil", já vendia isso: *"o problema pode não ser falta de lead, mas perda depois do clique."* **Isto é a regra 5 do brief em estado puro: já existia na casa.**

### 5.2 🔴 A jornada tem vazamentos, e o PHI dá nota em vez de achar vazamento

**[LIDO] E aqui a casa está mais perto do que o material supõe** — mas num outro nível.

`regras-otimizacao-metodo-subido.md` **§6 — "Cadeia de diagnóstico do funil (ONDE o cano vaza)"** é uma tabela de **10 elos, cada um com sintoma → alavanca**: CPM, Hook Rate, CTR, CPC, Connect Rate, "Curioso", jornada, CPA, ROAS, LTV. **É exatamente a mecânica de vazamento que o material pede.**

| | |
|---|---|
| **O que a casa tem** | a cadeia de vazamento **de dentro da plataforma de anúncio** — do leilão até o CPA |
| **O que o material pede** | a cadeia de vazamento **do negócio inteiro** — `Descoberta → Visita → Confiança → Contato → Atendimento → Venda → Retenção` |
| **Onde as duas se encontram** | o elo **`Connect Rate`** e o caso **`"Curioso"`** (CPC baixo, cliques altos, conversão zero) — que o próprio documento diz ser *"exatamente o padrão da Salão/CLI-4"* |
| **Onde o material vai além** | os elos **Atendimento** e **Retenção**. A cadeia da casa **para no CPA**. Depois do lead chegar, ela não tem elo nenhum |

**[DEDUZO] Então o diagnóstico é mais preciso do que "o PHI dá nota, não acha vazamento":** o PHI **tem** a régua de vazamento escrita e **não a executa** — é o que o `PLANO-ENTREGA-FINAL-PHI.md` §4.1 já registrou (*"a régua existe e nenhum sub-chat a leu"*). O que **não existe em régua nenhuma** são os dois últimos elos da jornada.

### 5.3 🔴 "A auditoria deve realizar testes reais" — a casa nunca fez

**[LIDO]** Tudo o que a casa mede vem de **API ou scraper**: Google Ads API v23, Meta Ads API, Places API, Apify, GA4, Clarity, GBP API, PageSpeed. A única coisa que se aproxima de teste real é o **PageSpeed no `PROSP-04`** — e é uma API que testa, não um humano testando.

**O que o material pede e não tem nenhum equivalente:** abrir o site no celular · clicar nos links · **enviar um formulário** · iniciar uma conversa · **verificar se o contato chega ao CRM**.

**[DEDUZO] E o último item é o mais pesado, por dois motivos:**
1. É a única verificação do mapa que prova **ponta a ponta** — e a casa **não prova ponta a ponta nem o próprio pipeline**: o `PHI - Vigia de Frescor` olha `raw_campaign_data` e `phi_score_history`, e **não olha o Notion**, que é a superfície que o gestor vê **[LIDO]**.
2. Um teste real **escreve no sistema de terceiro** (um lead falso no CRM do cliente). Isso não é engenharia: é **acordo com o cliente**. **[DEDUZO]** por isso é o item de menor chance de virar v1, por mais que o material insista.

---

## 6. O veredicto sobre o README desta pasta — confirmado e corrigido

| Linha do README | Meu veredicto |
|---|---|
| Presença e infraestrutura (10) — *"—"* | ✅ **confirmo** para cliente; corrijo: há cobertura **de lead** (`site`, `site_tipo`, `nao_reivindicado`) |
| Visibilidade (15) — *"🟡 Prospecção (GBP do lead)"* | ⚠️ **incompleto.** Falta dizer que **para cliente existe tabela pronta e vazia** (`t28_gbp_daily`) |
| Redes sociais (10) — *"—"* | ✅ **confirmo** |
| Reputação (10) — *"🟡 Prospecção (reviews do lead)"* | ⚠️ **incompleto.** Mesma tabela vazia |
| Experiência (10) — *"🟡 Prospecção (medição do site)"* | 🔴 **derrubo.** O maior pedaço não é da Prospecção: é `t28_clarity_daily` + `t28_ga4_landing`, **do parque, escrevendo, sem leitor** |
| Aquisição (15) — *"🟢 `phi_value` — e só a parte paga"* | ⚠️ **quase.** A parte **orgânica também é coletada** (`t28_ga4_landing`, `canal='google_organic'`) — só não é lida |
| 🔴 Conversão e atendimento (20) — *"🟡 CRM Odoo, parcialmente"* | 🔴 **derrubo.** O Odoo é o CRM da **agência vendendo**. Cobertura do atendimento do cliente: **0%** |
| Dados e governança (10) — *"🟢 o parque PHI"* | 🔴 **derrubo** — ver H2. O parque governa o pipeline da agência, não os ativos do cliente |

---

## 7. O tamanho da reformulação — a resposta que só o mapa podia dar

| | |
|---|---|
| **Pilares que mudam o PHI v1** | **zero.** O v1 está fechado em 14 critérios + F1–F8, ordem decidida F1→F3→F2→F4, F7 no fim. Nada do material entra sem **trocar** (`DEFINICAO-DE-PRONTO` §4, `PLANO-ENTREGA-FINAL-PHI` §7) |
| **O que muda no ENTENDIMENTO** | **muito.** O F4 (*"campanha, conjunto, anúncio"*) deixa de ser "o PHI completo" e passa a ser **o acabamento de 1 pilar de 8**. **[DEDUZO]** isso não invalida o F4 — reposiciona a ambição |
| **O que muda AGORA, sem escopo novo** | o **M11** sobre `t28_clarity_daily`, `t28_ga4_landing` e `t28_gbp_daily`: ganham leitor ou param de escrever |
| **O que é DEPOIS** | pilares 1, 2 (Search Console), 4 (% respondidas), 5, 7 inteiro, 8-cliente, e a dimensão **Consistência** |
| **O que eu leio como NUNCA no v1** | pilar 3 (redes sociais orgânicas), menções externas, resposta de IA, diretórios, e **teste real que escreve no CRM do cliente** |

> ⚠️ **O risco desta frente, escrito para o Olavo poder cobrar de mim:** o material é bonito e cabe numa tabela de 8 linhas. **Construir qualquer pilar novo antes de 30/11 mata o v1**, e o v1 é o que faz o PHI parar de depender do olho do Olavo. **[DEDUZO] A reformulação certa é de MAPA agora e de ADR em dezembro.**

---

## 8. Rodada de perguntas para o Olavo — 6, com as consequências

> Escolha de opção **não é redação dele** (lição de 22/09). Se ele marcar uma, a definição continua sendo minha.

**P1 — As três tabelas que coletam e ninguém lê (`t28_clarity_daily`, `t28_ga4_landing`, `t28_gbp_daily`):**
- **(a)** ganham leitor agora → escopo novo antes de 30/11, contra a ordem F1→F3→F2→F4
- **(b)** **param de escrever** até haver leitor → cumpre o M11 ao pé da letra, e **perde-se a série histórica** que está sendo acumulada
- **(c)** continuam escrevendo com a dívida **anotada e datada** → não cumpre o M11, mas guarda a série. **[DEDUZO] é a minha leitura, e o motivo é a R-B: o ativo é a série, não o dado de hoje**

**P2 — A cota do GBP** (`t28_gbp_daily` vazia desde sempre, `"too many requests"`, em stand-by por decisão sua de 28/06): entra na fila agora, fica em stand-by, ou **sai do parque** e o pilar 2 espera dezembro?

**P3 — O pilar de peso 20 (Conversão e atendimento):** ele é **do PHI** ou é **de outra frente**? A casa já tem um eixo separado para operação — o `Board Agência`, no Miro. **[DEDUZO] tempo de resposta e comparecimento parecem procedimento de atendimento antes de serem software** — e se forem do PHI, o PHI passa a precisar de acesso ao WhatsApp e à agenda do cliente.

**P4 — H1, na versão que sobrou:** unificar **a coleta de fatos** de GBP (hoje feita duas vezes — Apify na Prospecção, GBP API no Agregador) é útil, ou é otimização que não dói? **Os scores ficam separados de qualquer jeito** — nisso o `CLAUDE.md` está certo e eu não mexo.

**P5 — A dimensão Consistência** (mesmo nome, telefone e endereço em todos os canais): ninguém nesta casa a mediu nem sentiu falta. É **buraco real** que o mapa achou, ou é **detalhe** que o material trouxe e não importa para negócio local?

**P6 — O nome.** O material propõe **"Saúde Digital do Negócio"** para o todo, e a casa já chama de **"Saúde Digital"** o que é só mídia paga (o `phi_value`, pilar 6). **[DEDUZO] a colisão vai custar caro** — é a mesma doença do `phi_value` × `potencial_comercial`. Renomear o que existe (para *"PHI·Mídia"*, que já aparece em alguns documentos), ou reservar o nome novo só para a frente de estudo?

---

## 9. Como verificar este mapa

| O que | Como se confere |
|---|---|
| As colunas e tabelas que eu cito **existem** | as 6 tabelas `t28_*` estão em `agregador-t28/ddl/phi_prod_t28_tables.sql`; as 63 colunas da planilha em `CONTRATO-PROSPECCAO.md` §3; os destinos do parque em `CONTRATO-PHI.md` §4.1 |
| As tabelas que eu digo **vazias** ou **sem leitor** | `CONTRATO-PHI.md` §4.1, coluna *"Consumidor declarado"* e *"Estado"* — é as-built lido em 20/09, não dedução minha |
| `t28_clarity_daily` / `t28_ga4_landing` **escreveram** | `CONTRATO-PHI.md` §4.1: *"✅ escreveram em 14/09"* · `ESTADO-DO-PROJETO.md` smoke `11755`: `t28_ga4_landing=2` |
| O que eu digo que **não existe** | `grep -ri "search console"`, `"primeira resposta"`, `"NAP"` em `docs/` — foi assim que verifiquei |
| ⚠️ **O que NÃO conferi** | **não abri um único workflow no n8n nem rodei query no BigQuery.** Tudo aqui vem de documento. Se algum documento mentir (R13 — *"o rascunho mente"*), este mapa herda a mentira |

**Confiança na veracidade deste documento: 0,85.** O que puxa para baixo: (1) as **6 dimensões** do lead têm composição descrita num documento de **design**, e eu **não verifiquei** se o motor `PROSP-03` vivo calcula assim; (2) `t28_search_terms` aparece no design v0.1 e **não está no DDL de produção** — tratei como inexistente, o que é o mais provável, mas não conferi no BigQuery; (3) a cobertura do Odoo para atendimento do cliente é **minha leitura** do módulo `phi_crm`, que eu não abri.

